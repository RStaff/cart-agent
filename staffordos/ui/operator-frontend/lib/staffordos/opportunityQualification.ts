import type { PrivateRequirementEvidenceMapping } from "./candidateEvidenceMapper";
import type { PrivateJobRequirementRecord } from "./jobRequirementExtractor";

export const OPPORTUNITY_QUALIFICATION_VERSION = "J010.01";

export type OpportunityQualificationState =
  | "HARD_MISMATCH"
  | "TRANSFERABLE_BUT_NOT_DIRECT"
  | "PLAUSIBLE_TARGET"
  | "INSUFFICIENT_EVIDENCE";

export type OpportunityQualification = {
  state: OpportunityQualificationState;
  reasons: string[];
  hardMismatchCategories: string[];
  limitations: string[];
};

type QualificationInput = {
  role: string;
  laneDisposition?: string | null;
  totalScore: number;
  requirements: readonly PrivateJobRequirementRecord[];
  mappings: readonly PrivateRequirementEvidenceMapping[];
};

const TARGET_ROLE_PATTERNS = /\b(ai|automation|agent|business systems?|business technolog|marketing technolog|crm|salesforce|workflow|product|technical program|technical product|revops|governance|platform operations|digital transformation)\b/i;
const LEGAL_ROLE_PATTERN = /\b(counsel|attorney|lawyer|legal)\b/i;
const MEDICAL_ROLE_PATTERN = /\b(physician|doctor|nurse|clinical|medical|therapist|pharmac|dentist)\b/i;
const SPECIALIST_ENGINEERING_PATTERN = /\b(infrastructure|kernel|systems|sandbox|site reliability|sre|devops|embedded|firmware|compiler|machine learning engineer|software engineer|software engineering|engineering manager|applied ai engineer|security governance.*risk engineer|research scientist|ai research scientist|ai applications ops|physical ai)\b/i;
const UNRELATED_FUNCTION_PATTERN = /\b(cash manager|treasury|controller|accountant|accounting|financial analyst|investment|recruiter|sales representative)\b/i;
const SPECIALIST_REQUIREMENT_PATTERN = /\b(?:software engineering|production[- ]grade (?:applications?|systems?)|strong programming|strong background in distributed|deep learning models?|hands[- ]on (?:coding|engineering)|data structures|algorithms|system design|kernel|firecracker|gvisor|qemu|kata|kubernetes|docker|distributed systems|low[- ]level|embedded|firmware|mlops|site reliability|sre|devops|terraform|infrastructure as code|gpu|cuda|reinforcement learning|robotics|autonomous systems|computer vision|foundation models?|distributed training|research publications?|top[- ]tier conferences?|phd in (?:computer science|machine learning)|cyber risk quantification|risk engineering|penetration testing|vulnerability management|high[- ]performing engineering teams|hiring.*engineering teams)\b/i;
const SECURITY_SPECIALIST_REQUIREMENT_PATTERN = /\b(?:security frameworks?|risk engineering|risk quantification|vulnerability management|security tooling|security controls|cyber risk|second line of defense)\b/i;

function mappingFor(requirement: PrivateJobRequirementRecord, mappings: readonly PrivateRequirementEvidenceMapping[]) {
  return mappings.find((mapping) => mapping.requirementId === requirement.id) || null;
}

function supported(mapping: PrivateRequirementEvidenceMapping | null) {
  return mapping?.classification === "PROVEN" || mapping?.classification === "PARTIAL";
}

function required(requirement: PrivateJobRequirementRecord) {
  return requirement.requirementLevel === "REQUIRED" || requirement.importanceClassification === "Required";
}

function matches(text: string, pattern: RegExp) {
  return pattern.test(text);
}

function hardRequirement(
  requirements: readonly PrivateJobRequirementRecord[],
  pattern: RegExp,
  label: string,
) {
  return requirements.find((requirement) => required(requirement) && matches(requirement.requirementText, pattern))
    ? label
    : null;
}

