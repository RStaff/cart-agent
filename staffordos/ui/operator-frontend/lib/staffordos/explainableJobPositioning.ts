import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import type { PrivateRequirementEvidenceMapping, RequirementEvidenceClassification } from "./candidateEvidenceMapper";
import { summarizeMappingCoverage } from "./candidateEvidenceMapper";
import type { PrivateJobRequirementRecord } from "./jobRequirementExtractor";
import {
  loadPrivateCareerEvidenceStore,
  loadRoleFocusedAnalysis,
  type CareerCandidateFactSummary,
  type CareerEvidenceSummary,
} from "./roleFocusedCareerEvidenceReview";

export const EXPLAINABLE_JOB_POSITIONING_VERSION = "J001.04";
export const EXPLAINABLE_JOB_POSITIONING_SCHEMA_VERSION =
  "staffordos.job_search.explainable_positioning_model.v1";

export const POSITIONING_CATEGORIES = [
  "AI Product",
  "AI Governance",
  "AI Automation",
  "Digital Transformation",
  "Technical Program Management",
  "Marketing Technology",
  "DevOps",
  "Platform Operations",
  "Customer Discovery",
  "Stakeholder Management",
  "Leadership",
  "Data",
  "Analytics",
  "Automation",
] as const;

export type PositioningCategory = (typeof POSITIONING_CATEGORIES)[number];
export type PositioningConfidence = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
export type PositioningRisk = "LOW" | "MODERATE" | "HIGH";

export type ExplainablePositioningCard = {
  cardId: string;
  capability: PositioningCategory;
  supportingEvidence: Array<{
    requirementId: string;
    careerFactIds: string[];
    careerEvidenceIds: string[];
    evidenceClassification: RequirementEvidenceClassification;
    safeEvidenceSummary: string[];
    evidenceAuthority: string[];
    limitations: string[];
  }>;
  evidenceClassification: RequirementEvidenceClassification | "MIXED";
  businessValue: string;
  suggestedResumeWording: string;
  suggestedInterviewWording: string;
  suggestedRecruiterWording: string;
  confidence: PositioningConfidence;
  riskLevel: PositioningRisk;
  prohibitedWording: string[];
  interviewTalkingPoints: string[];
  recruiterSummary: string;
  suitableRoleFamilies: string[];
  reusableAcrossFutureRoles: boolean;
};

export type ExplainableFitSummary = {
  strengths: string[];
  transferableStrengths: string[];
  verifiedStrengths: string[];
  remainingEvidenceGaps: string[];
  highRiskClaimsToAvoid: string[];
  suitableRoleFamilies: string[];
  unsuitableRoleFamilies: string[];
  recommendation: string;
  recommendationExplanation: string;
  coverage: ReturnType<typeof summarizeMappingCoverage>;
};

export type ResumePositioningRecommendation = {
  capability: PositioningCategory;
  currentPositioning: string;
  recommendedPositioning: string;
  reason: string;
  supportingEvidence: string[];
  confidence: PositioningConfidence;
  finalResumeModified: false;
};

export type InterviewGuidance = {
  capability: PositioningCategory;
  starOutline: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  supportingEvidence: string[];
  expectedFollowUpQuestions: string[];
  honestyBoundary: string;
};

export type ExplainableJobPositioningModel = {
  schemaVersion: typeof EXPLAINABLE_JOB_POSITIONING_SCHEMA_VERSION;
  workflowVersion: typeof EXPLAINABLE_JOB_POSITIONING_VERSION;
  analysisRunId: string;
  opportunityId: string;
  generatedAt: string;
  surface: "OWNER_PRIVATE_LOCAL_CLI";
  explainableFitSummary: ExplainableFitSummary;
  positioningKnowledgeBase: Record<PositioningCategory, ExplainablePositioningCard[]>;
  positioningCards: ExplainablePositioningCard[];
  resumePositioningRecommendations: ResumePositioningRecommendation[];
  linkedInPositioningGuidance: ResumePositioningRecommendation[];
  interviewGuidance: InterviewGuidance[];
  recruiterTalkingPoints: Array<{
    capability: PositioningCategory;
    talkingPoint: string;
    confidence: PositioningConfidence;
    riskLevel: PositioningRisk;
  }>;
  reusabilityReport: {
    automaticallyReusable: string[];
    reusableWithReview: string[];
    blockedUntilEvidenceExists: string[];
    futureRoleFamilies: string[];
  };
  safety: {
    privateRecord: true;
    privatePathVisible: false;
    noApplicationSubmitted: true;
    noMessageSent: true;
    noResumeMutated: true;
    noLinkedInMutated: true;
    noPublicArtifactCreated: true;
    noExternalAi: true;
    noOllama: true;
    noProviderFetch: true;
    notConnectedToOs: true;
    notConnectedToOperator: true;
    noEmployerSuccessProbability: true;
  };
};

