"use client";
import { BRAND } from "../lib/brand";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-900 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-xs uppercase tracking-widest text-slate-400">
          Shopify Supplements • Founders 7–8 figures
        </p>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {BRAND.category} — Built to Close <span className="text-indigo-400">Relentlessly</span>
        </h1>
        <p className="mt-5 text-lg text-slate-300">
          {BRAND.position}. {BRAND.promiseLong} No delays. No dead funnels.
          A closer that negotiates, handles objections, and pushes checkout to completion.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href={BRAND.ctas.trial.href} data-cta={BRAND.ctas.trial.data}
             className="inline-flex items-center rounded-md bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400">
            {BRAND.ctas.trial.label}
          </a>
          <a href={BRAND.ctas.demo.href} data-cta={BRAND.ctas.demo.data}
             className="inline-flex items-center rounded-md bg-slate-700 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-slate-600">
            {BRAND.ctas.demo.label}
          </a>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          {BRAND.proofMicro.join(" • ")}
        </p>
      </div>
    </section>
  );
}
