import { db } from "./db";
import { markOrderPaid } from "./orders";

export function getPaymentMode() {
  return {
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    paypalConfigured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET),
    applePayConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_APPLE_PAY_ENABLED === "true")
  };
}

export function createPayment(orderId: number, provider: "stripe" | "paypal" | "apple_pay" | "manual", amountCents: number) {
  const reference = `DEV-${provider.toUpperCase()}-${orderId}-${Date.now()}`;
  const configured = getPaymentMode();
  const liveReady =
    (provider === "stripe" && configured.stripeConfigured) ||
    (provider === "paypal" && configured.paypalConfigured) ||
    (provider === "apple_pay" && configured.applePayConfigured);

  if (!liveReady) {
    markOrderPaid(orderId, provider, reference);
  }

  db().prepare(`
    INSERT INTO payments (order_id, provider, status, amount_cents, reference, redirect_url, raw_payload)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderId,
    provider,
    liveReady ? "requires_redirect" : "simulated_paid",
    amountCents,
    reference,
    liveReady ? `/pay/${orderId}` : `/account`,
    JSON.stringify({ mode: liveReady ? "configured_placeholder" : "development_simulation" })
  );

  return {
    provider,
    reference,
    status: liveReady ? "requires_redirect" : "simulated_paid",
    redirectUrl: liveReady ? `/pay/${orderId}` : "/account"
  };
}
