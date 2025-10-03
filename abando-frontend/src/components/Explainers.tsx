"use client";
import React from "react";
import { useSearchParams } from "next/navigation";

export function ExplainerBox({ title, children, cta }: {
  title: string; children?: React.ReactNode; cta?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-5 mb-6">
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <div className="text-slate-300">{children}</div>
      {cta ? <div className="mt-3">{cta}</div> : null}
    </div>
  );
}

function useStripeStatus(){
  const [s,setS]=React.useState<{hasPublishable:boolean;hasSecret:boolean}|null>(null);
  React.useEffect(()=>{fetch("/api/stripe/status").then(r=>r.json()).then(j=>setS(j.env)).catch(()=>setS(null));},[]);
  return s;
}

export function PricingExplainer() {
  return (
    <ExplainerBox title="Which plan should I pick?">
      <ul className="list-disc ml-5 space-y-1">
        <li><b>Basic</b> — email-only cart recovery.</li>
        <li><b>Growth</b> — email + SMS + basic automations.</li>
        <li><b>Pro</b> — everything plus analytics & A/B.</li>
      </ul>
    </ExplainerBox>
  );
}

/** Client-side source of truth for plan (?plan=) */
export function OnboardingExplainer({ plan: planProp }: { plan?: string }) {
  const sp = useSearchParams();
  const plan = planProp ?? sp.get("plan") ?? undefined;

  return (
    <ExplainerBox title="You’re in demo mode">
      Add Stripe keys in Settings to go live. Until then, you can explore the app freely.
      {plan ? <div className="mt-2 text-slate-400">Selected plan: <b className="capitalize">{plan}</b></div> : null}
    
      {(()=>{const s=useStripeStatus(); if(!s) return null; if(!(s.hasPublishable && s.hasSecret)){return (<div className="mt-3"><a href="/settings" className="inline-flex items-center rounded-md border border-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-800">Go to Settings to add Stripe keys</a></div>);} return null;})()}
    </ExplainerBox>
  );
}

export function DashboardExplainer() {
  return (
    <ExplainerBox title="Your dashboard is empty (for now)">
      Connect your store and let a few shoppers add items to their carts — they’ll appear here automatically.
    </ExplainerBox>
  );
}

export function PlaygroundExplainer() {
  return (
    <ExplainerBox title="Demo playground">
      Type a product and preview an AI-generated recovery message. No data is stored in demo mode.
    </ExplainerBox>
  );
}
