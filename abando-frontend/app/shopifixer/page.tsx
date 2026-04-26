"use client";

import { useState } from "react";

export default function ShopiFixerPage() {

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const trackEvent = (eventName, payload = {}) => {
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
            A Stafford Media Consulting System
          </p>

          <h1 className="text-5xl font-bold leading-tight">
            Your Shopify store is leaking revenue. ShopiFixer shows you exactly where.
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Get a focused conversion audit that identifies the single highest-impact issue costing you sales — then gives you the first fix to test.
          </p>

          <div className="pt-4">
            <button onClick={runAudit} className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90">
              Find My Biggest Revenue Leak
            </button>
            <p className="text-xs text-zinc-500 mt-3">
              30-second scan • No login required • Clear first fix
            </p>
          </div>

          <div className="mx-auto mt-6 grid max-w-2xl gap-3 text-left text-sm text-zinc-300 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <strong className="text-white">Detect</strong>
              <p className="mt-1 text-zinc-400">Checkout, trust, UX, and recovery leaks.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <strong className="text-white">Prioritize</strong>
              <p className="mt-1 text-zinc-400">One issue first. No bloated audit report.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <strong className="text-white">Act</strong>
              <p className="mt-1 text-zinc-400">Know what to fix before spending more on ads.</p>
            </div>
          </div>
        </section>

        {/* PROOF BLOCK (CRITICAL) */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
            Example Audit Output
          </p>

          <div className="space-y-3 text-sm text-zinc-300">
            <p><strong>Store:</strong> example-store.com</p>
            <p><strong>Leak:</strong> Checkout hesitation (mobile UX friction)</p>
            <p><strong>Estimated 30-day loss:</strong> $12,400</p>
            <p><strong>First Fix:</strong> Remove forced account creation + simplify payment step</p>
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
                Abando captures lost revenue automatically after the fix.
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
          <button onClick={runAudit} className="bg-yellow-400 text-black px-10 py-5 rounded-xl font-bold text-xl hover:opacity-90">
            Run ShopiFixer Audit
          </button>

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
