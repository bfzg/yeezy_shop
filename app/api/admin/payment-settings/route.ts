import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPaymentSettings, savePaymentSettings } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getPaymentSettings());
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  savePaymentSettings({
    paypalEnabled: Boolean(body.paypalEnabled),
    paypalClientId: String(body.paypalClientId ?? ""),
    paypalSecret: String(body.paypalSecret ?? ""),
    paypalApiBaseUrl: String(body.paypalApiBaseUrl ?? ""),
    paypalWebhookId: String(body.paypalWebhookId ?? ""),
    applePayEnabled: Boolean(body.applePayEnabled),
    applePayMerchantId: String(body.applePayMerchantId ?? ""),
  });

  return NextResponse.json({ ok: true, settings: getPaymentSettings() });
}
