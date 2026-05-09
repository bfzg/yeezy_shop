import { StoreChrome } from "@/components/Chrome";
import { CartClient } from "@/components/CartClient";
import { getShippingCents } from "@/lib/config";

export default function CartPage() {
  return (
    <main className="shell">
      <StoreChrome cartCount={0} backHref="/" />
      <CartClient shippingCents={getShippingCents()} />
    </main>
  );
}
