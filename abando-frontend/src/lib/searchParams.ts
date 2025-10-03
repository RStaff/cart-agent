export async function normalizeSearchParams(
  searchParams?: Promise<URLSearchParams | Record<string, string | undefined>>
): Promise<Record<string, string>> {
  const raw: any = await searchParams;
  if (!raw) return {};
  if (typeof raw?.get === "function") {
    return Object.fromEntries((raw as URLSearchParams).entries());
  }
  return Object.fromEntries(
    Object.entries(raw as Record<string, string | undefined>)
      .filter(([, v]) => typeof v === "string") as [string, string][]
  );
}
