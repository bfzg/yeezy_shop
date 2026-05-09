import { readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { cookies } from "next/headers";
import { seedProducts } from "./products";
import { type CartLine, formatMoney } from "./shared";

export { formatMoney };

const dbPath = path.join(process.cwd(), "data", "yezi.db");
const schemaPath = path.join(process.cwd(), "lib", "schema.sql");

let database: DatabaseSync | undefined;

export type Product = {
  id: number;
  sku: string;
  slug: string;
  name: string;
  category: string;
  priceCents: number;
  description: string;
  material: string;
  sizeChart: string;
  careInstructions: string;
  modelInfo: string;
  image: string;
  gallery: string[];
  stock: number;
  archived: boolean;
  variants: ProductVariant[];
};

type ProductRow = {
  id: number;
  sku: string;
  slug: string;
  name: string;
  category: string;
  price_cents: number;
  description: string;
  image: string;
  stock: number;
  archived?: number;
  gallery: string;
  material?: string;
  size_chart?: string;
  care_instructions?: string;
  model_info?: string;
};

export type ProductVariant = {
  id: number;
  productId: number;
  sku: string;
  size: string;
  color: string;
  priceCents: number;
  stock: number;
  reserved: number;
  active: boolean;
  archived: boolean;
};

type VariantRow = {
  id: number;
  product_id: number;
  sku: string;
  size: string;
  color: string;
  price_cents: number;
  stock: number;
  reserved: number;
  active: number;
  archived?: number;
};

export function db() {
  if (!database) {
    database = new DatabaseSync(dbPath);
    database.exec(readFileSync(schemaPath, "utf8"));
    migrate(database);
    seedIfEmpty(database);
    ensureVariants(database);
    ensureAdmin(database);
    archiveLegacyDeletedProducts(database);
    backfillPaidAt(database);
  }
  return database;
}

function ignoreDuplicateColumn(action: () => void) {
  try {
    action();
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("duplicate column")) {
      throw error;
    }
  }
}

function migrate(conn: DatabaseSync) {
  const columns = [
    "ALTER TABLE products ADD COLUMN material TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE products ADD COLUMN size_chart TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE products ADD COLUMN care_instructions TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE products ADD COLUMN model_info TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE products ADD COLUMN archived INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE cart_items ADD COLUMN variant_id INTEGER",
    "ALTER TABLE orders ADD COLUMN user_id INTEGER",
    "ALTER TABLE orders ADD COLUMN payment_provider TEXT NOT NULL DEFAULT 'manual'",
    "ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'",
    "ALTER TABLE orders ADD COLUMN payment_reference TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE orders ADD COLUMN paid_at TEXT",
    "ALTER TABLE orders ADD COLUMN inventory_locked_until TEXT",
    "ALTER TABLE order_items ADD COLUMN variant_id INTEGER",
    "ALTER TABLE product_variants ADD COLUMN archived INTEGER NOT NULL DEFAULT 0"
  ];
  for (const statement of columns) {
    ignoreDuplicateColumn(() => conn.exec(statement));
  }
}

function seedIfEmpty(conn: DatabaseSync) {
  const count = conn.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number };
  if (count.count > 0) return;

  const insert = conn.prepare(`
    INSERT INTO products (
      sku, slug, name, category, price_cents, description, material,
      size_chart, care_instructions, model_info, image, gallery, stock, sort_order
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  conn.exec("BEGIN");
  try {
    for (const product of seedProducts) {
      insert.run(
        product.sku,
        product.slug,
        product.name,
        product.category,
        product.priceCents,
        product.description,
        product.material ?? "Shell: technical cotton blend. Lining: recycled poly.",
        product.sizeChart ?? "SIZE 1 / 2 / 3. Relaxed YEZI fit.",
        product.careInstructions ?? "Dry clean recommended. Store away from direct heat.",
        product.modelInfo ?? "Model is 180cm and wears size 2.",
        product.image,
        JSON.stringify(product.gallery),
        product.stock,
        product.sortOrder
      );
    }
    conn.exec("COMMIT");
  } catch (error) {
    conn.exec("ROLLBACK");
    throw error;
  }
}

function ensureVariants(conn: DatabaseSync) {
  const products = conn.prepare("SELECT id, sku, price_cents, stock FROM products").all() as Array<{
    id: number;
    sku: string;
    price_cents: number;
    stock: number;
  }>;
  const countVariants = conn.prepare("SELECT COUNT(*) AS count FROM product_variants WHERE product_id = ?");
  const insert = conn.prepare(`
    INSERT INTO product_variants (product_id, sku, size, color, price_cents, stock)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const product of products) {
    const count = countVariants.get(product.id) as { count: number };
    if (count.count > 0) continue;
    const sizes = ["1", "2", "3"];
    for (const size of sizes) {
      insert.run(product.id, `${product.sku}-${size}`, size, "BLACK", product.price_cents, Math.max(1, Math.floor(product.stock / sizes.length)));
    }
  }
}

