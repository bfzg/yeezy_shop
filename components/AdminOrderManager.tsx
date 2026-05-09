"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

export function AdminOrderManager({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function update(orderId: number, action: string) {
    setMessage("");
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action })
    });
    if (response.ok) {
      setMessage("订单已更新");
    } else {
      const payload = await response.json();
      setMessage(payload.error ?? "更新失败");
    }
    router.refresh();
  }

  return (
    <section>
      <h2 className="section-title spaced">订单管理</h2>
      <div className="admin-table">
        <div className="admin-table-head">
          <span>订单号</span>
          <span>客户</span>
          <span>订单状态</span>
          <span>支付</span>
          <span>金额</span>
          <span>操作</span>
        </div>
        {orders.map((order) => (
          <div className="admin-table-row" key={order.id}>
            <span>{order.order_number}</span>
            <span>{order.email}</span>
            <span>{statusText(order.status)}</span>
            <span>{paymentText(order.payment_provider)} / {paymentStatusText(order.payment_status)}</span>
            <span className="">${(order.total_cents / 100).toFixed(2)}</span>
            <span className="table-actions">
              {order.status === "paid" ? (
                <button onClick={() => update(order.id, "fulfill")} type="button">发货</button>
              ) : null}
              {order.status === "inventory_locked" ? (
                <button onClick={() => update(order.id, "cancel")} type="button">取消</button>
              ) : null}
              {["paid", "fulfilled"].includes(order.status) ? (
                <button onClick={() => update(order.id, "refund")} type="button">退款</button>
              ) : null}
              {["cancelled", "refunded"].includes(order.status) ? <span className="text-mute">无可用操作</span> : null}
            </span>
          </div>
        ))}
      </div>
      {message ? <p className="success">{message}</p> : null}
    </section>
  );
}

function statusText(status: string) {
  const map: Record<string, string> = {
    inventory_locked: "已锁库存",
    paid: "已支付",
    fulfilled: "已发货",
    cancelled: "已取消",
    refunded: "已退款"
  };
  return map[status] ?? status;
}

function paymentStatusText(status: string) {
  const map: Record<string, string> = {
    unpaid: "未支付",
    pending: "待支付",
    paid: "已支付",
    expired: "已过期"
    ,refunded: "已退款"
  };
  return map[status] ?? status;
}

function paymentText(provider: string) {
  const map: Record<string, string> = {
    stripe: "Stripe",
    paypal: "PayPal",
    apple_pay: "Apple Pay",
    manual: "手动"
  };
  return map[provider] ?? provider;
}
