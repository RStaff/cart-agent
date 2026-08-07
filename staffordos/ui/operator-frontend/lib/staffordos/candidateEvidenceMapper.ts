import type { CareerEvidence, CareerFact } from "./careerEvidenceContracts";
import type { PrivateJobRequirementRecord } from "./jobRequirementExtractor";

export const CANDIDATE_EVIDENCE_MAPPING_VERSION = "J001.03A";
export const CANDIDATE_EVIDENCE_MAPPING_SCHEMA_VERSION =
  "staffordos.job_search.private_requirement_evidence_mapping.v1";

export const REQUIREMENT_EVIDENCE_CLASSIFICATIONS = [
  "PROVEN",
  "PARTIAL",
  "TRANSFERABLE",
  "MISSING",
  "UNKNOWN",
] as const;

export type RequirementEvidenceClassification = (typeof REQUIREMENT_EVIDENCE_CLASSIFICATIONS)[number];

export type PrivateRequirementEvidenceMapping = {
  schemaVersion: typeof CANDIDATE_EVIDENCE_MAPPING_SCHEMA_VERSION;
  id: string;
  requirementId: string;
  jobOpportunityId: string;
  careerFactIds: string[];
  careerEvidenceIds: string[];
  classification: RequirementEvidenceClassification;
  explanation: string;
  supportLimitations: string[];
  verificationStatus: string;
  conflictStatus: "NO_CONFLICT" | "CONFLICT_REQUIRES_REVIEW" | "UNKNOWN";
  operatorReviewRequirement: string;
  safePositioning: string;
  prohibitedOverstatement: string[];
  matchedSignals: string[];
  createdAt: string;
  privateRecord: true;
  testOnly: false;
};

export type RequirementEvidenceMappingInput = {
  requirements: readonly PrivateJobRequirementRecord[];
  careerFacts: readonly Partial<CareerFact>[];
  careerEvidence: readonly Partial<CareerEvidence>[];
  createdAt: string;
};

const STOPWORDS = new Set([
  "and",
  "are",
  "for",
  "from",
  "have",
  "into",
  "must",
  "our",
  "the",
  "this",
  "that",
  "with",
  "will",
  "you",
  "your",
  "years",
  "experience",
  "ability",
  "work",
  "team",
  "role",
  "required",
  "preferred",
]);

