"use client";
import React from "react";

export default function AdminStatusPage() {
  const [data, setData] = React.useState<any>(null);
  const [err, setErr] = React.useState<string>("");

  React.useEffect(() => {
    fetch("/api/status").then(r=>r.json()).then(setData).catch(e=>setErr(String(e)));
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">System status</h1>
      <p className="text-slate-500 mb-6">Quick view of Stripe + autosend configuration.</p>

      {err && <div className="rounded-lg border border-rose-700 bg-rose-950 p-5 mb-6 text-rose-100">Error: {err}</div>}

      {!data && !err && <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">Loading…</div>}

      {data && (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-800 bg-slate-950 p-5">
            <h3 className="text-white font-semibold mb-2">Stripe</h3>
            <ul className="text-slate-300 list-disc ml-5 space-y-1">
              <li>Publishable key present: <b>{data.stripe.hasPublishable ? "Yes" : "No"}</b> {data.stripe.publishablePreview && `(${data.stripe.publishablePreview})`}</li>
              <li>Secret key present: <b>{data.stripe.hasSecret ? "Yes" : "No"}</b></li>
            </ul>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-950 p-5">
            <h3 className="text-white font-semibold mb-2">Autosend</h3>
            <ul className="text-slate-300 list-disc ml-5 space-y-1">
              <li>Mode: <b className="capitalize">{data.autosend.mode}</b></li>
              <li>Enabled: <b>{data.autosend.autosendEnabled ? "Yes" : "No"}</b></li>
            </ul>
            <p className="text-slate-400 mt-3 text-sm">
              Switch via <code>AUTOSEND_MODE</code> in <code>.env.local</code> or the helper script below.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
