import React from 'react';

export default function App() {
  return (
    <main style={{fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif', lineHeight:1.4}}>
      <section style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0f172a',color:'#e2e8f0',padding:'48px'}}>
        <div style={{maxWidth:860,textAlign:'center'}}>
          <h1 style={{margin:'0 0 12px',fontSize:42,fontWeight:800}}>Cart Agent</h1>
          <p style={{margin:'0 0 24px',fontSize:18,color:'#94a3b8'}}>
            AI-powered cart recovery & personalized checkout nudges. Works with Shopify and custom stores.
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <a href="https://buy.stripe.com/test_00w5kEe4sanJaHB15j00001" style={{background:'#3b82f6',color:'#fff',padding:'12px 18px',borderRadius:10,fontWeight:700,textDecoration:'none'}}>
              Start Free Trial
            </a>
            <a href="https://github.com/RStaff/cart-agent" style={{border:'1px solid #334155',color:'#e2e8f0',padding:'12px 18px',borderRadius:10,textDecoration:'none'}}>
              View Docs
            </a>
          </div>
          <p style={{marginTop:16,fontSize:12,color:'#64748b'}}>Test mode – no real charges.</p>
        </div>
      </section>
    </main>
  );
}
