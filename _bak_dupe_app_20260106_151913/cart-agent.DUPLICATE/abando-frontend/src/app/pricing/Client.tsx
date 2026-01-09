"use client";
import * as React from "react";

type Plan = "basic" | "growth" | "pro";

async function startTrial(plan: Plan) {
  try {
    const r = await fetch("/api/trial/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (!r.ok) throw new Error("request failed");
    const j = await r.json();
    const url = String(j?.checkout_url || "/onboarding");
    window.location.href = url;
  } catch {
    alert("Could not start trial. Please try again.");
  }
}

const card: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 12,
  padding: 16,
};
const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#635bff",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
};
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
};

export default function PricingClient() {
  return (
    <main style={{ maxWidth: 1000, margin: "48px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 12 }}>Pricing</h1>
      <p style={{ color: "#94a3b8", marginBottom: 16 }}>
        14-day free trial on every plan. In demo mode you’ll be sent to
        onboarding.
      </p>

      <div style={grid}>
        <div style={card}>
          <h3 style={{ margin: "0 0 6px" }}>Basic</h3>
          <ul style={{ margin: "0 0 12px 18px", padding: 0 }}>
            <li>AI cart recovery</li>
            <li>Playbooks</li>
            <li>Analytics</li>
          </ul>
          <button onClick={() => startTrial("basic")} style={btn}>
            Start Free Trial
          </button>
        </div>

        <div style={card}>
          <h3 style={{ margin: "0 0 6px" }}>Growth</h3>
          <ul style={{ margin: "0 0 12px 18px", padding: 0 }}>
            <li>All Basic features</li>
            <li>Voice variants</li>
            <li>A/B helpers</li>
          </ul>
          <button onClick={() => startTrial("growth")} style={btn}>
            Start Free Trial
          </button>
        </div>

        <div style={card}>
          <h3 style={{ margin: "0 0 6px" }}>Pro</h3>
          <ul style={{ margin: "0 0 12px 18px", padding: 0 }}>
            <li>All Growth features</li>
            <li>Custom voice presets</li>
            <li>Priority support</li>
          </ul>
          <button onClick={() => startTrial("pro")} style={btn}>
            Start Free Trial
          </button>
        </div>
      </div>
    </main>
  );
}
