import BrandLogo from "@/components/BrandLogo";
import CenteredContainer from "@/components/layout/CenteredContainer";
import InstallClient from "./InstallClient";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InstallShopifyPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const shop = Array.isArray(params.shop) ? params.shop[0] : params.shop || "";
  const plan = Array.isArray(params.plan) ? params.plan[0] : params.plan || "";

  return (
    <CenteredContainer>
      <header className="flex items-center justify-center gap-3">
        <BrandLogo width={148} height={24} />
        <span className="text-slate-500">×</span>
        <span className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Shopify</span>
      </header>

      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white">Connect Shopify to confirm what the scorecard suggests</h1>
        <p className="text-base leading-7 text-slate-300">
          Shopify asks for approval first. After that, Abando can activate tracking and open your dashboard with real data.
        </p>
      </section>

      <InstallClient initialShop={shop} initialPlan={plan} />
    </CenteredContainer>
  );
}
