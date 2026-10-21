import crypto from "node:crypto";

export const INBOX_SOURCE_TYPES = Object.freeze(["MANUAL_TEXT", "JOB_URL", "EMAIL_ALERT", "USER_FORWARD", "API_IMPORT", "FEED_IMPORT", "OTHER"]);
export const INBOX_STATES = Object.freeze(["NEW", "READY_TO_ANALYZE", "NEEDS_REVIEW", "IMPORTED", "DUPLICATE", "DISMISSED"]);

function clean(value, limit = 50000) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit); }
function cleanUrl(value) {
  const raw = clean(value, 1000);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}
function cleanSourceAuthority(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    sourceId: clean(value.sourceId, 160) || null,
    provider: clean(value.provider, 120) || null,
    employerName: clean(value.employerName, 240) || null,
    interfaceType: clean(value.interfaceType, 120) || null,
    authorityStatus: clean(value.authorityStatus, 80) || null,
    attributionText: clean(value.attributionText, 500) || null,
    sourceLinkRequired: value.sourceLinkRequired === true,
    applyRedirectRequired: value.applyRedirectRequired === true,
    rateLimitPolicy: clean(value.rateLimitPolicy, 240) || null,
    removalPolicy: clean(value.removalPolicy, 240) || null,
    lastReviewedAt: clean(value.lastReviewedAt, 80) || null,
  };
}
function cleanInputProvenance(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const sourceAuthority = cleanSourceAuthority(value.sourceAuthority);
  return {
    provider: clean(value.provider, 120) || null,
    authoritySourceId: clean(value.authoritySourceId, 160) || null,
    applyUrl: cleanUrl(value.applyUrl),
    retrievedAt: clean(value.retrievedAt, 80) || null,
    sourceAuthority,
  };
}
function cleanDescription(value, limit = 50000) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, limit)
    .trim();
}
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
  const sourceName = clean(input.sourceName, 240) || null;
  const title = clean(input.title, 240) || (sourceType === "JOB_URL" ? "Opportunity from source link" : "Imported opportunity");
  const company = clean(input.company, 240) || null;
  const location = clean(input.location, 240) || null;
  const description = cleanDescription(input.description, 50000) || null;
  if (!description && sourceType !== "JOB_URL") throw Object.assign(new Error("JOB_DESCRIPTION_REQUIRED"), { code: "JOB_DESCRIPTION_REQUIRED" });
  if (sourceType === "JOB_URL" && !sourceUrl) throw Object.assign(new Error("SOURCE_URL_REQUIRED"), { code: "SOURCE_URL_REQUIRED" });
  const normalizedText = [title, company || "", location || "", description || "", sourceUrl || "", clean(input.externalOpportunityId, 300)].join("\n").toLowerCase();
  const normalizedDigest = crypto.createHash("sha256").update(normalizedText).digest("hex");
  return {
    sourceType,
    sourceName,
    sourceUrl,
    externalOpportunityId: clean(input.externalOpportunityId, 300) || null,
    discoveredAt: input.discoveredAt ? new Date(input.discoveredAt).toISOString() : null,
    title,
    company,
    location,
    description,
    provenance: { ...cleanInputProvenance(input.provenance), inputMode: sourceType, sourceName },
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

export function urlOnlyOpportunityGuidance(item) {
  if (item?.sourceType !== "JOB_URL" || item?.normalizationStatus !== "NEEDS_USER_DESCRIPTION") return null;
  return "We saved this source link, but CareerOS does not fetch the job description from the website. Add or paste the job description so CareerOS can analyze the opportunity.";
}
