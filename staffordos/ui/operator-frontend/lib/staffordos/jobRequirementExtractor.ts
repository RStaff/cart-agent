import { createHash } from "node:crypto";
import type {
  JobExtractionMethod,
  JobRequirementCategory,
  JobRequirementLevel,
  JobRequirementReviewStatus,
  JobSearchWorkspaceId,
} from "./jobSearchContracts";

export const PRIVATE_JOB_REQUIREMENT_EXTRACTION_VERSION = "J001.03B";
export const PRIVATE_JOB_REQUIREMENT_SCHEMA_VERSION =
  "staffordos.job_search.private_requirement.v1";

export type PrivateJobRequirementSourceAuthority = "SOURCE_EXPLICIT";
export type PrivateJobRequirementRecord = {
  schemaVersion: typeof PRIVATE_JOB_REQUIREMENT_SCHEMA_VERSION;
  id: string;
  workspaceId: JobSearchWorkspaceId;
  jobOpportunityId: string;
  sourceId: string;
  requirementText: string;
  normalizedRequirement: string;
  requirementCategory: JobRequirementCategory;
  requirementLevel: JobRequirementLevel;
  importanceClassification: "Required" | "Preferred" | "Informational" | "Unclear";
  evidenceExpectation: string;
  yearsMentioned: number | null;
  degreeMentioned: string | null;
  certificationMentioned: string | null;
  technologyOrSkill: string | null;
  responsibilityOrQualification: string | null;
  sourceAuthority: PrivateJobRequirementSourceAuthority;
  sourceLocation: {
    sourceField: "listingText" | "sourceSummary" | "opportunityMetadata";
    lineNumber: number | null;
    sectionHint: string | null;
  };
  sourceExcerptReference: string;
  extractionMethod: JobExtractionMethod;
  extractionConfidence: "High" | "Moderate" | "Low" | "Needs review";
  operatorReviewStatus: JobRequirementReviewStatus;
  ambiguity: string | null;
  limitations: string[];
  createdAt: string;
  privateRecord: true;
  testOnly: false;
};

export type JobRequirementExtractionInput = {
  workspaceId?: JobSearchWorkspaceId;
  jobOpportunityId: string;
  sourceId: string;
  listingText?: string | null;
  sourceSummary?: string | null;
  locationText?: string | null;
  workArrangement?: string | null;
  compensationText?: string | null;
  employmentType?: string | null;
  createdAt: string;
};

type SourceUnit = {
  text: string;
  lineNumber: number;
  sectionHint: string | null;
  sourceField: "listingText" | "sourceSummary";
};

