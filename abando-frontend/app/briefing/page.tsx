import fs from "fs";
import path from "path";

export const metadata = {
  title: "Abando Daily Briefing",
  description: "Quick daily summary for Abando operations.",
};

type DailyBriefing = {
  generated_at: string;
  headline: string;
  summary: string;
  top_metrics: {
    audit_runs: number;
    install_clicks: number;
    installs: number;
  };
  top_opportunity: string;
  top_blocker: string;
  recommended_next_action: string;
};

const DEFAULT_BRIEFING: DailyBriefing = {
  generated_at: "",
  headline: "Daily briefing unavailable",
  summary: "Generate the daily briefing snapshot to populate this page.",
  top_metrics: {
    audit_runs: 0,
    install_clicks: 0,
    installs: 0,
  },
  top_opportunity: "Unavailable",
  top_blocker: "Unavailable",
  recommended_next_action: "Run the daily briefing generator.",
};

function readBriefing(): DailyBriefing {
  const briefingPath = path.join(process.cwd(), "..", "staffordos", "briefing", "daily_briefing.json");

  try {
    return {
      ...DEFAULT_BRIEFING,
      ...JSON.parse(fs.readFileSync(briefingPath, "utf8")),
    };
  } catch (_error) {
    return DEFAULT_BRIEFING;
  }
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export default function BriefingPage() {
  const briefing = readBriefing();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 md:px-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Abando Daily Briefing</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{briefing.headline}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{briefing.summary}</p>
          {briefing.generated_at ? (
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-400">Generated at {briefing.generated_at}</p>
          ) : null}
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Top Metrics</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <MetricCard label="Audit Runs" value={briefing.top_metrics.audit_runs} />
            <MetricCard label="Install Clicks" value={briefing.top_metrics.install_clicks} />
            <MetricCard label="Installs" value={briefing.top_metrics.installs} />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Top Opportunity</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">{briefing.top_opportunity}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Top Blocker</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">{briefing.top_blocker}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Recommended Next Action</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">{briefing.recommended_next_action}</p>
        </section>
      </div>
    </main>
  );
}
