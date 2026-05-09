import Link from "next/link";
import { redirect } from "next/navigation";
import { AddressForm } from "@/components/AddressForm";
import { StoreChrome } from "@/components/Chrome";
import { getCurrentUser } from "@/lib/auth";
import { db, getCart, getSessionId } from "@/lib/db";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sessionId = await getSessionId();
  const cart = getCart(sessionId);
  const addresses = db().prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC").all(user.id) as Array<Record<string, string | number>>;
  const orders = db().prepare("SELECT * FROM orders WHERE user_id = ? OR email = ? ORDER BY id DESC LIMIT 12").all(user.id, user.email) as Array<Record<string, string | number>>;

  return (
    <main className="shell admin-shell">
      <StoreChrome cartCount={cart.reduce((sum, line) => sum + line.quantity, 0)} backHref="/" />
      <section className="admin-header">
        <div>
          <h1>ACCOUNT</h1>
          <p>{user.email}</p>
        </div>
        {user.role === "admin" ? <Link className="text-button" href="/admin">ADMIN</Link> : null}
      </section>

      <section className="two-column">
        <div>
          <h2 className="section-title">ADDRESS BOOK</h2>
          <AddressForm />
        </div>
        <div>
          <h2 className="section-title">SAVED ADDRESSES</h2>
          <div className="data-list">
            {addresses.map((address) => (
              <div className="data-row" key={String(address.id)}>
                <strong>{String(address.label)}</strong>
                <span>{String(address.first_name)} {String(address.last_name)}</span>
                <span>{String(address.address)}, {String(address.city)}</span>
                <span>{String(address.country)} {String(address.postal_code)}</span>
              </div>
            ))}
          </div>
          <h2 className="section-title spaced">ORDERS</h2>
          <div className="data-list">
            {orders.map((order) => (
              <div className="data-row" key={String(order.id)}>
                <strong>{String(order.order_number)}</strong>
                <span>{String(order.status)} / {String(order.payment_status)}</span>
                <span>${(Number(order.total_cents) / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