const SECTION_HINTS: Array<[RegExp, string]> = [
  [/\b(requirements?|qualifications?|what you(?:'|’)ll need|minimum qualifications?)\b/i, "requirements"],
  [/\b(preferred|nice to have|bonus|desired|plus)\b/i, "preferred"],
  [/\b(responsibilities|what you(?:'|’)ll do|role|about the role|day to day)\b/i, "responsibilities"],
  [/\b(benefits|compensation|salary|pay range)\b/i, "compensation"],
  [/\b(location|remote|hybrid|onsite|work arrangement)\b/i, "location"],
];

const TECHNOLOGY_TERMS = [
  "ai",
  "automation",
  "agent",
  "analytics",
  "api",
  "architecture",
  "cloud",
  "crm",
  "data",
  "devops",
  "etl",
  "figma",
  "jira",
  "llm",
  "machine learning",
  "ml",
  "postgres",
  "prisma",
  "product",
  "python",
  "react",
  "salesforce",
  "sql",
  "typescript",
  "workflow",
] as const;

const STOP_REQUIREMENT_LINES = [
  /^about\b/i,
  /^benefits?$/i,
  /^company\b/i,
  /^equal opportunity\b/i,
  /^how to apply\b/i,
  /^our mission\b/i,
];

const POSTING_NOISE_PATTERNS = [
  /\b(?:eeo|equal opportunity employer|affirmative action|diversity|inclusion|belonging|protected veteran|reasonable accommodation|accommodations? for applicants)\b/i,
  /\b(?:we (?:strongly )?encourage you to apply|we(?:'|’)d love to hear from you|if you(?:'|’)re passionate about .* apply)\b/i,
  /\b(?:salary|compensation|pay range|base pay|ote|on-target earnings|commission|annual bonus|bonus|equity|total rewards)\b/i,
  /\b(?:rolling basis|rolling applications?|deadline to apply|application deadline|apply (?:now|here|today)|submit (?:an|your) application|privacy (?:notice|policy)|applicant tracking system|ats notice)\b/i,
  /\b(?:how (?:we're|we are) different|why join us|why work with us|come work with us|our mission|our vision|our values|company culture|employee benefits?|parental leave|perks)\b/i,
  /\b(?:sample|example) (?:projects?|customers?|work|case studies?)\b|\b(?:these are|some of|types of) (?:the )?(?:projects?|customers?|use cases?)\b/i,
  /\b(?:camera[- ]on|onboarding|workplace policy|candidate legal notices?|privacy and ai guidelines?)\b/i,
  /\b(?:your privacy|pay transparency disclosure|pay transparency provision|examples of accommodations|we believe that everyone|we comply with)\b/i,
  /\b(?:department|requisition):\s*[^.;]+$/i,
  /(?:^|\s)#(?:li[-_]|hybrid\b|remote\b|onsite\b|hiring\b)/i,
];

const MANDATORY_LOCATION_PATTERN = /\b(?:must reside|must be located|must live|reside in|located in|based in|onsite in|on-site in|within)\b/i;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeRequirement(value: string) {
  return normalizeWhitespace(value)
    .replace(/^(?:[-*•]\s*|\d+[.)]\s*)/, "")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function requirementId(input: JobRequirementExtractionInput, requirementText: string, sourceReference: string) {
  return `privjobreq_${sha256Text(`${input.jobOpportunityId}|${input.sourceId}|${requirementText}|${sourceReference}`).slice(0, 18)}`;
}

function isLikelySectionHeader(value: string) {
  const text = normalizeRequirement(value).replace(/:$/, "");
  if (!text) return false;
  if (text.length > 80) return false;
  return /^(requirements?|qualifications?|minimum qualifications?|preferred|preferred qualifications?|nice to have|responsibilities|what you(?:'|’)ll do|what you(?:'|’)ll do at .+|who you are|role overview|about the role|about us|benefits?|compensation|salary|pay range|location|work arrangement)$/i.test(text);
}

function sectionHintFromText(value: string, current: string | null) {
  for (const [pattern, hint] of SECTION_HINTS) {
    if (pattern.test(value)) return hint;
  }
  return current;
}

function splitSourceUnits(sourceText: string | null | undefined, sourceField: "listingText" | "sourceSummary") {
  const units: SourceUnit[] = [];
  if (!sourceText || !sourceText.trim()) return units;

  let currentSection: string | null = null;
  const lines = sourceText
    .split(/\r?\n/)
    .map((line, index) => ({ raw: line, lineNumber: index + 1 }));

  for (const line of lines) {
    const normalized = normalizeRequirement(line.raw);
    if (!normalized) continue;

    const possibleSection = sectionHintFromText(normalized, currentSection);
    if (isLikelySectionHeader(normalized)) {
      currentSection = possibleSection;
      continue;
    }

    currentSection = possibleSection;

    const parts = normalized
      .split(/(?:\s[•]\s|;\s+|\s\|\s)/)
      .map((part) => normalizeRequirement(part))
      .filter(Boolean);

    for (const part of parts) {
      if (part.length < 4 || STOP_REQUIREMENT_LINES.some((pattern) => pattern.test(part))) continue;
      units.push({
        text: part,
        lineNumber: line.lineNumber,
        sectionHint: currentSection,
        sourceField,
      });
    }
  }

  return units;
}

function detectYears(value: string) {
  const match = value.match(/\b(\d{1,2})\+?\s*(?:years?|yrs?)\b/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

function detectDegree(value: string) {
  const match = value.match(/\b(bachelor'?s?|master'?s?|mba|phd|doctorate|degree)\b[^.;,]*/i);
  return match ? normalizeWhitespace(match[0]) : null;
}

function detectCertification(value: string) {
  const match = value.match(/\b(certification|certified|pmp|scrum master|csm|cspo|aws certified|gcp certified|azure certified)\b[^.;,]*/i);
  return match ? normalizeWhitespace(match[0]) : null;
}

function detectTechnologyOrSkill(value: string) {
  const lower = value.toLowerCase();
  const found = TECHNOLOGY_TERMS.find((term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(lower));
  return found || null;
}

function hasRequirementCue(value: string, sectionHint: string | null) {
  if (sectionHint === "requirements" || sectionHint === "preferred" || sectionHint === "responsibilities") return true;
  return /\b(must|required|requirement|qualified|experience|years?|proficien|ability to|responsible for|you will|preferred|nice to have|bonus|desired|degree|certification|remote|hybrid|salary|compensation|travel|authorized|eligible)\b/i.test(value);
}

function isPostingNoise(value: string, sectionHint: string | null) {
  if (POSTING_NOISE_PATTERNS.some((pattern) => pattern.test(value))) return true;

  const locationMetadata = /\b(?:location|remote|hybrid|onsite|on-site|office|work arrangement)\b/i.test(value);
  if (locationMetadata && !MANDATORY_LOCATION_PATTERN.test(value) &&
      (sectionHint === "location" || /^(?:location|remote|hybrid|onsite|on-site|office|work arrangement)\b/i.test(value))) return true;

  return false;
}

function classifyLevel(value: string, sectionHint: string | null): JobRequirementLevel {
  if (/\b(preferred|nice to have|bonus|desired|plus)\b/i.test(value) || sectionHint === "preferred") return "PREFERRED";
  if (/\b(responsible for|responsibilities|you will|own\b|lead\b|manage\b|partner with|collaborate)\b/i.test(value) || sectionHint === "responsibilities") return "RESPONSIBILITY";
  if (/\b(must|required|minimum|required qualifications?|need to have|qualified candidates? will)\b/i.test(value) || sectionHint === "requirements") return "REQUIRED";
  if (/\b(location|remote|hybrid|onsite|salary|compensation|employment type|travel)\b/i.test(value)) return "INFORMATIONAL";
  return "UNCLEAR";
}

function classifyImportance(level: JobRequirementLevel) {
  if (level === "REQUIRED") return "Required" as const;
  if (level === "PREFERRED" || level === "DESIRED") return "Preferred" as const;
  if (level === "INFORMATIONAL") return "Informational" as const;
  return "Unclear" as const;
}

function classifyCategory(value: string, level: JobRequirementLevel, sectionHint: string | null): JobRequirementCategory {
  if (/\b(salary|compensation|pay range|bonus|equity)\b/i.test(value)) return "Compensation";
  if (/\b(remote|hybrid|onsite|location|relocat|work arrangement)\b/i.test(value)) return "Location or work arrangement";
  if (/\b(travel)\b/i.test(value)) return "Travel";
  if (/\b(authorized|authorization|visa|sponsorship|eligible to work|work eligibility)\b/i.test(value)) return "Legal or employment eligibility";
  if (detectCertification(value)) return "Certification";
  if (detectDegree(value)) return "Education";
  if (/\b(lead|leadership|manage|mentor|stakeholder|cross-functional|executive)\b/i.test(value)) return "Leadership";
  if (/\b(domain|industry|healthcare|finance|insurance|automotive|marketplace|saas|regulated)\b/i.test(value)) return "Domain";
  if (level === "RESPONSIBILITY" || sectionHint === "responsibilities") return "Responsibility";
  if (detectYears(value) !== null || /\bexperience\b/i.test(value)) return "Experience";
  if (level === "PREFERRED") return "Preferred skill";
  if (level === "REQUIRED") return "Required skill";
  if (detectTechnologyOrSkill(value)) return "Required skill";
  return level === "UNCLEAR" ? "Unknown" : "Other";
}

function evidenceExpectation(category: JobRequirementCategory) {
  if (category === "Compensation") return "No career evidence required; compare against Ross's compensation constraints when known.";
  if (category === "Location or work arrangement") return "Confirm against Ross's location and work-arrangement constraints.";
  if (category === "Legal or employment eligibility") return "Requires Ross confirmation; do not infer eligibility.";
  if (category === "Education" || category === "Certification") return "Requires official or operator-confirmed credential evidence.";
  if (category === "Experience") return "Requires evidence-backed scope, duration, and context.";
  if (category === "Leadership" || category === "Responsibility") return "Requires evidence-backed examples and careful role/context wording.";
  return "Requires mapped CareerFact and CareerEvidence before use in resume positioning.";
}

function ambiguityFor(value: string, level: JobRequirementLevel) {
  const ambiguity: string[] = [];
  if (level === "UNCLEAR") ambiguity.push("Listing wording does not say whether this is required or preferred.");
  if (/\b(familiar|comfortable|strong|deep|proven|excellent)\b/i.test(value)) {
    ambiguity.push("Listing uses qualitative proficiency wording that StaffordOS must not convert into years or seniority.");
  }
  if (/\b(experience with|knowledge of)\b/i.test(value) && detectYears(value) === null) {
    ambiguity.push("Listing mentions experience without an explicit duration.");
  }
  return ambiguity.length ? ambiguity.join(" ") : null;
}

function requirementConfidence(value: string, level: JobRequirementLevel) {
  if (level === "UNCLEAR") return "Needs review" as const;
  if (/\b(must|required|preferred|responsible|you will|salary|compensation|remote|hybrid|degree|certification)\b/i.test(value)) return "High" as const;
  return "Moderate" as const;
}

function buildRequirement(input: JobRequirementExtractionInput, unit: SourceUnit): PrivateJobRequirementRecord | null {
  const requirementText = normalizeRequirement(unit.text);
  if (!requirementText || isPostingNoise(requirementText, unit.sectionHint) || !hasRequirementCue(requirementText, unit.sectionHint)) return null;

  const level = classifyLevel(requirementText, unit.sectionHint);
  const category = classifyCategory(requirementText, level, unit.sectionHint);
  const sourceExcerptReference = `${unit.sourceField}:line:${unit.lineNumber}`;
  const responsibilityOrQualification =
    category === "Responsibility" || category === "Leadership" || category === "Experience"
      ? requirementText
      : null;

  return {
    schemaVersion: PRIVATE_JOB_REQUIREMENT_SCHEMA_VERSION,
    id: requirementId(input, requirementText, sourceExcerptReference),
    workspaceId: input.workspaceId || "professional",
    jobOpportunityId: input.jobOpportunityId,
    sourceId: input.sourceId,
    requirementText,
    normalizedRequirement: requirementText.toLowerCase(),
    requirementCategory: category,
    requirementLevel: level,
    importanceClassification: classifyImportance(level),
    evidenceExpectation: evidenceExpectation(category),
    yearsMentioned: detectYears(requirementText),
    degreeMentioned: detectDegree(requirementText),
    certificationMentioned: detectCertification(requirementText),
    technologyOrSkill: detectTechnologyOrSkill(requirementText),
    responsibilityOrQualification,
    sourceAuthority: "SOURCE_EXPLICIT",
    sourceLocation: {
      sourceField: unit.sourceField,
      lineNumber: unit.lineNumber,
      sectionHint: unit.sectionHint,
    },
    sourceExcerptReference,
    extractionMethod: "DETERMINISTIC_EXTRACTION",
    extractionConfidence: requirementConfidence(requirementText, level),
    operatorReviewStatus: "Needs review",
    ambiguity: ambiguityFor(requirementText, level),
    limitations: [
      "Extracted only from explicit saved listing wording.",
      "Does not prove Ross has or lacks this requirement.",
      "Does not authorize resume wording without Career evidence mapping.",
    ],
    createdAt: input.createdAt,
    privateRecord: true,
    testOnly: false,
  };
}

export function extractPrivateJobRequirements(input: JobRequirementExtractionInput) {
  const units = [
    ...splitSourceUnits(input.listingText, "listingText"),
    ...splitSourceUnits(input.sourceSummary, "sourceSummary"),
  ];

  const requirements = units
    .map((unit) => buildRequirement(input, unit))
    .filter((requirement): requirement is PrivateJobRequirementRecord => Boolean(requirement));

  const uniqueByText = new Map<string, PrivateJobRequirementRecord>();
  for (const requirement of requirements) {
    const key = `${requirement.normalizedRequirement}|${requirement.sourceExcerptReference}`;
    if (!uniqueByText.has(key)) uniqueByText.set(key, requirement);
  }

  return [...uniqueByText.values()].sort((a, b) =>
    a.sourceExcerptReference.localeCompare(b.sourceExcerptReference) || a.requirementText.localeCompare(b.requirementText),
  );
}
