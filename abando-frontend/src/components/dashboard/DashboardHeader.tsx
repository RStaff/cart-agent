import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function DashboardHeader({
  shop,
  openShopifyHref,
}: {
  shop: string;
  openShopifyHref: string;
}) {
  return (
    <header className="rounded-2xl border border-white/10 bg-[#020617]/92 px-5 py-4 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo size="header" />
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-slate-100">Abando™</p>
            <p className="text-sm text-slate-400">Checkout decision engine for Shopify</p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-300">
            <Link href="/run-audit" className="transition hover:text-cyan-200">
              Run audit
            </Link>
            <Link href="/pricing" className="transition hover:text-cyan-200">
              Pricing
            </Link>
          </nav>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
            {shop}
          </div>
          <a
            href={openShopifyHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-4 text-sm font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            Open Shopify
          </a>
          </div>
        </div>
      </div>
    </header>
  );
}
