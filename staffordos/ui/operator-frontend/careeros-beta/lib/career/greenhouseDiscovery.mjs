import { publicSourceAuthoritySnapshot, safeGreenhouseBoardToken } from "./sourceAuthorityRegistry.mjs";

const GREENHOUSE_JOB_BOARD_HOST = "boards-api.greenhouse.io";
const DEFAULT_RESULT_LIMIT = 25;
const MAX_RESULT_LIMIT = 25;
const REQUEST_TIMEOUT_MS = 15000;

function clean(value, limit = 50000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
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

function scalarText(value) {
  if (typeof value === "string" || typeof value === "number") return clean(value, 300) || null;
  return null;
}

function arrayNames(values) {
  return Array.isArray(values) ? values.map((value) => clean(value?.name, 240)).filter(Boolean) : [];
}

function metadataValue(job, patterns) {
  for (const item of job?.metadata || []) {
    const name = clean(item?.name, 160);
    if (!name || !patterns.some((pattern) => pattern.test(name))) continue;
    if (typeof item?.value === "string" || typeof item?.value === "number") return clean(item.value, 240) || null;
    if (item?.value && typeof item.value === "object" && !Array.isArray(item.value)) {
      const value = item.value;
      if (value.unit && (value.min_value || value.max_value)) return clean(`${value.unit} ${value.min_value ?? "UNKNOWN"}-${value.max_value ?? "UNKNOWN"}`, 240);
    }
  }
  return null;
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

function sourceUrlFor(job, boardToken) {
  const absolute = validHttpUrl(job?.absolute_url);
  if (absolute) return absolute;
  const jobId = scalarText(job?.id);
  return jobId ? `https://boards.greenhouse.io/${encodeURIComponent(boardToken)}/jobs/${encodeURIComponent(jobId)}` : null;
}

function workModeFor(job) {
  const metadata = metadataValue(job, [/location type/i, /remote/i, /work arrangement/i]);
  const source = `${metadata || ""} ${clean(job?.location?.name, 240)}`;
  if (/\bremote\b|anywhere/i.test(source)) return "remote";
  if (/\bhybrid\b/i.test(source)) return "hybrid";
  if (/\bon-?site\b/i.test(source)) return "onsite";
  return metadata;
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

export function greenhouseJobsEndpoint(boardToken) {
  const safeToken = safeGreenhouseBoardToken(boardToken);
  if (!safeToken) throw providerError("GREENHOUSE_BOARD_IDENTIFIER_INVALID");
  const url = new URL(`https://${GREENHOUSE_JOB_BOARD_HOST}/v1/boards/${encodeURIComponent(safeToken)}/jobs`);
  url.searchParams.set("content", "true");
  return url.toString();
}

export function normalizeGreenhouseJob(job, { source, retrievedAt }) {
  const boardToken = safeGreenhouseBoardToken(source?.boardToken);
  if (!boardToken) throw providerError("GREENHOUSE_BOARD_IDENTIFIER_INVALID");
  const authority = publicSourceAuthoritySnapshot(source);
  const providerJobId = scalarText(job?.id);
  const sourceUrl = sourceUrlFor(job, boardToken);
  const description = cleanDescription(job?.content);
  const departments = arrayNames(job?.departments);
  const offices = arrayNames(job?.offices);
  const employerName = clean(source?.employerName || job?.company_name, 240) || null;
  return {
    provider: "GREENHOUSE",
    sourceProvider: "GREENHOUSE",
    sourceName: employerName ? `Greenhouse / ${employerName}` : "Greenhouse / employer career site",
    authoritySourceId: authority.sourceId,
    sourceAuthority: authority,
    providerJobId,
    externalOpportunityId: providerJobId,
    title: clean(job?.title, 240) || null,
    company: clean(job?.company_name || source?.employerName, 240) || null,
    location: clean(job?.location?.name, 240) || null,
    workMode: workModeFor(job),
    employmentType: metadataValue(job, [/employment type/i, /time type/i]),
    salaryMin: null,
    salaryMax: null,
    postedAt: job?.first_published || null,
    closingAt: null,
    description,
    sourceUrl,
    applyUrl: sourceUrl,
    retrievedAt,
    providerMetadata: {
      sourceAuthority: authority,
      authoritySourceId: authority.sourceId,
      employerName,
      attributionText: authority.attributionText || "Source: Greenhouse / employer career site",
      sourceLinkRequired: authority.sourceLinkRequired,
      applyRedirectRequired: authority.applyRedirectRequired,
      greenhouse: {
        boardToken,
        jobId: providerJobId,
        internalJobId: scalarText(job?.internal_job_id),
        requisitionId: scalarText(job?.requisition_id),
        departments,
        offices,
        updatedAt: job?.updated_at || null,
      },
    },
  };
}

export async function searchGreenhouseSource({
  source,
  criteria = {},
  fetchImpl = fetch,
  timeoutMs = REQUEST_TIMEOUT_MS,
  now = new Date(),
} = {}) {
  if (!source?.retrievalAuthorized) throw providerError("GREENHOUSE_SOURCE_NOT_AUTHORIZED");
  if (source.provider !== "GREENHOUSE") throw providerError("GREENHOUSE_SOURCE_PROVIDER_MISMATCH");
  const boardToken = safeGreenhouseBoardToken(source.boardToken);
  if (!boardToken) throw providerError("GREENHOUSE_BOARD_IDENTIFIER_INVALID");
  if (typeof fetchImpl !== "function") throw providerError("GREENHOUSE_FETCH_UNAVAILABLE");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = greenhouseJobsEndpoint(boardToken);
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "CareerOS-GreenhouseAuthorizedSource/1.0",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw providerError(response.status === 429 ? "GREENHOUSE_RATE_LIMITED" : "GREENHOUSE_UNAVAILABLE", response.status);
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw providerError("GREENHOUSE_MALFORMED_RESPONSE", response.status);
    }
    if (!body || !Array.isArray(body.jobs)) throw providerError("GREENHOUSE_MALFORMED_RESPONSE", response.status);
    const retrievedAt = now.toISOString();
    const results = boundedResults(
      body.jobs
        .filter((job) => job && typeof job === "object" && !Array.isArray(job))
        .map((job) => normalizeGreenhouseJob(job, { source, retrievedAt })),
      criteria,
    );
    return { provider: "GREENHOUSE", providers: ["GREENHOUSE"], sourceIds: [source.sourceId], retrievedAt, results, criteria };
  } catch (error) {
    if (error?.code) throw error;
    throw providerError(error?.name === "AbortError" ? "GREENHOUSE_TIMEOUT" : "GREENHOUSE_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
  }
}
