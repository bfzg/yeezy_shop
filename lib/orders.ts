import { randomUUID } from "node:crypto";
import { cartTotals, db, getCart, getProductById, getVariantById } from "./db";
import type { CartLine } from "./shared";

export type CheckoutInput = {
  userId?: number | null;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment?: string;
  city: string;
  country: string;
  province: string;
  postalCode: string;
  phone: string;
  paymentProvider: "stripe" | "paypal" | "apple_pay" | "manual";
};

export type CheckoutCartItem = {
  productId: number;
  variantId?: number | null;
  size?: string;
  quantity: number;
};

export function createOrderFromCart(sessionId: string, input: CheckoutInput) {
  const lines = getCart(sessionId);
  return createOrderFromLines(lines, input, sessionId);
}

export function createOrderFromSubmittedCart(items: CheckoutCartItem[], input: CheckoutInput, sessionId = "") {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const lines = items.map((item, index) => {
    const product = getProductById(Number(item.productId));
    if (!product) throw new Error("A cart product no longer exists.");
    const variant = item.variantId ? getVariantById(Number(item.variantId)) : null;
    if (variant && variant.productId !== product.id) {
      throw new Error("A cart variant does not belong to its product.");
    }
    const quantity = Math.max(1, Number(item.quantity ?? 1));
    const stock = variant ? variant.stock - variant.reserved : product.stock;
    return {
      id: `${product.id}:${variant?.id ?? item.size ?? index}`,
      productId: product.id,
      variantId: variant?.id ?? null,
      sku: product.sku,
      variantSku: variant?.sku ?? null,
      slug: product.slug,
      name: product.name,
      image: product.image,
      priceCents: variant?.priceCents ?? product.priceCents,
      size: variant?.size ?? String(item.size ?? "2"),
      quantity,
      stock
    } satisfies CartLine;
  });

  return createOrderFromLines(lines, input, sessionId);
}

