import React from "react";

export default function App() {
  return (
    <main style={{fontFamily:"ui-sans-serif,system-ui", lineHeight:1.5, padding:"2rem", maxWidth:960, margin:"0 auto"}}>
      <header style={{textAlign:"center", marginBottom:"2rem"}}>
        <h1 style={{fontSize:"2rem", fontWeight:700, margin:"0 0 .5rem"}}>Cart Agent</h1>
        <p style={{opacity:.8}}>AI-powered cart & checkout optimization that installs in minutes.</p>
      </header>

      <section aria-label="AI Playground" style={{border:"1px solid #e5e7eb", borderRadius:12, padding:"1.25rem", marginBottom:"2rem"}}>
        <h2 style={{fontSize:"1.25rem", fontWeight:700, margin:"0 0 .5rem"}}>AI Playground / Demo</h2>
        <p style={{margin:"0 0 1rem"}}>Test prompts and see how agents explain, nudge, and recover carts in real time.</p>
        <button style={{padding:".6rem 1rem", borderRadius:8, border:"1px solid #111827", background:"#111827", color:"#fff"}}>
          Try the Playground
        </button>
      </section>

      <section aria-label="Pricing Tiers" style={{display:"grid", gap:"1rem", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", marginBottom:"2rem"}}>
        <article style={{border:"1px solid #e5e7eb", borderRadius:12, padding:"1rem"}}>
          <h3 style={{fontWeight:700, margin:"0 0 .25rem"}}>Free</h3>
          <p style={{margin:"0 0 .75rem"}}>Basic insights & sample agent. Great for testing.</p>
          <ul style={{margin:"0 0 .75rem", paddingLeft:"1rem"}}>
            <li>• 100 agent interactions / mo</li>
            <li>• Basic dashboard</li>
          </ul>
          <button style={{padding:".5rem .9rem", borderRadius:8, border:"1px solid #111827", background:"#fff"}}>Start Free</button>
        </article>

        <article style={{border:"2px solid #111827", borderRadius:12, padding:"1rem"}}>
          <h3 style={{fontWeight:700, margin:"0 0 .25rem"}}>Pro</h3>
          <p style={{margin:"0 0 .75rem"}}>AI conversions + recoveries. Shopify & custom sites.</p>
          <ul style={{margin:"0 0 .75rem", paddingLeft:"1rem"}}>
            <li>• 10k interactions / mo</li>
            <li>• A/B prompts & journeys</li>
            <li>• Webhooks / API</li>
          </ul>
          <button style={{padding:".5rem .9rem", borderRadius:8, border:"1px solid #111827", background:"#111827", color:"#fff"}}>Start Free Trial</button>
        </article>

        <article style={{border:"1px solid #e5e7eb", borderRadius:12, padding:"1rem"}}>
          <h3 style={{fontWeight:700, margin:"0 0 .25rem"}}>Scale</h3>
          <p style={{margin:"0 0 .75rem"}}>Advanced routing, HIPAA/PII controls, and SLAs.</p>
          <ul style={{margin:"0 0 .75rem", paddingLeft:"1rem"}}>
            <li>• Unlimited interactions</li>
            <li>• Multi-store & regions</li>
            <li>• Dedicated support</li>
          </ul>
          <button style={{padding:".5rem .9rem", borderRadius:8, border:"1px solid #111827", background:"#fff"}}>Talk to Sales</button>
        </article>
      </section>

      <section aria-label="Billing" style={{display:"flex", alignItems:"center", gap:12, opacity:.85}}>
        <span style={{display:"inline-block", padding:".35rem .6rem", border:"1px solid #e5e7eb", borderRadius:999}}>
          Stripe Billing Ready
        </span>
        <span>• Free trial • Cancel anytime</span>
      </section>
    </main>
  );
}