type LoadedAnalysis = ReturnType<typeof loadRoleFocusedAnalysis>;
type AnyRecord = Record<string, unknown>;

const CATEGORY_SIGNALS: Record<PositioningCategory, RegExp[]> = {
  "AI Product": [/\bai\b/i, /\bllm\b/i, /\bagent/i, /\bproduct\b/i, /\broadmap\b/i, /\bcustomer experience\b/i],
  "AI Governance": [/\bgovernance\b/i, /\bguardrail/i, /\bevaluation/i, /\brisk\b/i, /\bstandard/i, /\bpolicy\b/i],
  "AI Automation": [/\bai\b/i, /\bagent/i, /\bautomation\b/i, /\bprompt/i, /\bchatbot\b/i, /\bcomputer[- ]use\b/i],
  "Digital Transformation": [/\bdigital\b/i, /\btransformation\b/i, /\bmodern/i, /\bplatform\b/i, /\bprocess\b/i],
  "Technical Program Management": [/\bprogram\b/i, /\bproject\b/i, /\broadmap\b/i, /\brollout\b/i, /\btradeoff/i, /\bcross-functional\b/i],
  "Marketing Technology": [/\bmarketing\b/i, /\bmartech\b/i, /\bsalesforce\b/i, /\bcampaign\b/i, /\bcrm\b/i],
  DevOps: [/\bdevops\b/i, /\bci\/cd\b/i, /\bpipeline\b/i, /\bdeployment\b/i, /\brelease\b/i],
  "Platform Operations": [/\bplatform\b/i, /\barchitecture\b/i, /\bapi\b/i, /\bkubernetes\b/i, /\binfrastructure\b/i, /\bstandard/i],
  "Customer Discovery": [/\bcustomer\b/i, /\bdiscovery\b/i, /\buser\b/i, /\brequirements?\b/i, /\bservice request/i],
  "Stakeholder Management": [/\bstakeholder/i, /\btranslator\b/i, /\borganization\b/i, /\bcommunication\b/i, /\bpartner\b/i],
  Leadership: [/\blead\b/i, /\bowner\b/i, /\bmanage\b/i, /\bteam\b/i, /\bdecision\b/i],
  Data: [/\bdata\b/i, /\bdataset\b/i, /\bkpi\b/i, /\bmetrics?\b/i],
  Analytics: [/\banalytics?\b/i, /\breporting\b/i, /\bdashboard\b/i, /\bmeasurement\b/i],
  Automation: [/\bautomation\b/i, /\bautomated\b/i, /\bworkflow\b/i, /\borchestrat/i],
};

const FUTURE_ROLE_FAMILIES = [
  "AI Product",
  "AI Platform",
  "AI Governance",
  "AI Operations",
  "Technical Product Manager",
  "Technical Program Manager",
  "Marketing Technology",
  "Automation",
];

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
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

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  chmodSync(filePath, 0o600);
}

function writeText(filePath: string, value: string) {
  writeFileSync(filePath, value, "utf8");
  chmodSync(filePath, 0o600);
}

function compactDate(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 14) || sha256Text(value).slice(0, 12);
}

function requirementById(requirements: readonly PrivateJobRequirementRecord[]) {
  return new Map(requirements.map((requirement) => [requirement.id, requirement]));
}

function factById(facts: readonly CareerCandidateFactSummary[]) {
  return new Map(facts.map((fact) => [fact.id, fact]));
}

function evidenceById(evidence: readonly CareerEvidenceSummary[]) {
  return new Map(evidence.map((item) => [item.id, item]));
}

function evidenceTextFor(mapping: PrivateRequirementEvidenceMapping, facts: readonly CareerCandidateFactSummary[]) {
  if (!facts.length) return ["No supporting Career fact is currently available."];
  return facts.slice(0, 3).map((fact) => {
    const statement = fact.statement.length > 180 ? `${fact.statement.slice(0, 177)}...` : fact.statement;
    return `${statement} (${fact.verificationStatus}; ${fact.authorityClassification})`;
  });
}

