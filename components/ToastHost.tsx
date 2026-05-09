"use client";

import { useEffect, useState } from "react";
import type { ToastDetail } from "@/lib/toast";

type ToastState = ToastDetail & { id: number };

export function ToastHost() {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    function handle(event: Event) {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      setToast({ id: Date.now(), ...detail });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 2800);
    }
    window.addEventListener("yezi-toast", handle as EventListener);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("yezi-toast", handle as EventListener);
    };
  }, []);

  return (
    <div className="toast-host" aria-live="polite" aria-atomic="true">
      {toast ? (
        <div className={`toast toast-${toast.tone ?? "info"}`} key={toast.id}>
          <p>{toast.message}</p>
        </div>
      ) : null}
    </div>
  );
}
