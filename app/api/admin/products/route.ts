import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await request.json();
  const sku = String(body.sku);
  const slug = body.slug ? slugify(String(body.slug)) : slugify(sku);
  const priceCents = Math.round(Number(body.price ?? 0) * 100);
  const gallery = String(body.gallery ?? body.image ?? "").split("\n").map((item) => item.trim()).filter(Boolean);

  const result = db().prepare(`
    INSERT INTO products (
      sku, slug, name, category, price_cents, description, material,
      size_chart, care_instructions, model_info, image, gallery, stock, sort_order
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sku,
    slug,
    body.name ?? sku,
    body.category ?? "new",
    priceCents,
    body.description ?? "",
    body.material ?? "",
    body.sizeChart ?? "",
    body.careInstructions ?? "",
    body.modelInfo ?? "",
    body.image ?? "/products/pk-01.png",
    JSON.stringify(gallery.length ? gallery : [body.image ?? "/products/pk-01.png"]),
    Number(body.stock ?? 0),
    Number(body.sortOrder ?? 100)
  );

  const productId = Number(result.lastInsertRowid);
  const sizes = String(body.sizes ?? "1,2,3").split(",").map((size) => size.trim()).filter(Boolean);
  const perSizeStock = Math.max(0, Math.floor(Number(body.stock ?? 0) / Math.max(sizes.length, 1)));
  const insertVariant = db().prepare(`
    INSERT INTO product_variants (product_id, sku, size, color, price_cents, stock)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const size of sizes) {
    insertVariant.run(productId, `${sku}-${size}`, size, body.color ?? "BLACK", priceCents, perSizeStock);
  }

  return NextResponse.json({ id: productId, slug }, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await request.json();
  db().prepare(`
    UPDATE products SET
      name = ?, category = ?, price_cents = ?, description = ?, material = ?,
      size_chart = ?, care_instructions = ?, model_info = ?, image = ?, gallery = ?, stock = ?
    WHERE id = ?
  `).run(
    body.name,
    body.category,
    Math.round(Number(body.price ?? 0) * 100),
    body.description ?? "",
    body.material ?? "",
    body.sizeChart ?? "",
    body.careInstructions ?? "",
    body.modelInfo ?? "",
    body.image,
    JSON.stringify(String(body.gallery ?? body.image).split("\n").map((item) => item.trim()).filter(Boolean)),
    Number(body.stock ?? 0),
    Number(body.id)
  );
  if (body.variants && Array.isArray(body.variants)) {
    const updateVariant = db().prepare("UPDATE product_variants SET price_cents = ?, stock = ?, active = ? WHERE id = ?");
    for (const variant of body.variants) {
      updateVariant.run(
        Math.round(Number(variant.price ?? body.price ?? 0) * 100),
        Number(variant.stock ?? 0),
        variant.active === false ? 0 : 1,
        Number(variant.id)
      );
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Product id is required." }, { status: 400 });

  const hasOrders = db().prepare("SELECT id FROM order_items WHERE product_id = ? LIMIT 1").get(id);
  if (hasOrders) {
    db().prepare("UPDATE product_variants SET active = 0 WHERE product_id = ?").run(id);
    db().prepare("UPDATE products SET archived = 1, stock = 0 WHERE id = ?").run(id);
    return NextResponse.json({ ok: true, archived: true });
  }

  db().prepare("DELETE FROM products WHERE id = ?").run(id);
  return NextResponse.json({ ok: true, deleted: true });
}
