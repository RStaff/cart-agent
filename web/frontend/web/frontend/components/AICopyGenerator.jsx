import React, { useState } from "react";

export default function AICopyGenerator({ backendBase }) {
  const [style, setStyle] = useState("Luxury");
  const [goal, setGoal] = useState("recover");
  const [total, setTotal] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${backendBase}/api/generate-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style,
          goal,
          total,
          items: itemsText.split("\n").map(s => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 border rounded-lg shadow bg-white space-y-4">
      <h2 className="text-lg font-semibold">AI Copy Generator</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-1">
          <label className="text-sm font-medium">Style</label>
          <select className="border rounded-md px-3 py-2" value={style} onChange={e=>setStyle(e.target.value)}>
            <option>Luxury</option>
            <option>Casual</option>
            <option>Minimal</option>
          </select>
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Goal</label>
          <select className="border rounded-md px-3 py-2" value={goal} onChange={e=>setGoal(e.target.value)}>
            <option value="recover">Recover Cart</option>
            <option value="upsell">Upsell</option>
          </select>
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Total ($)</label>
          <input className="border rounded-md px-3 py-2" inputMode="decimal" value={total} onChange={e=>setTotal(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Items (one per line, e.g. “T-Shirt x2”)</label>
        <textarea className="border rounded-md px-3 py-2 min-h-[100px]" value={itemsText} onChange={e=>setItemsText(e.target.value)} />
      </div>

      <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50">
        {loading ? "Generating…" : "Generate Copy"}
      </button>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {result && (
        <div className="border rounded-lg p-4 grid gap-2">
          {result.subject && <div className="font-semibold">Subject: {result.subject}</div>}
          <pre className="whitespace-pre-wrap text-sm leading-6">{result.body}</pre>
          <div className="text-xs text-gray-500">Provider: {result.provider}</div>
        </div>
      )}
    </div>
  );
}