function categoriesFor(requirement: PrivateJobRequirementRecord, mapping: PrivateRequirementEvidenceMapping, facts: readonly CareerCandidateFactSummary[]) {
  const text = [
    requirement.requirementText,
    requirement.requirementCategory,
    requirement.technologyOrSkill,
    requirement.responsibilityOrQualification,
    mapping.safePositioning,
    mapping.matchedSignals.join(" "),
    facts.map((fact) => fact.statement).join(" "),
  ]
    .filter(Boolean)
    .join(" ");
  const categories = POSITIONING_CATEGORIES.filter((category) => CATEGORY_SIGNALS[category].some((signal) => signal.test(text)));
  return categories.length ? categories : ["Technical Program Management" as const];
}

function confidenceFor(classifications: readonly RequirementEvidenceClassification[]): PositioningConfidence {
  if (classifications.includes("PROVEN")) return "HIGH";
  if (classifications.includes("PARTIAL")) return "MEDIUM";
  if (classifications.includes("TRANSFERABLE")) return "LOW";
  return "INSUFFICIENT";
}

function riskFor(confidence: PositioningConfidence, classifications: readonly RequirementEvidenceClassification[]): PositioningRisk {
  if (classifications.includes("UNKNOWN") || classifications.includes("MISSING")) return "HIGH";
  if (confidence === "LOW" || classifications.includes("TRANSFERABLE")) return "MODERATE";
  return "LOW";
}

function dominantClassification(classifications: readonly RequirementEvidenceClassification[]) {
  const unique = [...new Set(classifications)];
  return unique.length === 1 ? unique[0] : "MIXED";
}

function businessValue(category: PositioningCategory) {
  const values: Record<PositioningCategory, string> = {
    "AI Product": "Connect product intent, customer needs, and technical execution without overstating direct AI ownership.",
    "AI Governance": "Help teams make AI work reviewable, safer, and operationally disciplined.",
    "AI Automation": "Translate automation opportunities into governed workflows and careful operational improvements.",
    "Digital Transformation": "Move business processes from fragmented manual work toward structured digital operating systems.",
    "Technical Program Management": "Coordinate technical delivery, tradeoffs, stakeholders, and rollout discipline.",
    "Marketing Technology": "Bridge marketing operations, platforms, analytics, and business execution.",
    DevOps: "Understand delivery pipelines and platform constraints enough to coordinate technical programs honestly.",
    "Platform Operations": "Frame platform standards, architecture conversations, and operating discipline as adjacent strengths.",
    "Customer Discovery": "Connect requirements, user needs, and customer-facing operational signals to product decisions.",
    "Stakeholder Management": "Translate between technical and business groups while preserving scope and decision clarity.",
    Leadership: "Coordinate people, priorities, and decisions without inventing management authority.",
    Data: "Use data context and measurement discipline without inventing metrics.",
    Analytics: "Turn reporting and analytics context into practical business operating insight.",
    Automation: "Use process automation experience as a transferable lane into AI operations.",
  };
  return values[category];
}

function wordingFor(category: PositioningCategory, confidence: PositioningConfidence) {
  if (confidence === "HIGH" || confidence === "MEDIUM") {
    return `Evidence-backed ${category} capability; describe only the scope, systems, outcomes, and authority directly supported by Career evidence.`;
  }
  if (confidence === "LOW") {
    return `Transferable ${category} positioning: adjacent program, platform, automation, or stakeholder work that may support this role family, but do not claim direct same-role ownership.`;
  }
  return `Do not position ${category} as a strength yet; collect direct evidence before using it in resumes, interviews, LinkedIn, or recruiter conversations.`;
}

function prohibitedWording(category: PositioningCategory, classifications: readonly RequirementEvidenceClassification[]) {
  const prohibited = [
    "Do not infer years of experience.",
    "Do not invent metrics, titles, dates, certifications, employers, or outcomes.",
    "Do not convert resume wording alone into verified fact.",
    "Do not convert local testing or repository presence into production or customer use.",
    "Do not claim ownership, deployment, or authority that is not directly supported.",
  ];
  if (classifications.includes("TRANSFERABLE")) prohibited.push(`Do not say direct ${category} ownership; say transferable or adjacent experience.`);
  if (classifications.includes("UNKNOWN") || classifications.includes("MISSING")) prohibited.push(`Do not use unresolved ${category} claims as resume facts.`);
  return prohibited;
}

