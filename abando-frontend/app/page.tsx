import { redirect } from "next/navigation";
import { MarketingLandingPage } from "../src/components/MarketingLandingPage";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toQuery(searchParams?: Record<string, string | string[] | undefined>) {
  if (!searchParams) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") sp.set(k, v);
    else if (Array.isArray(v)) v.forEach((vv) => sp.append(k, vv));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export default async function RootPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const host = typeof params?.host === "string" ? params?.host : undefined;
  const embedded = typeof params?.embedded === "string" ? params?.embedded : undefined;
  const shop = typeof params?.shop === "string" ? params.shop : "";

  // Shopify Admin loads embedded apps with host=... (and often embedded=1)
  if (host || embedded === "1") {
    redirect(`/embedded${toQuery(params)}`);
  }

  return <MarketingLandingPage shop={shop} />;
}
