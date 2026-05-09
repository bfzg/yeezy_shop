"use client";

import Image from "next/image";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export type AdminImageManagerHandle = {
  reset: () => void;
};

type AdminImageManagerProps = {
  initialImages: string[];
  imageFieldName?: string;
  galleryFieldName?: string;
};

export const AdminImageManager = forwardRef<AdminImageManagerHandle, AdminImageManagerProps>(
function AdminImageManager({
  initialImages,
  imageFieldName = "image",
  galleryFieldName = "gallery"
}, ref) {
  const [images, setImages] = useState(() => uniqueImages(initialImages));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    reset() {
      setImages(uniqueImages(initialImages));
      if (fileRef.current) fileRef.current.value = "";
    }
  }), [initialImages]);

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const payload = await response.json();
    if (payload.url) {
      setImages((current) => uniqueImages([...current, payload.url]));
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function remove(index: number) {
    setImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function move(from: number, to: number) {
    setImages((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  return (
    <div className="image-manager">
      <input name={imageFieldName} type="hidden" value={images[0] ?? ""} />
      <input name={galleryFieldName} type="hidden" value={images.join("\n")} />
      <div className="image-strip" aria-label="商品图片排序">
        {images.map((src, index) => (
          <div
            className={`image-tile ${index === 0 ? "primary" : ""}`}
            draggable
            key={`${src}-${index}`}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null && dragIndex !== index) move(dragIndex, index);
              setDragIndex(null);
            }}
          >
            <Image src={src} alt={`商品图片 ${index + 1}`} width={120} height={120} />
            <span>{index === 0 ? "首图" : `图 ${index + 1}`}</span>
            <button onClick={() => remove(index)} type="button">移除</button>
          </div>
        ))}
        <label className="image-upload-card">
          <input ref={fileRef} type="file" accept="image/*" onChange={upload} />
          <div className="image-upload-card-icon">+</div>
          <strong>上传图片</strong>
        </label>
      </div>
    </div>
  );
});

function uniqueImages(images: string[]) {
  return Array.from(new Set(images.map((image) => image.trim()).filter(Boolean)));
}
