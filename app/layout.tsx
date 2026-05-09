import type { Metadata } from "next";
import { ToastHost } from "@/components/ToastHost";
import "./globals.css";

export const metadata: Metadata = {
  title: "YEZI",
  description: "Minimal commerce prototype built with Next.js and SQLite."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ToastHost />
        {children}
      </body>
    </html>
  );
}
