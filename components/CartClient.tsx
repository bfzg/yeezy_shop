"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatMoney, type CartLine } from "@/lib/shared";
import { showToast } from "@/lib/toast";
import { ApplePayButton, PayPalButton, type CheckoutPayload } from "@/components/PayPalButton";

const CART_KEY = "yezi_cart_v1";
const SHIPPING_ADDRESS_KEY = "yezi_shipping_address_v1";

type ShippingAddressDraft = {
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  country: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
};

const EMPTY_SHIPPING_ADDRESS: ShippingAddressDraft = {
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  country: "",
  province: "",
  postalCode: "",
  phone: "",
  email: "",
};

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

function readShippingAddress() {
  try {
    return {
      ...EMPTY_SHIPPING_ADDRESS,
      ...(JSON.parse(window.localStorage.getItem(SHIPPING_ADDRESS_KEY) ?? "{}") as Partial<ShippingAddressDraft>)
    };
  } catch {
    return EMPTY_SHIPPING_ADDRESS;
  }
}

function writeShippingAddress(value: ShippingAddressDraft) {
  window.localStorage.setItem(SHIPPING_ADDRESS_KEY, JSON.stringify(value));
}

function totalsFor(lines: CartLine[], shippingCents: number) {
  const subtotalCents = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  const appliedShippingCents = lines.length > 0 ? shippingCents : 0;
  return {
    subtotalCents,
    shippingCents: appliedShippingCents,
    taxCents: 0,
    totalCents: subtotalCents + appliedShippingCents
  };
}

export function CartClient({ shippingCents }: { shippingCents: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddressDraft>(EMPTY_SHIPPING_ADDRESS);
  const currentTotals = useMemo(() => totalsFor(lines, shippingCents), [lines, shippingCents]);

  useEffect(() => {
    setLines(readCart());
    setShippingAddress(readShippingAddress());
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

  function updateShippingField(field: keyof ShippingAddressDraft, value: string) {
    setShippingAddress((current) => {
      const next = { ...current, [field]: value };
      writeShippingAddress(next);
      return next;
    });
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

  const getPayPalPayload = useCallback((): CheckoutPayload | null => {
    const form = formRef.current;
    if (!form) return null;
    if (!form.reportValidity()) return null;
    const source = new FormData(form);
    const firstName = String(source.get("firstName") ?? "");
    const lastName = String(source.get("lastName") ?? "");
    const address = String(source.get("address") ?? "");
    const apartment = String(source.get("apartment") ?? "");
    const city = String(source.get("city") ?? "");
    const country = String(source.get("country") ?? "");
    const province = String(source.get("province") ?? "");
    const postalCode = String(source.get("postalCode") ?? "");
    const phone = String(source.get("phone") ?? "");
    const email = String(source.get("email") ?? "");
    return {
      email,
      firstName,
      lastName,
      address,
      apartment,
      city,
      country,
      province,
      postalCode,
      phone,
      paymentProvider: "paypal" as const,
      cartItems: lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        size: line.size,
        quantity: line.quantity
      }))
    };
  }, [lines]);

  function handlePayPalPaid() {
    writeCart([]);
    setLines([]);
    router.refresh();
  }

  return (
    <main className="checkout">
      <form ref={formRef} action={submit}>
        <div className="express-pay">
          <ApplePayButton />
          <PayPalButton
            disabled={lines.length === 0}
            getPayload={getPayPalPayload}
            onPaid={handlePayPalPaid}
          />
        </div>
        <hr className="my-6" />
        <h2 className="section-title mt-6">SHIPPING ADDRESS</h2>
        <div className="form-grid">
          <label className="field">
            <span>FIRST NAME</span>
            <input name="firstName" onChange={(event) => updateShippingField("firstName", event.target.value)} required value={shippingAddress.firstName} />
          </label>
          <label className="field">
            <span>LAST NAME</span>
            <input name="lastName" onChange={(event) => updateShippingField("lastName", event.target.value)} required value={shippingAddress.lastName} />
          </label>
          <label className="field full">
            <span>ADDRESS</span>
            <input
              name="address"
              onChange={(event) => updateShippingField("address", event.target.value)}
              placeholder="START TYPING YOUR ADDRESS..."
              required
              value={shippingAddress.address}
            />
          </label>
          <label className="field full">
            <span>APARTMENT, SUITE, UNIT, ETC. (OPTIONAL)</span>
            <input
              name="apartment"
              onChange={(event) => updateShippingField("apartment", event.target.value)}
              placeholder="APARTMENT, SUITE, UNIT, FLOOR, ETC."
              value={shippingAddress.apartment}
            />
          </label>
          <label className="field">
            <span>CITY</span>
            <input name="city" onChange={(event) => updateShippingField("city", event.target.value)} required value={shippingAddress.city} />
          </label>
          <label className="field">
            <span>COUNTRY</span>
            <input name="country" onChange={(event) => updateShippingField("country", event.target.value)} required value={shippingAddress.country} />
          </label>
          <label className="field">
            <span>STATE / PROVINCE</span>
            <input name="province" onChange={(event) => updateShippingField("province", event.target.value)} required value={shippingAddress.province} />
          </label>
          <label className="field">
            <span>ZIP / POSTAL CODE</span>
            <input
              name="postalCode"
              onChange={(event) => updateShippingField("postalCode", event.target.value)}
              required
              value={shippingAddress.postalCode}
            />
          </label>
          <label className="field full">
            <span>PHONE NUMBER</span>
            <input
              name="phone"
              onChange={(event) => updateShippingField("phone", event.target.value)}
              placeholder="+852  123 456 7890"
              required
              value={shippingAddress.phone}
            />
          </label>
        </div>
        <p className="muted-note">ENTER YOUR SHIPPING ADDRESS TO SEE AVAILABLE SHIPPING OPTIONS.</p>
        <label className="field full">
          <span>EMAIL ADDRESS</span>
          <input
            name="email"
            onChange={(event) => updateShippingField("email", event.target.value)}
            required
            type="email"
            value={shippingAddress.email}
          />
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
              <div>{line.name}</div>
              <div>SIZE</div>
              <div>QTY</div>
            </div>
            <div className="cart-price">
              <div>{formatMoney(line.priceCents * line.quantity)}</div>
              <div className="cart-variant-value">{line.size}</div>
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
            <span>{lines.length > 0 ? formatMoney(currentTotals.shippingCents) : formatMoney(0)}</span>
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
