import Link from "next/link";

export default function InstallBlock({ installPath }: { installPath: string }) {
  return (
    <section className="rounded-xl bg-[#0f172a] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Next step</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">Confirm this on your real checkout</h2>
      <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
        <div>1. Shopify asks for approval</div>
        <div>2. Abando starts tracking checkout behavior</div>
        <div>3. You see confirmed checkout signals after successful connection and live activity</div>
      </div>
      <div className="mt-5 space-y-2 text-sm text-slate-400">
        <p>No changes are made without your approval.</p>
        <p>Billing is not collected on this page.</p>
      </div>
      <Link
        href={installPath}
        className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
      >
        Continue to Shopify approval
      </Link>
    </section>
  );
}
