import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { AdminPaymentSettings } from "@/components/AdminPaymentSettings";
import { StoreChrome } from "@/components/Chrome";
import { requireAdmin } from "@/lib/auth";
import { getCart, getPaymentSettings, getSessionId } from "@/lib/db";

export default async function AdminPaymentsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const sessionId = await getSessionId();
  const cart = getCart(sessionId);
  const settings = getPaymentSettings();
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const webhookUrl = `${protocol}://${host}/api/webhooks/paypal`;

  return (
    <main className="shell admin-shell">
      <StoreChrome cartCount={cart.reduce((sum, line) => sum + line.quantity, 0)} backHref="/" />
      <section className="admin-header">
        <div>
          <h1>支付设置</h1>
          <p>PayPal / Apple Pay 可视化配置</p>
        </div>
        <div className="admin-header-actions">
          <Link className="text-button" href="/admin">商品列表</Link>
          <Link className="text-button" href="/admin/orders">订单管理</Link>
        </div>
      </section>
      <AdminPaymentSettings initialSettings={settings} webhookUrl={webhookUrl} />
    </main>
  );
}
