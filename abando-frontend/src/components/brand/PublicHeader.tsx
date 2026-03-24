import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 -mx-2 rounded-2xl border border-white/10 bg-[#020617]/88 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="Abando™ home" className="inline-flex items-center gap-3">
          <BrandLogo size="header" />
          <span className="text-sm font-semibold tracking-[0.18em] text-slate-100">
            Abando™
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-slate-300">
          <Link href="/run-audit" className="transition hover:text-cyan-200">
            Run audit
          </Link>
          <Link href="/pricing" className="transition hover:text-cyan-200">
            Pricing
          </Link>
        </nav>
      </div>
    </header>
  );
}