function hasUnsupportedRequiredRequirement(
  requirements: readonly PrivateJobRequirementRecord[],
  mappings: readonly PrivateRequirementEvidenceMapping[],
  predicate: (requirement: PrivateJobRequirementRecord) => boolean,
) {
  return requirements.some((requirement) => required(requirement) && predicate(requirement) && !supported(mappingFor(requirement, mappings)));
}

function hasTransferableSupport(mappings: readonly PrivateRequirementEvidenceMapping[]) {
  return mappings.some((mapping) => mapping.classification === "TRANSFERABLE" || mapping.classification === "PARTIAL" || mapping.classification === "PROVEN");
}

function hasRelevantSupport(mappings: readonly PrivateRequirementEvidenceMapping[], pattern: RegExp) {
  return mappings.some((mapping) =>
    (mapping.classification === "TRANSFERABLE" || mapping.classification === "PARTIAL" || mapping.classification === "PROVEN") &&
    pattern.test(`${mapping.explanation} ${mapping.safePositioning} ${(mapping.matchedSignals || []).join(" ")}`),
  );
}

function hasDirectSpecialistSupport(mappings: readonly PrivateRequirementEvidenceMapping[]) {
  return mappings.some((mapping) =>
    (mapping.classification === "PROVEN" || mapping.classification === "PARTIAL") &&
    SPECIALIST_REQUIREMENT_PATTERN.test(`${mapping.explanation} ${mapping.safePositioning} ${(mapping.matchedSignals || []).join(" ")}`),
  );
}

