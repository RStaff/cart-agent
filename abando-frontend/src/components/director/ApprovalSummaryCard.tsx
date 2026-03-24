"use client";

export default function ApprovalSummaryCard({ pendingApprovals }: { pendingApprovals: number }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Approvals</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Review load currently waiting for director attention.
        </p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Pending approvals</p>
        <p className="mt-3 text-3xl font-bold text-slate-100">{pendingApprovals}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {pendingApprovals > 0
            ? "Human review is needed before those high-impact outputs can move forward."
            : "No pending approvals right now."}
        </p>
      </div>
    </section>
  );
}
