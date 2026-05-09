"use client";

import Image from "next/image";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { flushSync } from "react-dom";

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
  const [dragSrc, setDragSrc] = useState<string | null>(null);
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
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    const startViewTransition = ("startViewTransition" in document)
      ? (document as Document & { startViewTransition: (updateCallback: () => void) => void }).startViewTransition.bind(document)
      : null;
    if (startViewTransition) {
      startViewTransition(() => flushSync(() => setImages(next)));
    } else {
      setImages(next);
    }
  }

  function moveImage(draggedSrc: string, targetSrc: string) {
    if (draggedSrc === targetSrc) return;
    const from = images.findIndex((image) => image === draggedSrc);
    const to = images.findIndex((image) => image === targetSrc);
    if (from < 0 || to < 0) return;
    move(from, to);
  }

  return (
    <div className="image-manager">
      <input name={imageFieldName} type="hidden" value={images[0] ?? ""} />
      <input name={galleryFieldName} type="hidden" value={images.join("\n")} />
      <div className="image-strip" aria-label="商品图片排序">
        {images.map((src, index) => (
          <div
            className={`image-tile ${index === 0 ? "primary" : ""} ${dragSrc === src ? "dragging" : ""}`}
            draggable
            key={`${src}-${index}`}
            onDragStart={() => setDragSrc(src)}
            onDragEnd={() => setDragSrc(null)}
            onDragOver={(event) => {
              event.preventDefault();
              if (dragSrc) moveImage(dragSrc, src);
            }}
            onDrop={(event) => event.preventDefault()}
            style={{ viewTransitionName: imageTransitionName(src) }}
          >
            <span className="drag-handle image-drag-handle" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <Image src={src} alt={`商品图片 ${index + 1}`} width={120} height={120} />
            <span className="image-index-label">{index === 0 ? "首图" : `图 ${index + 1}`}</span>
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

function imageTransitionName(src: string) {
  return `admin-image-${src.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
