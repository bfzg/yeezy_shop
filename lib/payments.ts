import { db, getPaymentSettings } from "./db";
import { getPaymentMode, paymentEnv } from "./config";
import { markOrderPaid, refundOrder } from "./orders";

async function fetchPayPalAccessToken() {
  const settings = getPaymentSettings();
  const response = await fetch(`${settings.paypalApiBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${settings.paypalClientId}:${settings.paypalSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) {
    throw new Error("Unable to authenticate with PayPal.");
  }
  const payload = await response.json();
  return String(payload.access_token);
}

async function verifyPayPalWebhook(headers: Headers, body: unknown) {
  const settings = getPaymentSettings();
  if (!settings.paypalWebhookId) {
    throw new Error("PayPal webhook is not configured.");
  }

  const accessToken = await fetchPayPalAccessToken();
  const response = await fetch(`${settings.paypalApiBaseUrl}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: settings.paypalWebhookId,
      webhook_event: body,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to verify PayPal webhook.");
  }

  const payload = await response.json() as { verification_status?: string };
  if (payload.verification_status !== "SUCCESS") {
    throw new Error("Invalid PayPal webhook signature.");
  }
}

async function createPayPalOrder(orderId: number, amountCents: number) {
  const settings = getPaymentSettings();
  const accessToken = await fetchPayPalAccessToken();
  const response = await fetch(`${settings.paypalApiBaseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: String(orderId),
          amount: {
            currency_code: "USD",
            value: (amountCents / 100).toFixed(2),
          },
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error("Unable to create a PayPal order.");
  }
  return response.json() as Promise<{ id: string }>;
}

async function capturePayPalOrder(paypalOrderId: string) {
  const settings = getPaymentSettings();
  const accessToken = await fetchPayPalAccessToken();
  const response = await fetch(`${settings.paypalApiBaseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `capture-${paypalOrderId}`,
    },
  });
  if (!response.ok) {
    throw new Error("Unable to capture PayPal order.");
  }
  return response.json() as Promise<{
    status?: string;
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{
          id: string;
          status: string;
        }>;
      };
    }>;
  }>;
}

export async function createPayment(orderId: number, provider: "stripe" | "paypal" | "apple_pay" | "manual", amountCents: number) {
  const reference = `DEV-${provider.toUpperCase()}-${orderId}-${Date.now()}`;
  const configured = getPaymentMode();
  const settings = getPaymentSettings();
  const liveReady =
    (provider === "stripe" && configured.stripeConfigured) ||
    (provider === "paypal" && settings.paypalEnabled && Boolean(settings.paypalClientId && settings.paypalSecret)) ||
    (provider === "apple_pay" && settings.applePayEnabled && Boolean(paymentEnv.stripeSecretKey && settings.applePayMerchantId));
  let paypalOrderId = "";

  if (provider !== "paypal" && !liveReady) {
    markOrderPaid(orderId, provider, reference);
  }
  if (provider === "paypal" && liveReady) {
    const paypalOrder = await createPayPalOrder(orderId, amountCents);
    paypalOrderId = paypalOrder.id;
  }

  db().prepare(`
    INSERT INTO payments (order_id, provider, status, amount_cents, reference, redirect_url, raw_payload)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderId,
    provider,
    provider === "paypal"
      ? (liveReady ? "pending_approval" : "configuration_required")
      : liveReady
        ? "requires_redirect"
        : "simulated_paid",
    amountCents,
    provider === "paypal" && paypalOrderId ? paypalOrderId : reference,
    "",
    JSON.stringify({
      mode: provider === "paypal"
        ? (liveReady ? "paypal_sdk" : "configuration_required")
        : liveReady
          ? "configured_placeholder"
          : "development_simulation"
    })
  );

  return {
    provider,
    reference: provider === "paypal" && paypalOrderId ? paypalOrderId : reference,
    status: provider === "paypal"
      ? (liveReady ? "pending_approval" : "configuration_required")
      : liveReady
        ? "requires_redirect"
        : "simulated_paid",
    redirectUrl: ""
  };
}

export async function capturePayment(orderId: number, provider: "paypal", reference: string) {
  if (provider !== "paypal") {
    throw new Error("Unsupported payment provider.");
  }

  const capture = await capturePayPalOrder(reference);
  const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? reference;
  const captureStatus = capture.purchase_units?.[0]?.payments?.captures?.[0]?.status ?? capture.status ?? "";

  if (!["COMPLETED", "completed"].includes(captureStatus)) {
    throw new Error("PayPal payment is not completed.");
  }

  db().prepare(`
    UPDATE payments
    SET status = 'captured', reference = ?, raw_payload = ?
    WHERE order_id = ? AND provider = 'paypal'
  `).run(captureId, JSON.stringify(capture), orderId);

  markOrderPaid(orderId, provider, captureId);

  return {
    status: captureStatus,
    reference: captureId,
  };
}

export async function handlePayPalWebhook(headers: Headers, body: unknown) {
  await verifyPayPalWebhook(headers, body);

  const event = body as {
    event_type?: string;
    resource?: {
      id?: string;
      supplementary_data?: {
        related_ids?: {
          order_id?: string;
        };
      };
    };
  };

  const eventType = String(event.event_type ?? "");
  const resourceId = String(event.resource?.id ?? "");
  const relatedOrderId = String(event.resource?.supplementary_data?.related_ids?.order_id ?? "");
  const paymentReference = relatedOrderId || resourceId;

  const payment = db().prepare(`
    SELECT order_id, status
    FROM payments
    WHERE provider = 'paypal' AND reference IN (?, ?)
    ORDER BY id DESC
    LIMIT 1
  `).get(paymentReference, resourceId) as { order_id: number; status: string } | undefined;

  if (!payment) {
    return { ignored: true };
  }

  if (eventType === "PAYMENT.CAPTURE.COMPLETED" && payment.status !== "captured") {
    db().prepare("UPDATE payments SET status = 'captured', raw_payload = ? WHERE order_id = ? AND provider = 'paypal'")
      .run(JSON.stringify(body), payment.order_id);
    markOrderPaid(payment.order_id, "paypal", resourceId || paymentReference);
  }

  if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
    db().prepare("UPDATE payments SET status = 'refunded', raw_payload = ? WHERE order_id = ? AND provider = 'paypal'")
      .run(JSON.stringify(body), payment.order_id);
    refundOrder(payment.order_id);
  }

  return { ok: true };
}