function cardFor(input: {
  category: PositioningCategory;
  analysis: LoadedAnalysis;
  requirements: Map<string, PrivateJobRequirementRecord>;
  mappings: readonly PrivateRequirementEvidenceMapping[];
  facts: Map<string, CareerCandidateFactSummary>;
  evidence: Map<string, CareerEvidenceSummary>;
}): ExplainablePositioningCard {
  const classifications = input.mappings.map((mapping) => mapping.classification);
  const confidence = confidenceFor(classifications);
  const riskLevel = riskFor(confidence, classifications);
  const supportingEvidence = input.mappings.slice(0, 6).map((mapping) => {
    const facts = mapping.careerFactIds.flatMap((id) => {
      const fact = input.facts.get(id);
      return fact ? [fact] : [];
    });
    const evidence = mapping.careerEvidenceIds.flatMap((id) => {
      const record = input.evidence.get(id);
      return record ? [record] : [];
    });
    return {
      requirementId: mapping.requirementId,
      careerFactIds: mapping.careerFactIds,
      careerEvidenceIds: mapping.careerEvidenceIds,
      evidenceClassification: mapping.classification,
      safeEvidenceSummary: evidenceTextFor(mapping, facts),
      evidenceAuthority: [...new Set([...facts.map((fact) => fact.authorityClassification), ...evidence.map((record) => record.authorityClassification)])],
      limitations: [...new Set([...mapping.supportLimitations, ...facts.flatMap((fact) => fact.limitations), ...evidence.flatMap((record) => record.limitations)])].slice(0, 8),
    };
  });
  const suggested = wordingFor(input.category, confidence);
  const cardId = `j00104card_${sha256Text(`${input.analysis.metadata.analysisRunId}|${input.category}`).slice(0, 18)}`;
  return {
    cardId,
    capability: input.category,
    supportingEvidence,
    evidenceClassification: dominantClassification(classifications),
    businessValue: businessValue(input.category),
    suggestedResumeWording: suggested,
    suggestedInterviewWording:
      confidence === "INSUFFICIENT"
        ? `Acknowledge that ${input.category} evidence is not yet strong enough for a direct claim.`
        : `Use a specific Career evidence story for ${input.category}; state what Ross did, what evidence supports it, and where the experience is transferable rather than direct.`,
    suggestedRecruiterWording:
      confidence === "INSUFFICIENT"
        ? `${input.category} is an evidence gap right now; avoid leading with it.`
        : `Ross can discuss ${input.category} as ${confidence === "LOW" ? "a transferable" : "an evidence-backed"} capability, with careful scope boundaries.`,
    confidence,
    riskLevel,
    prohibitedWording: prohibitedWording(input.category, classifications),
    interviewTalkingPoints: [
      `Start with the evidence-supported part of ${input.category}.`,
      "Name the scope boundary before describing adjacent AI relevance.",
      "Use only verified metrics or omit metrics entirely.",
      "Separate professional use from local, repository, or learning work.",
    ],
    recruiterSummary:
      confidence === "LOW"
        ? `${input.category}: transferable signal only; useful for screening conversations but not proof of same-role ownership.`
        : `${input.category}: ${confidence.toLowerCase()} confidence based on current Career evidence classifications.`,
    suitableRoleFamilies: FUTURE_ROLE_FAMILIES.filter((role) => role.toLowerCase().includes(input.category.split(" ")[0].toLowerCase()) || input.category !== "Marketing Technology").slice(0, 6),
    reusableAcrossFutureRoles: confidence !== "INSUFFICIENT",
  };
}

function buildKnowledgeBase(cards: readonly ExplainablePositioningCard[]) {
  const base = {} as Record<PositioningCategory, ExplainablePositioningCard[]>;
  for (const category of POSITIONING_CATEGORIES) {
    base[category] = [];
  }
  for (const card of cards) {
    base[card.capability].push(card);
  }
  return base;
}

