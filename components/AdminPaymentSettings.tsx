"use client";

import { useState } from "react";
import { showToast } from "@/lib/toast";
import type { PaymentSettings } from "@/lib/db";

export function AdminPaymentSettings({
  initialSettings,
  webhookUrl,
}: {
  initialSettings: PaymentSettings;
  webhookUrl: string;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const response = await fetch("/api/admin/payment-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      showToast(payload.error ?? "保存支付设置失败", "error");
      return;
    }
    setSettings(payload.settings);
    showToast("支付设置已保存", "success");
  }

  return (
    <section className="admin-wide">
      <div className="admin-payment-grid">
        <div className="admin-payment-card">
          <div className="admin-payment-head">
            <strong>PayPal</strong>
            <label className="admin-toggle">
              <input
                checked={settings.paypalEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    paypalEnabled: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>{settings.paypalEnabled ? "已启用" : "已关闭"}</span>
            </label>
          </div>
          <div className="admin-form">
            <label className="setting-field">
              <span>Client ID</span>
              <input
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    paypalClientId: event.target.value,
                  }))
                }
                placeholder="PayPal Client ID"
                value={settings.paypalClientId}
              />
            </label>
            <label className="setting-field">
              <span>Secret</span>
              <input
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    paypalSecret: event.target.value,
                  }))
                }
                placeholder="PayPal Secret"
                type="password"
                value={settings.paypalSecret}
              />
            </label>
            <label className="setting-field">
              <span>API Base URL</span>
              <input
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    paypalApiBaseUrl: event.target.value,
                  }))
                }
                placeholder="PayPal API Base URL"
                value={settings.paypalApiBaseUrl}
              />
            </label>
            <label className="setting-field">
              <span>Webhook ID</span>
              <input
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    paypalWebhookId: event.target.value,
                  }))
                }
                placeholder="PayPal Webhook ID"
                value={settings.paypalWebhookId}
              />
            </label>
            <div className="setting-readonly">
              <span>Webhook URL</span>
              <code>{webhookUrl}</code>
            </div>
          </div>
        </div>

        <div className="admin-payment-card flex flex-col gap-4">
          <div className="admin-payment-head">
            <strong>Apple Pay</strong>
            <label className="admin-toggle">
              <input
                checked={settings.applePayEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    applePayEnabled: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>{settings.applePayEnabled ? "已启用" : "已关闭"}</span>
            </label>
          </div>
          <div className="admin-form">
            <label className="setting-field">
              <span>Merchant ID</span>
              <input
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    applePayMerchantId: event.target.value,
                  }))
                }
                placeholder="Apple Pay Merchant ID"
                value={settings.applePayMerchantId}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="admin-actions mt-6">
        <button
          className="admin-action-button primary"
          disabled={saving}
          onClick={save}
          type="button"
        >
          {saving ? "保存中..." : "保存支付设置"}
        </button>
      </div>
    </section>
  );
}
