"use client";
import { useMemo } from "react";
import Link from "next/link";

type Recovery = {
  id: string;
  customer: string;
  channel: "Email" | "SMS" | "Chat";
  amount: number;
  replied: boolean;
  date: string; // ISO
};

function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function Dashboard() {
  // Read query (?demo=1) – window is OK, this is a client page
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const demo = params.has("demo");

  // Sample demo data
  const data: Recovery[] = useMemo(() => {
    if (!demo) return [];
    return [
      { id: "A1001", customer: "Jamie L.", channel: "Email", amount: 149, replied: true,  date: new Date(Date.now()-864e5*1).toISOString() },
      { id: "A1002", customer: "Kira B.",  channel: "Chat",  amount: 92,  replied: false, date: new Date(Date.now()-864e5*2).toISOString() },
      { id: "A1003", customer: "Luis C.",  channel: "SMS",   amount: 68,  replied: true,  date: new Date(Date.now()-864e5*4).toISOString() },
      { id: "A1004", customer: "Ava P.",   channel: "Email", amount: 219, replied: false, date: new Date(Date.now()-864e5*7).toISOString() },
      { id: "A1005", customer: "Noah Z.",  channel: "Chat",  amount: 188, replied: true,  date: new Date(Date.now()-864e5*10).toISOString() },
    ];
  }, [demo]);

  const totals = useMemo(() => {
    const recovered = data.reduce((s,d) => s + d.amount, 0);
    const replyRate = data.length ? (data.filter(d=>d.replied).length / data.length) * 100 : 0;
    const messages = data.length * 3; // pretend 3 touches per recovery
    return { recovered, replyRate, messages };
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-brand-50">
      <div className="container py-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm">&larr; Back</Link>
          <div className="flex items-center gap-3">
            <a href="/#how" className="btn btn-ghost">How it works</a>
            <Link href="/trial" className="btn btn-primary">Start live trial</Link>
          </div>
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          {demo ? "Abando demo dashboard" : "Abando dashboard"}
        </h1>
        <p className="mt-2 text-slate-600">
          {demo
            ? "This view uses sample data. Start a live trial to connect Stripe test checkout and explore the full flow."
            : "Connect your store to see real-time recoveries, replies, and revenue."}
        </p>

        {/* KPIs */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="card"><div className="card-body">
            <div className="text-xs font-semibold text-brand-600">Recovered revenue</div>
            <div className="mt-2 text-3xl font-bold">{currency(totals.recovered)}</div>
          </div></div>
          <div className="card"><div className="card-body">
            <div className="text-xs font-semibold text-brand-600">Reply rate</div>
            <div className="mt-2 text-3xl font-bold">{totals.replyRate.toFixed(0)}%</div>
          </div></div>
          <div className="card"><div className="card-body">
            <div className="text-xs font-semibold text-brand-600">Messages sent</div>
            <div className="mt-2 text-3xl font-bold">{totals.messages.toLocaleString()}</div>
          </div></div>
        </div>

        {/* Recent activity */}
        <div className="mt-8 card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent recoveries</h2>
              <Link href="/trial" className="btn btn-ghost">Try a test checkout →</Link>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-4">Order</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Channel</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Replied</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 pr-4 font-medium">{r.id}</td>
                      <td className="py-2 pr-4">{r.customer}</td>
                      <td className="py-2 pr-4">{r.channel}</td>
                      <td className="py-2 pr-4">{currency(r.amount)}</td>
                      <td className="py-2 pr-4">{r.replied ? "Yes" : "No"}</td>
                      <td className="py-2">{new Date(r.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!data.length && (
                    <tr><td className="py-6 text-slate-500" colSpan={6}>
                      No data yet. Use the “Start live trial” button to kick off a Stripe test checkout.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link href="/trial" className="btn btn-primary">Start live trial</Link>
          <Link href="/#pricing" className="btn btn-ghost">See pricing</Link>
        </div>
      </div>
    </div>
  );
}
