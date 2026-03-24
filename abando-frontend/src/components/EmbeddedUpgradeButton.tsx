"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function EmbeddedUpgradeButton() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop") || "";
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  async function startUpgrade() {
    if (!shop) {
      setNote("A Shopify shop domain is required before starting a Pro upgrade.");
      return;
    }

    setLoading(true);
    setNote("");

    try {
      await fetch("/api/install-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          store_domain: shop,
          source: "embedded_admin",
        }),
      });

      const response = await fetch("/api/billing/createCharge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ shop }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        confirmationUrl?: string;
        error?: string;
      };

      if (!response.ok || !payload.confirmationUrl) {
        throw new Error(payload.error || "billing_create_failed");
      }

      window.location.assign(payload.confirmationUrl);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Unable to start Shopify billing approval.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={startUpgrade}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-100"
      >
        {loading ? "Redirecting to Shopify billing..." : "Start Pro Upgrade"}
      </button>
      {note ? <p className="mt-3 text-sm leading-6 text-slate-300">{note}</p> : null}
    </div>
  );
}
