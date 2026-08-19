const USAJOBS_SEARCH_URL = "https://data.usajobs.gov/api/search";
const DEFAULT_RESULT_LIMIT = 10;
const MAX_RESULT_LIMIT = 25;
const REQUEST_TIMEOUT_MS = 15000;

function clean(value, limit = 50000) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit); }
function clamp(value, min, max) { const number = Number(value); return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.floor(number))) : null; }
function firstValue(value) { return Array.isArray(value) ? value[0] : value; }
function providerError(code, status = null) { return Object.assign(new Error(code), { code, providerStatus: status }); }

export function boundUsajobsSearch(input = {}) {
  const resultLimit = clamp(input.resultLimit, 1, MAX_RESULT_LIMIT) || DEFAULT_RESULT_LIMIT;
  const postedWithinDays = clamp(input.postedWithinDays, 0, 60);
  const salaryMin = clamp(input.salaryMin, 0, 100000000);
  const remotePreference = ["any", "remote", "nonRemote"].includes(input.remotePreference) ? input.remotePreference : "any";
  return { keywords: clean(input.keywords, 240), location: clean(input.location, 240), remotePreference, postedWithinDays, salaryMin, resultLimit };
}

function descriptionFor(item) {
  const details = item?.MatchedObjectDescriptor?.UserArea?.Details || {};
  return clean(details.JobSummary || details.MajorDuties || item?.MatchedObjectDescriptor?.QualificationSummary, 50000) || null;
}

function normalizeResult(item, retrievedAt) {
  const descriptor = item?.MatchedObjectDescriptor || {};
  const remuneration = firstValue(descriptor.PositionRemuneration) || {};
  const schedule = firstValue(descriptor.PositionSchedule) || {};
  const offering = firstValue(descriptor.PositionOfferingType) || {};
  return {
    sourceProvider: "USAJOBS",
    externalOpportunityId: clean(item?.MatchedObjectId || descriptor.PositionID, 300) || null,
    title: clean(descriptor.PositionTitle, 240) || null,
    company: clean(descriptor.OrganizationName, 240) || null,
    location: clean(descriptor.PositionLocationDisplay || firstValue(descriptor.PositionLocation)?.LocationName, 240) || null,
    sourceUrl: clean(descriptor.PositionURI || firstValue(descriptor.ApplyURI), 1000) || null,
    description: descriptionFor(item),
    postedAt: descriptor.PublicationStartDate || null,
    closingAt: descriptor.ApplicationCloseDate || descriptor.PositionEndDate || null,
    salaryMin: remuneration.MinimumRange ? Number(remuneration.MinimumRange) : null,
    salaryMax: remuneration.MaximumRange ? Number(remuneration.MaximumRange) : null,
    employmentType: clean(offering.Name || schedule.Name, 120) || null,
    retrievedAt
  };
}

export async function searchUsajobs({
  keywords, location, remotePreference, postedWithinDays, salaryMin, resultLimit,
  env = process.env, fetchImpl = fetch, timeoutMs = REQUEST_TIMEOUT_MS, now = new Date()
} = {}) {
  if (!String(env.USAJOBS_API_KEY || "").trim() || !String(env.USAJOBS_USER_AGENT_EMAIL || "").trim()) throw providerError("USAJOBS_PROVIDER_NOT_CONFIGURED");
  const criteria = boundUsajobsSearch({ keywords, location, remotePreference, postedWithinDays, salaryMin, resultLimit });
  const url = new URL(USAJOBS_SEARCH_URL);
  if (criteria.keywords) url.searchParams.set("Keyword", criteria.keywords);
  if (criteria.location) url.searchParams.set("LocationName", criteria.location);
  if (criteria.remotePreference === "remote") url.searchParams.set("RemoteIndicator", "True");
  if (criteria.remotePreference === "nonRemote") url.searchParams.set("RemoteIndicator", "False");
  if (criteria.postedWithinDays !== null) url.searchParams.set("DatePosted", String(criteria.postedWithinDays));
  if (criteria.salaryMin !== null) url.searchParams.set("RemunerationMinimumAmount", String(criteria.salaryMin));
  url.searchParams.set("ResultsPerPage", String(criteria.resultLimit));
  url.searchParams.set("Fields", "Full");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { method: "GET", headers: { Host: "data.usajobs.gov", "User-Agent": env.USAJOBS_USER_AGENT_EMAIL, "Authorization-Key": env.USAJOBS_API_KEY }, signal: controller.signal });
    if (!response.ok) throw providerError(response.status === 401 || response.status === 403 ? "USAJOBS_AUTH_FAILED" : response.status === 429 ? "USAJOBS_RATE_LIMITED" : response.status >= 500 ? "USAJOBS_UNAVAILABLE" : "USAJOBS_REQUEST_FAILED", response.status);
    let body;
    try { body = await response.json(); } catch { throw providerError("USAJOBS_MALFORMED_RESPONSE", response.status); }
    const items = body?.SearchResult?.SearchResultItems;
    if (!body?.SearchResult || !Array.isArray(items)) throw providerError("USAJOBS_MALFORMED_RESPONSE", response.status);
    const retrievedAt = now.toISOString();
    return { provider: "USAJOBS", retrievedAt, results: items.slice(0, criteria.resultLimit).map((item) => normalizeResult(item, retrievedAt)), criteria };
  } catch (error) {
    if (error?.code) throw error;
    throw providerError(error?.name === "AbortError" ? "USAJOBS_TIMEOUT" : "USAJOBS_UNAVAILABLE");
  } finally { clearTimeout(timeout); }
}
