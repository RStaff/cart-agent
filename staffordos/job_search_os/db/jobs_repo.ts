export const JOB_SEARCH_RECOMMENDATIONS = [
  "pursue",
  "stretch_pursue",
  "skip",
] as const;

export const JOB_SOURCES = [
  "greenhouse",
  "lever",
  "ashby",
  "manual",
] as const;

export const JOB_INGESTION_STATUSES = [
  "success",
  "unsupported_source",
  "parse_failed",
  "incomplete_job_data",
] as const;

export const JOB_SEARCH_RISK_FLAGS = [
  "title_mismatch",
  "compensation_below_floor",
  "missing_salary",
  "weak_direct_evidence",
  "too_junior",
  "location_mismatch",
  "onsite_constraint",
  "tool_specific_gap",
  "people_management_gap",
] as const;

export type JobSearchRecommendation = typeof JOB_SEARCH_RECOMMENDATIONS[number];
export type JobSearchRiskFlag = typeof JOB_SEARCH_RISK_FLAGS[number];
export type JobSource = typeof JOB_SOURCES[number];
export type JobIngestionStatus = typeof JOB_INGESTION_STATUSES[number];

export type NormalizedJobRecord = {
  id: string;
  source: JobSource;
  source_job_id?: string | null;
  source_url: string;
  title: string;
  company: string;
  location_text?: string;
  work_mode?: string;
  employment_type?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  description_raw: string;
  description_normalized: string;
  role_family?: string | null;
  seniority_hint?: string | null;
  seniority?: string | null;
  domain_tags?: string[];
  function_tags?: string[];
  tools?: string[];
  requires_people_management?: boolean;
  company_quality?: string | null;
  strategic_upside?: string | null;
};

export type JobScoreRecord = {
  fit_score: number;
  compensation_score: number;
  narrative_score: number;
  total_score: number;
  recommendation: JobSearchRecommendation;
  score_reasoning: string;
  risk_flags: JobSearchRiskFlag[];
  strongest_angles: string[];
};

export type JobScoreUpdate = {
  job_id: string;
  fit_score: number;
  compensation_score: number;
  narrative_score: number;
  total_score: number;
  recommendation: JobSearchRecommendation;
  score_reasoning: string;
  risk_flags_json: string[];
  strongest_angles_json: string[];
};

export type NormalizedJobUpsert = NormalizedJobRecord & {
  dedupe_key: string;
};

export type JobDuplicateMatch = {
  duplicate_type: "source_url" | "source_and_source_job_id" | "none";
  matched_job_id: string | null;
};

export type IngestionFailure = {
  status: Exclude<JobIngestionStatus, "success">;
  source: JobSource | "unknown";
  source_url: string;
  source_job_id?: string | null;
  message: string;
};

export type ScoredJobRecord = NormalizedJobRecord & Partial<JobScoreRecord>;

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanOptionalText(value: unknown) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

function cleanList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanText(item).toLowerCase())
    .filter(Boolean);
}

function cleanNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : null;
}

function clampScore(value: unknown) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function cleanSource(value: unknown): JobSource {
  const normalized = cleanText(value).toLowerCase();
  return JOB_SOURCES.includes(normalized as JobSource)
    ? (normalized as JobSource)
    : "manual";
}

