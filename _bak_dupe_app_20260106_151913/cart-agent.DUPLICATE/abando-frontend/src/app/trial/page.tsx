"use client";
import React from "react";
import Link from "next/link";
import { toErrorMessage } from "@/lib/errors";

export default function TrialPage() {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onStart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/trial/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { checkout_url?: string };
      if (!data?.checkout_url) throw new Error("no_checkout_url");
      window.location.href = data.checkout_url;
    } catch (e: unknown) {
      setErr(toErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "48px auto", padding: "0 16px" }}>
      <h1 style={{ margin: 0 }}>Start Free Trial</h1>
      <p style={{ color: "#9fb0c6" }}>
        Kick off a trial. You’ll be redirected to checkout if successful.
      </p>
      <form onSubmit={onStart} style={{ marginTop: 16 }}>
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 700,
            border: "none",
            background: busy ? "#5149ff" : "#635bff",
            color: "#fff",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Processing…" : "Start Trial"}
        </button>
      </form>
      {err && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            background: "#2a1b1b",
            color: "#fca5a5",
            border: "1px solid rgba(255,255,255,.12)",
            padding: "10px 12px",
            borderRadius: 10,
          }}
        >
          {err}
        </div>
      )}
      <div style={{ marginTop: 24 }}>
        <Link
          href="/"
          style={{ textDecoration: "underline", color: "#9fb0c6" }}
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