function createOrderFromLines(lines: CartLine[], input: CheckoutInput, sessionId = "") {
  if (lines.length === 0) throw new Error("Cart is empty.");

  for (const line of lines) {
    if (line.variantId && line.quantity > line.stock) {
      throw new Error(`${line.sku} size ${line.size} is out of stock.`);
    }
  }

  const totals = cartTotals(lines);
  const conn = db();
  const orderNumber = `YZY-${randomUUID().slice(0, 8).toUpperCase()}`;
  const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  let orderId = 0;

  conn.exec("BEGIN");
  try {
    const orderResult = conn.prepare(`
      INSERT INTO orders (
        order_number, user_id, email, first_name, last_name, address, apartment, city, country,
        province, postal_code, phone, subtotal_cents, shipping_cents, tax_cents, total_cents,
        status, payment_provider, payment_status, inventory_locked_until
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'inventory_locked', ?, 'pending', ?)
    `).run(
      orderNumber,
      input.userId ?? null,
      input.email,
      input.firstName,
      input.lastName,
      input.address,
      input.apartment ?? "",
      input.city,
      input.country,
      input.province,
      input.postalCode,
      input.phone,
      totals.subtotalCents,
      totals.shippingCents,
      totals.taxCents,
      totals.totalCents,
      input.paymentProvider,
      lockUntil
    );
    orderId = Number(orderResult.lastInsertRowid);

    const insertItem = conn.prepare(`
      INSERT INTO order_items (order_id, product_id, variant_id, sku, size, quantity, price_cents)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const reserve = conn.prepare("UPDATE product_variants SET reserved = reserved + ? WHERE id = ?");
    const movement = conn.prepare("INSERT INTO inventory_movements (variant_id, order_id, type, quantity, note) VALUES (?, ?, 'reserved', ?, ?)");
    for (const line of lines) {
      insertItem.run(orderId, line.productId, line.variantId, line.variantSku ?? line.sku, line.size, line.quantity, line.priceCents);
      if (line.variantId) {
        reserve.run(line.quantity, line.variantId);
        movement.run(line.variantId, orderId, line.quantity, orderNumber);
      }
    }
    if (sessionId) {
      conn.prepare("DELETE FROM cart_items WHERE session_id = ?").run(sessionId);
    }
    conn.exec("COMMIT");
  } catch (error) {
    conn.exec("ROLLBACK");
    throw error;
  }

  return { orderId, orderNumber, totals };
}

export function markOrderPaid(orderId: number, provider: string, reference: string) {
  const conn = db();
  const items = conn.prepare("SELECT variant_id, quantity FROM order_items WHERE order_id = ? AND variant_id IS NOT NULL")
    .all(orderId) as Array<{ variant_id: number; quantity: number }>;
  conn.exec("BEGIN");
  try {
    for (const item of items) {
      conn.prepare("UPDATE product_variants SET stock = stock - ?, reserved = MAX(reserved - ?, 0) WHERE id = ?")
        .run(item.quantity, item.quantity, item.variant_id);
      conn.prepare("INSERT INTO inventory_movements (variant_id, order_id, type, quantity, note) VALUES (?, ?, 'captured', ?, ?)")
        .run(item.variant_id, orderId, item.quantity, provider);
    }
    conn.prepare(`
      UPDATE orders
      SET status = 'paid', payment_status = 'paid', payment_provider = ?, payment_reference = ?,
          paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP), inventory_locked_until = NULL
      WHERE id = ?
    `).run(provider, reference, orderId);
    conn.exec("COMMIT");
  } catch (error) {
    conn.exec("ROLLBACK");
    throw error;
  }
}

export function releaseExpiredLocks() {
  const conn = db();
  const expired = conn.prepare("SELECT id FROM orders WHERE status = 'inventory_locked' AND inventory_locked_until < CURRENT_TIMESTAMP")
    .all() as Array<{ id: number }>;
  for (const order of expired) {
    releaseOrderLock(order.id);
  }
}

export function releaseOrderLock(orderId: number) {
  const conn = db();
  const items = conn.prepare("SELECT variant_id, quantity FROM order_items WHERE order_id = ? AND variant_id IS NOT NULL")
    .all(orderId) as Array<{ variant_id: number; quantity: number }>;
  conn.exec("BEGIN");
  try {
    for (const item of items) {
      conn.prepare("UPDATE product_variants SET reserved = MAX(reserved - ?, 0) WHERE id = ?")
        .run(item.quantity, item.variant_id);
      conn.prepare("INSERT INTO inventory_movements (variant_id, order_id, type, quantity, note) VALUES (?, ?, 'released', ?, 'lock expired')")
        .run(item.variant_id, orderId, item.quantity);
    }
    conn.prepare("UPDATE orders SET status = 'cancelled', payment_status = 'expired' WHERE id = ?").run(orderId);
    conn.exec("COMMIT");
  } catch (error) {
    conn.exec("ROLLBACK");
    throw error;
  }
}

export function fulfillOrder(orderId: number) {
  const current = db().prepare("SELECT status FROM orders WHERE id = ?").get(orderId) as { status: string } | undefined;
  if (!current) throw new Error("Order not found.");
  if (current.status !== "paid") {
    throw new Error("Only paid orders can be fulfilled.");
  }
  db().prepare("UPDATE orders SET status = 'fulfilled' WHERE id = ?").run(orderId);
}

export function refundOrder(orderId: number) {
  const conn = db();
  const current = conn.prepare("SELECT status FROM orders WHERE id = ?").get(orderId) as { status: string } | undefined;
  if (!current) throw new Error("Order not found.");
  if (!["paid", "fulfilled"].includes(current.status)) {
    throw new Error("Only paid or fulfilled orders can be refunded.");
  }

  const items = conn.prepare("SELECT variant_id, quantity FROM order_items WHERE order_id = ? AND variant_id IS NOT NULL")
    .all(orderId) as Array<{ variant_id: number; quantity: number }>;

  conn.exec("BEGIN");
  try {
    if (current.status === "paid") {
      for (const item of items) {
        conn.prepare("UPDATE product_variants SET stock = stock + ? WHERE id = ?")
          .run(item.quantity, item.variant_id);
        conn.prepare("INSERT INTO inventory_movements (variant_id, order_id, type, quantity, note) VALUES (?, ?, 'refunded_restock', ?, 'refund before fulfillment')")
          .run(item.variant_id, orderId, item.quantity);
      }
    } else {
      for (const item of items) {
        conn.prepare("INSERT INTO inventory_movements (variant_id, order_id, type, quantity, note) VALUES (?, ?, 'refunded_after_fulfillment', ?, 'manual return stock required')")
          .run(item.variant_id, orderId, item.quantity);
      }
    }

    conn.prepare("UPDATE orders SET status = 'refunded', payment_status = 'refunded' WHERE id = ?").run(orderId);
    conn.exec("COMMIT");
  } catch (error) {
    conn.exec("ROLLBACK");
    throw error;
  }
}
