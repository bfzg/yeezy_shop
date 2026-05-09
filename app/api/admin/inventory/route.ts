import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await request.json();
  const variantId = Number(body.variantId);
  const stock = Number(body.stock);
  db().prepare("UPDATE product_variants SET stock = ? WHERE id = ?").run(stock, variantId);
  db().prepare("INSERT INTO inventory_movements (variant_id, type, quantity, note) VALUES (?, 'adjusted', ?, ?)")
    .run(variantId, stock, body.note ?? "admin adjustment");
  return NextResponse.json({ ok: true });
}
