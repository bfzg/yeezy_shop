import { redirect } from "next/navigation";
import { OrderConfirmation } from "@/components/OrderConfirmation";
import { StoreChrome } from "@/components/Chrome";
import { getCart, getOrderByNumber, getSessionId } from "@/lib/db";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const params = await searchParams;
  if (!params.order) redirect("/");

  const order = getOrderByNumber(params.order);
  if (!order) redirect("/");

  const sessionId = await getSessionId();
  const cart = getCart(sessionId);

  return (
    <main className="shell admin-shell">
      <StoreChrome backHref="/" cartCount={cart.reduce((sum, line) => sum + line.quantity, 0)} />
      <OrderConfirmation
        order={order}
        subtitle="支付成功，订单已经创建。后续发货与进度更新会通过邮箱或短信通知你。"
        title="购买成功"
      />
    </main>
  );
}
