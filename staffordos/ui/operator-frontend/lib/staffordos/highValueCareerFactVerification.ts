import { createHash } from "node:crypto";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import * as path from "node:path";
import { mapRequirementsToCareerEvidence, summarizeMappingCoverage } from "./candidateEvidenceMapper";
import type { CareerEvidence, CareerFact } from "./careerEvidenceContracts";
import { buildExplainableJobPositioningModel, writeExplainableJobPositioningOutput } from "./explainableJobPositioning";
import { buildPrivateJobFitAssessment } from "./jobFitAssessment";
import {
  buildPrivateJobAnalysisNextAction,
  buildPrivateJobAnalysisReviewQueue,
  buildPrivateJobPositioningBrief,
  type PrivateJobAnalysisAuditSummary,
  type PrivateJobAnalysisBundle,
  writePrivateJobAnalysisBundle,
} from "./privateJobAnalysisWorkflow";
import { loadPrivateJobAnalysisRun, type PrivateJobAnalysisRunMetadata } from "./privateJobAnalysisReview";
import type { CareerCandidateFactSummary, CareerEvidenceSummary } from "./roleFocusedCareerEvidenceReview";

export const HIGH_VALUE_CAREER_FACT_VERIFICATION_VERSION = "S010.02E";
export const HIGH_VALUE_CAREER_FACT_DECISION_SCHEMA_VERSION =
  "staffordos.professional.high_value_career_fact_verification_decision.v1";
export const HIGH_VALUE_CANONICAL_CAREER_FACT_SCHEMA_VERSION =
  "staffordos.professional.canonical_career_fact.v1";
export const HIGH_VALUE_VERIFICATION_AUDIT_SCHEMA_VERSION =
  "staffordos.professional.high_value_career_fact_verification_audit.v1";

export const HIGH_VALUE_CAREER_FACT_OUTCOMES = [
  "VERIFIED",
  "PARTIALLY_SUPPORTED",
  "TRANSFERABLE",
  "NEEDS_EVIDENCE",
  "CONFLICTING",
  "REJECTED",
  "DEFERRED",
] as const;

export const HIGH_VALUE_CAREER_FACT_CATEGORIES = [
  "PMP certification",
  "Master of Education",
  "verified employers and titles",
  "verified employment dates",
  "Stafford Media Consulting founder/consulting authority",
  "StaffordOS architecture and implementation facts",
  "ShopiFixer implementation facts",
  "Abando implementation facts",
  "AI-agent / automation development facts",
  "Python / SQL / cloud / DevOps usage context",
  "CI/CD / Kubernetes / ArgoCD / Terraform implementation context",
  "marketing technology leadership",
  "technical program/project leadership",
  "public speaking / training / presentation work",
  "production/deployment status",
] as const;

export type HighValueCareerFactOutcome = (typeof HIGH_VALUE_CAREER_FACT_OUTCOMES)[number];
export type HighValueCareerFactCategory = (typeof HIGH_VALUE_CAREER_FACT_CATEGORIES)[number];
export type CanonicalCareerFactAuthorityStatus =
  | "VERIFIED"
  | "PARTIALLY_SUPPORTED"
  | "NEEDS_EVIDENCE"
  | "CONFLICTING"
  | "HISTORICAL_ONLY"
  | "REJECTED";

type AnyRecord = Record<string, unknown>;

export type HighValueCareerEvidenceSummary = {
  id: string;
  evidenceType: string;
  authorityClassification: string;
  freshness: string;
  sourceKind: string | null;
  limitations: string[];
};

export type HighValueCareerFactCandidate = {
  candidateId: string;
  sourceFactId: string;
  category: HighValueCareerFactCategory;
  canonicalStatement: string;
  currentVerificationStatus: string;
  currentAuthorityClassification: string;
  supportLevel: string;
  experienceClassification: string | null;
  metricClassification: string | null;
  deploymentClaim: string | null;
  customerUseClaim: string | null;
  supportingEvidence: HighValueCareerEvidenceSummary[];
  conflictingEvidenceIds: string[];
  conflictTypes: string[];
  proposedAuthorityStatus: CanonicalCareerFactAuthorityStatus;
  allowedOutcomes: HighValueCareerFactOutcome[];
  whyHighValue: string;
  whatEvidenceWouldImproveIt: string;
  limitation: string;
  priority: number;
};

export type HighValueCareerFactVerificationDecision = {
  schemaVersion: typeof HIGH_VALUE_CAREER_FACT_DECISION_SCHEMA_VERSION;
  decisionId: string;
  workspaceId: "professional";
  analysisRunId: string;
  candidateId: string;
  sourceFactId: string;
  category: HighValueCareerFactCategory;
  outcome: HighValueCareerFactOutcome;
  operatorConfirmed: true;
  selectedEvidenceIds: string[];
  operatorContext: string | null;
  limitation: string;
  createdAt: string;
  supersedesDecisionId: string | null;
  sourceAuthority: "ROSS_HIGH_VALUE_CAREER_FACT_REVIEW";
  privacy: "Professional owner-private";
  canonicalCareerFactId: string | null;
  applicationSubmitted: false;
  messageSent: false;
  resumeMutated: false;
  linkedInMutated: false;
};

export type CanonicalCareerFactSnapshot = AnyRecord & {
  schemaVersion: typeof HIGH_VALUE_CANONICAL_CAREER_FACT_SCHEMA_VERSION;
  id: string;
  workspaceId: "professional";
  statement: string;
  verificationStatus: "VERIFIED" | "PARTIALLY_SUPPORTED" | "NEEDS_EVIDENCE" | "CONFLICTING" | "REJECTED" | "HISTORICAL_ONLY";
  supportLevel: "DIRECT" | "PARTIAL" | "TRANSFERABLE" | "INSUFFICIENT" | "CONFLICTING" | "UNKNOWN";
  sourceEvidenceIds: string[];
  sourceCandidateFactIds: string[];
  sourceDecisionIds: string[];
  canonical: true;
  privateRecord: true;
  testOnly: false;
};

export type CanonicalCareerEvidenceSnapshot = AnyRecord & {
  schemaVersion: "staffordos.professional.canonical_career_evidence.v1";
  id: string;
  workspaceId: "professional";
  evidenceType: "CERTIFICATION_RECORD" | "EDUCATION_RECORD" | "EMPLOYMENT_RECORD" | "PROJECT_ARTIFACT" | "OTHER";
  title: string;
  summary: string;
  sourceType: string;
  sourceReference: string;
  authorityClassification: "OFFICIAL_DOCUMENT" | "PROVIDER_CONFIRMED" | "OPERATOR_CONFIRMED" | "REPOSITORY_BACKED" | "PUBLIC_ARTIFACT";
  privacyClassification: "Professional owner-private";
  freshness: string;
  supportsFactIds: string[];
  challengesFactIds: string[];
  contentDigest: string;
  excerptReference: string;
  limitations: string[];
  operatorReviewStatus: "Ross confirmed";
  canonical: true;
  privateRecord: true;
  testOnly: false;
};

export type HighValueVerificationChangeReport = {
  schemaVersion: typeof HIGH_VALUE_VERIFICATION_AUDIT_SCHEMA_VERSION;
  workflowVersion: typeof HIGH_VALUE_CAREER_FACT_VERIFICATION_VERSION;
  previousAnalysisRunId: string;
  regeneratedAnalysisRunId: string | null;
  generatedAt: string;
  decisionsApplied: number;
  canonicalFactsPromoted: number;
  coverageBefore: ReturnType<typeof summarizeMappingCoverage>;
  coverageAfter: ReturnType<typeof summarizeMappingCoverage>;
  mappingChanges: Array<{
    requirementId: string;
    before: string;
    after: string;
    reason: string;
  }>;
  positioningBefore: {
    automaticallyReusable: string[];
    reusableWithReview: string[];
    verifiedStrengths: string[];
    transferableStrengths: string[];
  };
  positioningAfter: {
    automaticallyReusable: string[];
    reusableWithReview: string[];
    verifiedStrengths: string[];
    transferableStrengths: string[];
  };
  safeResumeLanguage: string[];
  safeInterviewClaims: string[];
  remainingBlockedClaims: string[];
  noApplicationSubmitted: true;
  noMessageSent: true;
  noResumeMutated: true;
  noLinkedInMutated: true;
  noExternalAi: true;
  noOllama: true;
};

