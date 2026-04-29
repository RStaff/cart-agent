"use client";

import { useState } from "react";

export default function PrimaryBlockerActionPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function runProof() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/proof/abando-recovery/run", {
        method: "POST"
      });

      const json = await res.json();
      setResult(json);
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="panelInner">
        <h2 className="sectionTitle">Primary Blocker Action</h2>

        <div className="kv">
          <div><strong>Target:</strong> Abando Recovery Loop</div>
          <div><strong>Status:</strong> Partially Proven — runtime confirmation required</div>
          <div><strong>Action:</strong> Create controlled proof run artifact</div>
        </div>

        <button
          onClick={runProof}
          disabled={loading}
          className="mt-4 rounded-lg border px-4 py-2"
        >
          {loading ? "Creating proof run…" : "Run Abando Proof Request"}
        </button>

        {result && (
          <pre className="mt-4 overflow-auto rounded-lg border p-3 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </section>
  );
}
