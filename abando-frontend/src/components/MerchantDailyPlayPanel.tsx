'use client';

import React, { useEffect, useState } from 'react';

type Recommendation = {
  recommended_action: string;
  timing: string;
  channel: string;
  reason: string;
};

type EventWithMeta = {
  created_at?: string;
  event_type?: string;
  eventType?: string;
  value?: string | number;
  segment?: string;
  urgency?: string;
  risk?: string;
  note?: string | null;
  recommendation?: Recommendation | null;
  [key: string]: any;
};

type DailyPlayResponse = {
  storeId: string;
  first_recent?: EventWithMeta | null;
  recent?: EventWithMeta[];
  [key: string]: any;
};

interface MerchantDailyPlayPanelProps {
  storeId: string;
  apiBase: string;
}

export const MerchantDailyPlayPanel: React.FC<MerchantDailyPlayPanelProps> = ({
  storeId,
  apiBase,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventWithMeta | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${apiBase.replace(/\/$/, '')}/api/ai-segments/${encodeURIComponent(
          storeId,
        )}`;
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) {
          throw new Error(`API responded with ${res.status}`);
        }

        const data: DailyPlayResponse = await res.json();

        const first =
          (data.first_recent as EventWithMeta | null | undefined) ??
          (Array.isArray(data.recent) && data.recent.length > 0
            ? data.recent[0]
            : null);

        if (!first) {
          if (!cancelled) {
            setEvent(null);
            setRecommendation(null);
          }
          return;
        }

        const rec = (first.recommendation as Recommendation | null | undefined) ?? null;

        if (!cancelled) {
          setEvent(first);
          setRecommendation(rec);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Unknown error');
          setEvent(null);
          setRecommendation(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [storeId, apiBase]);

  const prettyDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  };

  const currency = (value?: string | number) => {
    const n = Number(value ?? 0);
    if (Number.isNaN(n)) return '—';
    return `$${n.toFixed(2)}`;
  };

  return (
    <section className="mt-6 rounded-xl border border-slate-800 bg-black/40 p-4 text-slate-100">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Merchant Daily Play
          </h2>
          <p className="text-xs text-slate-500">
            Store: <span className="font-mono text-slate-300">{storeId}</span>
          </p>
        </div>
        {loading && (
          <span className="text-xs text-slate-500 animate-pulse">
            Refreshing…
          </span>
        )}
      </header>

      {error && (
        <div className="rounded-md border border-red-500/60 bg-red-950/40 p-3 text-xs text-red-100">
          <div className="font-semibold">API error</div>
          <div>{error}</div>
        </div>
      )}

      {!error && !loading && !event && (
        <div className="rounded-md border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-300">
          <div className="font-semibold text-slate-100">No live AI play yet</div>
          <p className="mt-1">
            Once we see enough recovery and churn-risk signals for this store, the #1
            recommended action for today will appear here automatically.
          </p>
        </div>
      )}

      {!error && event && (
        <div className="grid gap-3 md:grid-cols-[2fr,3fr]">
          {/* Left: #1 Play */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-400">
              Today&apos;s #1 Play
            </div>

            {recommendation ? (
              <>
                <div className="text-sm font-semibold text-slate-50">
                  {recommendation.recommended_action}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  <span className="font-medium text-slate-200">
                    Channel:
                  </span>{' '}
                  {recommendation.channel.toUpperCase()}
                  {' · '}
                  <span className="font-medium text-slate-200">Timing:</span>{' '}
                  {recommendation.timing}
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  {recommendation.reason}
                </p>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold text-slate-50">
                  Tracking live segments…
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  We&apos;ve started labeling visitor behavior for this store. As soon
                  as a play crosses the action threshold, the exact message, channel,
                  and timing will appear here.
                </p>
              </>
            )}
          </div>

          {/* Right: Context */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Context for this play
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
              <dt className="text-slate-500">Event type</dt>
              <dd className="text-slate-200">
                {event.event_type || event.eventType || '—'}
              </dd>

              <dt className="text-slate-500">Segment</dt>
              <dd className="text-slate-200">{event.segment || '—'}</dd>

              <dt className="text-slate-500">Urgency</dt>
              <dd className="text-slate-200">{event.urgency || '—'}</dd>

              <dt className="text-slate-500">Risk</dt>
              <dd className="text-slate-200">{event.risk || '—'}</dd>

              <dt className="text-slate-500">Value</dt>
              <dd className="text-slate-200">{currency(event.value)}</dd>

              <dt className="text-slate-500">Created at</dt>
              <dd className="text-slate-200">{prettyDate(event.created_at)}</dd>
            </dl>

            {event.note && (
              <div className="mt-2 border-t border-slate-800 pt-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Note
                </div>
                <p className="mt-1 text-[11px] text-slate-300">{event.note}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