type LoadedAnalysis = {
  metadata: PrivateJobAnalysisRunMetadata;
  bundle: PrivateJobAnalysisBundle;
};

type LoadedCareerStore = {
  facts: AnyRecord[];
  evidence: AnyRecord[];
};

function positioningFacts(records: readonly AnyRecord[]): CareerCandidateFactSummary[] {
  return records
    .map((record) => {
      const id = factId(record);
      const statement = stringValue(record.statement || record.normalizedStatement);
      if (!id || !statement) return null;
      return {
        id,
        factType: stringValue(record.factType || record.classification, "UNKNOWN"),
        statement,
        verificationStatus: stringValue(record.verificationStatus, "UNKNOWN"),
        authorityClassification: stringValue(record.authorityClassification, "UNKNOWN"),
        skillContext: stringValue(record.skillContext || record.experienceClassification) || null,
        metricClassification: stringValue(record.metricClassification) || null,
        limitations: stringArray(record.limitations),
      };
    })
    .filter((record): record is CareerCandidateFactSummary => record !== null);
}

function positioningEvidence(records: readonly AnyRecord[]): CareerEvidenceSummary[] {
  return records
    .map((record) => {
      const id = evidenceId(record);
      if (!id) return null;
      return {
        id,
        evidenceType: stringValue(record.evidenceType, "UNKNOWN"),
        sourceKind: stringValue(record.sourceKind || record.sourceType) || null,
        authorityClassification: stringValue(record.authorityClassification, "UNKNOWN"),
        freshness: stringValue(record.freshness, "Unknown"),
        limitations: stringArray(record.limitations),
      };
    })
    .filter((record): record is CareerEvidenceSummary => record !== null);
}

function mapperFacts(records: readonly AnyRecord[]): Partial<CareerFact>[] {
  return records.map((record) => {
    const { testOnly: _testOnly, ...mapperRecord } = record;
    return mapperRecord as Partial<CareerFact>;
  });
}

function mapperEvidence(records: readonly AnyRecord[]): Partial<CareerEvidence>[] {
  return records.map((record) => {
    const { testOnly: _testOnly, ...mapperRecord } = record;
    return mapperRecord as Partial<CareerEvidence>;
  });
}

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeStatement(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function compactDate(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || sha256Text(value).slice(0, 12);
}

function isInsideDirectory(candidatePath: string, parentPath: string) {
  const resolvedCandidate = path.resolve(candidatePath);
  const resolvedParent = path.resolve(parentPath);
  return resolvedCandidate === resolvedParent || resolvedCandidate.startsWith(`${resolvedParent}${path.sep}`);
}

function assertOutsideRepository(directory: string, repositoryRoot: string, label: string) {
  if (!directory || isInsideDirectory(directory, repositoryRoot)) {
    throw new Error(`${label} must be outside the repository.`);
  }
}

function ensurePrivateDirectory(directory: string) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  chmodSync(filePath, 0o600);
}

function writeText(filePath: string, value: string) {
  writeFileSync(filePath, value, "utf8");
  chmodSync(filePath, 0o600);
}

function walkFiles(directory: string, maxDepth = 8) {
  if (!existsSync(directory)) return [];
  const files: string[] = [];
  const walk = (current: string, depth: number) => {
    if (depth > maxDepth) return;
    for (const name of readdirSync(current)) {
      const filePath = path.join(current, name);
      const stat = statSync(filePath);
      if (stat.isDirectory()) walk(filePath, depth + 1);
      else if (stat.isFile()) files.push(filePath);
    }
  };
  walk(directory, 0);
  return files;
}

function payloadArray(filePath: string) {
  const value = readJson<unknown>(filePath);
  if (Array.isArray(value)) return value as AnyRecord[];
  if (value && typeof value === "object" && Array.isArray((value as { records?: unknown }).records)) {
    return (value as { records: AnyRecord[] }).records;
  }
  if (value && typeof value === "object" && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: AnyRecord[] }).data;
  }
  if (value && typeof value === "object" && Array.isArray((value as { candidateFacts?: unknown }).candidateFacts)) {
    return (value as { candidateFacts: AnyRecord[] }).candidateFacts;
  }
  if (value && typeof value === "object" && Array.isArray((value as { evidence?: unknown }).evidence)) {
    return (value as { evidence: AnyRecord[] }).evidence;
  }
  return [];
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

function factId(record: AnyRecord) {
  return stringValue(record.id);
}

function evidenceId(record: AnyRecord) {
  return stringValue(record.id);
}

function sourceEvidenceIds(record: AnyRecord) {
  return unique([
    ...stringArray(record.sourceEvidenceIds),
    ...stringArray(record.careerEvidenceIds),
    stringValue(record.sourceEvidenceId),
  ].filter(Boolean));
}

function hasEvidenceAuthority(evidence: readonly AnyRecord[], authorities: readonly string[]) {
  return evidence.some((record) => authorities.includes(stringValue(record.authorityClassification)));
}

function evidenceText(evidence: readonly AnyRecord[]) {
  return evidence.map((record) => [record.title, record.summary, record.excerptReference].filter(Boolean).join(" ")).join(" ");
}

function hasDeploymentAuthority(evidence: readonly AnyRecord[]) {
  const text = evidenceText(evidence);
  if (/\bnon[- ]production\b/i.test(text)) return false;
  return (
    hasEvidenceAuthority(evidence, ["REPOSITORY_BACKED", "PUBLIC_ARTIFACT", "OFFICIAL_DOCUMENT", "PROVIDER_CONFIRMED"]) &&
    /\b(deployed|deployment|production[- ]use|production runtime|runtime|live)\b/i.test(text)
  );
}

function isResumeOrGeneratedOnly(evidence: readonly AnyRecord[]) {
  return (
    evidence.length > 0 &&
    evidence.every((record) => {
      const evidenceType = stringValue(record.evidenceType);
      const sourceType = stringValue(record.sourceType);
      const authority = stringValue(record.authorityClassification);
      return evidenceType === "RESUME" || sourceType === "RESUME" || authority === "GENERATED_DOCUMENT";
    })
  );
}

function isCredentialCategory(category: HighValueCareerFactCategory) {
  return category === "PMP certification" || category === "Master of Education";
}

function sourceText(fact: AnyRecord) {
  return [
    fact.statement,
    fact.normalizedStatement,
    fact.factType,
    fact.technologyOrSkill,
    fact.classification,
    fact.experienceClassification,
    fact.skillContext,
  ]
    .filter(Boolean)
    .join(" ");
}

