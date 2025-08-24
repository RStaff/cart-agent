import React, { useState } from "react";
export default function AICopyGenerator({ backendBase = "" }) {
  const [itemsText, setItemsText] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [brand, setBrand] = useState("Default");
  const [goal, setGoal] = useState("recover");
  const [total, setTotal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const handleGenerate = async () => {
    setError(""); setResult(null);
    if (!backendBase) { setError("Missing backend base URL"); return; }
    const items = itemsText.split("\n").map(s => s.trim()).filter(Boolean);
    const totalNum = parseFloat(total || "0") || 0;
    setLoading(true);
    try {
      const res = await fetch(`${backendBase}/api/generate-copy`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ items, tone, brand, goal, total: totalNum })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <label className="text-sm font-medium">Items (one per line)</label>
        <textarea className="border rounded-md px-3 py-2 min-h-[100px]" value={itemsText} onChange={(e)=>setItemsText(e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-1">
          <label className="text-sm font-medium">Tone</label>
          <select className="border rounded-md px-3 py-2" value={tone} onChange={(e)=>setTone(e.target.value)}>
            <option>Friendly</option><option>Urgent</option><option>Playful</option><option>Luxury</option><option>Casual</option><option>Minimal</option>
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Brand Style</label>
          <select className="border rounded-md px-3 py-2" value={brand} onChange={(e)=>setBrand(e.target.value)}>
            <option>Default</option><option>Luxury</option><option>Casual</option><option>Minimal</option>
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Goal</label>
          <select className="border rounded-md px-3 py-2" value={goal} onChange={(e)=>setGoal(e.target.value)}>
            <option value="recover">Recover Cart</option><option value="upsell">Upsell</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-1">
          <label className="text-sm font-medium">Total ($)</label>
          <input className="border rounded-md px-3 py-2" inputMode="decimal" value={total} onChange={(e)=>setTotal(e.target.value)} />
        </div>
        <div className="grid gap-1 md:col-span-2">
          <label className="text-sm font-medium invisible">Generate</label>
          <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50">
            {loading ? 'Generating…' : 'Generate Copy'}
          </button>
        </div>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {result && (
        <div className="border rounded-lg p-4 grid gap-2">
          {result.subject && <div className="font-semibold">Subject: {result.subject}</div>}
          <pre className="whitespace-pre-wrap text-sm leading-6">{result.body}</pre>
          <div className="text-xs text-gray-500">Provider: {result.provider || 'n/a'}</div>
        </div>
      )}
    </div>
  );
}
