import Image from "next/image";
import Link from "next/link";
import { formatMoney, type OrderSummary } from "@/lib/db";

function paymentText(provider: string) {
  if (provider === "paypal") return "PayPal";
  if (provider === "apple_pay") return "Apple Pay";
  return provider.toUpperCase();
}

export function OrderConfirmation({
  order,
  title,
  subtitle,
}: {
  order: OrderSummary;
  title: string;
  subtitle: string;
  showOrderDetailLink?: boolean;
}) {
  return (
    <section className="order-confirmation">
      <div className="order-confirmation-head">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="order-confirmation-grid">
        <div className="order-confirmation-panel">
          <div className="order-confirmation-meta">
            <div>
              <span>ORDER</span>
              <strong>{order.orderNumber}</strong>
            </div>
            <div>
              <span>PAYMENT</span>
              <strong>{paymentText(order.paymentProvider)} / {order.paymentStatus}</strong>
            </div>
            <div>
              <span>TOTAL</span>
              <strong>{formatMoney(order.totalCents)}</strong>
            </div>
          </div>

          <div className="order-confirmation-address">
            <span>SHIPPING TO</span>
            <strong>{order.firstName} {order.lastName}</strong>
            <p>{order.address}{order.apartment ? `, ${order.apartment}` : ""}</p>
            <p>{order.city}, {order.province}, {order.postalCode}</p>
            <p>{order.country}</p>
            <p>{order.phone}</p>
            <p>{order.email}</p>
          </div>

          {(order.shippingCarrier || order.trackingNumber || order.shippingNote || order.fulfilledAt) ? (
            <div className="order-confirmation-address">
              <span>SHIPPING INFO</span>
              {order.shippingCarrier ? <p>承运商：{order.shippingCarrier}</p> : null}
              {order.trackingNumber ? <p>运单号：{order.trackingNumber}</p> : null}
              {order.fulfilledAt ? <p>发货时间：{new Date(order.fulfilledAt).toLocaleString("zh-CN")}</p> : null}
              {order.shippingNote ? <p>备注：{order.shippingNote}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="order-confirmation-panel">
          <div className="order-confirmation-items">
            {order.items.map((item) => (
              <div className="order-confirmation-item" key={item.id}>
                <Image alt={item.productName} height={84} src={item.image} width={84} />
                <div>
                  <strong>{item.productName}</strong>
                  <span>SIZE {item.size}</span>
                  <span>QTY {item.quantity}</span>
                </div>
                <strong>{formatMoney(item.priceCents * item.quantity)}</strong>
              </div>
            ))}
          </div>

          <div className="order-confirmation-totals">
            <div><span>SUBTOTAL</span><strong>{formatMoney(order.subtotalCents)}</strong></div>
            <div><span>SHIPPING</span><strong>{formatMoney(order.shippingCents)}</strong></div>
            <div><span>TAXES</span><strong>{formatMoney(order.taxCents)}</strong></div>
            <div><span>TOTAL</span><strong>{formatMoney(order.totalCents)}</strong></div>
          </div>
        </div>
      </div>

      <div className="order-confirmation-actions">
        <Link className="text-button" href="/">继续浏览商品</Link>
      </div>
    </section>
  );
}
