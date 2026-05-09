import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminProductManager } from "@/components/AdminProductManager";
import { StoreChrome } from "@/components/Chrome";
import { requireAdmin } from "@/lib/auth";
import { getCart, getProducts, getSessionId } from "@/lib/db";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const sessionId = await getSessionId();
  const cart = getCart(sessionId);
  const products = getProducts();

  return (
    <main className="shell admin-shell">
      <StoreChrome cartCount={cart.reduce((sum, line) => sum + line.quantity, 0)} backHref="/" />
      <section className="admin-header">
        <div>
          <h1>ADMIN</h1>
          <p>商品管理 / 库存</p>
        </div>
        <div className="admin-header-actions">
          <Link className="text-button" href="/admin/products/new">新增商品</Link>
          <Link className="text-button" href="/admin/orders">订单管理</Link>
        </div>
      </section>
      <AdminProductManager products={products} />
    </main>
  );
}
