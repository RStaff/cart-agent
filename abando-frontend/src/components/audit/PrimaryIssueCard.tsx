type PrimaryIssueCardProps = {
  issue: string;
  confidence: string;
};

export default function PrimaryIssueCard({ issue, confidence }: PrimaryIssueCardProps) {
  return (
    <div className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.24)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Primary Issue</p>
      <p className="mt-4 text-2xl font-semibold leading-tight text-white">{issue}</p>
      <p className="mt-4 text-sm leading-6 text-slate-400">Highest-confidence issue detected in this example audit preview. {confidence}.</p>
    </div>
  );
}
