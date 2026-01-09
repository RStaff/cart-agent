import { redirect } from "next/navigation";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function toQuery(searchParams?: Props["searchParams"]) {
  if (!searchParams) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") sp.set(k, v);
    else if (Array.isArray(v)) v.forEach((vv) => sp.append(k, vv));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export default function RootPage({ searchParams }: Props) {
  const host = typeof searchParams?.host === "string" ? searchParams?.host : undefined;
  const embedded = typeof searchParams?.embedded === "string" ? searchParams?.embedded : undefined;

  // Shopify Admin loads embedded apps with host=... (and often embedded=1)
  if (host || embedded === "1") {
    redirect(`/embedded${toQuery(searchParams)}`);
  }

  // Public root becomes your marketing entry point
  redirect("/marketing");
}
