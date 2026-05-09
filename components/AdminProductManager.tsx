"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { AdminCategorySelect } from "@/components/AdminCategorySelect";
import { AdminImageManager } from "@/components/AdminImageManager";
import type { Product } from "@/lib/db";

export function AdminProductManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const [items, setItems] = useState(products);
  const [editing, setEditing] = useState<Product | null>(products[0] ?? null);
  const [message, setMessage] = useState("");

  async function save(formData: FormData) {
    if (!editing) return;
    setMessage("");
    const variants = editing.variants.map((variant) => ({
      id: variant.id,
      price: formData.get(`variant_price_${variant.id}`),
      stock: formData.get(`variant_stock_${variant.id}`),
      active: formData.get(`variant_active_${variant.id}`) === "on"
    }));
    const response = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        name: formData.get("name"),
        category: formData.get("category"),
        price: formData.get("price"),
        stock: formData.get("stock"),
        image: formData.get("image"),
        gallery: formData.get("gallery"),
        description: formData.get("description"),
        material: formData.get("material"),
        sizeChart: formData.get("sizeChart"),
        careInstructions: formData.get("careInstructions"),
        modelInfo: formData.get("modelInfo"),
        variants
      })
    });
    setMessage(response.ok ? "SAVED" : "SAVE FAILED");
    router.refresh();
  }

  async function remove() {
    if (!editing || !confirm(`DELETE ${editing.sku}?`)) return;
    const response = await fetch(`/api/admin/products?id=${editing.id}`, { method: "DELETE" });
    if (response.ok) {
      const next = items.filter((product) => product.id !== editing.id);
      setItems(next);
      setEditing(next[0] ?? null);
      setMessage("已删除");
    } else {
      setMessage("删除失败");
    }
    router.refresh();
  }

  return (
    <section className="two-column">
      <div>
        <h2 className="section-title spaced">商品列表</h2>
        <div className="data-list">
          {items.map((product) => (
            <button className="product-admin-card" key={product.id} onClick={() => setEditing(product)} type="button">
              <Image src={product.image} alt={product.name} width={96} height={96} />
              <span>
                <strong>{product.sku}</strong>
                <em>{product.name} / {product.category}</em>
                <em>{product.variants.map((variant) => `${variant.size}:${variant.stock - variant.reserved}`).join("  ")}</em>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h2 className="section-title spaced">编辑商品</h2>
        {editing ? (
          <form className="admin-form" action={save}>
            <input name="sku" value={editing.sku} readOnly />
            <input name="name" defaultValue={editing.name} placeholder="商品名称" required />
            <AdminCategorySelect defaultValue={editing.category} key={`${editing.id}-${editing.category}`} />
            <input name="price" defaultValue={(editing.priceCents / 100).toString()} placeholder="价格" required />
            <input name="stock" defaultValue={editing.stock.toString()} placeholder="总库存" required />
            <AdminImageManager initialImages={[editing.image, ...editing.gallery]} key={editing.id} />
            <textarea name="description" defaultValue={editing.description} placeholder="描述" />
            <textarea name="material" defaultValue={editing.material} placeholder="材质" />
            <textarea name="sizeChart" defaultValue={editing.sizeChart} placeholder="尺码表" />
            <textarea name="careInstructions" defaultValue={editing.careInstructions} placeholder="护理说明" />
            <textarea name="modelInfo" defaultValue={editing.modelInfo} placeholder="模特信息" />
            <h3 className="mini-title">变体库存</h3>
            <div className="variant-admin-table">
              <div className="variant-admin-row variant-admin-head">
                <span>SKU</span>
                <span>尺码</span>
                <span>价格</span>
                <span>库存</span>
                <span>启用</span>
              </div>
              {editing.variants.map((variant) => (
                <div className="variant-admin-row" key={variant.id}>
                  <span>{variant.sku}</span>
                  <span>{variant.size}</span>
                  <input name={`variant_price_${variant.id}`} defaultValue={(variant.priceCents / 100).toString()} aria-label={`${variant.sku} price`} />
                  <input name={`variant_stock_${variant.id}`} defaultValue={variant.stock.toString()} aria-label={`${variant.sku} stock`} />
                  <label className="variant-active-cell">
                    <input name={`variant_active_${variant.id}`} type="checkbox" defaultChecked={variant.active} />
                  </label>
                </div>
              ))}
            </div>
            <div className="admin-actions">
              <button className="admin-action-button primary">保存</button>
              <button className="admin-action-button danger" onClick={remove} type="button">删除</button>
            </div>
            {message ? <p className="success">{message}</p> : null}
          </form>
        ) : (
          <p className="muted-note">请选择商品</p>
        )}
      </div>
    </section>
  );
}
