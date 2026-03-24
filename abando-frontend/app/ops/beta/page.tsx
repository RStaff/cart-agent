import Link from "next/link";
import BetaMerchantChecklist from "@/components/dashboard/BetaMerchantChecklist";
import {
  seededBetaMerchants,
  statusLabel,
  summarizeBetaMerchants,
} from "@/lib/beta/seededBetaMerchants";

export const metadata = {
  title: "Abando Beta Ops",
};

export default function BetaOpsPage() {
  const summary = summarizeBetaMerchants(seededBetaMerchants);

  return (
    <main className="min-h-screen bg-[#f6f6f7] text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Internal beta ops</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Abando beta merchant workflow</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Lightweight seeded tracking for the first 1–5 real merchant beta accounts. This is internal operations support, not a production CRM.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/run-audit"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
              >
                Run audit
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
              >
                View dashboard
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          {[
            ["Invited", summary.invited],
            ["Scorecard viewed", summary.scorecard_viewed],
            ["Install started", summary.install_started],
            ["Connected", summary.connected],
            ["Active beta", summary.active_beta],
          ].map(([label, count]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{count}</p>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          {seededBetaMerchants.map((merchant) => (
            <article key={merchant.shopDomain} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-950">{merchant.merchantName}</h2>
                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
                      {statusLabel(merchant.status)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{merchant.shopDomain}</p>
                  <p className="text-sm leading-7 text-slate-600">{merchant.notes}</p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/install/shopify?shop=${encodeURIComponent(merchant.shopDomain)}`}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
                    >
                      Open install flow
                    </Link>
                    <Link
                      href={`/dashboard?shop=${encodeURIComponent(merchant.shopDomain)}&connected=${merchant.installCompleted ? "1" : "0"}`}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50 px-4 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300"
                    >
                      Open dashboard state
                    </Link>
                  </div>
                </div>

                <div className="w-full xl:max-w-sm">
                  <BetaMerchantChecklist merchant={merchant} />
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
