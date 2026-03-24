"use client";

type RegistryResult = {
  result_id: string;
  task_id: string;
  result_type: string;
  created_at: string;
  summary: string;
  artifact_path: string;
};

export default function ResultRegistryPanel({ results }: { results: RegistryResult[] }) {
  const recentResults = results.slice().reverse().slice(0, 6);

  return (
    <div className="space-y-4">
      {recentResults.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
          No registered results yet.
        </div>
      ) : (
        recentResults.map((result) => (
          <div key={result.result_id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">{result.result_type}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{result.result_id}</div>
              </div>
              <div className="text-xs text-slate-500">{result.created_at}</div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{result.summary}</p>
            <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
              <span>Task ref: {result.task_id}</span>
              <span>Artifact: {result.artifact_path}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
