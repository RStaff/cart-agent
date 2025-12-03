"use client";

import React, { useEffect, useState } from "react";

type Recommendation = {
  recommended_action: string;
  timing: string;
  channel: string;
  reason: string;
};

type SegmentEvent = {
  created_at: string;
  event_type: string;
  value: string | number | null;
  segment: string;
  urgency: string;
  risk: string;
  note: string | null;
  recommendation: Recommendation | null;
};

type ApiResponse = {
  storeId: string;
  first_recent: SegmentEvent | null;
};

type MerchantDailyPlayPanelProps = {
  storeId: string;
  apiBase?: string;
};

function normalizeBase(apiBase?: string): string {
  const base =
    apiBase && apiBase.trim().length > 0
      ? apiBase.trim()
      : "https://pay.abando.ai";
  return base.replace(/\/$/, "");
}

export function MerchantDailyPlayPanel({
  storeId,
  apiBase,
}: MerchantDailyPlayPanelProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveStoreId =
    storeId && storeId.trim().length > 0
      ? storeId.trim()
      : "cart-agent-dev.myshopify.com";

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const base = normalizeBase(apiBase);
        const res = await fetch(
          `${base}/api/ai-segments/${encodeURIComponent(effectiveStoreId)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error(`API responded with ${res.status}`);
        }

        const json = (await res.json()) as ApiResponse;
        if (isMounted) {
          setData(json);
        }
      } catch (err: any) {
        if (!isMounted || err?.name === "AbortError") return;
        setError(err?.message ?? "Failed to load daily play.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [effectiveStoreId, apiBase]);

  const event = data?.first_recent ?? null;
  const rec = event?.recommendation ?? null;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.7)] md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Merchant Daily Play
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
            Today&apos;s #1 Play
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Store:{" "}
            <span className="font-mono text-[11px] text-slate-200">
              {data?.storeId ?? effectiveStoreId}
            </span>
          </p>
        </div>

        {event && (
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-300">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="uppercase tracking-[0.15em]">
              {event.segment || "segment"} · {event.urgency || "normal"}
            </span>
          </div>
        )}
      </div>

      {/* Loading / error / empty states */}
      {loading && (
        <div className="mt-6 space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-900" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-slate-900" />
        </div>
      )}

      {error && !loading && (
        <div className="mt-6 rounded-lg border border-red-800/60 bg-red-950/40 px-4 py-3 text-xs text-red-200">
          <p className="font-medium">Couldn&apos;t load today&apos;s play.</p>
          <p className="mt-1 text-[11px] opacity-90">{error}</p>
        </div>
      )}

      {!loading && !error && !event && (
        <div className="mt-6 text-sm text-slate-400">
          No recent events found for this store. Try sending a few test visits
          or carts through the dev store, then refresh this page.
        </div>
      )}

      {!loading && !error && event && (
        <>
          {/* Core recommendation */}
          <div className="mt-6 rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Play summary
            </p>
            <p className="mt-2 text-sm leading-relaxed text-emerald-50">
              {rec?.recommended_action ??
                "We’ve identified a key play for this segment based on recent behaviour."}
            </p>

            <dl className="mt-4 grid gap-4 text-[11px] text-emerald-100 md:grid-cols-3">
              <div>
                <dt className="uppercase tracking-[0.18em] text-emerald-400/80">
                  Channel
                </dt>
                <dd className="mt-1 text-sm text-emerald-50">
                  {rec?.channel ?? "ONSITE"}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.18em] text-emerald-400/80">
                  Timing
                </dt>
                <dd className="mt-1 text-sm text-emerald-50">
                  {rec?.timing ?? "next eligible visit"}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.18em] text-emerald-400/80">
                  Value
                </dt>
                <dd className="mt-1 text-sm text-emerald-50">
                  {event.value != null ? `$${event.value}` : "n/a"}
                </dd>
              </div>
            </dl>

            {rec?.reason && (
              <p className="mt-3 text-[11px] leading-relaxed text-emerald-100/80">
                <span className="font-semibold">Why this play:</span>{" "}
                {rec.reason}
              </p>
            )}
          </div>

          {/* Context section */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Event context
              </p>
              <dl className="mt-3 space-y-1.5">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Event type</dt>
                  <dd className="font-mono text-[11px] text-slate-100">
                    {event.event_type}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Segment</dt>
                  <dd className="font-mono text-[11px] text-slate-100">
                    {event.segment}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Urgency</dt>
                  <dd className="capitalize text-slate-100">
                    {event.urgency}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Risk</dt>
                  <dd className="capitalize text-slate-100">{event.risk}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Metrics
              </p>
              <dl className="mt-3 space-y-1.5">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Value</dt>
                  <dd className="text-slate-100">
                    {event.value != null ? `$${event.value}` : "n/a"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Created at</dt>
                  <dd className="text-right text-slate-100">
                    {new Date(event.created_at).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Notes
              </p>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-200">
                {event.note ?? "No additional notes on this event."}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default MerchantDailyPlayPanel;
