"use client";

type Signal = {
  signal_id: string;
  signal_type: string;
  title: string;
  summary: string;
  score: number;
  priority: string;
  recommended_action: string;
  created_at: string;
};

function SignalItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm leading-6 text-slate-200">{value || "Not available"}</p>
    </div>
  );
}

export default function SignalPanel({ signals }: { signals: Signal[] }) {
  const topSignal = signals[0];
  const blockerSignal = signals.find((signal) => signal.signal_type === "top_blocker" || signal.signal_type === "conversion_dropoff");
  const channelSignal = signals.find((signal) => signal.signal_type === "strongest_channel");
  const actionSignal = blockerSignal || topSignal;

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Signals</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          System-derived business signals prioritized from audits, outreach, installs, and experiments.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SignalItem label="Top Signal" value={topSignal?.title || "No top signal generated yet."} />
        <SignalItem label="Top Blocker" value={blockerSignal?.summary || "No blocker signal available."} />
        <SignalItem label="Strongest Channel" value={channelSignal?.summary || "No strongest channel signal available."} />
        <SignalItem
          label="Recommended Next Action"
          value={actionSignal?.recommended_action || "Generate signals to get the next recommended action."}
        />
      </div>
    </section>
  );
}
