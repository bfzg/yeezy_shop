import { readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const { seedProducts } = await import("../lib/products.ts").catch(async () => {
  throw new Error("Run `npm install` first so TypeScript imports are available through Next, or use the app to auto-seed.");
});

const dbPath = path.join(process.cwd(), "data", "yezi.db");
const schemaPath = path.join(process.cwd(), "lib", "schema.sql");
const db = new DatabaseSync(dbPath);
db.exec(readFileSync(schemaPath, "utf8"));
db.exec("DELETE FROM cart_items; DELETE FROM order_items; DELETE FROM orders; DELETE FROM products;");

const insert = db.prepare(`
  INSERT INTO products (sku, slug, name, category, price_cents, description, image, gallery, stock, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const product of seedProducts) {
  insert.run(
    product.sku,
    product.slug,
    product.name,
    product.category,
    product.priceCents,
    product.description,
    product.image,
    JSON.stringify(product.gallery),
    product.stock,
    product.sortOrder
  );
}

console.log(`Seeded ${seedProducts.length} products.`);
