"use client";

type ExperimentRecommendation = {
  experiment_id: string;
  title: string;
  signal_source: string;
  hypothesis: string;
  proposed_change: string;
  expected_metric: string;
  impact_score: number;
  priority_label?: string;
  status: string;
  created_at: string;
};

export default function ExperimentPanel({
  experiments,
  onApprove,
  onReject,
}: {
  experiments: ExperimentRecommendation[];
  onApprove: (experimentId: string) => void;
  onReject: (experimentId: string) => void;
}) {
  const visibleExperiments = experiments.slice(0, 6);

  if (visibleExperiments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
        No experiment recommendations available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleExperiments.map((experiment) => (
        <div key={experiment.experiment_id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-100">{experiment.title}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {experiment.signal_source} · {experiment.impact_score}
              </div>
            </div>
            <div className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
              {experiment.status}
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Hypothesis</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{experiment.hypothesis}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Proposed Change</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{experiment.proposed_change}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              onClick={() => {
                onApprove(experiment.experiment_id);
              }}
              type="button"
            >
              Approve Experiment
            </button>
            <button
              className="rounded-lg border border-rose-700 bg-rose-950/40 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-900/60"
              onClick={() => {
                onReject(experiment.experiment_id);
              }}
              type="button"
            >
              Reject Experiment
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
