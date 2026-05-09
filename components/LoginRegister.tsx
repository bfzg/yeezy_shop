"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginRegister() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setError("");
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error ?? "REQUEST FAILED");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <section className="auth-panel">
      <div className="segmented">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">LOGIN</button>
        <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">REGISTER</button>
      </div>
      <form action={submit} className="admin-form">
        {mode === "register" ? <input name="name" placeholder="NAME" /> : null}
        <input name="email" type="email" placeholder="EMAIL" required />
        <input name="password" type="password" placeholder="PASSWORD" required />
        <button className="submit-order">{mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}</button>
        <p className="muted-note">ADMIN: admin@yezi.local / admin123</p>
        {error ? <p className="error">{error}</p> : null}
      </form>
    </section>
  );
}
