import { redirect } from "next/navigation";
import Link from "next/link";
import PublicHeader from "@/components/brand/PublicHeader";
import CenteredContainer from "@/components/layout/CenteredContainer";
import RunAuditForm from "@/components/public/RunAuditForm";
import { resolveRunAuditTarget } from "@/lib/scorecards";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RunAuditPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const rawStore = Array.isArray(params.store) ? params.store[0] : params.store;

  if (rawStore) {
    const resolved = resolveRunAuditTarget(rawStore);
    redirect(resolved.redirectPath);
  }

  return (
    <CenteredContainer>
      <PublicHeader />

      <section className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">ShopiFixer audit</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white">See where your Shopify checkout is leaking revenue</h1>
        <p className="text-base leading-7 text-slate-300">
          Start with a free audit, then use the result to decide whether the ShopiFixer Fix Sprint is the right scoped fix for your store.
        </p>
      </section>

      <RunAuditForm />

      <section className="rounded-xl bg-[#0f172a] p-5 text-center">
        <p className="text-sm font-medium text-slate-200">No signup. No install. No risk.</p>
        <p className="text-sm leading-7 text-slate-300">
          The audit is the first step. If it surfaces a meaningful checkout issue, the next move is a scoped ShopiFixer fix recommendation, not a generic install pitch.
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-400">
          Enter a Shopify domain to see the scorecard path. Example inputs: <span className="text-slate-300">northstar-outdoors.myshopify.com</span> or{" "}
          <span className="text-slate-300">yourstore.com</span>
        </p>
      </section>

      <section className="rounded-xl border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(15,23,42,1)_0%,rgba(11,31,45,1)_100%)] p-5 text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">What comes next</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">The audit prepares you for the ShopiFixer Fix Sprint</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          When the audit shows a likely conversion issue, the next step is a scoped $950 fix sprint with before and after proof around the problem you just found.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/shopifixer" className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
            Review the Fix Sprint
          </Link>
          <Link href="/shopifixer" className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200">
            See the ShopiFixer offer
          </Link>
        </div>
      </section>
    </CenteredContainer>
  );
}
