import { NextResponse } from "next/server";
import { getPaymentSettings } from "@/lib/db";

export async function GET() {
  const settings = getPaymentSettings();
  return NextResponse.json({
    paypalEnabled: settings.paypalEnabled,
    paypalClientId: settings.paypalClientId,
    applePayEnabled: settings.applePayEnabled,
    applePayMerchantId: settings.applePayMerchantId,
  });
}
