"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/db";

export function HomeGrid({ products, expanded }: { products: Product[]; expanded: boolean }) {
  return (
    <section className={`product-grid ${expanded ? "expanded" : ""}`} aria-label="Products">
      {products.map((product) => (
        <Link className="product-card" href={`/products/${product.slug}`} key={product.id}>
          <div className="product-media">
            <Image src={product.image} alt={product.name} width={900} height={900} priority={product.id <= 6} />
          </div>
          <div className="product-name">{product.name}</div>
        </Link>
      ))}
    </section>
  );
}
