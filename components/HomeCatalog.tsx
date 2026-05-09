"use client";

import { useState } from "react";
import { StoreChrome } from "@/components/Chrome";
import { HomeGrid } from "@/components/HomeGrid";
import type { Product } from "@/lib/db";

export function HomeCatalog({
  products,
  cartCount,
  activeCategory
}: {
  products: Product[];
  cartCount: number;
  activeCategory: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <main className="shell">
      <StoreChrome
        cartCount={cartCount}
        activeCategory={activeCategory}
        expanded={expanded}
        onPlusClick={() => setExpanded((current) => !current)}
      />
      <HomeGrid expanded={expanded} products={products} />
    </main>
  );
}
