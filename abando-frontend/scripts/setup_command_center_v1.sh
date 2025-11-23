#!/usr/bin/env bash
set -euo pipefail

echo "▶ [Command Center v1] Moving to project root..."
cd "$(dirname "$0")/.."
echo "   Project root: $(pwd)"

echo "▶ Ensuring command-center directory exists..."
mkdir -p src/app/command-center

echo "▶ Writing src/app/command-center/StatusPanel.tsx ..."
cat << 'TSX' > src/app/command-center/StatusPanel.tsx
type Metric = {
  label: string;
  value: string;
  subLabel?: string;
};

type Segment = {
  segment: string;
  carts: number;
  recoveryRate: string;
  channel: string;
};

type RecentEvent = {
  id: string;
  cartValue: string;
  status: "Recovered" | "Pending" | "At Risk";
  channel: string;
  ago: string;
};

const metrics: Metric[] = [
  {
    label: "Recovered revenue (30 days)",
    value: "$9,420",
    subLabel: "+27.4% vs baseline",
  },
  {
    label: "Carts monitored (24 hours)",
    value: "384",
    subLabel: "AI watching in real time",
  },
  {
    label: "Recovery rate",
    value: "32.8%",
    subLabel: "Multi-channel flows enabled",
  },
];

const segments: Segment[] = [
  {
    segment: "High intent (checkout reached)",
    carts: 112,
    recoveryRate: "41%",
    channel: "Email + SMS",
  },
  {
    segment: "Browse abandon (product viewed)",
    carts: 167,
    recoveryRate: "19%",
    channel: "Email only",
  },
  {
    segment: "VIP customers",
    carts: 31,
    recoveryRate: "58%",
    channel: "Concierge flow",
  },
];

const recentEvents: RecentEvent[] = [
  {
    id: "#A-48219",
    cartValue: "$146.00",
    status: "Recovered",
    channel: "Email + SMS",
    ago: "12m ago",
  },
  {
    id: "#A-48203",
    cartValue: "$89.00",
    status: "Pending",
    channel: "Email",
    ago: "28m ago",
  },
  {
    id: "#A-48177",
    cartValue: "$312.00",
    status: "Recovered",
    channel: "VIP concierge",
    ago: "1h ago",
  },
  {
    id: "#A-48112",
    cartValue: "$57.00",
    status: "At Risk",
    channel: "Email",
    ago: "2h ago",
  },
];

function statusBadge(status: RecentEvent["status"]) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (status === "Recovered") {
    return (
      <span className={base + " bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"}>
        ● Recovered
      </span>
    );
  }
  if (status === "Pending") {
    return (
      <span className={base + " bg-sky-500/10 text-sky-300 border border-sky-500/40"}>
        ● Pending
      </span>
    );
  }
  return (
    <span className={base + " bg-amber-500/10 text-amber-300 border border-amber-500/40"}>
      ● At risk
    </span>
  );
}

export default function StatusPanel() {
  return (
    <div className="space-y-8">
      {/* Top metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              {m.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">
              {m.value}
            </p>
            {m.subLabel && (
              <p className="mt-1 text-xs text-slate-400">{m.subLabel}</p>
            )}
          </div>
        ))}
      </div>

      {/* Middle: segments */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)]">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                AI segments
              </h2>
              <p className="text-xs text-slate-400">
                How Abando groups abandoned carts for recovery.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {segments.map((s) => (
              <div
                key={s.segment}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">
                    {s.segment}
                  </p>
                  <p className="text-xs text-slate-400">
                    {s.carts} carts in the last 24 hours
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-300">
                      {s.recoveryRate}
                    </p>
                    <p className="text-[11px] text-slate-400">Recovery rate</p>
                  </div>
                  <div className="hidden text-[11px] text-slate-300 sm:block">
                    {s.channel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent events */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Live recovery feed
              </h2>
              <p className="text-xs text-slate-400">
                Recent carts Abando is trying to save.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {recentEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">
                    {e.id} • {e.cartValue}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {e.channel} • {e.ago}
                  </p>
                </div>
                <div className="shrink-0">{statusBadge(e.status)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
TSX

echo "▶ Writing src/app/command-center/page.tsx ..."
cat << 'TSX' > src/app/command-center/page.tsx
import StatusPanel from "./StatusPanel";

export const metadata = {
  title: "Abando Command Center",
};

export default function CommandCenterPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
            Abando™ for Shopify
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold">
            Live Recovery Command Center
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            This is the home base for your AI-powered recovery engine. Every
            card, segment, and event below will eventually be powered by real
            Shopify abandoned-cart data through the cart-agent backend.
          </p>
        </header>

        <StatusPanel />
      </div>
    </main>
  );
}
TSX

echo "✅ Command Center v1 files written."
echo "Next steps:"
echo "  1) npm run dev"
echo "  2) Visit http://localhost:3000/command-center"
echo "  3) When happy: ./scripts/deploy_abando_frontend.sh && ~/abando_quality_check.sh"
