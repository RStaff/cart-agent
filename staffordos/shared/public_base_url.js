function resolvePublicAppBaseUrl() {
  const candidates = [
    process.env.APP_BASE_URL,
    process.env.ABANDO_PUBLIC_BASE_URL,
    process.env.PUBLIC_BASE_URL,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim().replace(/\/$/, "");
    if (!value) continue;
    if (isLocalhostUrl(value)) continue;
    if (isDevOnlyHost(value)) continue;
    return value;
  }

  return "https://app.abando.ai";
}

function isLocalhostUrl(value = "") {
  try {
    const parsed = new URL(String(value || "").trim());
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function isDevOnlyHost(value = "") {
  try {
    const parsed = new URL(String(value || "").trim());
    const hostname = String(parsed.hostname || "").trim().toLowerCase();
    return hostname === "dev.abando.ai" || hostname.endsWith(".trycloudflare.com");
  } catch {
    const raw = String(value || "").trim().toLowerCase();
    return raw.includes("dev.abando.ai") || raw.includes("trycloudflare.com");
  }
}

export function canonicalizePublicAppUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const baseUrl = resolvePublicAppBaseUrl();

  if (/^https?:\/\//i.test(raw)) {
    if (!isLocalhostUrl(raw)) return raw;
    try {
      const parsed = new URL(raw);
      return `${baseUrl}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return raw;
    }
  }

  if (raw.startsWith("/")) return `${baseUrl}${raw}`;
  return `${baseUrl}/${raw}`;
}

export function getPublicAppBaseUrl() {
  return resolvePublicAppBaseUrl();
}
