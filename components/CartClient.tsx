"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatMoney, type CartLine } from "@/lib/shared";
import { showToast } from "@/lib/toast";

const CART_KEY = "yezi_cart_v1";

function readCart() {
  try {
    return JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]") as CartLine[];
  } catch {
    return [];
  }
}

function writeCart(lines: CartLine[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent("yezi-cart-updated"));
}

function totalsFor(lines: CartLine[]) {
  const subtotalCents = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  return { subtotalCents, shippingCents: 0, taxCents: 0, totalCents: subtotalCents };
}

export function CartClient() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [lines, setLines] = useState<CartLine[]>([]);
  const currentTotals = useMemo(() => totalsFor(lines), [lines]);

  useEffect(() => {
    setLines(readCart());
    function sync() {
      setLines(readCart());
    }
    window.addEventListener("storage", sync);
    window.addEventListener("yezi-cart-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("yezi-cart-updated", sync);
    };
  }, []);

  function setQty(id: number | string, quantity: number) {
    const updated = quantity <= 0
      ? lines.filter((line) => line.id !== id)
      : lines.map((line) => line.id === id ? { ...line, quantity } : line);
    setLines(updated);
    writeCart(updated);
  }

  async function checkout(provider: "paypal" | "manual", formData?: FormData) {
    const form = formRef.current;
    if (!form) return;
    if (!form.reportValidity()) return;
    const source = formData ?? new FormData(form);
    const checkoutPayload = {
      ...Object.fromEntries(source.entries()),
      paymentProvider: provider,
      cartItems: lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        size: line.size,
        quantity: line.quantity
      }))
    };
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload)
    });
    const payload = await response.json();
    if (response.ok) {
      writeCart([]);
      setLines([]);
      showToast(provider === "paypal" ? `PayPal 订单 ${payload.orderNumber} 已创建` : `订单 ${payload.orderNumber} 已创建`, "success");
      if (provider === "paypal" && payload.payment?.redirectUrl) {
        window.location.href = payload.payment.redirectUrl;
        return;
      }
      router.refresh();
    } else {
      showToast(payload.error ?? "下单失败", "error");
    }
  }

  async function submit(formData: FormData) {
    await checkout("manual", formData);
  }

  return (
    <main className="checkout">
      <form ref={formRef} action={submit}>
        <div className="express-pay">
          <button className="pay-button" disabled type="button">Apple Pay</button>
          <button className="pay-button paypal" onClick={() => checkout("paypal")} type="button">PayPal</button>
        </div>
        <hr className="my-6" />
        <h2 className="section-title mt-6">SHIPPING ADDRESS</h2>
        <div className="form-grid">
          <label className="field">
            <span>FIRST NAME</span>
            <input name="firstName" required />
          </label>
          <label className="field">
            <span>LAST NAME</span>
            <input name="lastName" required />
          </label>
          <label className="field full">
            <span>ADDRESS</span>
            <input name="address" placeholder="START TYPING YOUR ADDRESS..." required />
          </label>
          <label className="field full">
            <span>APARTMENT, SUITE, UNIT, ETC. (OPTIONAL)</span>
            <input name="apartment" placeholder="APARTMENT, SUITE, UNIT, FLOOR, ETC." />
          </label>
          <label className="field">
            <span>CITY</span>
            <input name="city" required />
          </label>
          <label className="field">
            <span>COUNTRY</span>
            <input name="country" required />
          </label>
          <label className="field">
            <span>STATE / PROVINCE</span>
            <input name="province" required />
          </label>
          <label className="field">
            <span>ZIP / POSTAL CODE</span>
            <input name="postalCode" required />
          </label>
          <label className="field full">
            <span>PHONE NUMBER</span>
            <input name="phone" placeholder="+852  123 456 7890" required />
          </label>
        </div>
        <p className="muted-note">ENTER YOUR SHIPPING ADDRESS TO SEE AVAILABLE SHIPPING OPTIONS.</p>
        <label className="field full">
          <span>EMAIL ADDRESS</span>
          <input name="email" type="email" required />
        </label>
        <label className="check-row">
          <input type="checkbox" defaultChecked />
          <span>SUBSCRIBE TO UPDATES AND NOTIFICATIONS</span>
        </label>
      </form>

      <aside className="cart-summary">
        {lines.map((line) => (
          <div className="cart-line" key={line.id}>
            <Image src={line.image} alt={line.name} width={180} height={180} />
            <div className="cart-meta">
              <div>{line.sku}</div>
              {line.variantSku ? <div>{line.variantSku}</div> : null}
              <div>SIZE</div>
              <div>{line.size}</div>
              <div>QTY</div>
            </div>
            <div className="cart-price">
              <div>{formatMoney(line.priceCents * line.quantity)}</div>
              <div className="qty-row">
                <button type="button" onClick={() => setQty(line.id, line.quantity + 1)}>+</button>
                <span>{line.quantity}</span>
                <button type="button" onClick={() => setQty(line.id, line.quantity - 1)}>-</button>
              </div>
            </div>
          </div>
        ))}
        <div className="totals">
          <div className="total-row">
            <span>SUBTOTAL</span>
            <span>{formatMoney(currentTotals.subtotalCents)}</span>
          </div>
          <div className="total-row">
            <span>SHIPPING</span>
            <span>CALCULATED AT NEXT STEP</span>
          </div>
          <div className="total-row">
            <span>TAXES</span>
            <span>{formatMoney(currentTotals.taxCents)}</span>
          </div>
          <div className="total-row strong">
            <span>TOTAL</span>
            <span>{formatMoney(currentTotals.totalCents)}</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