function cleanUrl(value: unknown) {
  const raw = cleanText(value);

  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

function cleanBoolean(value: unknown) {
  return value === true;
}

function buildFallbackJobId(source: JobSource, sourceUrl: string, sourceJobId?: string | null) {
  const normalizedUrl = cleanUrl(sourceUrl);
  const normalizedSourceJobId = cleanText(sourceJobId);
  return normalizedSourceJobId
    ? `${source}:${normalizedSourceJobId}`
    : `${source}:${normalizedUrl}`;
}

export function buildJobDedupeKey(job: Pick<NormalizedJobRecord, "source" | "source_url" | "source_job_id">) {
  const normalizedUrl = cleanUrl(job.source_url);
  const normalizedJobId = cleanText(job.source_job_id);

  if (normalizedJobId) {
    return `${job.source}:${normalizedJobId}`;
  }

  return normalizedUrl;
}

export function normalizeJobRecord(input: Partial<NormalizedJobRecord>): NormalizedJobRecord {
  const source = cleanSource(input.source);
  const sourceUrl = cleanUrl(input.source_url);
  const sourceJobId = cleanOptionalText(input.source_job_id);
  const id = cleanText(input.id) || buildFallbackJobId(source, sourceUrl, sourceJobId);
  const title = cleanText(input.title);
  const company = cleanText(input.company);
  const descriptionRaw = cleanText(input.description_raw);
  const description = cleanText(input.description_normalized);

  if (!id) {
    throw new Error("job_id_required");
  }

  if (!sourceUrl) {
    throw new Error("job_source_url_required");
  }

  if (!title) {
    throw new Error("job_title_required");
  }

  if (!company) {
    throw new Error("job_company_required");
  }

  if (!descriptionRaw) {
    throw new Error("job_description_raw_required");
  }

  if (!description) {
    throw new Error("job_description_required");
  }

  const seniorityHint = cleanText(input.seniority_hint || input.seniority).toLowerCase();

  return {
    id,
    source,
    source_job_id: sourceJobId,
    source_url: sourceUrl,
    title,
    company,
    location_text: cleanText(input.location_text),
    work_mode: cleanText(input.work_mode).toLowerCase(),
    employment_type: cleanText(input.employment_type).toLowerCase(),
    salary_min: cleanNullableNumber(input.salary_min),
    salary_max: cleanNullableNumber(input.salary_max),
    salary_currency: cleanText(input.salary_currency).toUpperCase(),
    description_raw: descriptionRaw,
    description_normalized: description,
    role_family: cleanText(input.role_family).toLowerCase(),
    seniority_hint: seniorityHint,
    seniority: seniorityHint,
    domain_tags: cleanList(input.domain_tags),
    function_tags: cleanList(input.function_tags),
    tools: cleanList(input.tools),
    requires_people_management: cleanBoolean(input.requires_people_management),
    company_quality: cleanText(input.company_quality).toLowerCase(),
    strategic_upside: cleanText(input.strategic_upside).toLowerCase(),
  };
}

export function buildNormalizedJobUpsert(input: Partial<NormalizedJobRecord>): NormalizedJobUpsert {
  const normalized = normalizeJobRecord(input);

  return {
    ...normalized,
    dedupe_key: buildJobDedupeKey(normalized),
  };
}

export function findDuplicateJob(
  existingJobs: Array<Pick<NormalizedJobRecord, "id" | "source" | "source_url" | "source_job_id">>,
  incomingJob: Pick<NormalizedJobRecord, "source" | "source_url" | "source_job_id">,
): JobDuplicateMatch {
  const normalizedUrl = cleanUrl(incomingJob.source_url);
  const normalizedSourceJobId = cleanText(incomingJob.source_job_id);

  const sameSourceAndJobId = normalizedSourceJobId
    ? existingJobs.find((job) =>
      job.source === incomingJob.source
      && cleanText(job.source_job_id) === normalizedSourceJobId
    )
    : null;

  if (sameSourceAndJobId) {
    return {
      duplicate_type: "source_and_source_job_id",
      matched_job_id: sameSourceAndJobId.id,
    };
  }

  const sameUrl = existingJobs.find((job) => cleanUrl(job.source_url) === normalizedUrl);

  if (sameUrl) {
    return {
      duplicate_type: "source_url",
      matched_job_id: sameUrl.id,
    };
  }

  return {
    duplicate_type: "none",
    matched_job_id: null,
  };
}

export function createNormalizedJob(
  existingJobs: Array<Pick<NormalizedJobRecord, "id" | "source" | "source_url" | "source_job_id">>,
  input: Partial<NormalizedJobRecord>,
) {
  const normalized = buildNormalizedJobUpsert(input);
  const duplicate = findDuplicateJob(existingJobs, normalized);

  return {
    status: duplicate.duplicate_type === "none" ? "create" : "duplicate",
    normalized_job: normalized,
    duplicate,
  };
}

export function updateNormalizedJob(
  existingJob: NormalizedJobRecord,
  updates: Partial<NormalizedJobRecord>,
) {
  return buildNormalizedJobUpsert({
    ...existingJob,
    ...updates,
    id: existingJob.id,
    source: existingJob.source,
    source_job_id: updates.source_job_id ?? existingJob.source_job_id,
    source_url: updates.source_url ?? existingJob.source_url,
  });
}

export function buildJobScoreUpdate(jobId: string, score: JobScoreRecord): JobScoreUpdate {
  const normalizedJobId = cleanText(jobId);

  if (!normalizedJobId) {
    throw new Error("job_id_required_for_score_update");
  }

  return {
    job_id: normalizedJobId,
    fit_score: clampScore(score.fit_score),
    compensation_score: clampScore(score.compensation_score),
    narrative_score: clampScore(score.narrative_score),
    total_score: clampScore(score.total_score),
    recommendation: score.recommendation,
    score_reasoning: cleanText(score.score_reasoning),
    risk_flags_json: Array.from(new Set(score.risk_flags)),
    strongest_angles_json: Array.from(new Set(score.strongest_angles.map((angle) => cleanText(angle)).filter(Boolean))),
  };
}

export function isScoredJobRecord(job: ScoredJobRecord) {
  return typeof job.total_score === "number" && Boolean(job.recommendation);
}

export function getJobScoreBand(totalScore: number) {
  if (totalScore >= 90) return "90-100";
  if (totalScore >= 80) return "80-89";
  if (totalScore >= 70) return "70-79";
  return "below_70";
}

export function extractJobTitleKeywords(title: string) {
  const stopWords = new Set(["and", "the", "for", "with", "lead", "senior"]);
  return cleanText(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));
}
