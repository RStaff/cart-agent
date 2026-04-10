import FixPageClient from "./FixPageClient";

type SearchParamsInput = Record<string, string | string[] | undefined>;

function cleanSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] || "").trim();
  return String(value || "").trim();
}

export const metadata = {
  title: "Shopifixer",
};

export default async function FixPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsInput>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const initialStoreUrl = cleanSearchParam(resolved.store);

  return <FixPageClient initialStoreUrl={initialStoreUrl} />;
}
