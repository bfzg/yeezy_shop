import { redirect } from "next/navigation";
import { OrderConfirmation } from "@/components/OrderConfirmation";
import { StoreChrome } from "@/components/Chrome";
import { getCart, getOrderByNumber, getSessionId } from "@/lib/db";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = getOrderByNumber(orderNumber);
  if (!order) redirect("/");

  const sessionId = await getSessionId();
  const cart = getCart(sessionId);

  return (
    <main className="shell admin-shell">
      <StoreChrome backHref="/" cartCount={cart.reduce((sum, line) => sum + line.quantity, 0)} />
      <OrderConfirmation
        order={order}
        subtitle="这里可以查看支付、收货和商品明细。"
        title="订单详情"
        showOrderDetailLink={false}
      />
    </main>
  );
}
