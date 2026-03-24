type BenchmarkBadgeProps = {
  label: string;
};

export default function BenchmarkBadge({ label }: BenchmarkBadgeProps) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-amber-700/70 bg-amber-950/40 px-4 py-2 text-sm font-medium text-amber-100">
      <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
      <span>{label}</span>
    </div>
  );
}
