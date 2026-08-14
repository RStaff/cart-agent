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

export const JOB_SEARCH_REGION_OPTIONS = [
  {
    regionId: "boston_eastern_massachusetts",
    label: "Boston / Eastern Massachusetts",
    aliases: ["Boston", "Braintree", "Eastern Massachusetts", "Boston, Massachusetts"],
  },
  {
    regionId: "new_york_city_metro",
    label: "New York City metro",
    aliases: ["New York", "New York City", "NYC", "New York, New York"],
  },
  {
    regionId: "northern_new_jersey",
    label: "Northern New Jersey",
    aliases: ["Short Hills", "Northern New Jersey", "New Jersey"],
  },
  {
    regionId: "remote_united_states",
    label: "Remote within the United States",
    aliases: ["Remote-Friendly, United States", "Remote, United States", "Remote within the United States"],
  },
] as const;

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
  relocationRequired?: boolean | null;
  qualification?: OpportunityQualification | null;
}): JobSearchCompatibilityProjection {
  const preferences = input.preferences || EMPTY_JOB_SEARCH_PREFERENCES;
  const qualificationState = input.qualification?.state || "UNKNOWN";
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
      reason: "CareerOS cannot determine whether this opportunity fits your geography because its location is unknown.",
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
      reason: "CareerOS cannot determine whether this opportunity fits your preferences because its work arrangement is unclear.",
      preferenceAuthority: preferences.authority,
      qualificationState,
      qualificationBlocks: false,
      inspectable: true,
    };
  }
  if (input.relocationRequired === true && preferences.geography.relocation === "NOT_REQUIRED") {
    return {
      state: "OUTSIDE_PREFERENCE",
      label: "Outside explicit preference",
      reason: "This role requires relocation, which is excluded by your selected preferences.",
      preferenceAuthority: preferences.authority,
      qualificationState,
      qualificationBlocks: false,
      inspectable: true,
    };
  }
  if (input.relocationRequired == null && preferences.geography.relocation !== "UNKNOWN") {
    return {
      state: "UNKNOWN",
      label: "Preference compatibility unknown",
      reason: "CareerOS cannot determine whether this role requires relocation.",
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
        ? "This work arrangement is outside your selected preferences."
        : "This location is outside your selected working regions.",
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
      ? `Matches your ${preferredRegion.label} preference and accepted work arrangement.`
      : `Matches an acceptable selected region and accepted work arrangement.`,
    preferenceAuthority: preferences.authority,
    qualificationState,
    qualificationBlocks: false,
    inspectable: true,
  };
}
