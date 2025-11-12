import { useState } from "react";
import { generateCopy } from "../services/api";

export default function AICopyGenerator() {
  const [result, setResult] = useState(null);
  const [items, setItems] = useState([]);
  const total = items.reduce((s, it) => s + (Number(it.unitPrice) * Number(it.quantity) || 0), 0);

  async function handleGenerate() {
    const r = await generateCopy("demo-cart", {});
    setResult(r);
    setItems(r.itemsNormalized || []);
  }
  function handleReset() { setResult(null); setItems([]); }

  return (
    <div className="container main">
      <div className="h1">AI Copy Generator</div>
      <div style={{display:"flex",gap:".5rem",marginBottom:"1rem"}}>
        <button className="btn btn-primary" onClick={handleGenerate}>Generate demo</button>
        <button className="btn" onClick={handleReset}>Reset</button>
      </div>

      <div className="card">
        {result?.subject && (
          <>
            <div style={{fontWeight:600, marginBottom:".5rem"}}>Subject: {result.subject}</div>
            <div style={{marginBottom:"1rem", whiteSpace:"pre-wrap"}}>{result.body}</div>
          </>
        )}
        <div className="mono">Computed Total: ${total.toFixed(2)}</div>
        <div className="mono">Line Items</div>
        <ul style={{paddingLeft:"1.25rem", listStyle:"disc"}}>
          {items.length === 0 ? (
            <li className="mono">No items parsed.</li>
          ) : (
            items.map((it, i) => (
              <li key={i}>{it.title} — qty {it.quantity} @ ${Number(it.unitPrice).toFixed(2)}</li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
