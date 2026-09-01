import { publicSourceAuthoritySnapshot, safeLeverSiteIdentifier } from "./sourceAuthorityRegistry.mjs";

export const LEVER_POSTINGS_API_HOSTS = Object.freeze({
  US: "api.lever.co",
  EU: "api.eu.lever.co",
});

const DEFAULT_RESULT_LIMIT = 25;
const MAX_RESULT_LIMIT = 25;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RESPONSE_BYTES = 2_000_000;

function clean(value, limit = 50000) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim().slice(0, limit);
}

function cleanDescription(value, limit = 50000) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, limit)
    .trim();
}

function providerError(code, status = null) {
  return Object.assign(new Error(code), { code, providerStatus: status });
}

function clamp(value, min, max) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.floor(number))) : null;
}

function scalarText(value, limit = 300) {
  if (typeof value === "string" || typeof value === "number") return clean(value, limit) || null;
  return null;
}

function numeric(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function validHttpUrl(value) {
  const raw = clean(value, 1000);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function leverRegionFor(value) {
  return clean(value, 20).toUpperCase() === "EU" ? "EU" : "US";
}

export function leverPostingsEndpoint(siteIdentifier, { region = "US" } = {}) {
  const site = safeLeverSiteIdentifier(siteIdentifier);
  if (!site) throw providerError("LEVER_SITE_IDENTIFIER_INVALID");
  const leverRegion = leverRegionFor(region);
  const host = LEVER_POSTINGS_API_HOSTS[leverRegion];
  const url = new URL(`https://${host}/v0/postings/${encodeURIComponent(site)}`);
  if (leverRegion === "US") url.searchParams.set("mode", "json");
  return url.toString();
}

function resultLimitFor(criteria) {
  return clamp(criteria?.resultLimit, 1, MAX_RESULT_LIMIT) || DEFAULT_RESULT_LIMIT;
}

function keywordScore(item, criteria) {
  const terms = clean(criteria?.keywords, 240).toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length >= 2);
  if (!terms.length) return 0;
  const text = [item.title, item.company, item.location, item.description].filter(Boolean).join(" ").toLowerCase();
  return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
}

function boundedResults(results, criteria) {
  const limit = resultLimitFor(criteria);
  return results
    .map((item, index) => ({ item, index, score: keywordScore(item, criteria) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ item }) => item);
}

function textForLocationItem(value) {
  return scalarText(value, 240) || scalarText(value?.text, 240) || scalarText(value?.name, 240) || scalarText(value?.location, 240);
}

function locationFor(posting) {
  const categories = objectOrEmpty(posting?.categories);
  const values = [scalarText(categories.location, 240)];
  if (Array.isArray(categories.allLocations)) values.push(...categories.allLocations.map(textForLocationItem));
  const unique = [...new Set(values.filter(Boolean))];
  return unique.join("; ") || null;
}

function listDescription(lists) {
  if (!Array.isArray(lists)) return "";
  return lists
    .map((item) => [scalarText(item?.text, 240), cleanDescription(item?.content)].filter(Boolean).join("\n"))
    .filter(Boolean)
    .join("\n\n");
}

function descriptionFor(posting) {
  const content = objectOrEmpty(posting?.content);
  const parts = [
    content.descriptionPlain,
    content.description,
    content.descriptionHtml,
    listDescription(content.lists),
    listDescription(posting?.lists),
    content.closingPlain,
    content.closing,
  ];
  return cleanDescription(parts.filter(Boolean).join("\n\n")) || null;
}

function workplaceTypeFor(posting) {
  const explicit = scalarText(posting?.workplaceType || posting?.workplace_type, 80);
  if (explicit) return explicit.toLowerCase();
  const source = [locationFor(posting), descriptionFor(posting)].filter(Boolean).join(" ");
  if (/\bremote\b|anywhere/i.test(source)) return "remote";
  if (/\bhybrid\b/i.test(source)) return "hybrid";
  if (/\bon-?site\b/i.test(source)) return "onsite";
  return null;
}

function salaryFor(posting) {
  const range = objectOrEmpty(posting?.salaryRange);
  return {
    min: numeric(range.min),
    max: numeric(range.max),
    currency: scalarText(range.currency, 20),
    interval: scalarText(range.interval, 80),
    description: scalarText(posting?.salaryDescription || range.description, 240),
  };
}

function dateTextOrNull(value) {
  const text = scalarText(value, 80);
  if (!text) return null;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? text : null;
}

function sourceUrlFor(posting, siteIdentifier) {
  const hostedUrl = validHttpUrl(posting?.hostedUrl);
  if (hostedUrl) return hostedUrl;
  const postingId = scalarText(posting?.id, 300);
  return postingId ? `https://jobs.lever.co/${encodeURIComponent(siteIdentifier)}/${encodeURIComponent(postingId)}` : null;
}

function applyUrlFor(posting, sourceUrl) {
  const applyUrl = validHttpUrl(posting?.applyUrl);
  return applyUrl || sourceUrl || null;
}

function contentLengthFor(response) {
  const raw = response?.headers?.get?.("content-length");
  const length = raw === null || raw === undefined ? null : Number(raw);
  return Number.isFinite(length) ? length : null;
}

export function normalizeLeverPosting(posting, { source, retrievedAt }) {
  const siteIdentifier = safeLeverSiteIdentifier(source?.siteIdentifier || source?.leverSite || source?.sourceIdentifier);
  if (!siteIdentifier) throw providerError("LEVER_SITE_IDENTIFIER_INVALID");
  const authority = publicSourceAuthoritySnapshot(source);
  const categories = objectOrEmpty(posting?.categories);
  const salary = salaryFor(posting);
  const providerJobId = scalarText(posting?.id, 300);
  const sourceUrl = sourceUrlFor(posting, siteIdentifier);
  const description = descriptionFor(posting);
  const employerName = clean(source?.employerName, 240) || null;
  return {
    provider: "LEVER",
    sourceProvider: "LEVER",
    sourceName: employerName ? `Lever / ${employerName}` : "Lever / employer career site",
    authoritySourceId: authority.sourceId,
    sourceAuthority: authority,
    providerJobId,
    externalOpportunityId: providerJobId,
    title: scalarText(posting?.text, 240),
    company: employerName,
    location: locationFor(posting),
    workMode: workplaceTypeFor(posting),
    employmentType: scalarText(categories.commitment, 120),
    salaryMin: salary.min,
    salaryMax: salary.max,
    postedAt: dateTextOrNull(posting?.postedAt || posting?.createdAt || posting?.created_at),
    closingAt: null,
    description,
    sourceUrl,
    applyUrl: applyUrlFor(posting, sourceUrl),
    retrievedAt,
    providerMetadata: {
      sourceAuthority: authority,
      authoritySourceId: authority.sourceId,
      employerName,
      attributionText: authority.attributionText || "Source: Lever / employer career site",
      sourceLinkRequired: authority.sourceLinkRequired,
      applyRedirectRequired: authority.applyRedirectRequired,
      lever: {
        siteIdentifier,
        region: authority.leverRegion || "US",
        postingId: providerJobId,
        hostedUrl: validHttpUrl(posting?.hostedUrl),
        applyUrl: validHttpUrl(posting?.applyUrl),
        workplaceType: workplaceTypeFor(posting),
        categories: {
          department: scalarText(categories.department, 120),
          team: scalarText(categories.team, 120),
          location: scalarText(categories.location, 240),
          commitment: scalarText(categories.commitment, 120),
          allLocations: Array.isArray(categories.allLocations) ? categories.allLocations.map(textForLocationItem).filter(Boolean) : [],
        },
        salaryRange: salary,
      },
    },
  };
}

export async function searchLeverSource({
  source,
  criteria = {},
  fetchImpl = fetch,
  timeoutMs = REQUEST_TIMEOUT_MS,
  now = new Date(),
  retrievedAt,
} = {}) {
  if (!source?.retrievalAuthorized) throw providerError("LEVER_SOURCE_NOT_AUTHORIZED");
  if (source.provider !== "LEVER") throw providerError("LEVER_SOURCE_PROVIDER_MISMATCH");
  const siteIdentifier = safeLeverSiteIdentifier(source.siteIdentifier || source.leverSite || source.sourceIdentifier);
  if (!siteIdentifier) throw providerError("LEVER_SITE_IDENTIFIER_INVALID");
  if (typeof fetchImpl !== "function") throw providerError("LEVER_FETCH_UNAVAILABLE");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = leverPostingsEndpoint(siteIdentifier, { region: source.leverRegion });
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "CareerOS-LeverAuthorizedSource/1.0",
      },
      redirect: "manual",
      credentials: "omit",
      signal: controller.signal,
    });
    if (response.status >= 300 && response.status < 400) throw providerError("LEVER_REDIRECT_NOT_ALLOWED", response.status);
    if (!response.ok) throw providerError(response.status === 429 ? "LEVER_RATE_LIMITED" : "LEVER_PROVIDER_FAILURE", response.status);
    const contentLength = contentLengthFor(response);
    if (contentLength !== null && contentLength > MAX_RESPONSE_BYTES) throw providerError("LEVER_RESPONSE_TOO_LARGE", response.status);
    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) throw providerError("LEVER_RESPONSE_TOO_LARGE", response.status);
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw providerError("LEVER_MALFORMED_RESPONSE", response.status);
    }
    if (!Array.isArray(body)) throw providerError("LEVER_MALFORMED_RESPONSE", response.status);
    const discoveryTime = clean(retrievedAt, 80) || now.toISOString();
    const results = boundedResults(
      body
        .filter((posting) => posting && typeof posting === "object" && !Array.isArray(posting))
        .map((posting) => normalizeLeverPosting(posting, { source, retrievedAt: discoveryTime })),
      criteria,
    );
    return { provider: "LEVER", providers: ["LEVER"], sourceIds: [source.sourceId], retrievedAt: discoveryTime, results, criteria };
  } catch (error) {
    if (error?.code) throw error;
    throw providerError(error?.name === "AbortError" ? "LEVER_TIMEOUT" : "LEVER_PROVIDER_FAILURE");
  } finally {
    clearTimeout(timeout);
  }
}
