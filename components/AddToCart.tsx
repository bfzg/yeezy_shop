"use client";

import { useState } from "react";
import type { ProductVariant } from "@/lib/db";

type AddProduct = {
  id: number;
  sku: string;
  slug: string;
  name: string;
  image: string;
  priceCents: number;
};

type LocalCartLine = {
  id: string;
  productId: number;
  variantId: number | null;
  sku: string;
  variantSku: string | null;
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  size: string;
  quantity: number;
  stock: number;
};

const CART_KEY = "yezi_cart_v1";

function readCart(): LocalCartLine[] {
  try {
    return JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]") as LocalCartLine[];
  } catch {
    return [];
  }
}

function writeCart(lines: LocalCartLine[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent("yezi-cart-updated"));
}

export function AddToCart({ product, variants }: { product: AddProduct; variants: ProductVariant[] }) {
  const [loading, setLoading] = useState(false);
  const activeVariants = variants.filter((variant) => variant.active && variant.archived === false);
  const [variantId, setVariantId] = useState(activeVariants[0]?.id ?? 0);
  const selected = activeVariants.find((variant) => variant.id === variantId);

  function add(event: React.MouseEvent<HTMLButtonElement>) {
    if (!selected) return;
    setLoading(true);
    const lines = readCart();
    const id = `${product.id}:${selected.id}:${selected.size}`;
    const existing = lines.find((line) => line.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      lines.push({
        id,
        productId: product.id,
        variantId: selected.id,
        sku: product.sku,
        variantSku: selected.sku,
        slug: product.slug,
        name: product.name,
        image: product.image,
        priceCents: selected.priceCents || product.priceCents,
        size: selected.size,
        quantity: 1,
        stock: selected.stock - selected.reserved
      });
    }
    writeCart(lines);
    const rect = event.currentTarget.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent("yezi-cart-animate", {
      detail: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      },
    }));
    setLoading(false);
  }

  return (
    <div className="variant-picker">
      <div className="size-row" aria-label="Size">
        {activeVariants.map((variant) => (
          <button
            className={variant.id === variantId ? "active" : ""}
            disabled={variant.stock - variant.reserved <= 0}
            key={variant.id}
            onClick={() => setVariantId(variant.id)}
            type="button"
          >
            {variant.size}
          </button>
        ))}
      </div>
      <button className="add-button" onClick={add} disabled={loading || !selected} aria-label="Add to cart">
        {loading ? "..." : "+"}
      </button>
    </div>
  );
}
