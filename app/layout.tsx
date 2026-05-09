import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YEZI",
  description: "Minimal commerce prototype built with Next.js and SQLite."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
