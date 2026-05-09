import { NextResponse } from "next/server";
import { capturePayment } from "@/lib/payments";

export async function POST(request: Request) {
  const body = await request.json();
  const orderId = Number(body.orderId ?? 0);
  const reference = String(body.reference ?? "");

  if (!orderId || !reference) {
    return NextResponse.json({ error: "orderId and reference are required." }, { status: 400 });
  }

  try {
    const payment = await capturePayment(orderId, "paypal", reference);
    return NextResponse.json({ ok: true, payment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Capture failed." },
      { status: 400 }
    );
  }
}
