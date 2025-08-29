import React, { useMemo, useState } from "react";

export default function AICopyGenerator({ backendBase="", onFlag }){
  const [tone,setTone]=useState("Friendly");
  const [brand,setBrand]=useState("Default");
  const [goal,setGoal]=useState("recover");
  const [total,setTotal]=useState("49.99");
  const [email,setEmail]=useState("you@example.com");
  const [itemsText,setItemsText]=useState("T-Shirt x2");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const items = useMemo(()=>itemsText.split("\n").map(s=>s.trim()).filter(Boolean),[itemsText]);

  async function generateCopy(){
    setLoading(true);
    try{
      const r = await fetch(`${backendBase}/api/generate-copy`,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ items, tone, brand, goal, total })
      });
      const json = await r.json();
      setResult({ ...json, provider: json.provider || "backend" });
    }catch(e){
      setResult({ subject:"Error", body:String(e), provider:"local" });
    }finally{ setLoading(false); }
  }

  async function flagAbandoned(){
    setLoading(true);
    try{
      const r = await fetch(`${backendBase}/api/abandoned-cart`,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          checkoutId: crypto.randomUUID(),
          email,
          lineItems: items.map((t,i)=>({ id:i+1, title:t, quantity:1 })),
          totalPrice: Number(total||0)
        })
      });
      const json = await r.json();
      setResult({ subject:"Abandoned Cart Flagged", body: JSON.stringify(json,null,2), provider:"backend" });
      onFlag?.(json);
    }catch(e){
      setResult({ subject:"Error", body:String(e), provider:"local" });
    }finally{ setLoading(false); }
  }

  return (
    <div className="grid" style={{gap:18}}>
      {/* controls */}
      <div className="controls">
        <div>
          <div className="label">Tone</div>
          <select className="select" value={tone} onChange={e=>setTone(e.target.value)}>
            {["Friendly","Urgent","Luxury","Casual","Minimal"].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Brand</div>
          <input className="input" value={brand} onChange={e=>setBrand(e.target.value)} />
        </div>
        <div>
          <div className="label">Goal</div>
          <select className="select" value={goal} onChange={e=>setGoal(e.target.value)}>
            <option value="recover">Recover Cart</option>
            <option value="upsell">Upsell</option>
          </select>
        </div>
        <div>
          <div className="label">Total ($)</div>
          <input className="input" inputMode="decimal" value={total} onChange={e=>setTotal(e.target.value)} />
        </div>
      </div>

      <div className="controls" style={{gridTemplateColumns:"1fr 1fr"}}>
        <div>
          <div className="label">Customer Email</div>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <div className="label">Actions</div>
          <div className="actions">
            <button className="btn primary" disabled={loading} onClick={generateCopy}>
              {loading ? "Generating…" : "Generate Copy"}
            </button>
            <button className="btn" disabled={loading} onClick={flagAbandoned}>
              Flag Abandoned
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="label">Items (one per line, e.g. “T-Shirt x2”)</div>
        <textarea className="textarea" value={itemsText} onChange={e=>setItemsText(e.target.value)} />
      </div>

      {result && (
        <div className="card" style={{padding:14}}>
          {result.subject && <div className="label" style={{marginBottom:6}}>Subject</div>}
          {result.subject && <div style={{fontWeight:700, marginBottom:10}}>{result.subject}</div>}
          <pre className="copy" style={{margin:0}}>{result.body}</pre>
          <div className="divider" />
          <div className="small">Provider: {result.provider}</div>
        </div>
      )}
    </div>
  );
}
