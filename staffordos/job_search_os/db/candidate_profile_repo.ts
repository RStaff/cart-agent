export const SENIORITY_LEVELS = [
  "senior",
  "staff",
  "principal",
  "director",
  "executive",
] as const;

export type CandidateSeniority = typeof SENIORITY_LEVELS[number];

export type CandidateProfileRecord = {
  id: string;
  target_roles: string[];
  salary_floor: number | null;
  preferred_locations: string[];
  seniority_level: CandidateSeniority;
  constraints: string[];
};

export type CreateCandidateProfileInput = {
  id?: string;
  target_roles?: string[];
  salary_floor?: number | string | null;
  preferred_locations?: string[];
  seniority_level?: string;
  constraints?: string[];
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function cleanSalaryFloor(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.round(numeric)) : null;
}

function cleanSeniorityLevel(value: unknown): CandidateSeniority {
  const normalized = cleanText(value).toLowerCase();
  return SENIORITY_LEVELS.includes(normalized as CandidateSeniority)
    ? (normalized as CandidateSeniority)
    : "senior";
}

export function normalizeCandidateProfile(
  input: CreateCandidateProfileInput,
): CandidateProfileRecord {
  return {
    id: cleanText(input.id) || "default_candidate_profile",
    target_roles: cleanList(input.target_roles),
    salary_floor: cleanSalaryFloor(input.salary_floor),
    preferred_locations: cleanList(input.preferred_locations),
    seniority_level: cleanSeniorityLevel(input.seniority_level),
    constraints: cleanList(input.constraints),
  };
}
