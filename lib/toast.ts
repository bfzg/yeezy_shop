"use client";

export type ToastTone = "success" | "error" | "info";

export type ToastDetail = {
  message: string;
  tone?: ToastTone;
};

export function showToast(message: string, tone: ToastTone = "info") {
  window.dispatchEvent(new CustomEvent<ToastDetail>("yezi-toast", { detail: { message, tone } }));
}
