"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        style?: Record<string, string | number>;
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError?: (error: unknown) => void;
      }) => {
        render: (selectorOrElement: string | HTMLElement) => Promise<void>;
      };
    };
  }
}

type CheckoutPayload = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment?: string;
  city: string;
  country: string;
  province: string;
  postalCode: string;
  phone: string;
  paymentProvider: "paypal";
  cartItems: Array<{
    productId: number;
    variantId: number | null;
    size: string;
    quantity: number;
  }>;
};

export type { CheckoutPayload };

type CreatedOrder = {
  orderId: number;
  orderNumber: string;
  paypalOrderId: string;
};

export function PayPalButton({
  getPayload,
  disabled,
  onPaid,
}: {
  getPayload: () => CheckoutPayload | null;
  disabled: boolean;
  onPaid: () => void;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [clientId, setClientId] = useState("");
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const createdOrderRef = useRef<CreatedOrder | null>(null);

  useEffect(() => {
    async function loadConfig() {
      const response = await fetch("/api/paypal/config");
      const payload = await response.json();
      if (response.ok) {
        setPaypalEnabled(Boolean(payload.paypalEnabled));
      }
      if (response.ok && payload.paypalEnabled && payload.paypalClientId) {
        setClientId(payload.paypalClientId);
      }
      setReady(true);
    }
    void loadConfig();
  }, []);

  useEffect(() => {
    if (!ready || !clientId || !containerRef.current) return;

    const existing = document.querySelector<HTMLScriptElement>("script[data-paypal-sdk='true']");
    function renderButtons() {
      if (!window.paypal || !containerRef.current) return;
      containerRef.current.innerHTML = "";
      void window.paypal.Buttons({
        style: {
          layout: "horizontal",
          color: "black",
          shape: "rect",
          label: "paypal",
          height: 50,
        },
        createOrder: async () => {
          const checkoutPayload = getPayload();
          if (!checkoutPayload) {
            throw new Error("missing-checkout-payload");
          }
          const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(checkoutPayload),
          });
          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload.error ?? "checkout-failed");
          }
          createdOrderRef.current = {
            orderId: Number(payload.orderId),
            orderNumber: String(payload.orderNumber ?? ""),
            paypalOrderId: String(payload.payment?.reference ?? ""),
          };
          return String(payload.payment?.reference ?? "");
        },
        onApprove: async (data) => {
          if (!data.orderID) {
            showToast("PayPal 订单确认失败", "error");
            return;
          }
          const createdOrder = createdOrderRef.current;
          if (!createdOrder?.orderId || !createdOrder.paypalOrderId) {
            showToast("PayPal 订单状态丢失", "error");
            return;
          }
          const response = await fetch("/api/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: createdOrder.orderId,
              reference: createdOrder.paypalOrderId,
            }),
          });
          const payload = await response.json();
          if (!response.ok) {
            showToast(payload.error ?? "PayPal 扣款确认失败", "error");
            return;
          }
          writeCheckoutSuccess();
          onPaid();
          if (createdOrder.orderNumber) {
            router.push(`/checkout/success?order=${encodeURIComponent(createdOrder.orderNumber)}`);
            return;
          }
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "PayPal 初始化失败";
          if (message === "missing-checkout-payload") {
            showToast("请先完整填写收货信息", "error");
            return;
          }
          if (message === "checkout-failed") {
            showToast("创建 PayPal 订单失败", "error");
            return;
          }
          showToast("PayPal 当前不可用，请检查配置", "error");
        },
      }).render(containerRef.current);
    }

    if (existing) {
      renderButtons();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&components=buttons`;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = renderButtons;
    document.body.appendChild(script);
  }, [clientId, getPayload, onPaid, ready]);

  if (!ready) {
    return <div className="pay-button paypal flex items-center justify-center">LOADING</div>;
  }

  if (!paypalEnabled || !clientId) {
    return (
      <button className="pay-button paypal" disabled type="button">
        PAYPAL NOT CONFIGURED
      </button>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : ""}>
      <div ref={containerRef} />
    </div>
  );
}

function writeCheckoutSuccess() {
  showToast("PayPal 支付授权已完成", "success");
}

export function ApplePayButton() {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      const response = await fetch("/api/paypal/config");
      const payload = await response.json();
      if (response.ok) {
        setEnabled(Boolean(payload.applePayEnabled));
      }
      setReady(true);
    }
    void loadConfig();
  }, []);

  if (!ready) {
    return <div className="pay-button flex items-center justify-center">LOADING</div>;
  }

  return (
    <button className="pay-button" disabled={!enabled} type="button">
      {enabled ? "APPLE PAY" : "APPLE PAY"}
    </button>
  );
}
