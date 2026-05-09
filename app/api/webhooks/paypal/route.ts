import { NextResponse } from "next/server";
import { handlePayPalWebhook } from "@/lib/payments";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const result = await handlePayPalWebhook(request.headers, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handling failed." },
      { status: 400 }
    );
  }
}
