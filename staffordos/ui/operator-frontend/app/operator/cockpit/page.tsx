"use client";

import { useState } from "react";

type Result = {
  ok?: boolean;
  action?: string;
  stdout?: string;
  stderr?: string;
  latest?: string;
  status?: any;
  error?: string;
};

export default function OperatorCockpitPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function run(label: string, url: string, method: "GET" | "POST") {
    setLoading(label);
    setResult(null);

    try {
      const res = await fetch(url, { method, cache: "no-store" });
      const json = await res.json();
      setResult(json);
    } catch (error: any) {
      setResult({ ok: false, error: error.message });
    } finally {
      setLoading(null);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1>StaffordOS Cockpit</h1>
      <p style={{ opacity: 0.75 }}>
        Control plane for start/stop gates, cron visibility, and discovery sync status.
      </p>

      <section style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        <button onClick={() => run("Start Workday", "/api/operator/workday/start", "POST")}>
          Start Workday
        </button>

        <button onClick={() => run("Stop Workday", "/api/operator/workday/stop", "POST")}>
          Stop Workday
        </button>

        <button onClick={() => run("Cron Status", "/api/operator/cron-status", "GET")}>
          Cron Status
        </button>

        <button onClick={() => run("Discovery Status", "/api/operator/discovery-status", "GET")}>
          Discovery Status
        </button>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>{loading ? `Running: ${loading}` : "Output"}</h2>
        <pre
          style={{
            background: "#0b0b0c",
            color: "#f2f2f2",
            padding: 16,
            borderRadius: 12,
            overflowX: "auto",
            minHeight: 300,
            whiteSpace: "pre-wrap"
          }}
        >
          {result ? JSON.stringify(result, null, 2) : "No action run yet."}
        </pre>
      </section>
    </main>
  );
}
