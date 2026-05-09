const DEFAULT_SHIPPING_CENTS = 2499;

export const paymentEnv = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  paypalClientId: process.env.PAYPAL_CLIENT_ID ?? "",
  paypalSecret: process.env.PAYPAL_SECRET ?? "",
  paypalApiBaseUrl: process.env.PAYPAL_API_BASE_URL ?? "https://api-m.sandbox.paypal.com",
  applePayEnabled: process.env.NEXT_PUBLIC_APPLE_PAY_ENABLED ?? "false",
  applePayMerchantId: process.env.APPLE_PAY_MERCHANT_ID ?? "",
};

export function getPaymentMode() {
  return {
    stripeConfigured: Boolean(paymentEnv.stripeSecretKey),
    paypalConfigured: Boolean(paymentEnv.paypalClientId && paymentEnv.paypalSecret),
    applePayConfigured: Boolean(paymentEnv.stripeSecretKey && paymentEnv.applePayEnabled === "true" && paymentEnv.applePayMerchantId),
  };
}

export const paymentProviderDocs = {
  paypal: [
    "PAYPAL_CLIENT_ID",
    "PAYPAL_SECRET",
    "PAYPAL_API_BASE_URL",
  ],
  applePay: [
    "NEXT_PUBLIC_APPLE_PAY_ENABLED",
    "APPLE_PAY_MERCHANT_ID",
    "STRIPE_SECRET_KEY",
  ],
} as const;

export function getShippingCents() {
  const raw = process.env.SHIPPING_FLAT_RATE_USD ?? "";
  if (!raw) return DEFAULT_SHIPPING_CENTS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_SHIPPING_CENTS;
  return Math.round(parsed * 100);
}

export function getPublicPaymentConfig() {
  return {
    paypalClientId: paymentEnv.paypalClientId,
    applePayEnabled: paymentEnv.applePayEnabled === "true",
  };
}