function ensureAdmin(conn: DatabaseSync) {
  const existing = conn.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (existing) return;
  conn.prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)")
    .run("admin@yezi.local", "dev-admin", "YEZI ADMIN", "admin");
}

function archiveLegacyDeletedProducts(conn: DatabaseSync) {
  conn.prepare(`
    UPDATE products
    SET archived = 1
    WHERE archived = 0
      AND stock = 0
      AND EXISTS (SELECT 1 FROM order_items WHERE order_items.product_id = products.id)
      AND NOT EXISTS (
        SELECT 1 FROM product_variants
        WHERE product_variants.product_id = products.id
          AND product_variants.active = 1
      )
  `).run();
}

function backfillPaidAt(conn: DatabaseSync) {
  conn.prepare(`
    UPDATE orders
    SET paid_at = COALESCE(
      (SELECT MIN(payments.created_at) FROM payments WHERE payments.order_id = orders.id),
      created_at
    )
    WHERE paid_at IS NULL
      AND payment_status = 'paid'
  `).run();
}

export function mapProduct(row: ProductRow): Product {
  const variants = getVariantsByProductId(row.id);
  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    category: row.category,
    priceCents: row.price_cents,
    description: row.description,
    material: row.material ?? "",
    sizeChart: row.size_chart ?? "",
    careInstructions: row.care_instructions ?? "",
    modelInfo: row.model_info ?? "",
    image: row.image,
    gallery: JSON.parse(row.gallery) as string[],
    stock: row.stock,
    archived: row.archived === 1,
    variants
  };
}

export function mapVariant(row: VariantRow): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    size: row.size,
    color: row.color,
    priceCents: row.price_cents,
    stock: row.stock,
    reserved: row.reserved,
    active: row.active === 1,
    archived: row.archived === 1
  };
}

export function getVariantsByProductId(productId: number, options: { includeInactive?: boolean } = {}) {
  const rows = options.includeInactive
    ? db().prepare("SELECT * FROM product_variants WHERE product_id = ? AND archived = 0 ORDER BY size ASC").all(productId) as VariantRow[]
    : db().prepare("SELECT * FROM product_variants WHERE product_id = ? AND active = 1 AND archived = 0 ORDER BY size ASC").all(productId) as VariantRow[];
  return rows.map(mapVariant);
}

export function getProducts(category?: string) {
  const conn = db();
  const rows = category && category !== "all"
    ? conn.prepare("SELECT * FROM products WHERE archived = 0 AND category = ? ORDER BY sort_order ASC").all(category)
    : conn.prepare("SELECT * FROM products WHERE archived = 0 ORDER BY sort_order ASC").all();
  return (rows as ProductRow[]).map(mapProduct);
}

export function getAdminProducts(category?: string) {
  const conn = db();
  const rows = category && category !== "all"
    ? conn.prepare("SELECT * FROM products WHERE archived = 0 AND category = ? ORDER BY sort_order ASC").all(category)
    : conn.prepare("SELECT * FROM products WHERE archived = 0 ORDER BY sort_order ASC").all();
  return (rows as ProductRow[]).map((row) => ({
    ...mapProduct(row),
    variants: getVariantsByProductId(row.id, { includeInactive: true })
  }));
}

export function getProductBySlug(slug: string) {
  const row = db().prepare("SELECT * FROM products WHERE archived = 0 AND slug = ?").get(slug) as ProductRow | undefined;
  return row ? mapProduct(row) : null;
}

export function getProductById(id: number) {
  const row = db().prepare("SELECT * FROM products WHERE archived = 0 AND id = ?").get(id) as ProductRow | undefined;
  return row ? mapProduct(row) : null;
}

export function getVariantById(id: number) {
  const row = db().prepare("SELECT * FROM product_variants WHERE id = ?").get(id) as VariantRow | undefined;
  return row ? mapVariant(row) : null;
}

export async function getSessionId() {
  const jar = await cookies();
  const existing = jar.get("yezi_session")?.value;
  return existing ?? "anonymous";
}

export async function getWritableSessionId() {
  const jar = await cookies();
  const existing = jar.get("yezi_session")?.value;
  if (existing) return existing;

  const id = randomUUID();
  jar.set("yezi_session", id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return id;
}

export function getCart(sessionId: string): CartLine[] {
  return db().prepare(`
    SELECT ci.id, ci.product_id AS productId, ci.variant_id AS variantId, p.sku,
      pv.sku AS variantSku, p.slug, p.name, p.image,
      COALESCE(pv.price_cents, p.price_cents) AS priceCents, ci.size, ci.quantity,
      COALESCE(pv.stock - pv.reserved, p.stock) AS stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.session_id = ?
    ORDER BY ci.created_at ASC, ci.id ASC
  `).all(sessionId) as CartLine[];
}

export function cartTotals(lines: CartLine[]) {
  const subtotalCents = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  return {
    subtotalCents,
    shippingCents: 0,
    taxCents: 0,
    totalCents: subtotalCents
  };
}