function buildInterviewGuidance(cards: readonly ExplainablePositioningCard[]): InterviewGuidance[] {
  return cards
    .filter((card) => card.evidenceClassification === "TRANSFERABLE" || card.confidence === "LOW")
    .map((card) => ({
      capability: card.capability,
      starOutline: {
        situation: `Choose a private Career evidence story where ${card.capability} was adjacent to the work.`,
        task: "Explain the business or operating problem without expanding the role beyond the evidence.",
        action: "Describe Ross's specific program, product, stakeholder, automation, or technical coordination actions.",
        result: "Use only supported outcomes; if no metric is verified, describe the operational change qualitatively.",
      },
      supportingEvidence: card.supportingEvidence.flatMap((item) => item.safeEvidenceSummary).slice(0, 4),
      expectedFollowUpQuestions: [
        "Was this production-used, customer-used, or local/internal only?",
        "What part did Ross personally own?",
        "What metrics are verified rather than estimated?",
        "Where does the experience transfer, and where is direct experience limited?",
      ],
      honestyBoundary: `Do not present ${card.capability} as direct same-role proof unless later evidence upgrades it beyond TRANSFERABLE.`,
    }));
}

function fitSummary(input: {
  analysis: LoadedAnalysis;
  cards: readonly ExplainablePositioningCard[];
}): ExplainableFitSummary {
  const coverage = summarizeMappingCoverage(input.analysis.bundle.mappings);
  const transferableCards = input.cards.filter((card) => card.confidence === "LOW");
  const verifiedCards = input.cards.filter((card) => card.confidence === "HIGH" || card.confidence === "MEDIUM");
  const gapMappings = input.analysis.bundle.mappings.filter((mapping) => mapping.classification === "UNKNOWN" || mapping.classification === "MISSING");
  return {
    strengths: input.cards.filter((card) => card.confidence !== "INSUFFICIENT").map((card) => card.capability),
    transferableStrengths: transferableCards.map((card) => card.capability),
    verifiedStrengths: verifiedCards.map((card) => card.capability),
    remainingEvidenceGaps: gapMappings.slice(0, 12).map((mapping) => mapping.requirementId),
    highRiskClaimsToAvoid: [
      ...input.cards.flatMap((card) => card.prohibitedWording).slice(0, 12),
      "Do not claim StaffordOS submitted, messaged, or modified anything for this application.",
    ],
    suitableRoleFamilies: FUTURE_ROLE_FAMILIES,
    unsuitableRoleFamilies: [
      "Roles requiring verified direct enterprise AI platform ownership when no direct evidence has been reviewed.",
      "Roles requiring proven production Kubernetes ownership if current evidence remains repository-backed or unresolved.",
      "Roles requiring verified certification, years, or metrics not yet supported by authority.",
    ],
    recommendation: input.analysis.bundle.fitAssessment.finalRecommendation,
    recommendationExplanation: input.analysis.bundle.fitAssessment.recommendationExplanation,
    coverage,
  };
}

function recommendations(cards: readonly ExplainablePositioningCard[], kind: "resume" | "linkedin"): ResumePositioningRecommendation[] {
  return cards.slice(0, 12).map((card) => ({
    capability: card.capability,
    currentPositioning: `${card.evidenceClassification} evidence classification with ${card.confidence} confidence.`,
    recommendedPositioning:
      kind === "linkedin"
        ? `${card.suggestedRecruiterWording} Keep it profile-level and avoid unverified specifics.`
        : card.suggestedResumeWording,
    reason: card.businessValue,
    supportingEvidence: card.supportingEvidence.flatMap((item) => item.safeEvidenceSummary).slice(0, 4),
    confidence: card.confidence,
    finalResumeModified: false,
  }));
}

