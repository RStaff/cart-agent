import {
  normalizeJobRecord,
  type IngestionFailure,
  type JobSource,
  type NormalizedJobRecord,
} from "../db/jobs_repo";

export type NormalizationResult =
  | {
    status: "success";
    source: JobSource;
    normalized_job: NormalizedJobRecord;
  }
  | IngestionFailure;

type GreenhouseJobPayload = Record<string, unknown>;
type LeverJobPayload = Record<string, unknown>;
type AshbyJobPayload = Record<string, unknown>;

const FUNCTION_KEYWORDS: Record<string, string[]> = {
  product: ["product", "roadmap", "strategy", "pm", "platform"],
  growth: ["growth", "retention", "lifecycle", "engagement", "acquisition"],
  marketing: ["marketing", "campaign", "crm", "brand", "demand"],
  operations: ["operations", "ops", "program", "process"],
  data: ["data", "analytics", "insights", "reporting"],
  engineering: ["engineering", "technical", "software", "architecture"],
  partnerships: ["partnership", "partner", "alliances"],
};

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  martech: ["crm", "marketing automation", "attribution", "email", "campaign"],
  ai: ["ai", "machine learning", "llm", "artificial intelligence"],
  ecommerce: ["ecommerce", "checkout", "merchant", "shopify", "retail"],
  b2b_saas: ["saas", "enterprise", "b2b", "plg"],
  retention: ["retention", "lifecycle", "reactivation", "loyalty"],
  monetization: ["pricing", "revenue", "monetization"],
};

const TOOL_KEYWORDS = [
  "salesforce",
  "hubspot",
  "braze",
  "marketo",
  "segment",
  "amplitude",
  "mixpanel",
  "sql",
  "python",
  "tableau",
  "looker",
  "figma",
  "jira",
];

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanNullableText(value: unknown) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

function cleanList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function extractTextValues(value: unknown): string[] {
  if (typeof value === "string") {
    return [cleanText(value)].filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractTextValues(item)).filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .flatMap((item) => extractTextValues(item))
      .filter(Boolean);
  }

  return [];
}

