import { redirect } from "next/navigation";
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
        <h1 className="text-4xl font-semibold tracking-tight text-white">Run a free 30-second checkout audit</h1>
        <p className="text-base leading-7 text-slate-300">
          See where your checkout may be losing conversions — based on Shopify benchmark patterns.
        </p>
      </section>

      <RunAuditForm />

      <section className="rounded-xl bg-[#0f172a] p-5 text-center">
        <p className="text-sm font-medium text-slate-200">No signup. No install. No risk.</p>
        <p className="text-sm leading-7 text-slate-300">
          The audit leads to a pre-install scorecard only. It is a directional estimate based on benchmark patterns, not tracked revenue yet.
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-400">
          Connect Shopify later if you want Abando to confirm the scorecard with real data. Example inputs: <span className="text-slate-300">northstar-outdoors.myshopify.com</span> or{" "}
          <span className="text-slate-300">yourstore.com</span>
        </p>
      </section>
    </CenteredContainer>
  );
}
