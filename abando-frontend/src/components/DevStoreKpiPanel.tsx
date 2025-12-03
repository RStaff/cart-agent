'use client';

import React from 'react';

type SegmentSummary = {
  segment: string;
  urgency: string;
  risk: string;
  event_count: number | string;
  total_value: number | string;
};

type AbandoKpiResponse = {
  storeId: string;
  segments: SegmentSummary[];
  kpis?: {
    total_events: number;
    abandoned_events: number;
    abandoned_value: number;
    high_value_abandoned_value: number;
    recovered_events: number;
    recovered_value: number;
  };
};

const STORE_ID = 'dev-store';

export function DevStoreKpiPanel() {
  const [data, setData] = React.useState<AbandoKpiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const base =
      process.env.NEXT_PUBLIC_ABANDO_API_BASE ?? 'https://pay.abando.ai';

    async function load() {
      try {
        const res = await fetch(`${base}/api/ai-segments/${STORE_ID}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = (await res.json()) as AbandoKpiResponse;
        setData(json);
      } catch (err: unknown) {
        console.error('DevStoreKpiPanel error', err);
        const message =
          err instanceof Error ? err.message : 'Failed to load KPIs';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="text-xs text-neutral-400">
        Loading Abando demo KPIs…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-xs text-red-400">
        Could not load KPIs: {error ?? 'Unknown error'}
      </div>
    );
  }

  const kpis = data.kpis;
  const vip = data.segments.find((s) => s.segment === 'vip');
  const high = data.segments.find((s) => s.segment === 'high_value');
  const low = data.segments.find((s) => s.segment === 'low_value');

  return (
    <div className="rounded-lg border border-neutral-800 bg-black/40 p-4 text-sm">
      <div className="mb-2 text-[11px] uppercase tracking-wide text-neutral-400">
        Demo store – AI recovery snapshot
      </div>

      {kpis && (
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-neutral-400">
              Abandoned value
            </div>
            <div className="text-lg font-semibold text-emerald-300">
              ${kpis.abandoned_value.toFixed(2)}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-neutral-400">
              Recovered value
            </div>
            <div className="text-lg font-semibold text-emerald-300">
              ${kpis.recovered_value.toFixed(2)}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-neutral-400">
              High-value at risk
            </div>
            <div className="text-base font-medium text-amber-300">
              ${kpis.high_value_abandoned_value.toFixed(2)}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-neutral-400">
              Recovery rate
            </div>
            <div className="text-base font-medium text-emerald-300">
              {kpis.abandoned_value > 0
                ? `${Math.round(
                    (kpis.recovered_value / kpis.abandoned_value) * 100,
                  )}%`
                : '—'}
            </div>
          </div>
        </div>
      )}

      <div className="mt-1 text-[11px] text-neutral-500">
        Segments:&nbsp;
        VIP {vip?.event_count ?? 0} • High {high?.event_count ?? 0} • Low{' '}
        {low?.event_count ?? 0}
      </div>
    </div>
  );
}
