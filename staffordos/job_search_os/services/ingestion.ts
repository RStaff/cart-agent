import type {
  IngestionFailure,
  JobSource,
  NormalizedJobRecord,
} from "../db/jobs_repo";
import { normalizeSupportedJob } from "./normalization";

type SupportedSourceDetection = {
  source: JobSource;
  source_url: string;
  source_job_id: string | null;
  company_hint: string | null;
};

export type ManualUrlIngestionResult =
  | {
    status: "success";
    source: JobSource;
    source_url: string;
    source_job_id: string | null;
    company_hint: string | null;
    normalized_job: NormalizedJobRecord;
  }
  | IngestionFailure
  | {
    status: "incomplete_job_data";
    source: JobSource;
    source_url: string;
    source_job_id: string | null;
    company_hint: string | null;
    message: string;
  };

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeUrl(value: string) {
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

function safeUrl(url: string) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function parseGreenhouseUrl(url: URL): SupportedSourceDetection | null {
  const segments = url.pathname.split("/").filter(Boolean);
  const jobsIndex = segments.findIndex((segment) => segment === "jobs");
  const companyHint = segments[0] || null;
  const jobId = jobsIndex >= 0 ? cleanText(segments[jobsIndex + 1]) || null : null;

  return {
    source: "greenhouse",
    source_url: normalizeUrl(url.toString()),
    source_job_id: jobId,
    company_hint: companyHint,
  };
}

function parseLeverUrl(url: URL): SupportedSourceDetection | null {
  const segments = url.pathname.split("/").filter(Boolean);
  const companyHint = segments[0] || null;
  const jobId = segments.length >= 2 ? cleanText(segments[segments.length - 1]) || null : null;

  return {
    source: "lever",
    source_url: normalizeUrl(url.toString()),
    source_job_id: jobId,
    company_hint: companyHint,
  };
}

function parseAshbyUrl(url: URL): SupportedSourceDetection | null {
  const segments = url.pathname.split("/").filter(Boolean);
  const companyHint = segments[0] || null;
  const jobId = segments.length >= 2 ? cleanText(segments[segments.length - 1]) || null : null;

  return {
    source: "ashby",
    source_url: normalizeUrl(url.toString()),
    source_job_id: jobId,
    company_hint: companyHint,
  };
}

export function detectJobSourceFromUrl(sourceUrl: string): SupportedSourceDetection | null {
  const parsed = safeUrl(normalizeUrl(sourceUrl));

  if (!parsed) {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();

  if (hostname.includes("greenhouse")) {
    return parseGreenhouseUrl(parsed);
  }

  if (hostname.includes("lever.co")) {
    return parseLeverUrl(parsed);
  }

  if (hostname.includes("ashbyhq.com")) {
    return parseAshbyUrl(parsed);
  }

  return null;
}

export function ingestGreenhouseJob(
  payload: Record<string, unknown>,
  sourceUrl: string,
) {
  return normalizeSupportedJob("greenhouse", payload, normalizeUrl(sourceUrl));
}

export function ingestLeverJob(
  payload: Record<string, unknown>,
  sourceUrl: string,
) {
  return normalizeSupportedJob("lever", payload, normalizeUrl(sourceUrl));
}

export function ingestAshbyJob(
  payload: Record<string, unknown>,
  sourceUrl: string,
) {
  return normalizeSupportedJob("ashby", payload, normalizeUrl(sourceUrl));
}

export function ingestManualJobUrl(
  sourceUrl: string,
  payload?: Record<string, unknown> | null,
): ManualUrlIngestionResult {
  const detected = detectJobSourceFromUrl(sourceUrl);
  const normalizedUrl = normalizeUrl(sourceUrl);

  if (!normalizedUrl) {
    return {
      status: "parse_failed",
      source: "unknown",
      source_url: sourceUrl,
      message: "job URL is empty or invalid",
    };
  }

  if (!detected) {
    return {
      status: "unsupported_source",
      source: "unknown",
      source_url: normalizedUrl,
      message: "manual URL is not a supported Greenhouse, Lever, or Ashby job URL",
    };
  }

  if (!payload) {
    return {
      status: "incomplete_job_data",
      source: detected.source,
      source_url: detected.source_url,
      source_job_id: detected.source_job_id,
      company_hint: detected.company_hint,
      message: "supported source detected, but a structured ATS payload is required to normalize the job",
    };
  }

  const normalized = normalizeSupportedJob(detected.source, payload, detected.source_url);

  if (normalized.status !== "success") {
    return normalized;
  }

  return {
    status: "success",
    source: detected.source,
    source_url: detected.source_url,
    source_job_id: detected.source_job_id,
    company_hint: detected.company_hint,
    normalized_job: normalized.normalized_job,
  };
}
