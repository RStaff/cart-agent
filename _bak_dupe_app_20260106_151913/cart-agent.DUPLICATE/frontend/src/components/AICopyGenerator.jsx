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
  <div className="border rounded-lg p-4 grid gap-2">
    {result.subject && (
      <div className="font-semibold">Subject: {result.subject}</div>
    )}

    <pre className="whitespace-pre-wrap text-sm leading-6">{result.body}</pre>

    <div className="text-sm">
      <div>
        <span className="font-medium">Computed Total:</span>{" "}
        ${Number(result.totalComputed ?? 0).toFixed(2)}
      </div>

      <div className="font-medium mt-2">Line Items</div>
      <ul className="list-disc ml-5">
{result?.itemsNormalized && (
  <div className="border rounded-md p-3 text-sm">
    <div className="font-medium mb-2">Parsed Items</div>
    <ul className="list-disc pl-5">
      {result.itemsNormalized.map((it, i) => (
        <li key={i}>
          {it.title} — qty {it.quantity}{it.unitPrice > 0 ? ` @ $${it.unitPrice.toFixed(2)}` : ""}
        </li>
      ))}
    </ul>
    <div className="mt-2">Computed total: <b>${Number(result.totalComputed ?? 0).toFixed(2)}</b></div>
  </div>
)}

