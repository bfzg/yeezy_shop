import Image from "next/image";
import Link from "next/link";
import { StoreChrome } from "@/components/Chrome";
import { cartTotals, getCart, getProducts, getSessionId } from "@/lib/db";

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const sessionId = await getSessionId();
  const cart = getCart(sessionId);
  const products = getProducts(params.category);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <main className="shell">
      <StoreChrome cartCount={cartCount} activeCategory={params.category ?? "new"} />
      <section className="product-grid" aria-label="Products">
        {products.map((product) => (
          <Link className="product-card" href={`/products/${product.slug}`} key={product.id}>
            <div className="product-media">
              <Image src={product.image} alt={product.name} width={900} height={900} priority={product.id <= 6} />
            </div>
            <div className="product-name">{product.name}</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
