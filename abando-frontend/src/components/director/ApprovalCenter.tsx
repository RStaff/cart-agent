"use client";

type ApprovalItem = {
  approval_id: string;
  type: string;
  title: string;
  status: string;
  created_at: string;
  requested_by: string;
  related_task_id: string;
  summary: string;
};

export default function ApprovalCenter({
  approvals,
  onApprove,
  onReject,
}: {
  approvals: ApprovalItem[];
  onApprove: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
}) {
  const pending = approvals.filter((item) => item.status === "pending");

  return (
    <div className="space-y-4">
      {pending.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
          No pending approvals right now.
        </div>
      ) : (
        pending.map((item) => (
          <div key={item.approval_id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-100">{item.title}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.type}</div>
              </div>
              <div className="rounded-full border border-amber-700 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-200">
                {item.status}
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{item.summary}</p>
            <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
              <span>Requested by: {item.requested_by}</span>
              <span>Related task: {item.related_task_id}</span>
              <span>Created: {item.created_at}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                onClick={() => {
                  onApprove(item.approval_id);
                }}
                type="button"
              >
                Approve
              </button>
              <button
                className="rounded-lg border border-rose-700 bg-rose-950/40 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-900/60"
                onClick={() => {
                  onReject(item.approval_id);
                }}
                type="button"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
