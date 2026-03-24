type StoreIdentityBarProps = {
  storeDomain: string;
  showExampleLabel?: boolean;
};

export default function StoreIdentityBar({
  storeDomain,
  showExampleLabel = true,
}: StoreIdentityBarProps) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-slate-800 bg-slate-950/70 px-5 py-4">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-300/80" />
        <span className="font-medium tracking-[0.01em]">{storeDomain}</span>
      </div>
      {showExampleLabel ? (
        <span className="rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
          Example audit preview
        </span>
      ) : null}
    </div>
  );
}