export function buildExplainableJobPositioningModel(input: {
  analysis: LoadedAnalysis;
  facts: readonly CareerCandidateFactSummary[];
  evidence: readonly CareerEvidenceSummary[];
  generatedAt: string;
}): ExplainableJobPositioningModel {
  const requirements = requirementById(input.analysis.bundle.requirements);
  const facts = factById(input.facts);
  const evidence = evidenceById(input.evidence);
  const grouped = new Map<PositioningCategory, PrivateRequirementEvidenceMapping[]>();

  for (const mapping of input.analysis.bundle.mappings) {
    const requirement = requirements.get(mapping.requirementId);
    if (!requirement) continue;
    const mappingFacts = mapping.careerFactIds.flatMap((id) => {
      const fact = facts.get(id);
      return fact ? [fact] : [];
    });
    for (const category of categoriesFor(requirement, mapping, mappingFacts)) {
      const list = grouped.get(category) || [];
      list.push(mapping);
      grouped.set(category, list);
    }
  }

  const cards = [...grouped.entries()]
    .map(([category, mappings]) =>
      cardFor({
        category,
        analysis: input.analysis,
        requirements,
        mappings,
        facts,
        evidence,
      }),
    )
    .sort((a, b) => {
      const confidenceOrder: Record<PositioningConfidence, number> = { HIGH: 4, MEDIUM: 3, LOW: 2, INSUFFICIENT: 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence] || a.capability.localeCompare(b.capability);
    });
  const explainableFitSummary = fitSummary({ analysis: input.analysis, cards });

  return {
    schemaVersion: EXPLAINABLE_JOB_POSITIONING_SCHEMA_VERSION,
    workflowVersion: EXPLAINABLE_JOB_POSITIONING_VERSION,
    analysisRunId: input.analysis.metadata.analysisRunId,
    opportunityId: input.analysis.metadata.opportunityId,
    generatedAt: input.generatedAt,
    surface: "OWNER_PRIVATE_LOCAL_CLI",
    explainableFitSummary,
    positioningKnowledgeBase: buildKnowledgeBase(cards),
    positioningCards: cards,
    resumePositioningRecommendations: recommendations(cards, "resume"),
    linkedInPositioningGuidance: recommendations(cards, "linkedin"),
    interviewGuidance: buildInterviewGuidance(cards),
    recruiterTalkingPoints: cards.slice(0, 12).map((card) => ({
      capability: card.capability,
      talkingPoint: card.suggestedRecruiterWording,
      confidence: card.confidence,
      riskLevel: card.riskLevel,
    })),
    reusabilityReport: {
      automaticallyReusable: cards.filter((card) => card.confidence === "HIGH" || card.confidence === "MEDIUM").map((card) => card.capability),
      reusableWithReview: cards.filter((card) => card.confidence === "LOW").map((card) => card.capability),
      blockedUntilEvidenceExists: cards.filter((card) => card.confidence === "INSUFFICIENT").map((card) => card.capability),
      futureRoleFamilies: FUTURE_ROLE_FAMILIES,
    },
    safety: {
      privateRecord: true,
      privatePathVisible: false,
      noApplicationSubmitted: true,
      noMessageSent: true,
      noResumeMutated: true,
      noLinkedInMutated: true,
      noPublicArtifactCreated: true,
      noExternalAi: true,
      noOllama: true,
      noProviderFetch: true,
      notConnectedToOs: true,
      notConnectedToOperator: true,
      noEmployerSuccessProbability: true,
    },
  };
}

export function loadExplainableJobPositioningInputs(options: {
  analysisRoot: string;
  repositoryRoot: string;
  opportunityDirectory?: string | null;
  careerRoots: readonly string[];
  analysisRunId: string;
}) {
  const analysis = loadRoleFocusedAnalysis({
    analysisRoot: options.analysisRoot,
    repositoryRoot: options.repositoryRoot,
    opportunityDirectory: options.opportunityDirectory || null,
    analysisRunId: options.analysisRunId,
  });
  const careerStore = loadPrivateCareerEvidenceStore({
    careerRoots: options.careerRoots,
    repositoryRoot: options.repositoryRoot,
  });
  return { analysis, careerStore };
}

export function renderExplainablePositioningMarkdown(model: ExplainableJobPositioningModel) {
  const lines = [
    "# Explainable Fit and Positioning",
    "",
    `Generated: ${model.generatedAt}`,
    "",
    "Owner-private local artifact. Not connected to /os or /operator. No application, message, resume, LinkedIn, provider, or AI action was performed.",
    "",
    "## Explainable Fit Summary",
    "",
    `Recommendation: ${model.explainableFitSummary.recommendation}`,
    "",
    model.explainableFitSummary.recommendationExplanation,
    "",
    `Coverage: ${JSON.stringify(model.explainableFitSummary.coverage)}`,
    "",
    "## Positioning Cards",
    "",
  ];
  for (const card of model.positioningCards) {
    lines.push(
      `### ${card.capability}`,
      "",
      `Confidence: ${card.confidence}`,
      "",
      `Risk: ${card.riskLevel}`,
      "",
      `Evidence: ${card.evidenceClassification}`,
      "",
      `Resume: ${card.suggestedResumeWording}`,
      "",
      `Interview: ${card.suggestedInterviewWording}`,
      "",
      `Recruiter: ${card.suggestedRecruiterWording}`,
      "",
      `Avoid: ${card.prohibitedWording.join(" ")}`,
      "",
    );
  }
  return `${lines.join("\n")}\n`;
}

