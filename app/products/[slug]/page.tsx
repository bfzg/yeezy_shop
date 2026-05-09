import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { StoreChrome } from "@/components/Chrome";
import { Gallery } from "@/components/Gallery";
import { formatMoney, getCart, getProductBySlug, getSessionId } from "@/lib/db";

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const sessionId = await getSessionId();
  const cart = getCart(sessionId);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <main className="shell">
      <StoreChrome cartCount={cartCount} backHref="/" />
      <section className="detail-stage">
        <Gallery images={product.gallery} name={product.name} />
        <div className="product-panel">
          <div>{product.name}</div>
          <div>{formatMoney(product.priceCents)}</div>
          <AddToCart
            product={{
              id: product.id,
              sku: product.sku,
              slug: product.slug,
              name: product.name,
              image: product.image,
              priceCents: product.priceCents
            }}
            variants={product.variants}
          />
          <div className="product-details-copy">
            <p>{product.material}</p>
            <p>{product.sizeChart}</p>
            <p>{product.careInstructions}</p>
            <p>{product.modelInfo}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