function categoriesForFact(fact: AnyRecord): HighValueCareerFactCategory[] {
  const text = sourceText(fact);
  const categories: HighValueCareerFactCategory[] = [];
  const factType = stringValue(fact.factType);
  if (/\b(pmp|project management professional)\b/i.test(text)) categories.push("PMP certification");
  if (/\b(master'?s? of education|m\.?ed\b|master.*education)\b/i.test(text)) categories.push("Master of Education");
  if (factType === "EMPLOYMENT") {
    categories.push("verified employers and titles");
  }
  if (/\b(19|20)\d{2}\b|present|current/i.test(text) && factType === "EMPLOYMENT") {
    categories.push("verified employment dates");
  }
  if (/\bstafford media|consulting|founder\b/i.test(text)) {
    categories.push("Stafford Media Consulting founder/consulting authority");
  }
  if (/\bstaffordos\b/i.test(text)) categories.push("StaffordOS architecture and implementation facts");
  if (/\bshopifixer\b/i.test(text)) categories.push("ShopiFixer implementation facts");
  if (/\babando\b/i.test(text)) categories.push("Abando implementation facts");
  if (/\b(ai agent|ai agents|agentic|llm|automation|prompt|workflow)\b/i.test(text)) {
    categories.push("AI-agent / automation development facts");
  }
  if (/\b(python|sql|cloud|gcp|aws|devops|docker)\b/i.test(text)) {
    categories.push("Python / SQL / cloud / DevOps usage context");
  }
  if (/\b(ci\/cd|kubernetes|argocd|terraform|github actions)\b/i.test(text)) {
    categories.push("CI/CD / Kubernetes / ArgoCD / Terraform implementation context");
  }
  if (/\b(marketing technology|martech|crm|salesforce|marketing)\b/i.test(text)) {
    categories.push("marketing technology leadership");
  }
  if (/\b(program|project management|stakeholder|roadmap|delivery|pmp|technical program)\b/i.test(text)) {
    categories.push("technical program/project leadership");
  }
  if (/\b(public speaking|presentation|training|workshop|facilitated|presented)\b/i.test(text)) {
    categories.push("public speaking / training / presentation work");
  }
  if (/\b(production|deployed|deployment|customer-used|customer used|merchant|live runtime)\b/i.test(text)) {
    categories.push("production/deployment status");
  }
  return unique(categories);
}

function categoryRank(category: HighValueCareerFactCategory) {
  const index = HIGH_VALUE_CAREER_FACT_CATEGORIES.indexOf(category);
  return index < 0 ? 0 : HIGH_VALUE_CAREER_FACT_CATEGORIES.length - index;
}

function factLinkedToAnalysis(fact: AnyRecord, analysis: LoadedAnalysis) {
  const id = factId(fact);
  return analysis.bundle.mappings.some((mapping) => mapping.careerFactIds.includes(id));
}

function scoreFact(fact: AnyRecord, category: HighValueCareerFactCategory, analysis: LoadedAnalysis) {
  let score = categoryRank(category) * 8;
  const status = stringValue(fact.verificationStatus);
  if (factLinkedToAnalysis(fact, analysis)) score += 40;
  if (status === "PARTIALLY_SUPPORTED") score += 20;
  if (status === "NEEDS_EVIDENCE" || status === "CONFLICTING") score += 18;
  if (status === "PROPOSED") score += 10;
  if (stringArray(fact.conflictTypes).length || stringArray(fact.conflictingEvidenceIds).length) score += 8;
  if (isCredentialCategory(category)) score += 12;
  if (category === "technical program/project leadership" || category === "AI-agent / automation development facts") score += 10;
  return score;
}

function categorySelectionCap(category: HighValueCareerFactCategory) {
  if (
    category === "PMP certification" ||
    category === "Master of Education" ||
    category === "verified employers and titles" ||
    category === "verified employment dates"
  ) {
    return 1;
  }
  return 2;
}

function evidenceSummary(record: AnyRecord): HighValueCareerEvidenceSummary {
  return {
    id: evidenceId(record),
    evidenceType: stringValue(record.evidenceType, "UNKNOWN"),
    authorityClassification: stringValue(record.authorityClassification, "UNKNOWN"),
    freshness: stringValue(record.freshness, "Unknown"),
    sourceKind: stringValue(record.sourceKind) || null,
    limitations: stringArray(record.limitations).slice(0, 4),
  };
}

function proposedStatusFor(input: {
  fact: AnyRecord;
  category: HighValueCareerFactCategory;
  supportingEvidence: readonly AnyRecord[];
}): CanonicalCareerFactAuthorityStatus {
  const conflictTypes = stringArray(input.fact.conflictTypes);
  const conflictingEvidenceIds = stringArray(input.fact.conflictingEvidenceIds);
  if (stringValue(input.fact.verificationStatus) === "CONFLICTING" || conflictTypes.length || conflictingEvidenceIds.length) {
    return "CONFLICTING";
  }
  if (stringValue(input.fact.verificationStatus) === "REJECTED") return "REJECTED";
  if (stringValue(input.fact.verificationStatus) === "HISTORICAL_ONLY") return "HISTORICAL_ONLY";
  const hasOfficial = hasEvidenceAuthority(input.supportingEvidence, ["OFFICIAL_DOCUMENT", "PROVIDER_CONFIRMED"]);
  const hasNonResumeEvidence = input.supportingEvidence.length > 0 && !isResumeOrGeneratedOnly(input.supportingEvidence);
  const hasRepositoryOrPublic = hasEvidenceAuthority(input.supportingEvidence, ["REPOSITORY_BACKED", "PUBLIC_ARTIFACT"]);
  const authority = stringValue(input.fact.authorityClassification);
  const metric = stringValue(input.fact.metricClassification);
  if (metric === "UNSUPPORTED") return "NEEDS_EVIDENCE";
  if (isCredentialCategory(input.category)) return hasOfficial ? "VERIFIED" : "NEEDS_EVIDENCE";
  if (input.category === "verified employers and titles" || input.category === "verified employment dates") {
    return hasOfficial ? "VERIFIED" : hasNonResumeEvidence ? "PARTIALLY_SUPPORTED" : "NEEDS_EVIDENCE";
  }
  if (input.category === "production/deployment status") {
    return hasDeploymentAuthority(input.supportingEvidence) ? "PARTIALLY_SUPPORTED" : "NEEDS_EVIDENCE";
  }
  if (stringValue(input.fact.verificationStatus) === "VERIFIED" && hasNonResumeEvidence) return "VERIFIED";
  if (hasRepositoryOrPublic || authority === "REPOSITORY_BACKED") return "PARTIALLY_SUPPORTED";
  if (stringValue(input.fact.verificationStatus) === "PARTIALLY_SUPPORTED" && hasNonResumeEvidence) return "PARTIALLY_SUPPORTED";
  if (stringValue(input.fact.experienceClassification) === "TRANSFERABLE" || stringValue(input.fact.skillContext) === "TRANSFERABLE") {
    return hasNonResumeEvidence ? "PARTIALLY_SUPPORTED" : "NEEDS_EVIDENCE";
  }
  return hasNonResumeEvidence ? "PARTIALLY_SUPPORTED" : "NEEDS_EVIDENCE";
}

function allowedOutcomesFor(status: CanonicalCareerFactAuthorityStatus, category: HighValueCareerFactCategory): HighValueCareerFactOutcome[] {
  const base: HighValueCareerFactOutcome[] = ["NEEDS_EVIDENCE", "CONFLICTING", "REJECTED", "DEFERRED"];
  if (status === "VERIFIED") return ["VERIFIED", "PARTIALLY_SUPPORTED", "TRANSFERABLE", ...base];
  if (status === "PARTIALLY_SUPPORTED") return ["PARTIALLY_SUPPORTED", "TRANSFERABLE", ...base];
  if (!isCredentialCategory(category)) return ["TRANSFERABLE", ...base];
  return base;
}

function evidenceImprovementFor(category: HighValueCareerFactCategory, status: CanonicalCareerFactAuthorityStatus) {
  if (status === "VERIFIED") return "Already has direct non-resume authority sufficient for a verified private Career fact if Ross confirms the wording.";
  if (category === "PMP certification") return "Official PMI or credential-provider authority is needed before this can become VERIFIED.";
  if (category === "Master of Education") return "Official education record authority is needed before this can become VERIFIED.";
  if (category === "verified employers and titles" || category === "verified employment dates") {
    return "Official employment records or independent corroborating records are needed before employer, title, or date claims become VERIFIED.";
  }
  if (category === "production/deployment status") return "Deployment, production-use, customer-use, or runtime authority is needed before production wording is safe.";
  if (status === "PARTIALLY_SUPPORTED") return "More direct evidence can strengthen scope, recency, production status, customer use, metrics, or ownership.";
  return "A non-resume source, official record, repository-backed implementation evidence, or public artifact is needed before stronger positioning.";
}

function limitationFor(candidate: HighValueCareerFactCandidate) {
  if (candidate.proposedAuthorityStatus === "VERIFIED") {
    return "Use only the evidence-cited wording; do not add years, metrics, production use, customer use, title scope, or certification details beyond the source.";
  }
  if (candidate.proposedAuthorityStatus === "PARTIALLY_SUPPORTED") {
    return "Partially supported only; preserve scope limits and avoid full ownership, production, customer, metric, years, certification, or title expansion.";
  }
  if (candidate.proposedAuthorityStatus === "CONFLICTING") return "Conflict remains visible until source authority is reconciled.";
  return "Do not use as verified Career truth until stronger evidence is available.";
}

export function loadHighValueCareerEvidenceStore(options: {
  careerRoots: readonly string[];
  repositoryRoot: string;
}): LoadedCareerStore {
  const facts = new Map<string, AnyRecord>();
  const evidence = new Map<string, AnyRecord>();
  for (const root of options.careerRoots) {
    if (!existsSync(root)) continue;
    assertOutsideRepository(root, options.repositoryRoot, "Private Career evidence root");
    for (const filePath of walkFiles(root)) {
      const filename = path.basename(filePath);
      if (/(candidate_career_facts|combined_candidate_career_facts|canonical_career_facts).*\.json$/.test(filename)) {
        for (const record of payloadArray(filePath)) {
          const id = factId(record);
          if (id) facts.set(id, record);
        }
      }
      if (/(career_evidence|combined_career_evidence|canonical_career_evidence).*\.json$/.test(filename)) {
        for (const record of payloadArray(filePath)) {
          const id = evidenceId(record);
          if (id) evidence.set(id, record);
        }
      }
    }
  }
  return { facts: [...facts.values()], evidence: [...evidence.values()] };
}

export function loadHighValueCareerFactVerificationInputs(options: {
  analysisRoot: string;
  repositoryRoot: string;
  opportunityDirectory?: string | null;
  careerRoots: readonly string[];
  analysisRunId: string;
}) {
  const analysis = loadPrivateJobAnalysisRun({
    analysisRoot: options.analysisRoot,
    repositoryRoot: options.repositoryRoot,
    opportunityDirectory: options.opportunityDirectory || null,
    analysisRunId: options.analysisRunId,
    latest: false,
  });
  const careerStore = loadHighValueCareerEvidenceStore({
    careerRoots: options.careerRoots,
    repositoryRoot: options.repositoryRoot,
  });
  return { analysis, careerStore };
}

export function buildHighValueCareerFactCandidates(input: {
  analysis: LoadedAnalysis;
  careerStore: LoadedCareerStore;
  maxItems?: number;
}): HighValueCareerFactCandidate[] {
  const evidenceById = new Map(input.careerStore.evidence.map((record) => [evidenceId(record), record]));
  const candidates: HighValueCareerFactCandidate[] = [];
  const seen = new Set<string>();
  for (const fact of input.careerStore.facts) {
    const id = factId(fact);
    const statement = stringValue(fact.statement);
    if (!id || !statement) continue;
    for (const category of categoriesForFact(fact)) {
      const key = `${id}|${category}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const supportingEvidence = sourceEvidenceIds(fact).flatMap((sourceId) => {
        const record = evidenceById.get(sourceId);
        return record ? [record] : [];
      });
      const proposedAuthorityStatus = proposedStatusFor({ fact, category, supportingEvidence });
      const candidate: HighValueCareerFactCandidate = {
        candidateId: `s01002e_candidate_${sha256Text(key).slice(0, 18)}`,
        sourceFactId: id,
        category,
        canonicalStatement: statement,
        currentVerificationStatus: stringValue(fact.verificationStatus, "UNKNOWN"),
        currentAuthorityClassification: stringValue(fact.authorityClassification, "UNKNOWN"),
        supportLevel: stringValue(fact.supportLevel, stringValue(fact.verificationStatus, "UNKNOWN")),
        experienceClassification: stringValue(fact.experienceClassification, stringValue(fact.skillContext)) || null,
        metricClassification: stringValue(fact.metricClassification, stringValue(fact.metricReviewClassification)) || null,
        deploymentClaim: stringValue(fact.deploymentClaim) || null,
        customerUseClaim: stringValue(fact.customerUseClaim) || null,
        supportingEvidence: supportingEvidence.map(evidenceSummary),
        conflictingEvidenceIds: stringArray(fact.conflictingEvidenceIds),
        conflictTypes: stringArray(fact.conflictTypes),
        proposedAuthorityStatus,
        allowedOutcomes: allowedOutcomesFor(proposedAuthorityStatus, category),
        whyHighValue: `${category} is reusable across AI Product, AI Governance, Technical Program, Automation, Marketing Technology, and AI Operations positioning.`,
        whatEvidenceWouldImproveIt: evidenceImprovementFor(category, proposedAuthorityStatus),
        limitation: "pending",
        priority: scoreFact(fact, category, input.analysis),
      };
      candidate.limitation = limitationFor(candidate);
      candidates.push(candidate);
    }
  }
  const selected: HighValueCareerFactCandidate[] = [];
  const categoryCounts = new Map<HighValueCareerFactCategory, number>();
  const maxItems = input.maxItems || 12;
  for (const candidate of candidates.sort((a, b) => b.priority - a.priority || a.category.localeCompare(b.category))) {
    const categoryCount = categoryCounts.get(candidate.category) || 0;
    if (categoryCount >= categorySelectionCap(candidate.category)) continue;
    selected.push(candidate);
    categoryCounts.set(candidate.category, categoryCount + 1);
    if (selected.length >= maxItems) break;
  }

  return selected.map((candidate, index) => ({ ...candidate, priority: index + 1 }));
}

function decisionsFilePath(decisionRoot: string, analysisRunId: string) {
  return path.join(decisionRoot, analysisRunId, "decisions.ndjson");
}

export function loadHighValueCareerFactVerificationDecisions(options: {
  decisionRoot: string;
  repositoryRoot: string;
  analysisRunId: string;
}) {
  assertOutsideRepository(options.decisionRoot, options.repositoryRoot, "Private high-value Career fact decision root");
  const filePath = decisionsFilePath(options.decisionRoot, options.analysisRunId);
  if (!existsSync(filePath)) return [] as HighValueCareerFactVerificationDecision[];
  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as HighValueCareerFactVerificationDecision);
}

function latestDecisionByCandidate(decisions: readonly HighValueCareerFactVerificationDecision[]) {
  const latest = new Map<string, HighValueCareerFactVerificationDecision>();
  for (const decision of decisions) latest.set(decision.candidateId, decision);
  return latest;
}

function strongerOutcomeRejected(candidate: HighValueCareerFactCandidate, outcome: HighValueCareerFactOutcome) {
  if (!candidate.allowedOutcomes.includes(outcome)) return "OUTCOME_NOT_ALLOWED_FOR_EVIDENCE";
  if (outcome === "VERIFIED" && candidate.proposedAuthorityStatus !== "VERIFIED") return "VERIFIED_REQUIRES_DIRECT_AUTHORITY";
  if (outcome === "PARTIALLY_SUPPORTED" && !["VERIFIED", "PARTIALLY_SUPPORTED"].includes(candidate.proposedAuthorityStatus)) {
    return "PARTIALLY_SUPPORTED_REQUIRES_NON_RESUME_EVIDENCE";
  }
  if ((outcome === "VERIFIED" || outcome === "PARTIALLY_SUPPORTED" || outcome === "TRANSFERABLE") && candidate.supportingEvidence.length === 0) {
    return "SUPPORT_OUTCOME_REQUIRES_EVIDENCE";
  }
  return null;
}

function selectedEvidenceIds(candidate: HighValueCareerFactCandidate, outcome: HighValueCareerFactOutcome) {
  if (outcome === "VERIFIED" || outcome === "PARTIALLY_SUPPORTED" || outcome === "TRANSFERABLE") {
    return candidate.supportingEvidence.map((evidence) => evidence.id);
  }
  return [];
}

export function createHighValueCareerFactVerificationDecision(input: {
  analysisRunId: string;
  candidate: HighValueCareerFactCandidate;
  outcome: HighValueCareerFactOutcome;
  operatorConfirmed?: boolean;
  operatorContext?: string | null;
  existingDecisions?: readonly HighValueCareerFactVerificationDecision[];
  createdAt: string;
}): HighValueCareerFactVerificationDecision {
  if (!input.operatorConfirmed) throw new Error("OPERATOR_CONFIRMATION_REQUIRED");
  const rejection = strongerOutcomeRejected(input.candidate, input.outcome);
  if (rejection) throw new Error(rejection);
  const supersedesDecisionId =
    [...(input.existingDecisions || [])]
      .reverse()
      .find((decision) => decision.candidateId === input.candidate.candidateId)?.decisionId || null;
  const seed = [
    input.analysisRunId,
    input.candidate.candidateId,
    input.outcome,
    input.createdAt,
    selectedEvidenceIds(input.candidate, input.outcome).join(","),
  ].join("|");
  const decisionId = `s01002e_decision_${sha256Text(seed).slice(0, 18)}`;
  const canonicalCareerFactId =
    input.outcome === "VERIFIED" || input.outcome === "PARTIALLY_SUPPORTED" || input.outcome === "TRANSFERABLE"
      ? `careerfact_${sha256Text(`${decisionId}|canonical`).slice(0, 18)}`
      : null;
  return {
    schemaVersion: HIGH_VALUE_CAREER_FACT_DECISION_SCHEMA_VERSION,
    decisionId,
    workspaceId: "professional",
    analysisRunId: input.analysisRunId,
    candidateId: input.candidate.candidateId,
    sourceFactId: input.candidate.sourceFactId,
    category: input.candidate.category,
    outcome: input.outcome,
    operatorConfirmed: true,
    selectedEvidenceIds: selectedEvidenceIds(input.candidate, input.outcome),
    operatorContext: input.operatorContext || null,
    limitation:
      input.outcome === "VERIFIED"
        ? "Verified only for the evidence-cited statement; no metrics, years, production use, certification detail, title scope, or employer responsibility may be added."
        : input.outcome === "PARTIALLY_SUPPORTED"
          ? "Partially supported; use limited wording and preserve remaining uncertainty."
          : input.outcome === "TRANSFERABLE"
            ? "Transferable capability only; do not present as direct same-role proof."
            : "No stronger canonical Career authority was created.",
    createdAt: input.createdAt,
    supersedesDecisionId,
    sourceAuthority: "ROSS_HIGH_VALUE_CAREER_FACT_REVIEW",
    privacy: "Professional owner-private",
    canonicalCareerFactId,
    applicationSubmitted: false,
    messageSent: false,
    resumeMutated: false,
    linkedInMutated: false,
  };
}

export function appendHighValueCareerFactVerificationDecision(options: {
  decisionRoot: string;
  repositoryRoot: string;
  decision: HighValueCareerFactVerificationDecision;
}) {
  assertOutsideRepository(options.decisionRoot, options.repositoryRoot, "Private high-value Career fact decision root");
  const directory = path.dirname(decisionsFilePath(options.decisionRoot, options.decision.analysisRunId));
  ensurePrivateDirectory(directory);
  const filePath = decisionsFilePath(options.decisionRoot, options.decision.analysisRunId);
  appendFileSync(filePath, `${JSON.stringify(options.decision)}\n`, { encoding: "utf8", mode: 0o600 });
  chmodSync(filePath, 0o600);
  return { privatePathVisible: false as const };
}

function rawFactById(facts: readonly AnyRecord[]) {
  return new Map(facts.map((fact) => [factId(fact), fact]));
}

function supportLevelForOutcome(outcome: HighValueCareerFactOutcome): CanonicalCareerFactSnapshot["supportLevel"] {
  if (outcome === "VERIFIED") return "DIRECT";
  if (outcome === "PARTIALLY_SUPPORTED") return "PARTIAL";
  if (outcome === "TRANSFERABLE") return "TRANSFERABLE";
  if (outcome === "CONFLICTING") return "CONFLICTING";
  if (outcome === "NEEDS_EVIDENCE" || outcome === "REJECTED") return "INSUFFICIENT";
  return "UNKNOWN";
}

function verificationStatusForOutcome(outcome: HighValueCareerFactOutcome): CanonicalCareerFactSnapshot["verificationStatus"] {
  if (outcome === "VERIFIED") return "VERIFIED";
  if (outcome === "PARTIALLY_SUPPORTED" || outcome === "TRANSFERABLE") return "PARTIALLY_SUPPORTED";
  if (outcome === "CONFLICTING") return "CONFLICTING";
  if (outcome === "REJECTED") return "REJECTED";
  return "NEEDS_EVIDENCE";
}

function categorySkill(category: HighValueCareerFactCategory) {
  if (category === "AI-agent / automation development facts") return "AI agents / automation";
  if (category === "Python / SQL / cloud / DevOps usage context") return "Python / SQL / cloud / DevOps";
  if (category === "CI/CD / Kubernetes / ArgoCD / Terraform implementation context") return "CI/CD / Kubernetes / ArgoCD / Terraform";
  if (category === "marketing technology leadership") return "Marketing technology";
  if (category === "technical program/project leadership") return "Technical program/project leadership";
  if (category === "PMP certification") return "PMP";
  return null;
}

export function buildCanonicalCareerFactSnapshot(input: {
  sourceFact: AnyRecord;
  candidate: HighValueCareerFactCandidate;
  decision: HighValueCareerFactVerificationDecision;
}): CanonicalCareerFactSnapshot | null {
  if (!input.decision.canonicalCareerFactId) return null;
  const sourceFact = input.sourceFact;
  const now = input.decision.createdAt;
  const outcome = input.decision.outcome;
  return {
    schemaVersion: HIGH_VALUE_CANONICAL_CAREER_FACT_SCHEMA_VERSION,
    id: input.decision.canonicalCareerFactId,
    workspaceId: "professional",
    factType: stringValue(sourceFact.factType, "OTHER"),
    subject: stringValue(sourceFact.subject, "Ross Stafford"),
    statement: input.candidate.canonicalStatement,
    normalizedStatement: normalizeStatement(input.candidate.canonicalStatement),
    startDate: sourceFact.startDate ?? null,
    endDate: sourceFact.endDate ?? null,
    current: typeof sourceFact.current === "boolean" ? sourceFact.current : null,
    organization: typeof sourceFact.organization === "string" ? sourceFact.organization : null,
    roleOrTitle: typeof sourceFact.roleOrTitle === "string" ? sourceFact.roleOrTitle : null,
    location: typeof sourceFact.location === "string" ? sourceFact.location : null,
    classification: input.candidate.category,
    supportLevel: supportLevelForOutcome(outcome),
    verificationStatus: verificationStatusForOutcome(outcome),
    authorityClassification:
      outcome === "VERIFIED"
        ? "OFFICIAL_DOCUMENT"
        : stringValue(sourceFact.authorityClassification, "OPERATOR_CONFIRMED"),
    privacyClassification: "Professional owner-private",
    sourceEvidenceIds: input.decision.selectedEvidenceIds,
    conflictingEvidenceIds: input.candidate.conflictingEvidenceIds,
    conflictTypes: input.candidate.conflictTypes,
    metricClassification: input.candidate.metricClassification === "UNSUPPORTED" ? "UNSUPPORTED" : "NOT_APPLICABLE",
    measurementAuthority: null,
    experienceClassification:
      outcome === "TRANSFERABLE"
        ? "TRANSFERABLE"
        : outcome === "PARTIALLY_SUPPORTED"
          ? stringValue(sourceFact.experienceClassification, "USED_IN_CONTROLLED_PROJECT")
          : stringValue(sourceFact.experienceClassification) || null,
    proficiencyLabel: null,
    yearsOfExperience: null,
    yearsAuthority: null,
    deploymentClaim: stringValue(sourceFact.deploymentClaim, "NEEDS_EVIDENCE"),
    customerUseClaim: stringValue(sourceFact.customerUseClaim, "NEEDS_EVIDENCE"),
    technologyOrSkill: stringValue(sourceFact.technologyOrSkill, categorySkill(input.candidate.category) || ""),
    limitations: unique([
      ...stringArray(sourceFact.limitations),
      input.decision.limitation,
      "S010.02E promoted this owner-private fact only for evidence-safe reuse; it does not modify resumes, LinkedIn, applications, or public UI.",
      "No years, metrics, production use, customer use, certification number, or employer responsibility may be inferred from this record.",
    ]),
    operatorNotes: null,
    positioningBoundaries: [
      {
        statement: input.candidate.canonicalStatement,
        sourceFactIds: [input.candidate.sourceFactId],
        positioningState: "READY_FOR_REVIEW",
        changesMeaning: false,
        limitation: input.decision.limitation,
      },
    ],
    sourceCandidateFactIds: [input.candidate.sourceFactId],
    sourceDecisionIds: [input.decision.decisionId],
    category: input.candidate.category,
    createdAt: now,
    updatedAt: now,
    canonical: true,
    privateRecord: true,
    testOnly: false,
  };
}

export function createOfficialCredentialVerificationDecision(input: {
  analysisRunId: string;
  credentialName: string;
  issuingOrganization: string;
  reviewedAt: string;
  operatorConfirmed?: boolean;
  operatorContext?: string | null;
}): HighValueCareerFactVerificationDecision {
  if (!input.operatorConfirmed) throw new Error("OPERATOR_CONFIRMATION_REQUIRED");
  if (!input.credentialName.trim() || !input.issuingOrganization.trim()) throw new Error("CREDENTIAL_NAME_AND_ISSUER_REQUIRED");
  const seed = [input.analysisRunId, input.credentialName, input.issuingOrganization, input.reviewedAt].join("|");
  const decisionId = `s01002e_decision_${sha256Text(seed).slice(0, 18)}`;
  return {
    schemaVersion: HIGH_VALUE_CAREER_FACT_DECISION_SCHEMA_VERSION,
    decisionId,
    workspaceId: "professional",
    analysisRunId: input.analysisRunId,
    candidateId: `s01002e_official_credential_${sha256Text(`${input.credentialName}|${input.issuingOrganization}`).slice(0, 18)}`,
    sourceFactId: "owner_private_official_credential_review",
    category: input.credentialName.toLowerCase().includes("pmp") ? "PMP certification" : "technical program/project leadership",
    outcome: "VERIFIED",
    operatorConfirmed: true,
    selectedEvidenceIds: [`careerev_${sha256Text(`${decisionId}|evidence`).slice(0, 18)}`],
    operatorContext: input.operatorContext || null,
    limitation:
      "Verified only for the official credential. This does not verify employment history, education, titles, years of experience, metrics, production use, or other Career facts.",
    createdAt: input.reviewedAt,
    supersedesDecisionId: null,
    sourceAuthority: "ROSS_HIGH_VALUE_CAREER_FACT_REVIEW",
    privacy: "Professional owner-private",
    canonicalCareerFactId: `careerfact_${sha256Text(`${decisionId}|fact`).slice(0, 18)}`,
    applicationSubmitted: false,
    messageSent: false,
    resumeMutated: false,
    linkedInMutated: false,
  };
}

export function buildOfficialCredentialVerificationRecords(input: {
  decision: HighValueCareerFactVerificationDecision;
  holderName: string;
  credentialName: string;
  issuingOrganization: string;
  credentialNumber: string | null;
  originalGrantDate: string | null;
  expirationDate: string | null;
  evidenceReviewed: string;
}): {
  fact: CanonicalCareerFactSnapshot;
  evidence: CanonicalCareerEvidenceSnapshot;
} {
  if (input.decision.outcome !== "VERIFIED" || !input.decision.canonicalCareerFactId) {
    throw new Error("VERIFIED_OFFICIAL_CREDENTIAL_DECISION_REQUIRED");
  }
  const evidenceId = input.decision.selectedEvidenceIds[0];
  const statement = `${input.credentialName} credential verified by official ${input.issuingOrganization} certificate.`;
  const evidence: CanonicalCareerEvidenceSnapshot = {
    schemaVersion: "staffordos.professional.canonical_career_evidence.v1",
    id: evidenceId,
    workspaceId: "professional",
    evidenceType: "CERTIFICATION_RECORD",
    title: `${input.issuingOrganization} credential certificate`,
    summary: "Official credential certificate reviewed privately by Ross. Sensitive credential values remain owner-private.",
    sourceType: "CERTIFICATION_RECORD",
    sourceReference: "owner-private-official-credential-certificate",
    sourceArtifact: null,
    sourceOwner: input.issuingOrganization,
    observedAt: input.decision.createdAt,
    sourceCreatedAt: input.originalGrantDate,
    authorityClassification: "OFFICIAL_DOCUMENT",
    privacyClassification: "Professional owner-private",
    freshness: "Current",
    supportsFactIds: [input.decision.canonicalCareerFactId],
    challengesFactIds: [],
    contentDigest: "OFFICIAL_DOCUMENT_REVIEWED_NO_CONTENT_DIGEST_RECORDED",
    excerptReference: "Official credential certificate reviewed privately; sensitive values are not exposed in repository or CLI summaries.",
    limitations: [
      "This evidence verifies only the named credential and documented credential metadata.",
      "It does not verify employment history, education, titles, years of experience, metrics, production use, customer use, or employer responsibilities.",
      "Credential status requires renewal review after the expiration date.",
      input.evidenceReviewed,
    ],
    operatorReviewStatus: "Ross confirmed",
    canonical: true,
    privateRecord: true,
    testOnly: false,
  };
  const fact: CanonicalCareerFactSnapshot = {
    schemaVersion: HIGH_VALUE_CANONICAL_CAREER_FACT_SCHEMA_VERSION,
    id: input.decision.canonicalCareerFactId,
    workspaceId: "professional",
    factType: "CERTIFICATION",
    subject: input.holderName,
    statement,
    normalizedStatement: normalizeStatement(statement),
    startDate: input.originalGrantDate,
    endDate: input.expirationDate,
    current: true,
    organization: input.issuingOrganization,
    roleOrTitle: null,
    location: null,
    classification: input.decision.category,
    supportLevel: "DIRECT",
    verificationStatus: "VERIFIED",
    authorityClassification: "OFFICIAL_DOCUMENT",
    privacyClassification: "Professional owner-private",
    sourceEvidenceIds: [evidence.id],
    conflictingEvidenceIds: [],
    conflictTypes: [],
    metricClassification: "NOT_APPLICABLE",
    measurementAuthority: null,
    experienceClassification: null,
    proficiencyLabel: null,
    yearsOfExperience: null,
    yearsAuthority: null,
    deploymentClaim: "NOT_APPLICABLE",
    customerUseClaim: "NONE",
    technologyOrSkill: input.credentialName,
    credentialDetails: {
      credentialName: input.credentialName,
      holderName: input.holderName,
      issuingOrganization: input.issuingOrganization,
      credentialNumber: input.credentialNumber,
      originalGrantDate: input.originalGrantDate,
      expirationDate: input.expirationDate,
    },
    limitations: [
      input.decision.limitation,
      "Do not infer years of project management experience from this credential.",
      "Do not infer employment history, titles, employer responsibilities, production use, customer use, or metrics from this credential.",
      "Credential status must be reviewed before use after the expiration date.",
    ],
    operatorNotes: null,
    positioningBoundaries: [
      {
        statement,
        sourceFactIds: [],
        positioningState: "APPROVED_FOR_USE",
        changesMeaning: false,
        limitation: input.decision.limitation,
      },
    ],
    sourceCandidateFactIds: [],
    sourceDecisionIds: [input.decision.decisionId],
    category: input.decision.category,
    createdAt: input.decision.createdAt,
    updatedAt: input.decision.createdAt,
    canonical: true,
    privateRecord: true,
    testOnly: false,
  };
  return { fact, evidence };
}

export function finalizeHighValueCareerFactVerificationWithPromotedRecords(options: {
  analysis: LoadedAnalysis;
  careerStore: LoadedCareerStore;
  promotedFacts: readonly CanonicalCareerFactSnapshot[];
  canonicalEvidence: readonly CanonicalCareerEvidenceSnapshot[];
  decisions: readonly HighValueCareerFactVerificationDecision[];
  generatedAt: string;
}) {
  const beforeModel = buildExplainableJobPositioningModel({
    analysis: options.analysis,
    facts: positioningFacts(options.careerStore.facts),
    evidence: positioningEvidence(options.careerStore.evidence),
    generatedAt: options.generatedAt,
  });
  const regeneratedBundle = applyPromotedFacts({
    previous: options.analysis,
    careerStore: options.careerStore,
    promotedFacts: options.promotedFacts,
    canonicalEvidence: options.canonicalEvidence,
    generatedAt: options.generatedAt,
  });
  const afterAnalysis = {
    metadata: options.analysis.metadata,
    bundle: regeneratedBundle,
  };
  const afterModel = buildExplainableJobPositioningModel({
    analysis: afterAnalysis,
    facts: positioningFacts([...options.careerStore.facts, ...options.promotedFacts]),
    evidence: positioningEvidence([...options.careerStore.evidence, ...options.canonicalEvidence]),
    generatedAt: options.generatedAt,
  });
  const report: HighValueVerificationChangeReport = {
    schemaVersion: HIGH_VALUE_VERIFICATION_AUDIT_SCHEMA_VERSION,
    workflowVersion: HIGH_VALUE_CAREER_FACT_VERIFICATION_VERSION,
    previousAnalysisRunId: options.analysis.metadata.analysisRunId,
    regeneratedAnalysisRunId: null,
    generatedAt: options.generatedAt,
    decisionsApplied: options.decisions.length,
    canonicalFactsPromoted: options.promotedFacts.length,
    coverageBefore: summarizeMappingCoverage(options.analysis.bundle.mappings),
    coverageAfter: summarizeMappingCoverage(regeneratedBundle.mappings),
    mappingChanges: mappingChanges(options.analysis.bundle, regeneratedBundle),
    positioningBefore: positioningSummary(beforeModel),
    positioningAfter: positioningSummary(afterModel),
    safeResumeLanguage: afterModel.resumePositioningRecommendations
      .filter((item) => item.confidence === "HIGH" || item.confidence === "MEDIUM")
      .map((item) => item.recommendedPositioning)
      .slice(0, 8),
    safeInterviewClaims: afterModel.interviewGuidance
      .filter((item) => !/not yet strong enough/i.test(item.honestyBoundary))
      .map((item) => `${item.capability}: ${item.honestyBoundary}`)
      .slice(0, 8),
    remainingBlockedClaims: afterModel.explainableFitSummary.highRiskClaimsToAvoid.slice(0, 12),
    noApplicationSubmitted: true,
    noMessageSent: true,
    noResumeMutated: true,
    noLinkedInMutated: true,
    noExternalAi: true,
    noOllama: true,
  };
  return { regeneratedBundle, beforeModel, afterModel, report };
}

function applyPromotedFacts(input: {
  previous: LoadedAnalysis;
  careerStore: LoadedCareerStore;
  promotedFacts: readonly CanonicalCareerFactSnapshot[];
  canonicalEvidence?: readonly CanonicalCareerEvidenceSnapshot[];
  generatedAt: string;
}): PrivateJobAnalysisBundle {
  const promotedEvidenceIds = new Set(input.promotedFacts.flatMap((fact) => sourceEvidenceIds(fact)));
  const overlayEvidence = [
    ...input.careerStore.evidence.filter((record) => promotedEvidenceIds.has(evidenceId(record))),
    ...(input.canonicalEvidence || []),
  ];
  const overlayMappings = mapRequirementsToCareerEvidence({
    requirements: input.previous.bundle.requirements,
    careerFacts: mapperFacts(input.promotedFacts),
    careerEvidence: mapperEvidence(overlayEvidence),
    createdAt: input.generatedAt,
  });
  const overlayByRequirement = new Map(overlayMappings.map((mapping) => [mapping.requirementId, mapping]));
  const strength: Record<string, number> = { PROVEN: 5, PARTIAL: 4, TRANSFERABLE: 3, UNKNOWN: 2, MISSING: 1 };
  const updatedMappings = input.previous.bundle.mappings.map((current) => {
    const overlay = overlayByRequirement.get(current.requirementId);
    if (!overlay) return current;
    if (!["PROVEN", "PARTIAL", "TRANSFERABLE"].includes(overlay.classification)) return current;
    if ((strength[overlay.classification] || 0) <= (strength[current.classification] || 0)) return current;
    return {
      ...current,
      ...overlay,
      id: current.id,
      jobOpportunityId: current.jobOpportunityId,
      supportLimitations: unique([...current.supportLimitations, ...overlay.supportLimitations]),
      prohibitedOverstatement: unique([...current.prohibitedOverstatement, ...overlay.prohibitedOverstatement]),
      matchedSignals: unique([...current.matchedSignals, ...overlay.matchedSignals]).slice(0, 10),
      privateRecord: true as const,
      testOnly: false as const,
    };
  });
  const fitAssessment = buildPrivateJobFitAssessment({
    opportunityId: input.previous.bundle.opportunity.id,
    requirements: input.previous.bundle.requirements,
    mappings: updatedMappings,
    applicationEvent: input.previous.bundle.applicationEvent,
    createdAt: input.generatedAt,
  });
  const reviewQueue = buildPrivateJobAnalysisReviewQueue(input.previous.bundle.requirements, updatedMappings);
  const positioningBrief = buildPrivateJobPositioningBrief({
    opportunityId: input.previous.bundle.opportunity.id,
    requirements: input.previous.bundle.requirements,
    mappings: updatedMappings,
    reviewQueue,
    createdAt: input.generatedAt,
  });
  const nextAction = buildPrivateJobAnalysisNextAction({
    opportunityId: input.previous.bundle.opportunity.id,
    fitAssessment,
    reviewQueue,
  });
  const auditSummary: PrivateJobAnalysisAuditSummary = {
    ...input.previous.bundle.auditSummary,
    generatedAt: input.generatedAt,
    workflowVersion: "J001.03A",
    summary: {
      requirementCount: input.previous.bundle.requirements.length,
      mappingCount: updatedMappings.length,
      reviewQuestionCount: reviewQueue.length,
      finalRecommendation: fitAssessment.finalRecommendation,
    },
  };
  return {
    ...input.previous.bundle,
    workflowVersion: "J001.03A",
    mappings: updatedMappings,
    fitAssessment,
    positioningBrief,
    reviewQueue,
    nextAction,
    auditSummary,
  };
}

function positioningSummary(model: ReturnType<typeof buildExplainableJobPositioningModel>) {
  return {
    automaticallyReusable: model.reusabilityReport.automaticallyReusable,
    reusableWithReview: model.reusabilityReport.reusableWithReview,
    verifiedStrengths: model.explainableFitSummary.verifiedStrengths,
    transferableStrengths: model.explainableFitSummary.transferableStrengths,
  };
}

function mappingChanges(before: PrivateJobAnalysisBundle, after: PrivateJobAnalysisBundle) {
  const beforeMap = new Map(before.mappings.map((mapping) => [mapping.requirementId, mapping]));
  return after.mappings.flatMap((mapping) => {
    const previous = beforeMap.get(mapping.requirementId);
    if (!previous || previous.classification === mapping.classification) return [];
    return [
      {
        requirementId: mapping.requirementId,
        before: previous.classification,
        after: mapping.classification,
        reason: "S010.02E added owner-private canonical Career fact authority.",
      },
    ];
  });
}

export function finalizeHighValueCareerFactVerification(options: {
  analysis: LoadedAnalysis;
  careerStore: LoadedCareerStore;
  candidates: readonly HighValueCareerFactCandidate[];
  decisions: readonly HighValueCareerFactVerificationDecision[];
  canonicalEvidence?: readonly CanonicalCareerEvidenceSnapshot[];
  generatedAt: string;
}) {
  const latest = latestDecisionByCandidate(options.decisions);
  const sourceFacts = rawFactById(options.careerStore.facts);
  const canonicalEvidence = options.canonicalEvidence || [];
  const promotedFacts = options.candidates.flatMap((candidate) => {
    const decision = latest.get(candidate.candidateId);
    const sourceFact = sourceFacts.get(candidate.sourceFactId);
    if (!decision || !sourceFact) return [];
    const promoted = buildCanonicalCareerFactSnapshot({ sourceFact, candidate, decision });
    return promoted ? [promoted] : [];
  });
  const beforeModel = buildExplainableJobPositioningModel({
    analysis: options.analysis,
    facts: positioningFacts(options.careerStore.facts),
    evidence: positioningEvidence(options.careerStore.evidence),
    generatedAt: options.generatedAt,
  });
  const regeneratedBundle = applyPromotedFacts({
    previous: options.analysis,
    careerStore: options.careerStore,
    promotedFacts,
    canonicalEvidence,
    generatedAt: options.generatedAt,
  });
  const afterAnalysis = {
    metadata: options.analysis.metadata,
    bundle: regeneratedBundle,
  };
  const afterModel = buildExplainableJobPositioningModel({
    analysis: afterAnalysis,
    facts: positioningFacts([...options.careerStore.facts, ...promotedFacts]),
    evidence: positioningEvidence([...options.careerStore.evidence, ...canonicalEvidence]),
    generatedAt: options.generatedAt,
  });
  const report: HighValueVerificationChangeReport = {
    schemaVersion: HIGH_VALUE_VERIFICATION_AUDIT_SCHEMA_VERSION,
    workflowVersion: HIGH_VALUE_CAREER_FACT_VERIFICATION_VERSION,
    previousAnalysisRunId: options.analysis.metadata.analysisRunId,
    regeneratedAnalysisRunId: null,
    generatedAt: options.generatedAt,
    decisionsApplied: options.decisions.length,
    canonicalFactsPromoted: promotedFacts.length,
    coverageBefore: summarizeMappingCoverage(options.analysis.bundle.mappings),
    coverageAfter: summarizeMappingCoverage(regeneratedBundle.mappings),
    mappingChanges: mappingChanges(options.analysis.bundle, regeneratedBundle),
    positioningBefore: positioningSummary(beforeModel),
    positioningAfter: positioningSummary(afterModel),
    safeResumeLanguage: afterModel.resumePositioningRecommendations
      .filter((item) => item.confidence === "HIGH" || item.confidence === "MEDIUM")
      .map((item) => item.recommendedPositioning)
      .slice(0, 8),
    safeInterviewClaims: afterModel.interviewGuidance
      .filter((item) => !/not yet strong enough/i.test(item.honestyBoundary))
      .map((item) => `${item.capability}: ${item.honestyBoundary}`)
      .slice(0, 8),
    remainingBlockedClaims: afterModel.explainableFitSummary.highRiskClaimsToAvoid.slice(0, 12),
    noApplicationSubmitted: true,
    noMessageSent: true,
    noResumeMutated: true,
    noLinkedInMutated: true,
    noExternalAi: true,
    noOllama: true,
  };
  return { promotedFacts, regeneratedBundle, beforeModel, afterModel, report };
}

export function writeHighValueCareerFactVerificationOutputs(options: {
  outputRoot: string;
  analysisOutputRoot: string;
  positioningOutputRoot: string;
  repositoryRoot: string;
  analysis: LoadedAnalysis;
  promotedFacts: readonly CanonicalCareerFactSnapshot[];
  canonicalEvidence?: readonly CanonicalCareerEvidenceSnapshot[];
  regeneratedBundle: PrivateJobAnalysisBundle;
  positioningModel: ReturnType<typeof buildExplainableJobPositioningModel>;
  report: HighValueVerificationChangeReport;
}) {
  assertOutsideRepository(options.outputRoot, options.repositoryRoot, "Private S010.02E output root");
  assertOutsideRepository(options.analysisOutputRoot, options.repositoryRoot, "Private Job Analysis output root");
  assertOutsideRepository(options.positioningOutputRoot, options.repositoryRoot, "Private positioning output root");
  const runDirectory = path.join(
    options.outputRoot,
    options.analysis.metadata.analysisRunId,
    `s010_02e_${compactDate(options.report.generatedAt)}`,
  );
  ensurePrivateDirectory(runDirectory);
  writeJson(path.join(runDirectory, "canonical_career_facts.private.json"), options.promotedFacts);
  writeJson(path.join(runDirectory, "canonical_career_evidence.private.json"), options.canonicalEvidence || []);
  writeJson(path.join(runDirectory, "verification_audit.private.json"), options.report);
  writeJson(
    path.join(runDirectory, "unresolved_conflicts.private.json"),
    options.promotedFacts.filter((fact) => fact.verificationStatus === "CONFLICTING"),
  );
  writeText(
    path.join(runDirectory, "summary.private.md"),
    [
      "# S010.02E High-Value Career Fact Verification",
      "",
      "Owner-private local artifact. Not connected to /os or /operator.",
      "",
      `Generated: ${options.report.generatedAt}`,
      `Canonical facts promoted: ${options.promotedFacts.length}`,
      `Coverage before: ${JSON.stringify(options.report.coverageBefore)}`,
      `Coverage after: ${JSON.stringify(options.report.coverageAfter)}`,
      "",
      "No application, message, resume, LinkedIn, provider, external AI, or Ollama action was performed.",
      "",
    ].join("\n"),
  );
  const analysisWrite = writePrivateJobAnalysisBundle(options.regeneratedBundle, {
    outputRoot: options.analysisOutputRoot,
    repositoryRoot: options.repositoryRoot,
  });
  const regeneratedAnalysisRunId = `privjobanalysis_${sha256Text(path.resolve(analysisWrite.runDirectory)).slice(0, 18)}`;
  const report = { ...options.report, regeneratedAnalysisRunId };
  writeJson(path.join(runDirectory, "verification_audit.private.json"), report);
  const positioningWrite = writeExplainableJobPositioningOutput({
    model: { ...options.positioningModel, analysisRunId: regeneratedAnalysisRunId },
    outputRoot: options.positioningOutputRoot,
    repositoryRoot: options.repositoryRoot,
  });
  return {
    privatePathVisible: false as const,
    outputArtifactCount: 5,
    promotedFactCount: options.promotedFacts.length,
    regeneratedAnalysisRunId,
    coverageBefore: report.coverageBefore,
    coverageAfter: report.coverageAfter,
    mappingChanges: report.mappingChanges,
    positioningBefore: report.positioningBefore,
    positioningAfter: report.positioningAfter,
    safeResumeLanguage: report.safeResumeLanguage,
    safeInterviewClaims: report.safeInterviewClaims,
    remainingBlockedClaims: report.remainingBlockedClaims,
    analysisArtifactCount: analysisWrite.privateArtifactNames.length,
    positioningArtifactCount: positioningWrite.artifactNames.length,
  };
}

export function buildHighValueCliSummary(input: {
  candidates: readonly HighValueCareerFactCandidate[];
  decisions: readonly HighValueCareerFactVerificationDecision[];
}) {
  const latest = latestDecisionByCandidate(input.decisions);
  return {
    candidateCount: input.candidates.length,
    answeredCount: input.candidates.filter((candidate) => latest.has(candidate.candidateId)).length,
    remainingCount: input.candidates.filter((candidate) => !latest.has(candidate.candidateId)).length,
    candidates: input.candidates.map((candidate) => ({
      candidateId: candidate.candidateId,
      category: candidate.category,
      statement: candidate.canonicalStatement,
      currentVerificationStatus: candidate.currentVerificationStatus,
      currentAuthorityClassification: candidate.currentAuthorityClassification,
      proposedAuthorityStatus: candidate.proposedAuthorityStatus,
      supportingEvidenceCount: candidate.supportingEvidence.length,
      allowedOutcomes: candidate.allowedOutcomes,
      whyHighValue: candidate.whyHighValue,
      whatEvidenceWouldImproveIt: candidate.whatEvidenceWouldImproveIt,
      limitation: candidate.limitation,
      decisionOutcome: latest.get(candidate.candidateId)?.outcome || null,
    })),
    privatePathVisible: false,
  };
}