export function qualifyOpportunity(input: QualificationInput): OpportunityQualification {
  const role = input.role || "";
  const requirementText = input.requirements.map((requirement) => requirement.requirementText).join(" ");
  const allText = `${role} ${requirementText}`;
  const hardMismatchCategories: string[] = [];
  const reasons: string[] = [];

  if (matches(role, LEGAL_ROLE_PATTERN) && input.requirements.some((requirement) =>
    matches(requirement.requirementText, /\b(j\.?\s*d\.?|juris doctor|bar admission|barred|attorney|law degree|legal license)\b/i) &&
    !supported(mappingFor(requirement, input.mappings)))) {
    hardMismatchCategories.push("legal qualification");
    reasons.push("The role requires a legal qualification that is not supported by confirmed career evidence.");
  }

  if (matches(role, MEDICAL_ROLE_PATTERN) && hasUnsupportedRequiredRequirement(input.requirements, input.mappings, (requirement) =>
    matches(requirement.requirementText, /\b(license|licensure|licensed|board certified|clinical credential|medical degree)\b/i))) {
    hardMismatchCategories.push("medical licensure");
    reasons.push("The role requires a medical or clinical qualification that is not supported by confirmed career evidence.");
  }

  if (hasUnsupportedRequiredRequirement(input.requirements, input.mappings, (requirement) =>
    matches(requirement.requirementText, /\b(security clearance|secret clearance|top secret|ts\/sci|clearable)\b/i))) {
    hardMismatchCategories.push("security clearance");
    reasons.push("A required security clearance is not supported by confirmed eligibility evidence.");
  }

  if (hasUnsupportedRequiredRequirement(input.requirements, input.mappings, (requirement) =>
    requirement.requirementCategory === "Certification" || matches(requirement.requirementText, /\b(certification|certified|pmp|scrum master|csm|cspo|license|licensure)\b/i))) {
    hardMismatchCategories.push("mandatory certification");
    reasons.push("A mandatory professional certification or license is not supported by confirmed career evidence.");
  }

  if (hasUnsupportedRequiredRequirement(input.requirements, input.mappings, (requirement) =>
    matches(requirement.requirementText, /\b(must be located|must reside|onsite in|on-site in|based in|located in)\b/i) &&
    matches(requirement.requirementText, /\b(outside the united states|europe|uk|london|new york|san francisco)\b/i))) {
    hardMismatchCategories.push("mandatory location");
    reasons.push("The listing contains a mandatory location requirement that is not compatible with the known search boundary.");
  }

  if (matches(role, SPECIALIST_ENGINEERING_PATTERN) &&
      input.requirements.some((requirement) => matches(requirement.requirementText, SPECIALIST_REQUIREMENT_PATTERN)) &&
      !hasDirectSpecialistSupport(input.mappings)) {
    hardMismatchCategories.push("specialized engineering function");
    reasons.push("The role requires deep specialist engineering experience without confirmed or transferable support.");
  }

  if (matches(role, SPECIALIST_ENGINEERING_PATTERN) &&
      input.requirements.some((requirement) => matches(requirement.requirementText, SECURITY_SPECIALIST_REQUIREMENT_PATTERN)) &&
      !hasDirectSpecialistSupport(input.mappings)) {
    hardMismatchCategories.push("specialized security or risk engineering function");
    reasons.push("The role requires specialized security or risk-engineering history without direct supporting evidence.");
  }

  if (matches(role, /\b(?:research scientist|ai research|robotics|autonomous systems)\b/i) &&
      input.requirements.some((requirement) => required(requirement) && matches(requirement.requirementText, /\b(?:research|reinforcement learning|gpu|cuda|distributed training|robotics|computer vision|publication|foundation model)\b/i)) &&
      !hasDirectSpecialistSupport(input.mappings)) {
    hardMismatchCategories.push("specialized research or advanced engineering function");
    reasons.push("The role requires specialized research or advanced engineering history without direct supporting evidence.");
  }

  if (matches(role, UNRELATED_FUNCTION_PATTERN) && !matches(role, TARGET_ROLE_PATTERNS) && !hasRelevantSupport(input.mappings, /\b(treasury|cash|finance|accounting|recruit|sales)\b/i)) {
    hardMismatchCategories.push("incompatible role family");
    reasons.push("The role family is outside the confirmed target lanes and has no meaningful transferable support.");
  }

  if (hardMismatchCategories.length) {
    return {
      state: "HARD_MISMATCH",
      reasons,
      hardMismatchCategories,
      limitations: ["Hard mismatch is used only for explicit mandatory requirements or clear role-family incompatibility; unknown evidence alone is not a hard mismatch."],
    };
  }

  const support = hasTransferableSupport(input.mappings);
  if (support && matches(allText, TARGET_ROLE_PATTERNS)) {
    return {
      state: input.mappings.some((mapping) => mapping.classification === "PROVEN" || mapping.classification === "PARTIAL") ? "PLAUSIBLE_TARGET" : "TRANSFERABLE_BUT_NOT_DIRECT",
      reasons: ["The target lane is supported by confirmed or transferable experience; exact title history is not required."],
      hardMismatchCategories: [],
      limitations: ["Transferable support does not prove every requirement is met; Ross should review the requirement-level evidence."],
    };
  }

  return {
    state: input.requirements.length || input.mappings.length ? "INSUFFICIENT_EVIDENCE" : "INSUFFICIENT_EVIDENCE",
    reasons: ["The available job requirements and career evidence do not establish a sufficiently qualified target match."],
    hardMismatchCategories: [],
    limitations: ["Insufficient evidence is preserved as uncertainty and is not treated as proof that Ross lacks the experience."],
  };
}

export function shortlistOpportunity(input: {
  recommendation: "APPLY_NOW" | "REVIEW" | "WAIT" | "SKIP";
  qualification: OpportunityQualification;
  totalScore: number;
  supportingEvidenceCount: number;
  role: string;
}) {
  if (input.qualification.state === "HARD_MISMATCH" || input.recommendation === "WAIT" || input.recommendation === "SKIP") return false;
  if (input.recommendation === "APPLY_NOW") return true;
  return input.supportingEvidenceCount >= 2 && (input.totalScore >= 30 || matches(input.role, TARGET_ROLE_PATTERNS));
}
