export type InstallSurface = "marketing_page" | "free_audit" | "embedded_admin";

type ResolveInstallPathOptions = {
  surface: InstallSurface;
  store?: string;
  shop?: string;
};

function normalizeValue(value?: string) {
  return String(value || "").trim();
}

export function resolveInstallPath(options: ResolveInstallPathOptions) {
  const store = normalizeValue(options.store);
  const shop = normalizeValue(options.shop);

  if (options.surface === "free_audit" && store) {
    return `/free-audit?store=${encodeURIComponent(store)}&install=1`;
  }

  if (options.surface === "embedded_admin") {
    return shop ? `/embedded?shop=${encodeURIComponent(shop)}&upgrade=1` : "/embedded?upgrade=1";
  }

  return "/embedded";
}