function normalizeText(value: string) {
  return cleanText(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function inferSourceSpecificCompany(sourceUrl: string) {
  try {
    const parsed = new URL(sourceUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);

    if (!segments.length) {
      return "";
    }

    if (parsed.hostname.includes("greenhouse")) {
      return segments[0] || "";
    }

    if (parsed.hostname.includes("lever")) {
      return segments[0] || "";
    }

    if (parsed.hostname.includes("ashbyhq")) {
      return segments[0] || "";
    }
  } catch {
    return "";
  }

  return "";
}

function inferWorkMode(locationText: string, description: string, explicitWorkMode?: string | null) {
  const combined = `${cleanText(explicitWorkMode)} ${locationText} ${description}`.toLowerCase();

  if (combined.includes("remote")) return "remote";
  if (combined.includes("hybrid")) return "hybrid";
  if (combined.includes("on-site") || combined.includes("onsite") || combined.includes("in office")) return "onsite";

  return "";
}

function inferEmploymentType(explicitEmploymentType?: string | null, description?: string) {
  const combined = `${cleanText(explicitEmploymentType)} ${cleanText(description)}`.toLowerCase();

  if (combined.includes("full-time") || combined.includes("full time")) return "full_time";
  if (combined.includes("part-time") || combined.includes("part time")) return "part_time";
  if (combined.includes("contract")) return "contract";
  if (combined.includes("temporary")) return "temporary";

  return "";
}

function parseSalaryText(text: string) {
  const normalized = cleanText(text);
  const currencyMatch = normalized.match(/\$|usd|eur|gbp/i);
  const numberMatches = [...normalized.matchAll(/(\d{2,3})(?:[,\s]?(\d{3}))?(?:\s*[kK])?/g)];

  if (!numberMatches.length) {
    return {
      salary_min: null,
      salary_max: null,
      salary_currency: currencyMatch ? normalizeCurrency(currencyMatch[0]) : null,
    };
  }

  const numbers = numberMatches.map((match) => {
    const raw = `${match[1] || ""}${match[2] || ""}`;
    let value = Number(raw);
    if (match[0].toLowerCase().includes("k")) {
      value *= 1000;
    }
    return Number.isFinite(value) ? value : null;
  }).filter((value): value is number => value !== null);

  if (!numbers.length) {
    return {
      salary_min: null,
      salary_max: null,
      salary_currency: currencyMatch ? normalizeCurrency(currencyMatch[0]) : null,
    };
  }

  const sorted = [...numbers].sort((left, right) => left - right);

  return {
    salary_min: sorted[0] || null,
    salary_max: sorted.length > 1 ? sorted[sorted.length - 1] : sorted[0] || null,
    salary_currency: currencyMatch ? normalizeCurrency(currencyMatch[0]) : null,
  };
}

function normalizeCurrency(value: string) {
  const normalized = cleanText(value).toUpperCase();
  if (normalized === "$" || normalized === "USD") return "USD";
  if (normalized === "EUR") return "EUR";
  if (normalized === "GBP") return "GBP";
  return normalized || null;
}

function inferRoleFamily(title: string, description: string) {
  const normalized = `${title} ${description}`.toLowerCase();
  const ranked = Object.entries(FUNCTION_KEYWORDS)
    .map(([family, keywords]) => ({
      family,
      score: keywords.filter((keyword) => normalized.includes(keyword)).length,
    }))
    .sort((left, right) => right.score - left.score || left.family.localeCompare(right.family));

  return ranked[0]?.score ? ranked[0].family : "";
}

function inferTagSet(text: string, keywordMap: Record<string, string[]>) {
  const normalized = cleanText(text).toLowerCase();
  return Object.entries(keywordMap)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([tag]) => tag);
}

function inferSeniorityHint(title: string, description: string) {
  const combined = `${title} ${description}`.toLowerCase();
  if (combined.includes("chief") || combined.includes("vp") || combined.includes("head")) return "executive";
  if (combined.includes("director")) return "director";
  if (combined.includes("principal")) return "principal";
  if (combined.includes("staff")) return "staff";
  if (combined.includes("senior") || combined.includes("lead")) return "senior";
  if (combined.includes("associate") || combined.includes("junior") || combined.includes("coordinator")) return "junior";
  return "";
}

function inferPeopleManagement(title: string, description: string) {
  const combined = `${title} ${description}`.toLowerCase();
  return (
    combined.includes("manage a team")
    || combined.includes("people manager")
    || combined.includes("team leadership")
    || combined.includes("direct reports")
    || combined.includes("build and lead")
  );
}

function inferToolTags(description: string) {
  const normalized = description.toLowerCase();
  return TOOL_KEYWORDS.filter((tool) => normalized.includes(tool));
}

function inferQuality(value: unknown) {
  const normalized = cleanText(value).toLowerCase();
  return ["high", "medium", "low", "strong", "solid", "weak"].includes(normalized)
    ? normalized
    : "";
}

function inferStrategicUpside(value: unknown) {
  const normalized = cleanText(value).toLowerCase();
  return ["high", "medium", "low", "strong", "solid", "weak"].includes(normalized)
    ? normalized
    : "";
}

function buildIncompleteResult(
  source: JobSource,
  sourceUrl: string,
  sourceJobId: string | null,
  message: string,
): IngestionFailure {
  return {
    status: "incomplete_job_data",
    source,
    source_url: sourceUrl,
    source_job_id: sourceJobId,
    message,
  };
}

function buildParseFailedResult(
  source: JobSource,
  sourceUrl: string,
  sourceJobId: string | null,
  message: string,
): IngestionFailure {
  return {
    status: "parse_failed",
    source,
    source_url: sourceUrl,
    source_job_id: sourceJobId,
    message,
  };
}

function normalizeBaseJob(input: {
  source: JobSource;
  source_job_id?: string | null;
  source_url: string;
  company: string;
  title: string;
  location_text?: string | null;
  work_mode?: string | null;
  employment_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  description_raw: string;
  company_quality?: string | null;
  strategic_upside?: string | null;
}) {
  const descriptionNormalized = normalizeText(input.description_raw);
  const roleFamily = inferRoleFamily(input.title, descriptionNormalized);
  const functionTags = inferTagSet(`${input.title} ${descriptionNormalized}`, FUNCTION_KEYWORDS);
  const domainTags = inferTagSet(descriptionNormalized, DOMAIN_KEYWORDS);
  const seniorityHint = inferSeniorityHint(input.title, descriptionNormalized);
  const locationText = cleanText(input.location_text);
  const workMode = inferWorkMode(locationText, descriptionNormalized, input.work_mode || "");

  return normalizeJobRecord({
    id: input.source_job_id ? `${input.source}:${input.source_job_id}` : `${input.source}:${input.source_url}`,
    source: input.source,
    source_job_id: input.source_job_id,
    source_url: input.source_url,
    company: input.company || inferSourceSpecificCompany(input.source_url),
    title: input.title,
    location_text: locationText,
    work_mode: workMode,
    employment_type: inferEmploymentType(input.employment_type, descriptionNormalized),
    salary_min: input.salary_min,
    salary_max: input.salary_max,
    salary_currency: input.salary_currency,
    description_raw: input.description_raw,
    description_normalized: descriptionNormalized,
    role_family: roleFamily,
    function_tags: functionTags,
    domain_tags: domainTags,
    seniority_hint: seniorityHint,
    requires_people_management: inferPeopleManagement(input.title, descriptionNormalized),
    tools: inferToolTags(descriptionNormalized),
    company_quality: inferQuality(input.company_quality),
    strategic_upside: inferStrategicUpside(input.strategic_upside),
  });
}

export function normalizeGreenhouseJob(payload: GreenhouseJobPayload, sourceUrl: string): NormalizationResult {
  const title = cleanText(payload.title);
  const jobId = cleanNullableText(payload.id || payload.job_id);
  const company = cleanText(payload.company_name || payload.company || inferSourceSpecificCompany(sourceUrl));
  const locationText = cleanText(
    (payload.location as { name?: string } | undefined)?.name
    || payload.location
    || payload.location_text,
  );
  const descriptionRaw = cleanText(payload.content || payload.description || payload.description_raw);
  const salary = parseSalaryText(
    cleanText(payload.salary_range || payload.compensation || payload.pay_input_ranges || ""),
  );

  if (!title || !descriptionRaw) {
    return buildParseFailedResult("greenhouse", sourceUrl, jobId, "greenhouse payload missing title or description");
  }

  return {
    status: "success",
    source: "greenhouse",
    normalized_job: normalizeBaseJob({
      source: "greenhouse",
      source_job_id: jobId,
      source_url: sourceUrl,
      company,
      title,
      location_text: locationText,
      employment_type: cleanNullableText(payload.employment_type),
      salary_min: salary.salary_min,
      salary_max: salary.salary_max,
      salary_currency: salary.salary_currency,
      description_raw: descriptionRaw,
      company_quality: cleanNullableText(payload.company_quality),
      strategic_upside: cleanNullableText(payload.strategic_upside),
    }),
  };
}

export function normalizeLeverJob(payload: LeverJobPayload, sourceUrl: string): NormalizationResult {
  const title = cleanText(payload.text || payload.title);
  const jobId = cleanNullableText(payload.id || payload.job_id);
  const company = cleanText(payload.company || inferSourceSpecificCompany(sourceUrl));
  const categories = (payload.categories as Record<string, unknown> | undefined) || {};
  const locationText = cleanText(categories.location || payload.location || payload.location_text);
  const descriptionSegments = [
    payload.description,
    payload.descriptionPlain,
    payload.team,
    payload.additional,
    ...extractTextValues(payload.lists),
  ].map((segment) => cleanText(segment)).filter(Boolean);
  const descriptionRaw = descriptionSegments.join("\n\n");
  const salary = parseSalaryText(
    cleanText(payload.salaryDescription || payload.compensation || ""),
  );

  if (!title || !descriptionRaw) {
    return buildParseFailedResult("lever", sourceUrl, jobId, "lever payload missing title or description");
  }

  return {
    status: "success",
    source: "lever",
    normalized_job: normalizeBaseJob({
      source: "lever",
      source_job_id: jobId,
      source_url: sourceUrl,
      company,
      title,
      location_text: locationText,
      work_mode: cleanNullableText(categories.workplaceType || payload.work_mode),
      employment_type: cleanNullableText(categories.commitment || payload.commitment),
      salary_min: salary.salary_min,
      salary_max: salary.salary_max,
      salary_currency: salary.salary_currency,
      description_raw: descriptionRaw,
      company_quality: cleanNullableText(payload.company_quality),
      strategic_upside: cleanNullableText(payload.strategic_upside),
    }),
  };
}

export function normalizeAshbyJob(payload: AshbyJobPayload, sourceUrl: string): NormalizationResult {
  const title = cleanText(payload.title || payload.name);
  const jobId = cleanNullableText(payload.id || payload.jobId || payload.jobPostingId);
  const company = cleanText(payload.companyName || payload.company || inferSourceSpecificCompany(sourceUrl));
  const location = (payload.location as Record<string, unknown> | undefined) || {};
  const descriptionSegments = [
    payload.descriptionHtml,
    payload.description,
    payload.jobDescription,
    payload.summary,
  ].map((segment) => cleanText(segment)).filter(Boolean);
  const descriptionRaw = descriptionSegments.join("\n\n");
  const compensation = (payload.compensation as Record<string, unknown> | undefined) || {};
  const salaryText = cleanText(
    compensation.summary
    || compensation.description
    || payload.compensationSummary
    || "",
  );
  const salary = parseSalaryText(salaryText);

  if (!title || !descriptionRaw) {
    return buildParseFailedResult("ashby", sourceUrl, jobId, "ashby payload missing title or description");
  }

  return {
    status: "success",
    source: "ashby",
    normalized_job: normalizeBaseJob({
      source: "ashby",
      source_job_id: jobId,
      source_url: sourceUrl,
      company,
      title,
      location_text: cleanText(location.locationName || location.name || payload.locationName || payload.location),
      work_mode: cleanNullableText(location.workplaceType || payload.work_mode),
      employment_type: cleanNullableText(payload.employmentType || payload.employment_type),
      salary_min: Number.isFinite(Number(compensation.minValue)) ? Number(compensation.minValue) : salary.salary_min,
      salary_max: Number.isFinite(Number(compensation.maxValue)) ? Number(compensation.maxValue) : salary.salary_max,
      salary_currency: cleanNullableText(compensation.currencyCode || compensation.currency) || salary.salary_currency,
      description_raw: descriptionRaw,
      company_quality: cleanNullableText(payload.company_quality),
      strategic_upside: cleanNullableText(payload.strategic_upside),
    }),
  };
}

export function normalizeSupportedJob(
  source: JobSource,
  payload: Record<string, unknown>,
  sourceUrl: string,
): NormalizationResult {
  if (source === "greenhouse") {
    return normalizeGreenhouseJob(payload, sourceUrl);
  }

  if (source === "lever") {
    return normalizeLeverJob(payload, sourceUrl);
  }

  if (source === "ashby") {
    return normalizeAshbyJob(payload, sourceUrl);
  }

  return buildIncompleteResult(source, sourceUrl, null, "manual source requires supported ATS payload");
}
