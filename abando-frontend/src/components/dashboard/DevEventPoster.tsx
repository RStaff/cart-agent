"use client";

import { useState, useTransition } from "react";

export default function DevEventPoster({
  shop,
  embedded = false,
}: {
  shop: string;
  embedded?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  if (process.env.NODE_ENV === "production" || !shop) {
    return null;
  }

  function postSampleEvents() {
    const sessionId = `manual-${crypto.randomUUID()}`;
    const now = Date.now();
    const events = [
      {
        shop,
        session_id: sessionId,
        timestamp: new Date(now).toISOString(),
        event_type: "cart_view",
        stage: "cart",
        device_type: "mobile",
        order_id: null,
        amount: null,
        source: "manual_dev",
        metadata: { sender: "dashboard_dev_poster", step: 1 },
      },
      {
        shop,
        session_id: sessionId,
        timestamp: new Date(now + 1000).toISOString(),
        event_type: "checkout_started",
        stage: "checkout",
        device_type: "mobile",
        order_id: null,
        amount: null,
        source: "manual_dev",
        metadata: { sender: "dashboard_dev_poster", step: 2 },
      },
      {
        shop,
        session_id: sessionId,
        timestamp: new Date(now + 2000).toISOString(),
        event_type: "checkout_return",
        stage: "checkout",
        device_type: "mobile",
        order_id: null,
        amount: null,
        source: "manual_dev",
        metadata: { sender: "dashboard_dev_poster", step: 3 },
      },
    ];

    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/checkout-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(events),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setMessage(payload.error || "Event post failed");
        return;
      }

      setMessage("Posted dev checkout activity. Refreshing dashboard state...");
      window.location.reload();
    });
  }

  return (
    <section className={`rounded-2xl p-5 ${embedded ? "border border-amber-200 bg-amber-50" : "border border-amber-400/20 bg-amber-400/10"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${embedded ? "text-amber-700" : "text-amber-200"}`}>Dev event sender</p>
      <h3 className={`mt-2 text-xl font-semibold tracking-tight ${embedded ? "text-slate-950" : "text-white"}`}>Post manual checkout activity</h3>
      <p className={`mt-3 text-sm leading-7 ${embedded ? "text-slate-700" : "text-slate-200"}`}>
        This is a dev-only fallback. Real storefront activity should now arrive from the installed Shopify script runtime first, and this tool remains here only to help us test <span className="font-semibold">/api/checkout-events</span> with source <span className="font-semibold">manual_dev</span> when no store-connected traffic is available.
      </p>
      <button
        type="button"
        onClick={postSampleEvents}
        disabled={isPending}
        className={`mt-4 inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white transition ${embedded ? "bg-slate-900" : "bg-gradient-to-r from-blue-500 to-indigo-500"} ${isPending ? "opacity-70" : ""}`}
      >
        {isPending ? "Posting events..." : "Post test checkout activity"}
      </button>
      {message ? <p className={`mt-3 text-sm ${embedded ? "text-slate-600" : "text-slate-300"}`}>{message}</p> : null}
    </section>
  );
}
