import RevenueOpportunityRow from "./RevenueOpportunityRow";

type OpportunityRow = {
  label: string;
  amount: string;
  accent?: "cyan" | "amber" | "violet" | "emerald";
};

export default function RevenueOpportunityMap({ rows }: { rows: OpportunityRow[] }) {
  return (
    <div className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.94))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.24)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Revenue Opportunity Map</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">Estimated annual opportunity by issue area</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <RevenueOpportunityRow key={row.label} label={row.label} amount={row.amount} accent={row.accent} />
        ))}
      </div>
    </div>
  );
}
