import Link from "next/link";

type PublicHeaderProps = {
  shop?: string;
};

export default function PublicHeader({ shop = "" }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-20 -mx-2 rounded-2xl border border-white/10 bg-[#020617]/88 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="StaffordMedia home" className="inline-flex items-center gap-3">
          <span className="text-sm font-semibold tracking-[0.18em] text-slate-100">
            StaffordMedia
          </span>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
            ShopiFixer
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-slate-300">
          <Link href="/shopifixer" className="font-semibold text-cyan-200 transition hover:text-cyan-100">
            ShopiFixer
          </Link>
          <Link href="/run-audit" className="transition hover:text-cyan-200">
            Audit
          </Link>
          <Link href="/install/shopify" className="transition hover:text-cyan-200">
            Abando
          </Link>
        </nav>
      </div>
    </header>
  );
}
