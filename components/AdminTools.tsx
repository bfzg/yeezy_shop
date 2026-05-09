"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminCategorySelect } from "@/components/AdminCategorySelect";
import { AdminImageManager, type AdminImageManagerHandle } from "@/components/AdminImageManager";

export function AdminTools() {
  const router = useRouter();
  const imageManagerRef = useRef<AdminImageManagerHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function createProduct(formData: FormData) {
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    if (response.ok) {
      formRef.current?.reset();
      imageManagerRef.current?.reset();
      router.refresh();
    }
  }

  return (
    <section className="admin-wide">
        <h2 className="section-title">创建商品</h2>
        <form ref={formRef} className="admin-form" action={createProduct}>
          <input name="sku" placeholder="SKU" required />
          <input name="name" placeholder="商品名称" required />
          <AdminCategorySelect defaultValue="mens" exclude={["new"]} />
          <input name="price" placeholder="价格" required />
          <input name="stock" placeholder="库存" defaultValue="12" />
          <input name="sizes" placeholder="尺码：1,2,3" defaultValue="1,2,3" />
          <AdminImageManager ref={imageManagerRef} initialImages={[]} />
          <textarea name="description" placeholder="描述" />
          <textarea name="material" placeholder="材质" />
          <textarea name="sizeChart" placeholder="尺码表" />
          <textarea name="careInstructions" placeholder="护理说明" />
          <textarea name="modelInfo" placeholder="模特信息" />
          <button className="submit-order">创建</button>
        </form>
    </section>
  );
}
