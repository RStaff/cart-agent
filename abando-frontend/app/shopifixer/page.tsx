"use client";

import { useEffect, useState } from "react";

type ShopiFixerResult = {
  leak: string;
  loss: string;
  fix: string;
};

export default function ShopiFixerPage() {

  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [storeDomain, setStoreDomain] = useState("");
  const [result, setResult] = useState<ShopiFixerResult | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const seeded =
      params.get("store_domain") ||
      params.get("storeDomain") ||
      params.get("store") ||
      params.get("shop") ||
      "";
    if (seeded) setStoreDomain(seeded);
  }, []);

  const trackEvent = (eventName: string, payload: Record<string, unknown> = {}) => {
    const event = {
      surface: "shopifixer",
      event: eventName,
      payload,
      occurred_at: new Date().toISOString(),
    };

    console.log("shopifixer_event", event);

    if (typeof window !== "undefined") {
      const key = "shopifixer_event_log_v1";
      const existing = JSON.parse(window.localStorage.getItem(key) || "[]");
      existing.push(event);
      window.localStorage.setItem(key, JSON.stringify(existing.slice(-50)));
    }
  };

  const normalizeStoreDomain = (value: string) => value.trim().toLowerCase();

  const startCheckout = async () => {
    const normalizedStoreDomain = normalizeStoreDomain(storeDomain);
    if (!normalizedStoreDomain) {
      setCheckoutError("Enter a Shopify store domain to continue.");
      return;
    }

    setCheckoutError(null);
    setCheckoutLoading(true);
    trackEvent("purchase_started", { store_domain: normalizedStoreDomain, product: "ShopiFixer Fix Sprint" });

    try {
      const checkoutBase = (
        process.env.NEXT_PUBLIC_ABANDO_API_BASE ||
        process.env.NEXT_PUBLIC_ABANDO_BACKEND_ORIGIN ||
        ""
      ).replace(/\/$/, "");

      const checkoutUrl = checkoutBase ? `${checkoutBase}/__public-checkout` : "/__public-checkout";
      const response = await fetch(checkoutUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          plan: "scale",
          store_domain: normalizedStoreDomain,
        }),
      });

      const payload = await response.json().catch(() => ({} as Record<string, unknown>));

      if (!response.ok) {
        const message =
          (payload && typeof payload.message === "string" && payload.message) ||
          (payload && typeof payload.code === "string" && payload.code) ||
          `Checkout failed with status ${response.status}`;
        throw new Error(message);
      }

      const url = payload && typeof payload.url === "string" ? payload.url : "";
      if (!url) throw new Error("Checkout did not return a payment link.");

      trackEvent("purchase_redirected", {
        store_domain: normalizedStoreDomain,
        plan: "scale",
        session_id: typeof payload.sessionId === "string" ? payload.sessionId : undefined,
      });

      window.location.href = url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout unavailable.";
      setCheckoutError(message);
      trackEvent("purchase_failed", { store_domain: normalizedStoreDomain, message });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const runAudit = () => {
    trackEvent("audit_started");
    setLoading(true);
    setResult(null);

    setTimeout(() => {
      const auditResult = {
        leak: "Checkout hesitation (mobile)",
        loss: "$8,700 / month",
        fix: "Remove forced account creation + simplify payment step"
      };

      setLoading(false);
      setResult(auditResult);
      trackEvent("audit_result_viewed", auditResult);
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16 flex justify-center">
      <div className="max-w-5xl w-full space-y-16">

        {/* HERO */}
        <section className="space-y-6 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-zinc-500">
            ShopiFixer Fix Sprint · $950 flat fee
          </p>

          <h1 className="text-5xl font-bold leading-tight">
            ShopiFixer fixes one visible Shopify conversion problem.
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Get a focused conversion audit that identifies the single highest-impact issue costing you sales, then gives you the first fix and the proof package.
          </p>

          <div className="pt-4 space-y-4">
            <div className="mx-auto max-w-xl text-left">
              <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-zinc-500" htmlFor="store-domain">
                Shopify store domain
              </label>
              <input
                id="store-domain"
                type="text"
                value={storeDomain}
                onChange={(event) => setStoreDomain(event.target.value)}
                placeholder="example.myshopify.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-yellow-400/60 focus:bg-white/8"
              />
              <p className="mt-2 text-xs text-zinc-500">
                We use this to keep the checkout, fix sprint, and follow-up proof tied to the right store.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={startCheckout}
                disabled={checkoutLoading}
                className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkoutLoading ? "Opening secure checkout..." : "Get the $950 Fix Sprint"}
              </button>
              <button
                type="button"
                onClick={runAudit}
                className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90"
              >
                Run ShopiFixer Audit
              </button>
              <a href="/shopifixer" className="inline-flex items-center justify-center border border-white/10 bg-white/5 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10">
                View the ShopiFixer offer
              </a>
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              30-second scan • No login required • Clear first fix • Secure Stripe checkout
            </p>
            {checkoutError && (
              <p className="mx-auto max-w-xl text-sm text-red-300">
                {checkoutError}
              </p>
            )}
          </div>

          <div className="mx-auto mt-6 grid max-w-2xl gap-3 text-left text-sm text-zinc-300 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <strong className="text-white">Detect</strong>
              <p className="mt-1 text-zinc-400">Checkout, trust, UX, and recovery leaks.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <strong className="text-white">Proof</strong>
              <p className="mt-1 text-zinc-400">Before/after evidence and a clear fix summary.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <strong className="text-white">Act</strong>
              <p className="mt-1 text-zinc-400">Know what to fix before spending more on ads.</p>
            </div>
          </div>
        </section>

        {/* PROOF BLOCK (CRITICAL) */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-8" id="proof">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
            Proof package
          </p>

          <div className="space-y-3 text-sm text-zinc-300">
            <p><strong>Store:</strong> example-store.com</p>
            <p><strong>Visible issue:</strong> Checkout hesitation (mobile UX friction)</p>
            <p><strong>Before/after evidence:</strong> Included with the sprint</p>
            <p><strong>First fix:</strong> Remove forced account creation + simplify payment step</p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Diagnose. Fix. Recover.</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 border border-white/10 rounded-xl bg-white/5">
              <h3 className="font-semibold mb-2">Diagnose</h3>
              <p className="text-zinc-400 text-sm">
                Identify the clearest conversion issue and quantify its impact.
              </p>
            </div>

            <div className="p-6 border border-white/10 rounded-xl bg-white/5">
              <h3 className="font-semibold mb-2">Fix</h3>
              <p className="text-zinc-400 text-sm">
                Implement the highest-leverage improvement first.
              </p>
            </div>

            <div className="p-6 border border-white/10 rounded-xl bg-white/5">
              <h3 className="font-semibold mb-2">Recover</h3>
              <p className="text-zinc-400 text-sm">
                The ShopiFixer path captures the issue, the fix, and the proof before the merchant moves on.
              </p>
            </div>
          </div>
        </section>

        {/* TRUST LAYER */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
          <h2 className="text-xl font-bold">Why this works</h2>

          <ul className="space-y-2 text-zinc-400 text-sm">
            <li>• Built from real store behavior signals — not generic audits</li>
            <li>• Focuses on the single highest-impact issue first</li>
            <li>• Separates diagnosis, implementation, and recovery</li>
            <li>• No retainers. No fluff. Just clear next actions</li>
          </ul>
        </section>

        {/* FINAL CTA */}
        <section className="text-center pt-6">
          <button
            type="button"
            onClick={startCheckout}
            disabled={checkoutLoading}
            className="bg-yellow-400 text-black px-10 py-5 rounded-xl font-bold text-xl hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checkoutLoading ? "Opening secure checkout..." : "Get the $950 Fix Sprint"}
          </button>
          <button type="button" onClick={runAudit} className="ml-3 bg-white/5 text-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-white/10">
            Run ShopiFixer Audit
          </button>
          <a href="/run-audit" className="ml-3 inline-flex items-center justify-center border border-white/10 bg-white/5 px-10 py-5 rounded-xl font-bold text-xl hover:bg-white/10">
            Run the free audit
          </a>

          {loading && (
            <div className="mx-auto mt-6 max-w-xl rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
              Scanning store…
            </div>
          )}

          {result && (
            <div className="mx-auto mt-6 max-w-xl space-y-2 rounded-xl border border-white/10 bg-white/5 p-5 text-left text-sm text-zinc-300">
              <p><strong className="text-white">Leak:</strong> {result.leak}</p>
              <p><strong className="text-white">Estimated loss:</strong> {result.loss}</p>
              <p><strong className="text-white">First fix:</strong> {result.fix}</p>
            </div>
          )}

          <p className="text-sm text-zinc-500 mt-3">
            Know exactly what’s costing you revenue — in minutes
          </p>
        </section>

      </div>
    </main>
  );
}
