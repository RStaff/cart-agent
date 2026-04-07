"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RecoveryEntryCtaProps = {
  shop?: string;
};

export default function RecoveryEntryCta({ shop = "" }: RecoveryEntryCtaProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const normalizedShop = String(shop || "").trim().toLowerCase();

  async function handleStart() {
    if (!normalizedShop || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/abando/activation/trigger-test-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop: normalizedShop }),
      });

      const data = (await response.json().catch(() => null)) as
        | { status?: string; error?: string; details?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.details || data?.error || "recovery_trigger_failed");
      }

      router.push(`/merchant?shop=${encodeURIComponent(normalizedShop)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "recovery_trigger_failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!normalizedShop) {
    return (
      <a
        href="/install/shopify"
        className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
      >
        Connect Shopify to start recovery
      </a>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleStart}
        disabled={isSubmitting}
        className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Starting recovery test..." : "Start recovery test"}
      </button>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
