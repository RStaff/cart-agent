import React from "react";

// NOTE: customer-facing brand is Abando; "Cart Agent" is the engine ("powered by")
const pay = new URLSearchParams(window.location.search).get("pay") || "";

const CTA = ({ plan, url }) => (
  <a
    href={`${url}?plan=${encodeURIComponent(plan)}`}
    style={{
      display:"inline-block", background:"#3b82f6", color:"#fff",
      padding:"10px 14px", borderRadius:10, fontWeight:700, textDecoration:"none"
    }}
  >
    {plan === "free-trial" ? "Start Free Trial" : `Choose ${plan[0].toUpperCase()+plan.slice(1)}`}
  </a>
);

export default function App() {
  const payUrl = "https://buy.stripe.com/test_00w5kEe4sanJaHB15j00001"; // injected by script

  return (
    <main style={{fontFamily:"system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif", lineHeight:1.45}}>
      {/* Hero */}
      <section style={{minHeight:"60vh", display:"grid", placeItems:"center", background:"#0f172a", color:"#e2e8f0", padding:"56px 20px"}}>
        <div style={{maxWidth:920, textAlign:"center"}}>
          <h1 style={{margin:"0 0 12px", fontSize:44, fontWeight:800}}>Abando</h1>
          <p style={{margin:"0 auto 24px", maxWidth:720, fontSize:18, color:"#94a3b8"}}>
            Recover revenue with AI-driven cart nudges and personalized checkout flows.
            Seamless Shopify integration. Results in hours, not weeks.
          </p>
          <div style={{display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap"}}>
            <CTA plan="free-trial" url={payUrl} />
            <a href="https://staffordmedia.ai" style={{border:"1px solid #334155", color:"#e2e8f0", padding:"10px 14px", borderRadius:10, textDecoration:"none"}}>
              Learn about Stafford Media AI
            </a>
          </div>
          <p style={{marginTop:16, fontSize:12, color:"#64748b"}}>Test mode — no real charges. Powered by Cart Agent.</p>
        </div>
      </section>

      {/* Plans */}
      <section aria-label="Plans" style={{padding:"36px 20px", maxWidth:1100, margin:"0 auto"}}>
        <h2 style={{textAlign:"center", fontSize:28, margin:"0 0 16px"}}>Pricing</h2>
        <p style={{textAlign:"center", color:"#475569", margin:"0 0 28px"}}>Pick a plan now — upgrade anytime.</p>

        <div style={{display:"grid", gap:16, gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))"}}>
          {/* Free Trial */}
          <article style={{border:"1px solid #e5e7eb", borderRadius:12, padding:"16px", background:"#fff"}}>
            <h3 style={{margin:"0 0 4px"}}>Free Trial</h3>
            <p style={{margin:"0 0 8px", color:"#475569"}}>Try Abando in minutes.</p>
            <ul style={{margin:"0 0 12px", paddingLeft:18, color:"#111827"}}>
              <li>Up to 250 interactions</li>
              <li>Starter prompts & templates</li>
              <li>Basic dashboard</li>
            </ul>
            <CTA plan="free-trial" url={payUrl} />
          </article>

          {/* Basic */}
          <article style={{border:"1px solid #e5e7eb", borderRadius:12, padding:"16px", background:"#fff"}}>
            <h3 style={{margin:"0 0 4px"}}>Basic</h3>
            <p style={{margin:"0 0 8px", color:"#475569"}}>$19/mo</p>
            <ul style={{margin:"0 0 12px", paddingLeft:18, color:"#111827"}}>
              <li>2k interactions / mo</li>
              <li>A/B copy tests</li>
              <li>Email capture + webhooks</li>
            </ul>
            <CTA plan="basic" url={payUrl} />
          </article>

          {/* Growth */}
          <article style={{border:"2px solid #111827", borderRadius:12, padding:"16px", background:"#fff"}}>
            <h3 style={{margin:"0 0 4px"}}>Growth</h3>
            <p style={{margin:"0 0 8px", color:"#475569"}}>$79/mo</p>
            <ul style={{margin:"0 0 12px", paddingLeft:18, color:"#111827"}}>
              <li>20k interactions / mo</li>
              <li>Journey builder + segments</li>
              <li>Shopify + custom sites</li>
            </ul>
            <CTA plan="growth" url={payUrl} />
          </article>

          {/* Pro */}
          <article style={{border:"1px solid #e5e7eb", borderRadius:12, padding:"16px", background:"#fff"}}>
            <h3 style={{margin:"0 0 4px"}}>Pro</h3>
            <p style={{margin:"0 0 8px", color:"#475569"}}>$249/mo</p>
            <ul style={{margin:"0 0 12px", paddingLeft:18, color:"#111827"}}>
              <li>Unlimited interactions</li>
              <li>Advanced routing & SLAs</li>
              <li>HIPAA/PII controls</li>
            </ul>
            <CTA plan="pro" url={payUrl} />
          </article>
        </div>
        <p style={{marginTop:12, color:"#64748b", fontSize:12}}>All plans: free trial • cancel anytime • Stripe Billing</p>
      </section>
    </main>
  );
}
