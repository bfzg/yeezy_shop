"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, ShoppingBag } from "lucide-react";

export function StoreChrome({
  cartCount,
  backHref,
  showPlus = true,
}: {
  cartCount: number;
  backHref?: string;
  showPlus?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);

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
            <Link className="active" href="/">
              NEW
            </Link>
            <Link href="/?category=mens">MENS</Link>
            <Link href="/?category=womens">WOMENS</Link>
          </div>
          <div>
            <Link href="/?category=footwear">FOOTWEAR</Link>
            <Link href="/?category=accessories">ACCESSORIES</Link>
          </div>
          <div>
            <Link href="/?category=slides">SLIDES</Link>
          </div>
        </nav>
      ) : null}
      <div className="flex flex-1 items-center justify-end">
        <Link className={rightLinkClass} href="/cart" aria-label="Cart">
          <span>{cartCount}</span>
          <ShoppingBag size={18} strokeWidth={2.4} />
        </Link>
      </div>
    </header>
  );
}
