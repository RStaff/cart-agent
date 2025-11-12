// src/components/AICopyPanel.jsx
import React from "react";
import AICopyGenerator from "./AICopyGenerator.jsx";
import { generateCopy } from "../services/api.js";

export default function AICopyPanel() {
  const [cartId, setCartId] = React.useState("demo-cart-123");
  const [payload, setPayload] = React.useState(`{
  "items": [{ "title": "Mock Product", "quantity": 1, "unitPrice": 42.5 }]
}`);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");

  async function onGenerate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let parsed = {};
      try {
        parsed = payload.trim() ? JSON.parse(payload) : {};
      } catch {
        setError("Payload must be valid JSON.");
        setLoading(false);
        return;
      }
      const res = await generateCopy(cartId, parsed);
      setResult(res);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="text-base font-medium mb-4">AI Copy Generator</div>

      <form onSubmit={onGenerate} className="grid gap-3 mb-4">
        <div className="grid gap-1">
          <label className="text-sm font-medium">Cart ID</label>
          <input
            className="border rounded-md px-3 py-2 text-sm"
            value={cartId}
            onChange={(e) => setCartId(e.target.value)}
            placeholder="cart-123"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Payload JSON (optional)</label>
          <textarea
            className="border rounded-md px-3 py-2 text-sm min-h-[120px]"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
          />
          <div className="text-xs text-neutral-500">
            Example keys: <code>items</code>, <code>email</code>, <code>discount</code>, etc.
          </div>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div>
          <button
            type="submit"
            disabled={loading}
            className={`px-3 py-2 rounded-md text-sm border ${
              loading ? "bg-neutral-200 text-neutral-500" : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Generating…" : "Generate Recovery Copy"}
          </button>
        </div>
      </form>

      <AICopyGenerator result={result} />
    </div>
  );
}
