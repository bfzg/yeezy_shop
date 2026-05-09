"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AdminCategorySelect } from "@/components/AdminCategorySelect";
import { AdminImageManager } from "@/components/AdminImageManager";
import type { Product } from "@/lib/db";
import { showToast } from "@/lib/toast";

export function AdminProductManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const [items, setItems] = useState(products);
  const itemsRef = useRef(products);
  const [editing, setEditing] = useState<Product | null>(products[0] ?? null);
  const [dragProductId, setDragProductId] = useState<number | null>(null);

  useEffect(() => {
    itemsRef.current = products;
    setItems(products);
    setEditing((current) => {
      if (!current) return products[0] ?? null;
      return products.find((product) => product.id === current.id) ?? products[0] ?? null;
    });
  }, [products]);

  async function save(formData: FormData) {
    if (!editing) return;
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
    if (response.ok) {
      showToast("商品已保存", "success");
    } else {
      showToast("商品保存失败", "error");
    }
    router.refresh();
  }

  async function remove() {
    if (!editing || !confirm(`DELETE ${editing.sku}?`)) return;
    const response = await fetch(`/api/admin/products?id=${editing.id}`, { method: "DELETE" });
    if (response.ok) {
      const next = items.filter((product) => product.id !== editing.id);
      itemsRef.current = next;
      setItems(next);
      setEditing(next[0] ?? null);
      showToast("商品已删除", "success");
    } else {
      showToast("商品删除失败", "error");
    }
    router.refresh();
  }

  function animateItems(next: Product[]) {
    const startViewTransition = ("startViewTransition" in document)
      ? (document as Document & { startViewTransition: (updateCallback: () => void) => void }).startViewTransition.bind(document)
      : null;
    if (startViewTransition) {
      startViewTransition(() => flushSync(() => {
        itemsRef.current = next;
        setItems(next);
      }));
    } else {
      itemsRef.current = next;
      setItems(next);
    }
  }

  function moveProduct(draggedId: number, targetId: number) {
    if (draggedId === targetId) return;
    const from = items.findIndex((product) => product.id === draggedId);
    const to = items.findIndex((product) => product.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    animateItems(next);
  }

  async function saveProductOrder(productList = itemsRef.current) {
    const response = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder", productIds: productList.map((product) => product.id) })
    });
    if (response.ok) {
      showToast("商品排序已更新", "success");
    } else {
      showToast("商品排序保存失败", "error");
    }
    router.refresh();
  }

  async function addVariant(formData: FormData) {
    if (!editing) return;
    const response = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addVariant",
        productId: editing.id,
        size: formData.get("newVariantSize"),
        price: formData.get("newVariantPrice") || editing.priceCents / 100,
        stock: formData.get("newVariantStock") || 0
      })
    });
    if (response.ok) {
      showToast("变体已新增", "success");
      router.refresh();
    } else {
      const payload = await response.json();
      showToast(payload.error ?? "变体新增失败", "error");
    }
  }

  async function deleteVariant(variantId: number) {
    if (!confirm("删除这个变体？有历史订单时会归档隐藏，不会破坏订单。")) return;
    const response = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteVariant", variantId })
    });
    if (response.ok) {
      showToast("变体已删除", "success");
      router.refresh();
    } else {
      const payload = await response.json();
      showToast(payload.error ?? "变体删除失败", "error");
    }
  }

  return (
    <section className="two-column">
      <div>
        <h2 className="section-title spaced">商品列表</h2>
        <div className="data-list">
          {items.map((product) => (
            <button
              className={`product-admin-card ${editing?.id === product.id ? "selected" : ""} ${dragProductId === product.id ? "dragging" : ""}`}
              key={product.id}
              draggable
              onDragStart={() => setDragProductId(product.id)}
              onDragEnd={() => {
                setDragProductId(null);
                saveProductOrder();
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (dragProductId !== null) moveProduct(dragProductId, product.id);
              }}
              onDrop={(event) => event.preventDefault()}
              onClick={() => setEditing(product)}
              type="button"
              aria-pressed={editing?.id === product.id}
              style={{ viewTransitionName: `admin-product-${product.id}` }}
            >
              <span className="drag-handle" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
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
            <div className="locked-field">
              <input
                name="sku"
                value={editing.sku}
                disabled
                aria-readonly="true"
                aria-describedby="sku-lock-note"
              />
            </div>
            <input name="name" defaultValue={editing.name} placeholder="商品名称" required />
            <AdminCategorySelect defaultValue={editing.category} key={`${editing.id}-${editing.category}`} />
            <label className="unit-field">
              <input name="price" defaultValue={(editing.priceCents / 100).toString()} placeholder="价格" required />
              <span className="text-xs">USD</span>
            </label>
            <label className="unit-field">
              <input name="stock" defaultValue={editing.stock.toString()} placeholder="总库存" required />
              <span>件</span>
            </label>
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
                <span>操作</span>
              </div>
              {editing.variants.map((variant) => (
                <div className={`variant-admin-row ${variant.active ? "" : "inactive"}`} key={variant.id}>
                  <span>{variant.sku}</span>
                  <span>{variant.size}</span>
                  <label className="unit-field compact">
                    <input name={`variant_price_${variant.id}`} defaultValue={(variant.priceCents / 100).toString()} aria-label={`${variant.sku} price`} />
                    <span className="text-xs">USD</span>
                  </label>
                  <label className="unit-field compact">
                    <input name={`variant_stock_${variant.id}`} defaultValue={variant.stock.toString()} aria-label={`${variant.sku} stock`} />
                    <span>件</span>
                  </label>
                  <label className="variant-active-cell">
                    <input name={`variant_active_${variant.id}`} type="checkbox" defaultChecked={variant.active} />
                  </label>
                  <button className="variant-delete-button" onClick={() => deleteVariant(variant.id)} type="button">删除</button>
                </div>
              ))}
            </div>
            <div className="variant-add-row">
              <input name="newVariantSize" placeholder="新增尺码" form="variant-add-form" />
              <label className="unit-field compact">
                <input name="newVariantPrice" placeholder="价格" form="variant-add-form" />
                <span className="text-xs">USD</span>
              </label>
              <label className="unit-field compact">
                <input name="newVariantStock" placeholder="库存" form="variant-add-form" />
                <span>件</span>
              </label>
              <button className="admin-action-button" form="variant-add-form" type="submit">新增变体</button>
            </div>
            <div className="admin-actions">
              <button className="admin-action-button primary">保存</button>
              <button className="admin-action-button danger" onClick={remove} type="button">删除</button>
            </div>
          </form>
        ) : (
          <p className="muted-note">请选择商品</p>
        )}
      </div>
      {editing ? <form id="variant-add-form" action={addVariant} /> : null}
    </section>
  );
}
