import type { OpportunityQualification } from "./opportunityQualification";

export const JOB_SEARCH_PREFERENCES_VERSION = "CAREEROS_V1.19B";
export const JOB_SEARCH_PREFERENCES_SCHEMA_VERSION =
  "staffordos.job_search.explicit_preferences.v1";

export type JobSearchPreferenceResolution = "EXPLICIT" | "UNRESOLVED";
export type JobSearchPreferenceAuthority = "ROSS_OPERATOR_EXPLICIT" | "AWAITING_ROSS_CONFIRMATION";
export type JobSearchCompatibilityState = "MATCH" | "PARTIAL_MATCH" | "OUTSIDE_PREFERENCE" | "UNKNOWN";

export type JobSearchRegionPreference = {
  regionId: string;
  label: string;
  aliases: string[];
  preference: "PREFERRED" | "ACCEPTABLE";
};

export type JobSearchGeographyPreference = {
  resolution: JobSearchPreferenceResolution;
  preferredRegions: JobSearchRegionPreference[];
  acceptableRegions: JobSearchRegionPreference[];
  remote: "ACCEPT" | "DECLINE" | "UNKNOWN";
  hybrid: "ACCEPT" | "DECLINE" | "UNKNOWN";
  onsite: "ACCEPT" | "DECLINE" | "UNKNOWN";
  relocation: "REQUIRED" | "NOT_REQUIRED" | "UNKNOWN";
};

export type JobSearchPreferenceAuthorityRecord = {
  schemaVersion: typeof JOB_SEARCH_PREFERENCES_SCHEMA_VERSION;
  version: typeof JOB_SEARCH_PREFERENCES_VERSION;
  workspaceId: "professional";
  authority: JobSearchPreferenceAuthority;
  provenance: string;
  capturedAt: string | null;
  geography: JobSearchGeographyPreference;
  unresolvedQuestions: string[];
  limitations: string[];
  workflowDecisionsDoNotMutatePreferences: true;
  careerFactAndEvidenceSeparate: true;
};

export type JobSearchCompatibilityProjection = {
  state: JobSearchCompatibilityState;
  label: "Matches explicit preference" | "Partially matches explicit preference" | "Outside explicit preference" | "Preference compatibility unknown";
  reason: string;
  preferenceAuthority: JobSearchPreferenceAuthority;
  qualificationState: OpportunityQualification["state"] | "UNKNOWN";
  qualificationBlocks: boolean;
  inspectable: true;
};

export const EMPTY_JOB_SEARCH_PREFERENCES: JobSearchPreferenceAuthorityRecord = {
  schemaVersion: JOB_SEARCH_PREFERENCES_SCHEMA_VERSION,
  version: JOB_SEARCH_PREFERENCES_VERSION,
  workspaceId: "professional",
  authority: "AWAITING_ROSS_CONFIRMATION",
  provenance: "No explicit Ross job-search preference authority is present in current repository or private runtime artifacts.",
  capturedAt: null,
  geography: {
    resolution: "UNRESOLVED",
    preferredRegions: [],
    acceptableRegions: [],
    remote: "UNKNOWN",
    hybrid: "UNKNOWN",
    onsite: "UNKNOWN",
    relocation: "UNKNOWN",
  },
  unresolvedQuestions: [
    "Which working regions are preferred for Ross's job search?",
    "Which additional working regions are acceptable?",
    "Is fully remote work acceptable?",
    "Is hybrid work acceptable, and under what location constraints?",
    "Is on-site work acceptable, and under what location constraints?",
    "Should a role requiring relocation be considered, or should relocation be excluded?",
  ],
  limitations: [
    "This unresolved authority is a job-search preference, not CareerFact, CareerEvidence, qualification, or workflow history.",
    "No geography filtering or preference learning is active while operator values remain unresolved.",
  ],
  workflowDecisionsDoNotMutatePreferences: true,
  careerFactAndEvidenceSeparate: true,
};

