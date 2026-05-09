import { HomeCatalog } from "@/components/HomeCatalog";
import { getCart, getProducts, getSessionId } from "@/lib/db";

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const sessionId = await getSessionId();
  const cart = getCart(sessionId);
  const products = getProducts(params.category);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  return <HomeCatalog activeCategory={params.category ?? "new"} cartCount={cartCount} products={products} />;
}
