import { redirect } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import CenteredContainer from "@/components/layout/CenteredContainer";
import { resolveRunAuditTarget } from "@/lib/scorecards";
import RunAuditForm from "./RunAuditForm";

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
      <header className="flex justify-center">
        <BrandLogo width={164} height={24} />
      </header>

      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white">Run a 30-second checkout audit</h1>
        <p className="text-base leading-7 text-slate-300">
          See where your checkout may be losing conversions — based on Shopify benchmark patterns.
        </p>
      </section>

      <RunAuditForm />

      <p className="text-center text-sm text-slate-400">
        This is a directional estimate — not tracked revenue yet.
      </p>
    </CenteredContainer>
  );
}