function normalized(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function arrangementState(workArrangement: string | null | undefined) {
  const value = normalized(workArrangement);
  if (!value) return "UNKNOWN" as const;
  if (value.includes("remote")) return "REMOTE" as const;
  if (value.includes("hybrid")) return "HYBRID" as const;
  if (value.includes("on-site") || value.includes("onsite") || value.includes("on site")) return "ONSITE" as const;
  return "UNKNOWN" as const;
}

function regionMatch(location: string, region: JobSearchRegionPreference) {
  const haystack = normalized(location);
  return [region.label, ...region.aliases].some((value) => value.trim() && haystack.includes(normalized(value)));
}

export function projectJobSearchCompatibility(input: {
  preferences?: JobSearchPreferenceAuthorityRecord | null;
  location?: string | null;
  workArrangement?: string | null;
  qualification?: OpportunityQualification | null;
}): JobSearchCompatibilityProjection {
  const preferences = input.preferences || EMPTY_JOB_SEARCH_PREFERENCES;
  const qualificationState = input.qualification?.state || "UNKNOWN";
  if (qualificationState === "HARD_MISMATCH") {
    return {
      state: "UNKNOWN",
      label: "Preference compatibility unknown",
      reason: "Geography preference values are unresolved; qualification authority independently blocks this opportunity as a hard mismatch.",
      preferenceAuthority: preferences.authority,
      qualificationState,
      qualificationBlocks: true,
      inspectable: true,
    };
  }
  if (preferences.geography.resolution !== "EXPLICIT") {
    return {
      state: "UNKNOWN",
      label: "Preference compatibility unknown",
      reason: "Ross has not explicitly confirmed job-search geography and work-arrangement preferences.",
      preferenceAuthority: preferences.authority,
      qualificationState,
      qualificationBlocks: false,
      inspectable: true,
    };
  }

  const location = (input.location || "").trim();
  const arrangement = arrangementState(input.workArrangement);
  if (!location) {
    return {
      state: "UNKNOWN",
      label: "Preference compatibility unknown",
      reason: "The opportunity has no authoritative location; work arrangement alone is insufficient to establish geography compatibility.",
      preferenceAuthority: preferences.authority,
      qualificationState,
      qualificationBlocks: false,
      inspectable: true,
    };
  }

  const preferredRegion = preferences.geography.preferredRegions.find((region) => regionMatch(location, region));
  const acceptableRegion = preferences.geography.acceptableRegions.find((region) => regionMatch(location, region));
  const arrangementPreference = arrangement === "REMOTE"
    ? preferences.geography.remote
    : arrangement === "HYBRID"
      ? preferences.geography.hybrid
      : arrangement === "ONSITE"
        ? preferences.geography.onsite
        : "UNKNOWN";
  if (arrangement === "UNKNOWN" || arrangementPreference === "UNKNOWN") {
    return {
      state: "UNKNOWN",
      label: "Preference compatibility unknown",
      reason: "The opportunity's location or work arrangement cannot be compared to an explicit preference.",
      preferenceAuthority: preferences.authority,
      qualificationState,
      qualificationBlocks: false,
      inspectable: true,
    };
  }
  if (arrangementPreference === "DECLINE" || (!preferredRegion && !acceptableRegion && location)) {
    return {
      state: "OUTSIDE_PREFERENCE",
      label: "Outside explicit preference",
      reason: arrangementPreference === "DECLINE"
        ? "The explicit work-arrangement preference declines this arrangement."
        : "The authoritative opportunity location does not match a preferred or acceptable region.",
      preferenceAuthority: preferences.authority,
      qualificationState,
      qualificationBlocks: false,
      inspectable: true,
    };
  }
  return {
    state: preferredRegion ? "MATCH" : "PARTIAL_MATCH",
    label: preferredRegion ? "Matches explicit preference" : "Partially matches explicit preference",
    reason: preferredRegion
      ? "The opportunity matches an explicitly preferred region and accepted work arrangement."
      : "The opportunity matches an explicitly acceptable region and accepted work arrangement.",
    preferenceAuthority: preferences.authority,
    qualificationState,
    qualificationBlocks: false,
    inspectable: true,
  };
}
