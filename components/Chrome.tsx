"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, ShoppingBag } from "lucide-react";

const CART_KEY = "yezi_cart_v1";

type CartLine = {
  quantity: number;
};

export function StoreChrome({
  cartCount,
  backHref,
  showPlus = true,
  activeCategory = "new",
  }: {
  cartCount: number;
  backHref?: string;
  showPlus?: boolean;
  activeCategory?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [liveCartCount, setLiveCartCount] = useState(cartCount);

  useEffect(() => {
    function readCartCount() {
      try {
        const lines = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]") as CartLine[];
        setLiveCartCount(lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0));
      } catch {
        setLiveCartCount(0);
      }
    }
    readCartCount();
    window.addEventListener("storage", readCartCount);
    window.addEventListener("yezi-cart-updated", readCartCount);
    return () => {
      window.removeEventListener("storage", readCartCount);
      window.removeEventListener("yezi-cart-updated", readCartCount);
    };
  }, [cartCount]);

  useEffect(() => {
    function update() {
      setScrolled(window.scrollY > 8);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const topBarClass = [
    "fixed inset-x-0 top-0 z-20 flex h-[6rem] items-center justify-between px-7 transition-colors duration-150",
    scrolled ? "border-b border-neutral-200 bg-white" : "bg-white/0",
  ].join(" ");
  const iconButtonClass = "inline-flex h-7 w-7 items-center justify-center";
  const rightLinkClass = "inline-flex h-7 items-center justify-center gap-1.5";
  const navLinkClass = (value: string) => activeCategory === value ? "active" : "";

  return (
    <header className={topBarClass}>
      <div className="flex flex-1 items-center justify-start">
        {backHref ? (
          <Link className={iconButtonClass} href={backHref} aria-label="Back">
            <ArrowLeft size={23} strokeWidth={2.6} />
          </Link>
        ) : showPlus ? (
          <button className={iconButtonClass} aria-label="Open menu">
            <Plus size={24} strokeWidth={2.6} />
          </button>
        ) : null}
      </div>
      {!backHref ? (
        <nav className="top-nav" aria-label="Product categories">
          <div>
            <Link className={navLinkClass("new")} href="/">
              NEW
            </Link>
            <Link className={navLinkClass("mens")} href="/?category=mens">MENS</Link>
            <Link className={navLinkClass("womens")} href="/?category=womens">WOMENS</Link>
          </div>
          <div>
            <Link className={navLinkClass("footwear")} href="/?category=footwear">FOOTWEAR</Link>
            <Link className={navLinkClass("accessories")} href="/?category=accessories">ACCESSORIES</Link>
          </div>
          <div>
            <Link className={navLinkClass("slides")} href="/?category=slides">SLIDES</Link>
          </div>
        </nav>
      ) : null}
      <div className="flex flex-1 items-center justify-end">
        <Link className={rightLinkClass} href="/cart" aria-label="Cart">
          <span>{liveCartCount}</span>
          <ShoppingBag size={18} strokeWidth={2.4} />
        </Link>
      </div>
    </header>
  );
}
