import { redirect } from "next/navigation";
import PublicHeader from "@/components/brand/PublicHeader";
import DashboardWorkspace from "@/components/dashboard/DashboardWorkspace";
import { buildDashboardData } from "@/components/dashboard/buildDashboardData";
import CenteredContainer from "@/components/layout/CenteredContainer";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const dashboard = await buildDashboardData(params);

  if (dashboard.embedded || dashboard.host) {
    const nextQuery = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") nextQuery.set(key, value);
      else if (Array.isArray(value)) value.forEach((item) => nextQuery.append(key, item));
    }
    const queryString = nextQuery.toString();
    redirect(`/embedded/dashboard${queryString ? `?${queryString}` : ""}`);
  }

  return (
    <CenteredContainer>
      <PublicHeader />

      {!dashboard.data.shop ? (
        <section className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-5 text-amber-100">
          <p className="text-sm font-semibold uppercase tracking-[0.24em]">Store context pending</p>
          <p className="mt-3 text-sm leading-7">
            Shopify connection completed, but the connected shop domain was not passed through. Abando can still show the dashboard structure, but the scorecard prediction cannot be matched to a specific store yet.
          </p>
        </section>
      ) : null}

      <DashboardWorkspace
        data={dashboard.data}
        connectionLabel={dashboard.connectionLabel}
        trackingLabel={dashboard.trackingLabel}
        kpiTrackingLabel={dashboard.kpiTrackingLabel}
        openShopifyHref={dashboard.openShopifyHref}
        showHeader={false}
      />
    </CenteredContainer>
  );
}
