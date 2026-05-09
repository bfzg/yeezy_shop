"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

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

type AdminOrderManagerProps = {
  orders: AdminOrder[];
  page: number;
  pageSize: number;
  paidSort: "latest" | "oldest";
  totalOrders: number;
};

export function AdminOrderManager({ orders, page, pageSize, paidSort, totalOrders }: AdminOrderManagerProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize));
  const nextSort = paidSort === "latest" ? "oldest" : "latest";

  async function update(orderId: number, action: string) {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action })
    });
    if (response.ok) {
      showToast("订单已更新", "success");
    } else {
      const payload = await response.json();
      showToast(payload.error ?? "订单更新失败", "error");
    }
    router.refresh();
  }

  return (
    <section>
      <div className="admin-table-toolbar">
        <h2 className="section-title spaced">订单管理</h2>
        <span>共 {totalOrders} 单 / 第 {page} 页</span>
      </div>
      <div className="admin-table">
        <div className="admin-table-head">
          <span>订单号</span>
          <span>客户</span>
          <span>订单状态</span>
          <span>支付</span>
          <Link className="sort-link" href={`/admin/orders?paidSort=${nextSort}&page=1`}>
            支付成功时间 {paidSort === "latest" ? "↓" : "↑"}
          </Link>
          <span>金额</span>
          <span>操作</span>
        </div>
        {orders.map((order) => (
          <div className="admin-table-row" key={order.id}>
            <span>{order.order_number}</span>
            <span>{order.email}</span>
            <span>{statusText(order.status)}</span>
            <span>{paymentText(order.payment_provider)} / {paymentStatusText(order.payment_status)}</span>
            <span>{formatDateTime(order.paid_at)}</span>
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
      <div className="pagination">
        <Link
          aria-disabled={page <= 1}
          className={page <= 1 ? "disabled" : ""}
          href={`/admin/orders?paidSort=${paidSort}&page=${Math.max(1, page - 1)}`}
        >
          上一页
        </Link>
        <span>{page} / {totalPages}</span>
        <Link
          aria-disabled={page >= totalPages}
          className={page >= totalPages ? "disabled" : ""}
          href={`/admin/orders?paidSort=${paidSort}&page=${Math.min(totalPages, page + 1)}`}
        >
          下一页
        </Link>
      </div>
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

function formatDateTime(value: string | null) {
  if (!value) return "未支付";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
