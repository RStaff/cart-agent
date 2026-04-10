import { trackLeadOutcomeByStore } from "./leads_store.js";

function cleanText(value) {
  return String(value || "").trim();
}

export function normalizeStoreDomain(value) {
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

/**
 * @param {{ event?: string; store?: string; at?: string }} input
 */
export function trackShopifixerOutcome({ event, store, at = new Date().toISOString() } = {}) {
  const normalizedStore = normalizeStoreDomain(store);
  if (!normalizedStore) {
    throw new Error("store_missing");
  }

  return trackLeadOutcomeByStore({
    event: cleanText(event),
    store: normalizedStore,
    at,
  });
}
