import { appendFileSync, chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";
import { createHash } from "node:crypto";
import {
  EMPTY_JOB_SEARCH_PREFERENCES,
  JOB_SEARCH_PREFERENCES_SCHEMA_VERSION,
  JOB_SEARCH_PREFERENCES_VERSION,
  JOB_SEARCH_REGION_OPTIONS,
  type JobSearchGeographyPreference,
  type JobSearchPreferenceAuthorityRecord,
} from "./jobSearchPreferences";

export const JOB_SEARCH_PREFERENCES_DIRECTORY = "job-search-preferences";
export const JOB_SEARCH_PREFERENCES_FILENAME = "job_search_preferences.json";
export const JOB_SEARCH_PREFERENCES_EVENTS_FILENAME = "job_search_preference_events.jsonl";

type PreferenceStorageOptions = { jobSearchRoot?: string };

export type JobSearchPreferenceSaveResult = {
  ok: boolean;
  preference: JobSearchPreferenceAuthorityRecord;
  errors: string[];
  pathsWritten: string[];
};

function storageDirectory(jobSearchRoot = path.join(homedir(), ".staffordos/private/professional/job-search")) {
  return path.join(jobSearchRoot, JOB_SEARCH_PREFERENCES_DIRECTORY);
}

function currentPath(options: PreferenceStorageOptions = {}) {
  return path.join(storageDirectory(options.jobSearchRoot), JOB_SEARCH_PREFERENCES_FILENAME);
}

function eventsPath(options: PreferenceStorageOptions = {}) {
  return path.join(storageDirectory(options.jobSearchRoot), JOB_SEARCH_PREFERENCES_EVENTS_FILENAME);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function list(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function selectedRegions(ids: readonly string[], preference: "PREFERRED" | "ACCEPTABLE") {
  return ids
    .map((id) => JOB_SEARCH_REGION_OPTIONS.find((option) => option.regionId === id))
    .filter((option): option is typeof JOB_SEARCH_REGION_OPTIONS[number] => Boolean(option))
    .map((option) => ({ ...option, aliases: [...option.aliases], preference }));
}

export function validateJobSearchPreferenceInput(input: {
  preferredRegionIds: readonly string[];
  acceptableRegionIds: readonly string[];
  remote: string;
  hybrid: string;
  onsite: string;
  relocation: string;
}) {
  const errors: string[] = [];
  const allowedArrangements = new Set(["ACCEPT", "DECLINE", "UNKNOWN"]);
  if (!input.preferredRegionIds.length && !input.acceptableRegionIds.length &&
      input.remote !== "ACCEPT" && input.hybrid !== "ACCEPT" && input.onsite !== "ACCEPT" && input.relocation === "UNKNOWN") {
    errors.push("Select at least one working region, accepted work arrangement, or relocation choice.");
  }
  for (const [label, value] of [["Fully remote", input.remote], ["Hybrid", input.hybrid], ["On-site", input.onsite]] as const) {
    if (!allowedArrangements.has(value)) errors.push(`${label} preference is invalid.`);
  }
  if (!["REQUIRED", "NOT_REQUIRED", "UNKNOWN"].includes(input.relocation)) {
    errors.push("Relocation preference is invalid.");
  }
  const knownIds = new Set<string>(JOB_SEARCH_REGION_OPTIONS.map((option) => option.regionId));
  for (const id of [...input.preferredRegionIds, ...input.acceptableRegionIds]) {
    if (!knownIds.has(id)) errors.push("A selected working region is invalid.");
  }
  if (new Set(input.preferredRegionIds).size !== input.preferredRegionIds.length) errors.push("Preferred regions contain a duplicate.");
  if (new Set(input.acceptableRegionIds).size !== input.acceptableRegionIds.length) errors.push("Acceptable regions contain a duplicate.");
  if (input.preferredRegionIds.some((id) => input.acceptableRegionIds.includes(id))) errors.push("A region cannot be both preferred and additionally acceptable.");
  return errors;
}

function recordFromInput(input: {
  preferredRegionIds: readonly string[];
  acceptableRegionIds: readonly string[];
  remote: "ACCEPT" | "DECLINE" | "UNKNOWN";
  hybrid: "ACCEPT" | "DECLINE" | "UNKNOWN";
  onsite: "ACCEPT" | "DECLINE" | "UNKNOWN";
  relocation: "REQUIRED" | "NOT_REQUIRED" | "UNKNOWN";
  capturedAt: string;
}): JobSearchPreferenceAuthorityRecord {
  const geography: JobSearchGeographyPreference = {
    resolution: "EXPLICIT",
    preferredRegions: selectedRegions(input.preferredRegionIds, "PREFERRED"),
    acceptableRegions: selectedRegions(input.acceptableRegionIds, "ACCEPTABLE"),
    remote: input.remote,
    hybrid: input.hybrid,
    onsite: input.onsite,
    relocation: input.relocation,
  };
  return {
    schemaVersion: JOB_SEARCH_PREFERENCES_SCHEMA_VERSION,
    version: JOB_SEARCH_PREFERENCES_VERSION,
    workspaceId: "professional",
    authority: "ROSS_OPERATOR_EXPLICIT",
    provenance: "Ross explicitly saved these job-search preferences from the CareerOS Professional workspace.",
    capturedAt: input.capturedAt,
    geography,
    unresolvedQuestions: [],
    limitations: [
      "Preferences govern job-search presentation and compatibility only; they do not mutate CareerFact, CareerEvidence, opportunities, or workflow history.",
      "Unknown opportunity location or work arrangement remains UNKNOWN.",
    ],
    workflowDecisionsDoNotMutatePreferences: true,
    careerFactAndEvidenceSeparate: true,
  };
}

function writePrivateJson(filePath: string, value: unknown) {
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  chmodSync(path.dirname(filePath), 0o700);
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  chmodSync(filePath, 0o600);
}

function readStoredPreference(filePath: string): JobSearchPreferenceAuthorityRecord | null {
  if (!existsSync(filePath)) return null;
  try {
    const value = JSON.parse(readFileSync(filePath, "utf8")) as Partial<JobSearchPreferenceAuthorityRecord>;
    if (value.schemaVersion !== JOB_SEARCH_PREFERENCES_SCHEMA_VERSION || value.workspaceId !== "professional") return null;
    if (value.authority !== "ROSS_OPERATOR_EXPLICIT" || value.geography?.resolution !== "EXPLICIT") return null;
    return value as JobSearchPreferenceAuthorityRecord;
  } catch {
    return null;
  }
}

export function loadJobSearchPreferences(options: PreferenceStorageOptions = {}) {
  return readStoredPreference(currentPath(options)) || EMPTY_JOB_SEARCH_PREFERENCES;
}

export function saveJobSearchPreferences(input: {
  preferredRegionIds: readonly string[];
  acceptableRegionIds: readonly string[];
  remote: string;
  hybrid: string;
  onsite: string;
  relocation: string;
  operatorId?: string;
  jobSearchRoot?: string;
  capturedAt?: string;
}): JobSearchPreferenceSaveResult {
  const preferredRegionIds = [...input.preferredRegionIds].map(text).filter(Boolean);
  const acceptableRegionIds = [...input.acceptableRegionIds].map(text).filter(Boolean);
  const remote = text(input.remote);
  const hybrid = text(input.hybrid);
  const onsite = text(input.onsite);
  const relocation = text(input.relocation);
  const errors = validateJobSearchPreferenceInput({ preferredRegionIds, acceptableRegionIds, remote, hybrid, onsite, relocation });
  if (errors.length) return { ok: false, preference: loadJobSearchPreferences(input), errors, pathsWritten: [] };

  const capturedAt = input.capturedAt || new Date().toISOString();
  const preference = recordFromInput({
    preferredRegionIds,
    acceptableRegionIds,
    remote: remote as "ACCEPT" | "DECLINE" | "UNKNOWN",
    hybrid: hybrid as "ACCEPT" | "DECLINE" | "UNKNOWN",
    onsite: onsite as "ACCEPT" | "DECLINE" | "UNKNOWN",
    relocation: relocation as "REQUIRED" | "NOT_REQUIRED" | "UNKNOWN",
    capturedAt,
  });
  const preferencePath = currentPath(input);
  const auditPath = eventsPath(input);
  const previous = loadJobSearchPreferences(input);
  const event = {
    eventType: "JOB_SEARCH_PREFERENCES_SAVED",
    eventVersion: "CAREEROS_V1.19C",
    occurredAt: capturedAt,
    operatorAuthority: "ROSS_OPERATOR_EXPLICIT",
    operatorId: input.operatorId || "ROSS",
    preferenceSchemaVersion: JOB_SEARCH_PREFERENCES_SCHEMA_VERSION,
    previousStateDigest: createHash("sha256").update(JSON.stringify(previous)).digest("hex"),
    nextStateDigest: createHash("sha256").update(JSON.stringify(preference)).digest("hex"),
    careerFactMutated: false,
    careerEvidenceMutated: false,
    workflowDecisionMutated: false,
    opportunityTruthMutated: false,
  };
  writePrivateJson(preferencePath, preference);
  mkdirSync(path.dirname(auditPath), { recursive: true, mode: 0o700 });
  appendFileSync(auditPath, `${JSON.stringify(event)}\n`, { encoding: "utf8", mode: 0o600 });
  chmodSync(auditPath, 0o600);
  return { ok: true, preference, errors: [], pathsWritten: [preferencePath, auditPath] };
}

export function preferenceStoragePaths(options: PreferenceStorageOptions = {}) {
  return { current: currentPath(options), events: eventsPath(options) };
}
