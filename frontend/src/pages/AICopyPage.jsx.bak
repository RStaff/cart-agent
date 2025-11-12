import React from "react";
import { generateCopy } from "../services/api.js";

function AICopyGenerator({ result }) {
  const items = result?.itemsNormalized ?? [];
  const total = result?.totalComputed ?? 0;

  return (
    <div className="rounded-md border p-4">
      {result?.subject ? (
        <>
          <div className="font-semibold mb-2">Subject: {result.subject}</div>
          <div className="mb-4 whitespace-pre-wrap">{result.body}</div>
        </>
      ) : null}

      <div className="text-sm text-gray-600 mb-1">Computed Total: ${total.toFixed(2)}</div>
      <div className="text-sm text-gray-600">Line Items</div>
      <ul className="list-disc pl-6">
        {items.length === 0 ? (
          <li className="text-gray-400">No items parsed.</li>
        ) : items.map((it, i) => (
          <li key={i}>
            {it.title} — qty {it.quantity} @ ${Number(it.unitPrice).toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AICopyPage() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);

  async function handleGenerateDemo() {
    setLoading(true);
    setError(null);
    try {
      const demoCart = {
        items: [
          { title: "Cart-Agent Tee", quantity: 1, unitPrice: 24.0 },
          { title: "Wolf Sticker", quantity: 2, unitPrice: 2.25 },
        ],
        totalComputed: 28.5,
      };
      const r = await generateCopy("demo-cart-123", demoCart);
      setResult(r);
    } catch (e) {
      setError(e?.message || "Failed to generate copy.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-4">AI Copy Generator</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleGenerateDemo}
          disabled={loading}
          className="px-3 py-1.5 rounded-md bg-blue-600 text-white disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate demo"}
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-md bg-gray-200"
        >
          Reset
        </button>
      </div>

      {error ? (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <AICopyGenerator result={result || { totalComputed: 0, itemsNormalized: [] }} />
    </div>
  );
}
