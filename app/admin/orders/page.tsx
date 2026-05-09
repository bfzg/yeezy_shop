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
  paid_at: string | null;
  total_cents: number;
  created_at: string;
};

type AdminOrdersPageProps = {
  searchParams: Promise<{
    paidSort?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 12;

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const params = await searchParams;
  const paidSort = params.paidSort === "oldest" ? "oldest" : "latest";
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const orderBy = paidSort === "oldest"
    ? "paid_at IS NULL ASC, paid_at ASC, id ASC"
    : "paid_at IS NULL ASC, paid_at DESC, id DESC";
  const sessionId = await getSessionId();
  const cart = getCart(sessionId);
  const total = db().prepare("SELECT COUNT(*) AS count FROM orders").get() as { count: number };
  const rows = db().prepare(`SELECT * FROM orders ORDER BY ${orderBy} LIMIT ? OFFSET ?`).all(PAGE_SIZE, offset) as AdminOrder[];
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
      <AdminOrderManager
        orders={orders}
        page={page}
        pageSize={PAGE_SIZE}
        paidSort={paidSort}
        totalOrders={total.count}
      />
    </main>
  );
}
