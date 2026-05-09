"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddressForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setError("");
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, isDefault: payload.isDefault === "on" })
    });
    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "SAVE FAILED");
      return;
    }
    router.refresh();
  }

  return (
    <form className="admin-form" action={submit}>
      <input name="label" placeholder="LABEL" />
      <input name="firstName" placeholder="FIRST NAME" required />
      <input name="lastName" placeholder="LAST NAME" required />
      <input name="address" placeholder="ADDRESS" required />
      <input name="apartment" placeholder="APARTMENT" />
      <input name="city" placeholder="CITY" required />
      <input name="country" placeholder="COUNTRY" required />
      <input name="province" placeholder="STATE / PROVINCE" required />
      <input name="postalCode" placeholder="ZIP / POSTAL CODE" required />
      <input name="phone" placeholder="PHONE" required />
      <label className="check-row"><input name="isDefault" type="checkbox" /> DEFAULT</label>
      <button className="submit-order">SAVE ADDRESS</button>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
