import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fulfillOrder, refundOrder, releaseOrderLock } from "@/lib/orders";

const allowedActions = new Set(["fulfill", "cancel", "refund"]);

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await request.json();
  const orderId = Number(body.orderId);
  const action = String(body.action ?? "");
  if (!orderId || !allowedActions.has(action)) {
    return NextResponse.json({ error: "Invalid order update." }, { status: 400 });
  }

  const current = db().prepare("SELECT status, payment_status FROM orders WHERE id = ?").get(orderId) as { status: string; payment_status: string } | undefined;
  if (!current) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  try {
    if (action === "fulfill") {
      fulfillOrder(orderId);
    } else if (action === "cancel") {
      if (current.status !== "inventory_locked") {
        return NextResponse.json({ error: "Only unpaid locked orders can be cancelled. Use refund for paid orders." }, { status: 409 });
      }
      releaseOrderLock(orderId);
    } else if (action === "refund") {
      refundOrder(orderId);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order update failed." }, { status: 409 });
  }
}
