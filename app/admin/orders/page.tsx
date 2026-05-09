import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminOrderManager } from "@/components/AdminOrderManager";
import { StoreChrome } from "@/components/Chrome";
import { requireAdmin } from "@/lib/auth";
import { db, getCart, getSessionId } from "@/lib/db";

type AdminOrder = {
  id: number;
  order_number: string;
  email: string;
  status: string;
  payment_status: string;
  payment_provider: string;
  total_cents: number;
  created_at: string;
};

export default async function AdminOrdersPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const sessionId = await getSessionId();
  const cart = getCart(sessionId);
  const rows = db().prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 100").all() as AdminOrder[];
  const orders = rows.map((order) => ({ ...order }));

  return (
    <main className="shell admin-shell">
      <StoreChrome cartCount={cart.reduce((sum, line) => sum + line.quantity, 0)} backHref="/admin" />
      <section className="admin-header">
        <div>
          <h1>订单管理</h1>
          <p>管理订单 / 发货 / 退款</p>
        </div>
        <Link className="text-button" href="/admin">商品列表</Link>
      </section>
      <AdminOrderManager orders={orders} />
    </main>
  );
}
