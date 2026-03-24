import type { BetaMerchantRecord } from "@/lib/beta/seededBetaMerchants";

export default function BetaMerchantChecklist({ merchant }: { merchant: BetaMerchantRecord }) {
  const items = [
    { label: "Scorecard viewed", done: merchant.scorecardViewed },
    { label: "Install started", done: merchant.installStarted },
    { label: "Install completed", done: merchant.installCompleted },
    { label: "Dashboard visited", done: merchant.dashboardVisited },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Beta checklist</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700">{item.label}</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                item.done ? "bg-cyan-100 text-cyan-800" : "bg-slate-200 text-slate-600"
              }`}
            >
              {item.done ? "Done" : "Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
