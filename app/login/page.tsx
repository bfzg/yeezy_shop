import { redirect } from "next/navigation";
import { StoreChrome } from "@/components/Chrome";
import { getCurrentUser } from "@/lib/auth";
import { getCart, getSessionId } from "@/lib/db";
import { LoginRegister } from "@/components/LoginRegister";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  const sessionId = await getSessionId();
  const cart = getCart(sessionId);

  return (
    <main className="shell admin-shell">
      <StoreChrome cartCount={cart.reduce((sum, line) => sum + line.quantity, 0)} backHref="/" />
      <LoginRegister />
    </main>
  );
}
