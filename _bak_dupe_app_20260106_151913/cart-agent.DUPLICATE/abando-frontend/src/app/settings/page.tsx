"use client";
import React from "react";

export default function SettingsPage() {
  const [status, setStatus] = React.useState<{
    ok: boolean;
    env: {
      hasPublishable: boolean;
      hasSecret: boolean;
      publishablePreview: string;
    };
  } | null>(null);
  const [err, setErr] = React.useState<string>("");

  React.useEffect(() => {
    fetch("/api/stripe/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch((e) => setErr(String(e)));
  }, []);

  const ok = !!status?.env && status.env.hasPublishable && status.env.hasSecret;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-slate-500 mb-6">
        Connect Stripe to leave demo mode. Add keys to <code>.env.local</code>{" "}
        and restart.
      </p>

      <div
        className={`rounded-lg border p-5 mb-6 ${ok ? "border-emerald-700 bg-emerald-950" : "border-amber-700 bg-amber-950"}`}
      >
        <h3 className="text-white font-semibold mb-2">Stripe status</h3>
        {!status && !err && <div className="text-slate-300">Checking…</div>}
        {err && <div className="text-rose-300">Error: {err}</div>}
        {status && (
          <ul className="text-slate-300 list-disc ml-5 space-y-1">
            <li>
              Publishable key present:{" "}
              <b>{status.env.hasPublishable ? "Yes" : "No"}</b>{" "}
              {status.env.publishablePreview &&
                `(${status.env.publishablePreview})`}
            </li>
            <li>
              Secret key present: <b>{status.env.hasSecret ? "Yes" : "No"}</b>
            </li>
          </ul>
        )}
        <div className="mt-3 text-slate-300">
          Required vars:
          <pre className="mt-2 rounded bg-black/40 p-3 overflow-x-auto">
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
            STRIPE_SECRET_KEY=sk_live_xxx
          </pre>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
        <h3 className="text-white font-semibold mb-2">Next step</h3>
        <ol className="text-slate-300 list-decimal ml-5 space-y-1">
          <li>
            Set the keys in <code>.env.local</code>.
          </li>
          <li>Restart dev (the script below does it automatically).</li>
          <li>Come back to this page and look for “Yes/Yes”.</li>
        </ol>
      </div>
    </main>
  );
}
