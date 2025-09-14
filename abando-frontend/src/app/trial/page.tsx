"use client";
import { useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;
const DEV_TOKEN = process.env.NEXT_PUBLIC_DEV_AUTH_TOKEN;

export default function Trial() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${BACKEND}/api/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(DEV_TOKEN ? { Authorization: `Bearer ${DEV_TOKEN}` } : {}),
          Origin: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "checkout_failed");
      if (data?.url) window.location.href = data.url;
      else throw new Error("no_checkout_url");
    } catch (e: any) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-brand-50">
      <div className="container py-16">
        <a href="/" className="text-sm">&larr; Abando</a>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Start your free trial</h1>
        <p className="mt-2 text-slate-600">No credit card required for Starter.</p>

        <div className="mt-8 max-w-md rounded-xl border bg-white p-4 shadow-sm sm:p-6">
          <label className="block text-sm font-medium text-slate-700">Your email</label>
          <div className="mt-2 flex gap-2">
            <input
              type="email"
              placeholder="you@store.com"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={start} disabled={busy || !email} className="btn btn-primary">
              {busy ? "Continuing..." : "Continue"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">You’ll be redirected to a Stripe checkout.</p>
          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        </div>
      </div>
    </div>
  );
}
