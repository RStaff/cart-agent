import Link from "next/link";

type InstallCtaBarProps = {
  label: string;
  screenshotMode?: boolean;
};

export default function InstallCtaBar({ label, screenshotMode = false }: InstallCtaBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-cyan-900/60 bg-[linear-gradient(90deg,rgba(34,211,238,0.14),rgba(15,23,42,0.88))] px-6 py-5 shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Next step</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">Install Abando to monitor checkout friction, validate fixes, and capture the highest-leverage revenue opportunity first.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/shopify/install"
          className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          {label}
        </Link>
        {screenshotMode ? null : (
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200"
          >
            View Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
