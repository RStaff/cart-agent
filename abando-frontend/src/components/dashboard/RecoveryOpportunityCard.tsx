type RecoveryOpportunityCardProps = {
  domain: string;
  topIssue: string;
  estimatedRevenueLeak: string;
};

export default function RecoveryOpportunityCard({
  domain,
  topIssue,
  estimatedRevenueLeak,
}: RecoveryOpportunityCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-sm font-medium text-white">{domain}</p>
      <p className="mt-3 text-sm text-slate-300">{topIssue}</p>
      <p className="mt-2 text-sm text-cyan-200">{estimatedRevenueLeak}</p>
    </div>
  );
}
