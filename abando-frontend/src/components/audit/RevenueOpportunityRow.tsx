type RevenueOpportunityRowProps = {
  label: string;
  amount: string;
  accent?: "cyan" | "amber" | "violet" | "emerald";
};

const ACCENT_STYLES: Record<NonNullable<RevenueOpportunityRowProps["accent"]>, string> = {
  cyan: "bg-cyan-300/80",
  amber: "bg-amber-300/80",
  violet: "bg-violet-300/80",
  emerald: "bg-emerald-300/80",
};

export default function RevenueOpportunityRow({
  label,
  amount,
  accent = "cyan",
}: RevenueOpportunityRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[20px] border border-slate-800 bg-slate-950/70 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${ACCENT_STYLES[accent]}`} />
        <span className="text-sm font-medium text-slate-200">{label}</span>
      </div>
      <span className="text-sm font-semibold tracking-tight text-white md:text-base">{amount}</span>
    </div>
  );
}
