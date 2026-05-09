export const paymentEnv = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  paypalClientId: process.env.PAYPAL_CLIENT_ID ?? "",
  paypalSecret: process.env.PAYPAL_SECRET ?? "",
  paypalMerchantId: process.env.PAYPAL_MERCHANT_ID ?? "",
  paypalBaseUrl: process.env.PAYPAL_BASE_URL ?? "",
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
    "PAYPAL_MERCHANT_ID",
    "PAYPAL_BASE_URL",
  ],
  applePay: [
    "NEXT_PUBLIC_APPLE_PAY_ENABLED",
    "APPLE_PAY_MERCHANT_ID",
    "STRIPE_SECRET_KEY",
  ],
} as const;
