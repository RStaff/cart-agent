function normalizeShopDomain(raw) {
  if (!raw) return "";
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function defaultCartUrl(shopDomain) {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);
  return normalizedShopDomain ? `https://${normalizedShopDomain}/cart` : "#";
}

export function sanitizeSignalPath(rawPath, shopDomain) {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);
  if (!normalizedShopDomain) {
    return "#";
  }

  const explicitPath = typeof rawPath === "string" ? rawPath.trim() : "";
  if (!explicitPath) {
    return defaultCartUrl(normalizedShopDomain);
  }

  if (explicitPath.startsWith("/")) {
    if (explicitPath.startsWith("//")) {
      return defaultCartUrl(normalizedShopDomain);
    }
    return `https://${normalizedShopDomain}${explicitPath}`;
  }

  try {
    const parsed = new URL(explicitPath);
    const parsedHostname = normalizeShopDomain(parsed.hostname);
    if (parsedHostname !== normalizedShopDomain) {
      return defaultCartUrl(normalizedShopDomain);
    }

    return `https://${normalizedShopDomain}${parsed.pathname || "/"}${parsed.search || ""}${parsed.hash || ""}`;
  } catch {
    return defaultCartUrl(normalizedShopDomain);
  }
}

export { normalizeShopDomain };
