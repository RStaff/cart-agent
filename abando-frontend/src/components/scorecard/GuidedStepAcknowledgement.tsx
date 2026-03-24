"use client";

type GuidedStepAcknowledgementProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

export default function GuidedStepAcknowledgement({
  checked,
  label,
  onChange,
}: GuidedStepAcknowledgementProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-300/60">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`inline-flex h-5 w-5 items-center justify-center rounded-md border text-xs font-semibold transition ${
          checked
            ? "border-cyan-300 bg-cyan-400/20 text-cyan-100 shadow-[0_0_0_4px_rgba(34,211,238,0.12)]"
            : "border-white/20 bg-slate-950 text-transparent"
        }`}
      >
        ✓
      </span>
      <span>{label}</span>
    </label>
  );
}
