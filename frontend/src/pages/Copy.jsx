import React from "react";
import AICopyGenerator from "../components/AICopyGenerator.jsx";
import { generateCopy } from "../services/api.js";

export default function Copy() {
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
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
      const r = await generateCopy("demo-cart", demoCart);
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">AI Copy Generator</h1>
        <div className="flex gap-2">
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
