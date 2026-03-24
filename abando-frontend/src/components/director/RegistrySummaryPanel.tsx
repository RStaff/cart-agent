"use client";

type RegistryCounts = {
  entities: number;
  tasks: number;
  results: number;
  approvals: number;
  signals: number;
};

function SummaryCountCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-100">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

export default function RegistrySummaryPanel({ counts }: { counts: RegistryCounts }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">System Summary</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Live operator state pulled from the canonical StaffordOS registries.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCountCard label="Entities" value={counts.entities} description="Tracked system entities across stores, audits, surfaces, and experiments." />
        <SummaryCountCard label="Tasks" value={counts.tasks} description="Canonical record of queued and executed operator work." />
        <SummaryCountCard label="Results" value={counts.results} description="Durable outputs produced by the system." />
        <SummaryCountCard label="Approvals" value={counts.approvals} description="Items requiring or recording human review decisions." />
        <SummaryCountCard label="Signals" value={counts.signals} description="Business intelligence objects prioritized from current artifacts." />
      </div>
    </section>
  );
}
