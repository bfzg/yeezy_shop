"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
  shipping_carrier: string;
  tracking_number: string;
  shipping_note: string;
};

type AdminOrderManagerProps = {
  orders: AdminOrder[];
  page: number;
  pageSize: number;
  paidSort: "latest" | "oldest";
  paymentStatus: "all" | "unpaid" | "pending" | "paid";
  totalOrders: number;
};

type ShippingDraft = {
  orderId: number;
  carrier: string;
  trackingNumber: string;
  note: string;
  mode: "fulfill" | "update_shipping";
};

export function AdminOrderManager({
  orders,
  page,
  pageSize,
  paidSort,
  paymentStatus,
  totalOrders,
}: AdminOrderManagerProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize));
  const nextSort = paidSort === "latest" ? "oldest" : "latest";
  const [shippingDraft, setShippingDraft] = useState<ShippingDraft | null>(
    null,
  );
  const [refundTarget, setRefundTarget] = useState<AdminOrder | null>(null);
  const filterOptions = useMemo(
    () => [
      { label: "已支付", value: "paid" },
      { label: "全部", value: "all" },
      { label: "未支付", value: "unpaid" },
      { label: "待支付", value: "pending" },
    ],
    [],
  );

  async function update(
    orderId: number,
    action: string,
    extra: Record<string, string> = {},
  ) {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action, ...extra }),
    });
    if (response.ok) {
      showToast("订单已更新", "success");
    } else {
      const payload = await response.json();
      showToast(payload.error ?? "订单更新失败", "error");
    }
    router.refresh();
  }

  function openFulfillModal(order: AdminOrder) {
    setShippingDraft({
      orderId: order.id,
      carrier: order.shipping_carrier ?? "",
      trackingNumber: order.tracking_number ?? "",
      note: order.shipping_note ?? "",
      mode: order.status === "fulfilled" ? "update_shipping" : "fulfill",
    });
  }

  async function submitShipping() {
    if (!shippingDraft) return;
    if (!shippingDraft.carrier.trim() || !shippingDraft.trackingNumber.trim()) {
      showToast("请填写物流公司和运单号", "error");
      return;
    }
    await update(shippingDraft.orderId, shippingDraft.mode, {
      carrier: shippingDraft.carrier,
      trackingNumber: shippingDraft.trackingNumber,
      note: shippingDraft.note,
    });
    setShippingDraft(null);
  }

  async function confirmRefund() {
    if (!refundTarget) return;
    await update(refundTarget.id, "refund");
    setRefundTarget(null);
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6 w-full gap-3">
        <div className="flex flex-wrap gap-2 admin-filter-row">
          {filterOptions.map((option) => (
            <Link
              className={`text-button ${paymentStatus === option.value ? "active" : ""}`}
              href={`/admin/orders?paymentStatus=${option.value}&paidSort=${paidSort}&page=1`}
              key={option.value}
            >
              {option.label}
            </Link>
          ))}
        </div>
        <div>
          共 {totalOrders} 单 / 第 {page} 页
        </div>
      </div>
      <div className="admin-table">
        <div className="admin-table-head">
          <span>订单号</span>
          <span>客户</span>
          <span>订单状态</span>
          <span>支付</span>
          <Link
            className="sort-link"
            href={`/admin/orders?paymentStatus=${paymentStatus}&paidSort=${nextSort}&page=1`}
          >
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
            <span>
              {paymentText(order.payment_provider)} /{" "}
              {paymentStatusText(order.payment_status)}
            </span>
            <span>{formatDateTime(order.paid_at)}</span>
            <span>${(order.total_cents / 100).toFixed(2)}</span>
            <span className="table-actions">
              {order.status === "paid" ? (
                <button onClick={() => openFulfillModal(order)} type="button">
                  发货
                </button>
              ) : null}
              {order.status === "fulfilled" ? (
                <button onClick={() => openFulfillModal(order)} type="button">
                  修改发货
                </button>
              ) : null}
              {order.status === "inventory_locked" ? (
                <button
                  onClick={() => update(order.id, "cancel")}
                  type="button"
                >
                  取消
                </button>
              ) : null}
              {["paid", "fulfilled"].includes(order.status) ? (
                <button onClick={() => setRefundTarget(order)} type="button">
                  退款
                </button>
              ) : null}
              {["cancelled", "refunded"].includes(order.status) ? (
                <span className="text-mute">无可用操作</span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
      <div className="pagination">
        <Link
          aria-disabled={page <= 1}
          className={page <= 1 ? "disabled" : ""}
          href={`/admin/orders?paymentStatus=${paymentStatus}&paidSort=${paidSort}&page=${Math.max(1, page - 1)}`}
        >
          上一页
        </Link>
        <span>
          {page} / {totalPages}
        </span>
        <Link
          aria-disabled={page >= totalPages}
          className={page >= totalPages ? "disabled" : ""}
          href={`/admin/orders?paymentStatus=${paymentStatus}&paidSort=${paidSort}&page=${Math.min(totalPages, page + 1)}`}
        >
          下一页
        </Link>
      </div>

      {shippingDraft ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h3>
              {shippingDraft.mode === "fulfill"
                ? "填写发货信息"
                : "修改发货信息"}
            </h3>
            <div className="admin-form">
              <label className="setting-field">
                <span>物流公司</span>
                <input
                  onChange={(event) =>
                    setShippingDraft((current) =>
                      current
                        ? { ...current, carrier: event.target.value }
                        : current,
                    )
                  }
                  placeholder="如：UPS / DHL / SF EXPRESS"
                  value={shippingDraft.carrier}
                />
              </label>
              <label className="setting-field">
                <span>运单号</span>
                <input
                  onChange={(event) =>
                    setShippingDraft((current) =>
                      current
                        ? { ...current, trackingNumber: event.target.value }
                        : current,
                    )
                  }
                  placeholder="Tracking Number"
                  value={shippingDraft.trackingNumber}
                />
              </label>
              <label className="setting-field">
                <span>备注</span>
                <textarea
                  onChange={(event) =>
                    setShippingDraft((current) =>
                      current
                        ? { ...current, note: event.target.value }
                        : current,
                    )
                  }
                  placeholder="如：已短信通知客户 / 拆分包裹说明"
                  value={shippingDraft.note}
                />
              </label>
            </div>
            <div className="admin-modal-actions">
              <button
                className="admin-action-button"
                onClick={() => setShippingDraft(null)}
                type="button"
              >
                取消
              </button>
              <button
                className="admin-action-button primary"
                onClick={submitShipping}
                type="button"
              >
                {shippingDraft.mode === "fulfill" ? "确认发货" : "保存修改"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {refundTarget ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h3>确认退款</h3>
            <p>订单 {refundTarget.order_number} 将进入退款流程，是否继续？</p>
            <div className="admin-modal-actions">
              <button
                className="admin-action-button"
                onClick={() => setRefundTarget(null)}
                type="button"
              >
                取消
              </button>
              <button
                className="admin-action-button danger"
                onClick={confirmRefund}
                type="button"
              >
                确认退款
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function statusText(status: string) {
  const map: Record<string, string> = {
    inventory_locked: "已锁库存",
    paid: "已支付",
    fulfilled: "已发货",
    cancelled: "已取消",
    refunded: "已退款",
  };
  return map[status] ?? status;
}

function paymentStatusText(status: string) {
  const map: Record<string, string> = {
    unpaid: "未支付",
    pending: "待支付",
    paid: "已支付",
    expired: "已过期",
    refunded: "已退款",
  };
  return map[status] ?? status;
}

function paymentText(provider: string) {
  const map: Record<string, string> = {
    stripe: "Stripe",
    paypal: "PayPal",
    apple_pay: "Apple Pay",
    manual: "手动",
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
    minute: "2-digit",
  }).format(date);
}