export function writeExplainableJobPositioningOutput(options: {
  model: ExplainableJobPositioningModel;
  outputRoot: string;
  repositoryRoot: string;
}) {
  assertOutsideRepository(options.outputRoot, options.repositoryRoot, "Private explainable positioning output root");
  const runDirectory = path.join(
    options.outputRoot,
    options.model.opportunityId,
    `j001_04_${compactDate(options.model.generatedAt)}`,
  );
  ensurePrivateDirectory(runDirectory);
  const artifacts: Record<string, unknown> = {
    "explainable_positioning_model.json": options.model,
    "explainable_fit_summary.json": options.model.explainableFitSummary,
    "positioning_cards.json": options.model.positioningCards,
    "positioning_knowledge_base.json": options.model.positioningKnowledgeBase,
    "resume_positioning_recommendations.json": options.model.resumePositioningRecommendations,
    "linkedin_positioning_guidance.json": options.model.linkedInPositioningGuidance,
    "interview_guidance.json": options.model.interviewGuidance,
    "recruiter_talking_points.json": options.model.recruiterTalkingPoints,
    "reusability_report.json": options.model.reusabilityReport,
  };
  const writtenArtifacts: string[] = [];
  for (const [name, value] of Object.entries(artifacts)) {
    const filePath = path.join(runDirectory, name);
    writeJson(filePath, value);
    writtenArtifacts.push(name);
  }
  writeText(path.join(runDirectory, "explainable_positioning_report.md"), renderExplainablePositioningMarkdown(options.model));
  writtenArtifacts.push("explainable_positioning_report.md");
  return {
    written: true,
    artifactNames: writtenArtifacts,
    privatePathVisible: false as const,
  };
}

export function buildCliSummary(model: ExplainableJobPositioningModel) {
  return {
    analysisRunId: model.analysisRunId,
    opportunityId: model.opportunityId,
    recommendation: model.explainableFitSummary.recommendation,
    coverage: model.explainableFitSummary.coverage,
    positioningCardCount: model.positioningCards.length,
    topCapabilities: model.positioningCards.slice(0, 8).map((card) => ({
      capability: card.capability,
      evidenceClassification: card.evidenceClassification,
      confidence: card.confidence,
      riskLevel: card.riskLevel,
    })),
    verifiedStrengths: model.explainableFitSummary.verifiedStrengths,
    transferableStrengths: model.explainableFitSummary.transferableStrengths.slice(0, 10),
    remainingEvidenceGapCount: model.explainableFitSummary.remainingEvidenceGaps.length,
    reusableWithReview: model.reusabilityReport.reusableWithReview,
    automaticallyReusable: model.reusabilityReport.automaticallyReusable,
    blockedUntilEvidenceExists: model.reusabilityReport.blockedUntilEvidenceExists,
    safety: model.safety,
  };
}

export function assertNoForbiddenPositioningUpgrade(model: ExplainableJobPositioningModel) {
  const originalMappings = model.positioningCards.flatMap((card) => card.supportingEvidence);
  for (const evidence of originalMappings) {
    if (evidence.evidenceClassification === "UNKNOWN" || evidence.evidenceClassification === "MISSING") {
      const card = model.positioningCards.find((candidate) => candidate.supportingEvidence.includes(evidence));
      if (card?.confidence === "HIGH" || card?.confidence === "MEDIUM") {
        throw new Error("UNKNOWN_OR_MISSING_POSITIONING_UPGRADED");
      }
    }
    if (evidence.evidenceClassification === "TRANSFERABLE") {
      const card = model.positioningCards.find((candidate) => candidate.supportingEvidence.includes(evidence));
      if (card?.evidenceClassification === "PROVEN") {
        throw new Error("TRANSFERABLE_POSITIONING_UPGRADED_TO_PROVEN");
      }
    }
  }
}

export function isJsonRecord(value: unknown): value is AnyRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
