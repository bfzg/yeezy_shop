import { StoreChrome } from "@/components/Chrome";
import { CartClient } from "@/components/CartClient";

export default function CartPage() {
  return (
    <main className="shell">
      <StoreChrome cartCount={0} backHref="/" />
      <CartClient />
    </main>
  );
}
