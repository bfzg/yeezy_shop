import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminTools } from "@/components/AdminTools";
import { StoreChrome } from "@/components/Chrome";
import { requireAdmin } from "@/lib/auth";
import { getCart, getSessionId } from "@/lib/db";

export default async function NewProductPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const sessionId = await getSessionId();
  const cart = getCart(sessionId);

  return (
    <main className="shell admin-shell max-w-[1180px] mx-auto">
      <StoreChrome cartCount={cart.reduce((sum, line) => sum + line.quantity, 0)} backHref="/admin" />
      <section className="admin-header">
        <div>
          <h1>新增商品</h1>
          <p>创建商品 / 上传图片</p>
        </div>
        <Link className="text-button" href="/admin">商品列表</Link>
      </section>
      <AdminTools />
    </main>
  );
}
