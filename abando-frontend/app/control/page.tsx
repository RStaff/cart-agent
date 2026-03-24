import fs from "fs";
import path from "path";

export const metadata = {
  title: "Abando Control Panel",
  description: "Operational view for installs, audits, benchmarks, and system activity.",
};

type Snapshot = {
  generated_at: string;
  audit_views: number;
  audit_runs: number;
  install_clicks: number;
  installs: number;
  best_channel: string;
  biggest_dropoff: string;
  top_segment: string;
  latest_intelligence_event: string;
  published_posts: number;
  pending_posts: number;
  operator_signal: "green" | "yellow" | "red";
};

const DEFAULT_SNAPSHOT: Snapshot = {
  generated_at: "",
  audit_views: 0,
  audit_runs: 0,
  install_clicks: 0,
  installs: 0,
  best_channel: "",
  biggest_dropoff: "",
  top_segment: "",
  latest_intelligence_event: "",
  published_posts: 0,
  pending_posts: 0,
  operator_signal: "yellow",
};

function readSnapshot(): Snapshot {
  const snapshotPath = path.join(process.cwd(), "..", "staffordos", "control_panel", "abando_control_snapshot.json");

  try {
    return {
      ...DEFAULT_SNAPSHOT,
      ...JSON.parse(fs.readFileSync(snapshotPath, "utf8")),
    };
  } catch (_error) {
    return DEFAULT_SNAPSHOT;
  }
}

function SignalPill({ signal }: { signal: Snapshot["operator_signal"] }) {
  const styleMap = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    yellow: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-rose-200 bg-rose-50 text-rose-800",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${styleMap[signal]}`}>
      {signal}
    </span>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

export default function ControlPage() {
  const snapshot = readSnapshot();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Abando Control Panel</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Product operations snapshot</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Installs, audits, benchmarks, distribution, and live system activity in one Abando-specific view.
              </p>
            </div>
            <SignalPill signal={snapshot.operator_signal} />
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Funnel Overview</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Audit views" value={snapshot.audit_views} />
            <MetricCard label="Audit runs" value={snapshot.audit_runs} />
            <MetricCard label="Install clicks" value={snapshot.install_clicks} />
            <MetricCard label="Installs" value={snapshot.installs} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Best Channel</h2>
            <div className="mt-5">
              <MetricCard
                label="Current signal"
                value={snapshot.best_channel || "Unavailable"}
                helper={`Published posts: ${snapshot.published_posts}`}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Biggest Dropoff</h2>
            <div className="mt-5">
              <MetricCard
                label="Funnel friction"
                value={snapshot.biggest_dropoff || "Unavailable"}
                helper={`Pending posts: ${snapshot.pending_posts}`}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Benchmark Signal</h2>
            <div className="mt-5">
              <MetricCard
                label="Top segment"
                value={snapshot.top_segment || "Unavailable"}
                helper="Based on current benchmark pool coverage."
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Latest Intelligence Event</h2>
            <div className="mt-5">
              <MetricCard
                label="Latest event"
                value={snapshot.latest_intelligence_event || "No event recorded"}
                helper={snapshot.generated_at ? `Snapshot generated at ${snapshot.generated_at}` : undefined}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Operator Signal</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Green means the core audit, growth, benchmark, and intelligence files are available. Yellow means partial visibility.
            Red means core inputs are missing and the panel should not be trusted without investigation.
          </p>
          <div className="mt-5">
            <SignalPill signal={snapshot.operator_signal} />
          </div>
        </section>
      </div>
    </main>
  );
}
