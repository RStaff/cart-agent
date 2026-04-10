const SHOPIFIXER_FIX_BASE_URL = "https://app.abando.ai/fix";

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeStoreHost(value) {
  const raw = cleanText(value);
  if (!raw) return "";

  try {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(candidate);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return raw
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .toLowerCase();
  }
}

export function getShopifixerFixBaseUrl() {
  return SHOPIFIXER_FIX_BASE_URL;
}

export function buildShopifixerFixUrl(storeUrl) {
  const host = normalizeStoreHost(storeUrl);
  if (!host) return SHOPIFIXER_FIX_BASE_URL;
  return `${SHOPIFIXER_FIX_BASE_URL}?store=${encodeURIComponent(host)}`;
}
