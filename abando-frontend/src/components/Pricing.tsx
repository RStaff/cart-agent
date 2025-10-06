"use client";
import { useState } from "react";
export default function Pricing() {
  const [yearly, setYearly] = useState(true);
  const plans = [
    {
      name: "Starter",
      priceM: 0,
      priceY: 0,
      blurb: "Kick the tires with 20 credits.",
      features: ["20 follow-up credits", "Email support", "Demo dashboard"],
      cta: { label: "Start free trial", action: "trial" as const },
      highlighted: false,
    },
    {
      name: "Pro",
      priceM: 29,
      priceY: 290,
      blurb: "Recover more with multi-channel outreach.",
      features: [
        "2,000 credits / mo",
        "Multi-channel outreach",
        "Dashboard & export",
        "Priority support",
      ],
      cta: { label: "Buy Pro", action: "checkout" as const },
      highlighted: true,
    },
    {
      name: "Scale",
      priceM: 99,
      priceY: 990,
      blurb: "Higher limits & success manager.",
      features: [
        "10,000+ credits",
        "Dedicated tuning",
        "SLAs",
        "Onboarding help",
      ],
      cta: { label: "Talk to sales", action: "contact" as const },
      highlighted: false,
    },
  ];
  async function go(action: "trial" | "checkout" | "contact") {
    if (action === "trial") return (window.location.href = "/trial");
    if (action === "contact")
      return (window.location.href =
        "mailto:hello@abando.ai?subject=Abando%20Scale");
    try {
      const r = await fetch("/api/checkout", { method: "POST" });
      const d = await r.json();
      if (!r.ok || !d?.url) throw new Error(String(d?.error || "bad_response"));
      window.location.href = d.url;
    } catch (e) {
      console.error(e);
      alert("Could not open Stripe checkout. (Is the backend URL/token set?)");
    }
  }
  return (
    <section className="py-16" id="pricing">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Simple pricing</h2>
        <p className="text-white/70 mt-2">
          Start free. Upgrade when you’re ready.
        </p>
        <div className="inline-flex items-center gap-2 mt-5 rounded-full border border-white/10 bg-white/5 p-1">
          <button
            className={`px-3 py-1 rounded-full text-sm ${!yearly ? "bg-blue-500 text-white" : "text-white/80"}`}
            onClick={() => setYearly(false)}
          >
            Monthly
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm ${yearly ? "bg-blue-500 text-white" : "text-white/80"}`}
            onClick={() => setYearly(true)}
          >
            Yearly <span className="ml-1 text-white/80">(2 months off)</span>
          </button>
        </div>
      </div>
      <div className="mt-10 grid md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const price = yearly ? p.priceY : p.priceM;
          const suffix = p.priceM === 0 ? "" : yearly ? "/yr" : "/mo";
          return (
            <div
              key={p.name}
              className={`card p-6 ${p.highlighted ? "ring-1 ring-blue-500/40" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">{p.name}</div>
                {p.highlighted && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30">
                    Most popular
                  </span>
                )}
              </div>
              <p className="text-white/70 text-sm mt-1">{p.blurb}</p>
              <div className="mt-5">
                <span className="text-4xl font-extrabold tracking-tight">
                  {price === 0 ? "Free" : `$${price}`}
                </span>
                {suffix && <span className="ml-1 text-white/60">{suffix}</span>}
              </div>
              <ul className="mt-5 space-y-2 text-sm text-white/80">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-400/80" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => go(p.cta.action)}
                className={`mt-6 btn w-full ${p.highlighted ? "btn-primary" : "btn-ghost"}`}
              >
                {p.cta.label}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
