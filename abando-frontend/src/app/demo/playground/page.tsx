"use client";

import React, { useState } from "react";

type SegmentRow = {
  segment: string;
  urgency: string;
  risk: string;
  event_count: string;
  total_value: string;
};

type RecentRow = {
  created_at: string;
  event_type: string;
  value: string;
  segment: string;
  urgency: string;
  risk: string;
  note: string | null;
};

type ApiResponse = {
  ok: boolean;
  storeId: string;
  segments: SegmentRow[];
  recent: RecentRow[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_ABANDO_API_BASE ?? "https://pay.abando.ai";

export default function DemoPlaygroundPage() {
  const [storeId, setStoreId] = useState<string>("demo-store-ai");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLoad() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/ai-segments/${encodeURIComponent(storeId)}`
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `HTTP ${res.status} – ${res.statusText} – ${text.slice(0, 200)}`
        );
      }

      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (err: any) {
      console.error("Error loading AI segments:", err);
      setError(err?.message ?? "Unknown error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-5xl space-y-8">
        <header className="border-b border-slate-800 pb-4 mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Abando AI Segments – Demo Playground
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            This dashboard reads live data from{" "}
            <code className="px-1 py-0.5 rounded bg-slate-900">
              /api/ai-segments/:storeId
            </code>{" "}
            on{" "}
            <code className="px-1 py-0.5 rounded bg-slate-900">
              {API_BASE}
            </code>
            . Use it to show merchants how Abando classifies abandoned carts
            into segments with urgency and risk.
          </p>
        </header>

        {/* Controls */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Store ID
              </label>
              <input
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-emerald-500/60"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                placeholder="demo-store-ai"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Example: <code>demo-store-ai</code> (uses your seeded demo events)
              </p>
            </div>

            <button
              type="button"
              onClick={handleLoad}
              disabled={loading || !storeId.trim()}
              className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-60 disabled:cursor-not-allowed shadow"
            >
              {loading ? "Loading…" : "Load AI Segments"}
            </button>
          </div>

          {error && (
            <div className="rounded-md border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
              <strong>Error:</strong> {error}
            </div>
          )}
        </section>

        {/* Segments summary */}
        {data && (
          <>
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Segment Summary</h2>
              {data.segments.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No AI-labeled events found yet for store{" "}
                  <code>{data.storeId}</code>.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-slate-800 bg-slate-950/60">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-900/80">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-slate-300">
                          Segment
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-slate-300">
                          Urgency
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-slate-300">
                          Risk
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-slate-300">
                          Events
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-slate-300">
                          Total Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.segments.map((row, idx) => (
                        <tr
                          key={`${row.segment}-${row.urgency}-${row.risk}-${idx}`}
                          className={
                            idx % 2 === 0 ? "bg-slate-950" : "bg-slate-950/70"
                          }
                        >
                          <td className="px-3 py-2 font-medium">
                            {row.segment}
                          </td>
                          <td className="px-3 py-2">{row.urgency}</td>
                          <td className="px-3 py-2">{row.risk}</td>
                          <td className="px-3 py-2 text-right">
                            {row.event_count}
                          </td>
                          <td className="px-3 py-2 text-right">
                            ${row.total_value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Recent events */}
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Recent AI-Labeled Events</h2>
              {data.recent.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No recent events for this store.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-slate-800 bg-slate-950/60">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-900/80">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-slate-300">
                          Time (UTC)
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-slate-300">
                          Type
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-slate-300">
                          Value
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-slate-300">
                          Segment
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-slate-300">
                          Urgency
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-slate-300">
                          Risk
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-slate-300">
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent.map((row, idx) => (
                        <tr
                          key={`${row.created_at}-${idx}`}
                          className={
                            idx % 2 === 0 ? "bg-slate-950" : "bg-slate-950/70"
                          }
                        >
                          <td className="px-3 py-2">
                            {new Date(row.created_at).toISOString()}
                          </td>
                          <td className="px-3 py-2">{row.event_type}</td>
                          <td className="px-3 py-2 text-right">
                            ${row.value}
                          </td>
                          <td className="px-3 py-2">{row.segment}</td>
                          <td className="px-3 py-2">{row.urgency}</td>
                          <td className="px-3 py-2">{row.risk}</td>
                          <td className="px-3 py-2">
                            {row.note ?? <span className="text-slate-500">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {!data && !error && (
          <p className="text-sm text-slate-400">
            Click{" "}
            <span className="font-medium text-emerald-400">
              “Load AI Segments”
            </span>{" "}
            to pull live analytics for the current store ID. Use{" "}
            <code>demo-store-ai</code> to see your seeded demo data.
          </p>
        )}
      </div>
    </main>
  );
}
