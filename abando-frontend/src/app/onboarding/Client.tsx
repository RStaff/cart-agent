"use client";
import * as React from "react";

export default function OnboardingClient({ plan }: { plan?: string }) {
  const effectivePlan = plan || "basic";
  return (
    <main style={{ maxWidth: 760, margin: "48px auto", padding: "0 16px" }}>
      <h1>Onboarding</h1>
      <p style={{ color: "#94a3b8" }}>
        You’re in demo mode. Add Stripe keys to go live, or continue exploring the dashboard and demo.
      </p>
      <p style={{ marginTop: 12 }}>
        Plan: <strong>{effectivePlan}</strong>
      </p>
      <ul>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/demo/playground">Demo playground</a></li>
      </ul>
    </main>
  );
}