function tokenize(value: unknown) {
  if (typeof value !== "string") return [];
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

function factText(fact: Partial<CareerFact>) {
  return [
    fact.statement,
    fact.normalizedStatement,
    fact.factType,
    fact.classification,
    fact.technologyOrSkill,
    fact.authorityClassification,
    fact.experienceClassification,
  ]
    .filter(Boolean)
    .join(" ");
}

function evidenceText(evidence: Partial<CareerEvidence>) {
  return [evidence.title, evidence.summary, evidence.excerptReference, evidence.authorityClassification]
    .filter(Boolean)
    .join(" ");
}

function sourceEvidenceIds(fact: Partial<CareerFact>) {
  const ids = new Set<string>();
  const sourceIds = (fact as { sourceEvidenceIds?: unknown }).sourceEvidenceIds;
  const sourceId = (fact as { sourceEvidenceId?: unknown }).sourceEvidenceId;
  if (Array.isArray(sourceIds)) {
    for (const id of sourceIds) if (typeof id === "string" && id) ids.add(id);
  }
  if (typeof sourceId === "string" && sourceId) ids.add(sourceId);
  return [...ids];
}

function relatedEvidence(facts: readonly Partial<CareerFact>[], evidence: readonly Partial<CareerEvidence>[]) {
  const ids = new Set<string>();
  for (const fact of facts) {
    for (const id of sourceEvidenceIds(fact)) ids.add(id);
  }
  return evidence.filter((item) => typeof item.id === "string" && ids.has(item.id));
}

function scoreFact(requirement: PrivateJobRequirementRecord, fact: Partial<CareerFact>) {
  const requirementTokens = new Set([
    ...tokenize(requirement.requirementText),
    ...tokenize(requirement.technologyOrSkill),
    ...tokenize(requirement.requirementCategory),
  ]);
  const factTokens = new Set(tokenize(factText(fact)));
  let score = 0;
  const signals: string[] = [];

  for (const token of requirementTokens) {
    if (factTokens.has(token)) {
      score += 1;
      signals.push(token);
    }
  }

  if (requirement.technologyOrSkill && fact.technologyOrSkill) {
    const reqSkill = requirement.technologyOrSkill.toLowerCase();
    const factSkill = String(fact.technologyOrSkill).toLowerCase();
    if (reqSkill === factSkill || factSkill.includes(reqSkill) || reqSkill.includes(factSkill)) {
      score += 4;
      signals.push(requirement.technologyOrSkill);
    }
  }

  if (requirement.requirementCategory === "Leadership" && fact.factType === "LEADERSHIP") score += 3;
  if (requirement.requirementCategory === "Education" && fact.factType === "EDUCATION") score += 3;
  if (requirement.requirementCategory === "Certification" && fact.factType === "CERTIFICATION") score += 3;
  if (requirement.requirementCategory === "Domain" && fact.factType === "PRODUCT") score += 2;
  if (requirement.requirementCategory === "Responsibility" && fact.factType === "PROJECT") score += 1;

  return { fact, score, signals: unique(signals).slice(0, 8) };
}

function hasResumeOnlyEvidence(evidenceRecords: readonly Partial<CareerEvidence>[]) {
  return (
    evidenceRecords.length > 0 &&
    evidenceRecords.every(
      (evidence) =>
        evidence.evidenceType === "RESUME" ||
        evidence.sourceType === "RESUME" ||
        evidence.authorityClassification === "GENERATED_DOCUMENT",
    )
  );
}

function hasConflict(facts: readonly Partial<CareerFact>[], evidenceRecords: readonly Partial<CareerEvidence>[]) {
  return (
    facts.some(
      (fact) =>
        fact.verificationStatus === "CONFLICTING" ||
        (Array.isArray(fact.conflictTypes) && fact.conflictTypes.length > 0) ||
        (Array.isArray(fact.conflictingEvidenceIds) && fact.conflictingEvidenceIds.length > 0),
    ) || evidenceRecords.some((evidence) => Array.isArray(evidence.challengesFactIds) && evidence.challengesFactIds.length > 0)
  );
}

function directlySupportsRequirement(requirement: PrivateJobRequirementRecord, fact: Partial<CareerFact>) {
  if (fact.factType === "CERTIFICATION") {
    return (
      requirement.requirementCategory === "Certification" ||
      Boolean(requirement.certificationMentioned) ||
      /\b(certification|certified|credential|pmp|project management professional)\b/i.test(requirement.requirementText)
    );
  }
  if (fact.factType === "EDUCATION") {
    return requirement.requirementCategory === "Education" || Boolean(requirement.degreeMentioned) || /\b(degree|education|master|bachelor)\b/i.test(requirement.requirementText);
  }
  return true;
}

function hasVerifiedSupport(requirement: PrivateJobRequirementRecord, facts: readonly Partial<CareerFact>[], evidenceRecords: readonly Partial<CareerEvidence>[]) {
  return (
    facts.some((fact) => fact.verificationStatus === "VERIFIED" && directlySupportsRequirement(requirement, fact)) &&
    evidenceRecords.length > 0 &&
    !hasResumeOnlyEvidence(evidenceRecords)
  );
}

function hasPartialSupport(facts: readonly Partial<CareerFact>[], evidenceRecords: readonly Partial<CareerEvidence>[]) {
  return (
    evidenceRecords.length > 0 &&
    facts.some((fact) => {
      const explicitlyTransferable =
        fact.supportLevel === "TRANSFERABLE" || fact.experienceClassification === "TRANSFERABLE";
      const operatorReviewStatus = (fact as { operatorReviewStatus?: unknown }).operatorReviewStatus;
      if (explicitlyTransferable) return false;
      return (
        fact.verificationStatus === "PARTIALLY_SUPPORTED" ||
        fact.supportLevel === "PARTIAL" ||
        (!explicitlyTransferable && operatorReviewStatus === "Ross confirmed")
      );
    })
  );
}

function hasTransferableSupport(requirement: PrivateJobRequirementRecord, facts: readonly Partial<CareerFact>[], evidenceRecords: readonly Partial<CareerEvidence>[]) {
  if (!facts.length || !evidenceRecords.length) return false;
  if (requirement.requirementCategory === "Compensation" || requirement.requirementCategory === "Location or work arrangement") return false;

  return facts.some(
    (fact) =>
      fact.experienceClassification === "TRANSFERABLE" ||
      fact.experienceClassification === "USED_IN_CONTROLLED_PROJECT" ||
      fact.deploymentClaim === "CONTROLLED_PROJECT" ||
      fact.factType === "PROJECT" ||
      fact.factType === "ARCHITECTURE" ||
      fact.factType === "LEADERSHIP",
  );
}

function classifyMapping(
  requirement: PrivateJobRequirementRecord,
  facts: readonly Partial<CareerFact>[],
  evidenceRecords: readonly Partial<CareerEvidence>[],
): RequirementEvidenceClassification {
  if (!facts.length) return "MISSING";
  if (hasConflict(facts, evidenceRecords)) return "UNKNOWN";
  if (hasVerifiedSupport(requirement, facts, evidenceRecords)) return "PROVEN";
  if (hasPartialSupport(facts, evidenceRecords)) return "PARTIAL";
  if (hasTransferableSupport(requirement, facts, evidenceRecords)) return "TRANSFERABLE";
  if (evidenceRecords.length > 0 || facts.length > 0) return "UNKNOWN";
  return "MISSING";
}

function supportLimitations(classification: RequirementEvidenceClassification, evidenceRecords: readonly Partial<CareerEvidence>[]) {
  const limitations: string[] = [];
  if (classification !== "PROVEN") limitations.push("Do not present this as fully proven without Ross review.");
  if (hasResumeOnlyEvidence(evidenceRecords)) limitations.push("Resume wording alone is not verification authority.");
  if (!evidenceRecords.length) limitations.push("No supporting CareerEvidence record is currently linked.");
  limitations.push("Mapping is deterministic and local; no external source was consulted.");
  return limitations;
}

function safePositioningFor(classification: RequirementEvidenceClassification) {
  if (classification === "PROVEN") return "May be used with evidence-cited wording and no expansion beyond the verified fact.";
  if (classification === "PARTIAL") return "Use limited wording that preserves scope, recency, depth, and unresolved limitations.";
  if (classification === "TRANSFERABLE") return "Position as adjacent or transferable experience; do not claim exact same-role experience.";
  if (classification === "MISSING") return "Do not claim this requirement. Treat it as a gap or review item.";
  return "Hold for Ross review before using in a resume, cover letter, or interview answer.";
}

function prohibitedOverstatement(requirement: PrivateJobRequirementRecord, facts: readonly Partial<CareerFact>[]) {
  const prohibitions = [
    "Do not invent employers, titles, dates, certifications, metrics, or outcomes.",
    "Do not turn studied or local-only work into professional production use.",
    "Do not claim customer use unless a supported fact explicitly proves it.",
  ];
  if (requirement.yearsMentioned !== null && !facts.some((fact) => typeof fact.yearsOfExperience === "number" && fact.yearsAuthority)) {
    prohibitions.push("Do not claim the requested years of experience without years authority.");
  }
  if (requirement.certificationMentioned && !facts.some((fact) => fact.factType === "CERTIFICATION" && fact.verificationStatus === "VERIFIED")) {
    prohibitions.push("Do not claim this certification unless Ross verifies credential authority.");
  }
  return prohibitions;
}

function explanationFor(classification: RequirementEvidenceClassification) {
  if (classification === "PROVEN") return "Reviewed Career facts and supporting evidence directly support this requirement.";
  if (classification === "PARTIAL") return "Existing evidence supports part of the requirement, but the scope, recency, depth, or context is incomplete.";
  if (classification === "TRANSFERABLE") return "Existing evidence supports an adjacent capability that may be relevant if carefully positioned.";
  if (classification === "MISSING") return "No matching CareerFact or CareerEvidence was found for this requirement.";
  return "Matching private Career material exists, but current verification, conflict, or review status is insufficient for a stronger classification.";
}

export function mapRequirementsToCareerEvidence(input: RequirementEvidenceMappingInput) {
  return input.requirements.map((requirement): PrivateRequirementEvidenceMapping => {
    const scored = input.careerFacts
      .map((fact) => scoreFact(requirement, fact))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const matchedFacts = scored.map((item) => item.fact);
    const evidenceRecords = relatedEvidence(matchedFacts, input.careerEvidence);
    const classification = classifyMapping(requirement, matchedFacts, evidenceRecords);
    const conflictStatus = hasConflict(matchedFacts, evidenceRecords)
      ? "CONFLICT_REQUIRES_REVIEW"
      : matchedFacts.length || evidenceRecords.length
        ? "NO_CONFLICT"
        : "UNKNOWN";

    return {
      schemaVersion: CANDIDATE_EVIDENCE_MAPPING_SCHEMA_VERSION,
      id: `privjobmap_${requirement.id.replace(/^privjobreq_/, "")}`,
      requirementId: requirement.id,
      jobOpportunityId: requirement.jobOpportunityId,
      careerFactIds: unique(matchedFacts.map((fact) => fact.id).filter((id): id is string => typeof id === "string" && Boolean(id))).slice(0, 5),
      careerEvidenceIds: unique(evidenceRecords.map((evidence) => evidence.id).filter((id): id is string => typeof id === "string" && Boolean(id))).slice(0, 5),
      classification,
      explanation: explanationFor(classification),
      supportLimitations: supportLimitations(classification, evidenceRecords),
      verificationStatus: unique(matchedFacts.map((fact) => String(fact.verificationStatus || "UNKNOWN"))).join(", ") || "UNKNOWN",
      conflictStatus,
      operatorReviewRequirement:
        classification === "PROVEN" ? "Ross review optional before reuse." : "Ross review required before resume or interview positioning.",
      safePositioning: safePositioningFor(classification),
      prohibitedOverstatement: prohibitedOverstatement(requirement, matchedFacts),
      matchedSignals: unique(scored.flatMap((item) => item.signals)).slice(0, 10),
      createdAt: input.createdAt,
      privateRecord: true,
      testOnly: false,
    };
  });
}

export function summarizeMappingCoverage(mappings: readonly PrivateRequirementEvidenceMapping[]) {
  const counts = {
    PROVEN: 0,
    PARTIAL: 0,
    TRANSFERABLE: 0,
    MISSING: 0,
    UNKNOWN: 0,
  };
  for (const mapping of mappings) counts[mapping.classification] += 1;
  return counts;
}
