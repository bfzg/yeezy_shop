import { NextResponse } from "next/server";
import { cartTotals, db, getCart, getVariantById, getWritableSessionId } from "@/lib/db";

export async function GET() {
  const sessionId = await getWritableSessionId();
  const lines = getCart(sessionId);
  return NextResponse.json({ lines, totals: cartTotals(lines) });
}

export async function POST(request: Request) {
  const sessionId = await getWritableSessionId();
  const body = await request.json();
  const productId = Number(body.productId);
  const variantId = body.variantId ? Number(body.variantId) : null;
  const variant = variantId ? getVariantById(variantId) : null;
  const size = String(variant?.size ?? body.size ?? "2");
  const quantity = Math.max(1, Number(body.quantity ?? 1));
  if (variant && variant.productId !== productId) {
    return NextResponse.json({ error: "Selected variant does not belong to this product." }, { status: 400 });
  }
  if (variant && variant.stock - variant.reserved < quantity) {
    return NextResponse.json({ error: "Selected size is out of stock." }, { status: 409 });
  }

  db().prepare(`
    INSERT INTO cart_items (session_id, product_id, variant_id, size, quantity, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(session_id, product_id, size)
    DO UPDATE SET variant_id = excluded.variant_id, quantity = quantity + excluded.quantity, updated_at = CURRENT_TIMESTAMP
  `).run(sessionId, productId, variantId, size, quantity);

  const lines = getCart(sessionId);
  return NextResponse.json({ lines, totals: cartTotals(lines) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const sessionId = await getWritableSessionId();
  const body = await request.json();
  const id = Number(body.id);
  const quantity = Number(body.quantity);

  if (quantity <= 0) {
    db().prepare("DELETE FROM cart_items WHERE id = ? AND session_id = ?").run(id, sessionId);
  } else {
    db().prepare("UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND session_id = ?")
      .run(quantity, id, sessionId);
  }

  const lines = getCart(sessionId);
  return NextResponse.json({ lines, totals: cartTotals(lines) });
}
