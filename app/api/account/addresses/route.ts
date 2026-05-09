import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const addresses = db().prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC").all(user.id);
  return NextResponse.json({ addresses });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await request.json();
  const isDefault = body.isDefault ? 1 : 0;
  const conn = db();
  conn.exec("BEGIN");
  try {
    if (isDefault) conn.prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?").run(user.id);
    conn.prepare(`
      INSERT INTO addresses (
        user_id, label, first_name, last_name, address, apartment, city,
        country, province, postal_code, phone, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      body.label ?? "DEFAULT",
      body.firstName,
      body.lastName,
      body.address,
      body.apartment ?? "",
      body.city,
      body.country,
      body.province,
      body.postalCode,
      body.phone,
      isDefault
    );
    conn.exec("COMMIT");
  } catch (error) {
    conn.exec("ROLLBACK");
    throw error;
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
