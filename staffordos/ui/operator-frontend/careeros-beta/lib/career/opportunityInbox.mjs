import crypto from "node:crypto";

export const INBOX_SOURCE_TYPES = Object.freeze(["MANUAL_TEXT", "JOB_URL", "EMAIL_ALERT", "USER_FORWARD", "API_IMPORT", "FEED_IMPORT", "OTHER"]);
export const INBOX_STATES = Object.freeze(["NEW", "READY_TO_ANALYZE", "NEEDS_REVIEW", "IMPORTED", "DUPLICATE", "DISMISSED"]);

function clean(value, limit = 50000) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit); }
export function normalizeInboxUrl(value) {
  const raw = clean(value, 1000);
  if (!raw) return null;
  let parsed;
  try { parsed = new URL(raw); } catch { throw Object.assign(new Error("INVALID_SOURCE_URL"), { code: "INVALID_SOURCE_URL" }); }
  if (!["http:", "https:"].includes(parsed.protocol)) throw Object.assign(new Error("INVALID_SOURCE_URL"), { code: "INVALID_SOURCE_URL" });
  [...parsed.searchParams.keys()].filter((key) => /^utm_/i.test(key)).forEach((key) => parsed.searchParams.delete(key));
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "").toLowerCase();
}

export function normalizeInboxInput(input = {}) {
  const sourceType = INBOX_SOURCE_TYPES.includes(String(input.sourceType || "")) ? String(input.sourceType) : "MANUAL_TEXT";
  const sourceUrl = normalizeInboxUrl(input.sourceUrl);
  const title = clean(input.title, 240) || (sourceType === "JOB_URL" ? "Opportunity from source link" : "Imported opportunity");
  const company = clean(input.company, 240) || null;
  const location = clean(input.location, 240) || null;
  const description = clean(input.description, 50000) || null;
  if (!description && sourceType !== "JOB_URL") throw Object.assign(new Error("JOB_DESCRIPTION_REQUIRED"), { code: "JOB_DESCRIPTION_REQUIRED" });
  if (sourceType === "JOB_URL" && !sourceUrl) throw Object.assign(new Error("SOURCE_URL_REQUIRED"), { code: "SOURCE_URL_REQUIRED" });
  const normalizedText = [title, company || "", location || "", description || "", sourceUrl || "", clean(input.externalOpportunityId, 300)].join("\n").toLowerCase();
  const normalizedDigest = crypto.createHash("sha256").update(normalizedText).digest("hex");
  return {
    sourceType,
    sourceName: clean(input.sourceName, 240) || null,
    sourceUrl,
    externalOpportunityId: clean(input.externalOpportunityId, 300) || null,
    discoveredAt: input.discoveredAt ? new Date(input.discoveredAt).toISOString() : null,
    title,
    company,
    location,
    description,
    provenance: { inputMode: sourceType, sourceName: clean(input.sourceName, 240) || null },
    normalizedDigest,
    normalizedUrl: sourceUrl,
    normalizationStatus: description ? "NORMALIZED" : "NEEDS_USER_DESCRIPTION",
    initialStatus: description ? "READY_TO_ANALYZE" : "NEEDS_REVIEW",
  };
}

export function classifyInboxDuplicate(candidate, existing = []) {
  const exact = existing.find((item) => (candidate.normalizedUrl && item.normalizedUrl === candidate.normalizedUrl) || (candidate.externalOpportunityId && item.externalOpportunityId === candidate.externalOpportunityId && item.sourceName === candidate.sourceName) || (candidate.normalizedDigest && item.normalizedDigest === candidate.normalizedDigest));
  if (exact) return { duplicateStatus: "DUPLICATE", duplicateOf: exact };
  const possible = existing.find((item) => candidate.title.toLowerCase() === String(item.title || "").toLowerCase() && candidate.company && candidate.company.toLowerCase() === String(item.company || "").toLowerCase());
  return possible ? { duplicateStatus: "POSSIBLE_DUPLICATE", duplicateOf: possible } : { duplicateStatus: "NEW", duplicateOf: null };
}

export function publicInboxItem(row) {
  return { id: row.id, sourceType: row.sourceType, sourceName: row.sourceName, sourceUrl: row.sourceUrl, title: row.title, company: row.company, location: row.location, discoveredAt: row.discoveredAt, importedAt: row.importedAt, normalizationStatus: row.normalizationStatus, duplicateStatus: row.duplicateStatus, status: row.status, opportunityId: row.opportunityId };
}
