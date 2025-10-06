"use client";

import * as React from "react";

export default function OnboardingForm() {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function sendMagic(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const r = await fetch("/api/auth/magic/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, returnTo: "/dashboard" }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok)
        throw new Error((j && (j.error || j.message)) || "Failed to send link");
      // If your dev API returns {link}, auto-open locally to save clicks.
      if (
        j.link &&
        typeof window !== "undefined" &&
        location.hostname === "localhost"
      ) {
        window.location.href = j.link as string;
        return;
      }
      setMsg("Magic link sent! Check your email to continue.");
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "Could not send the magic link.";
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={sendMagic} style={{ marginTop: 16 }}>
      <label style={{ display: "block", marginBottom: 8 }}>
        <span style={{ display: "block", marginBottom: 6 }}>Your email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,.12)",
            background: "#0f1524",
            color: "#e6eaf2",
          }}
        />
      </label>
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
        {busy ? "Sending…" : "Email me a login link"}
      </button>

      {msg && (
        <div role="status" style={{ marginTop: 12, color: "#a7f3d0" }}>
          {msg}
        </div>
      )}
      {err && (
        <div role="alert" style={{ marginTop: 12, color: "#fca5a5" }}>
          {err}
        </div>
      )}
    </form>
  );
}
