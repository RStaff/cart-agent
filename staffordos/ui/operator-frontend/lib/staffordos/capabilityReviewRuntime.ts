import * as path from "node:path";
import questionSet from "../../../../job-search/CAREEROS_V1_27A_ACTIVE_LEARNING_QUESTION_SET.json";
import graph from "../../../../job-search/CAREEROS_V1_27A_CAPABILITY_GRAPH.json";
import {
  activeCapabilityAdjudications,
  appendCapabilityAdjudicationDecision as appendCapabilityAdjudicationDecisionRaw,
  loadCapabilityAdjudicationDecisions,
} from "./careerOsV1_27AOfflineCapabilityGraph.mjs";

const appendCapabilityAdjudicationDecision = appendCapabilityAdjudicationDecisionRaw as any;

export const CAPABILITY_REVIEW_SET_ID = "V1_27A_CANONICAL_CAPABILITY_REVIEW";
export const CAPABILITY_GRAPH_VERSION = "CAREEROS_V1_27A_GRAPH_V1";

export type CapabilityReviewQuestion = {
  questionId: string;
  order: number;
  question: string;
  canonicalCapability: string;
  capabilityId: string | null;
  allowedAnswers: string[];
  scopeBoundary: string;
  scopeBeingResolved?: string;
  specialistBoundary: string;
  affectedConceptIds: string[];
  affectedRequirementCount: number;
  informationValue: number;
  labelsExcluded: boolean;
  authorityEffect: string;
};

export type CapabilityReviewDecision = {
  decisionId: string;
  questionId: string;
  capabilityIds: string[];
  answer: string;
  authorityState: string;
  operatorId: string;
  createdAt: string;
  graphVersion: string;
  note?: string | null;
  superseded?: boolean;
  supersededBy?: string;
  sourceAuthorityMutated: false;
};

export function privateCapabilityAdjudicationRoot(home = process.env.HOME || "") {
  return path.join(home, ".staffordos/private/professional/job-search/capability-adjudication");
}

function questions(): CapabilityReviewQuestion[] {
  return (questionSet.questions as CapabilityReviewQuestion[]).map((question, index) => ({ ...question, order: question.order || index + 1 }));
}

export function loadCapabilityReviewQueue({ decisionRoot = privateCapabilityAdjudicationRoot() } = {}) {
  const active = activeCapabilityAdjudications(loadCapabilityAdjudicationDecisions({ decisionRoot })) as CapabilityReviewDecision[];
  const decisions = new Map(active.map((decision) => [decision.questionId, decision]));
  return questions().map((question) => ({
    ...question,
    decision: decisions.get(question.questionId) || null,
    capability: question.capabilityId ? (graph.capabilities as Array<Record<string, unknown>>).find((item) => item.capabilityId === question.capabilityId) || null : null,
  }));
}

export function capabilityReviewProgress(queue = loadCapabilityReviewQueue()) {
  return { completed: queue.filter((item) => Boolean(item.decision)).length, total: queue.length, capabilityCount: graph.capabilities.length, conceptCount: 41 };
}

export function appendCapabilityReviewDecision(options: {
  decisionRoot: string;
  question: CapabilityReviewQuestion;
  answer: string;
  note?: string | null;
  createdAt?: string;
}) {
  if (!questionSet.questions.some((item: CapabilityReviewQuestion) => item.questionId === options.question.questionId)) throw new Error("UNKNOWN_CAPABILITY_QUESTION");
  if (options.question.capabilityId === null) throw new Error("CAPABILITY_ID_REQUIRED");
  return appendCapabilityAdjudicationDecision({
    decisionRoot: options.decisionRoot,
    questionId: options.question.questionId,
    capabilityIds: [options.question.capabilityId],
    answer: options.answer,
    note: options.note || undefined,
    createdAt: options.createdAt,
    operatorId: "ROSS",
    graphVersion: CAPABILITY_GRAPH_VERSION,
  });
}

export function capabilityReviewSafeSummary(question: CapabilityReviewQuestion) {
  const summaries: Record<string, string> = {
    TECHNICAL_PROGRAM_LEADERSHIP: "CareerOS has evidence of program coordination and cross-functional delivery, but ownership scope remains bounded to the source authority.",
    PROJECT_DELIVERY: "CareerOS has delivery and implementation evidence; the review distinguishes contribution, coordination, and ownership.",
    PRODUCT_GOVERNANCE: "CareerOS has product or governance-related evidence; exact ownership and scope remain separate questions.",
    GENERAL_OPERATIONS: "CareerOS has operations and process evidence; the review does not infer portfolio or people-management scope.",
    MARKETING_TECHNOLOGY: "CareerOS has marketing-system or automation evidence; specialist engineering claims remain separate.",
    STAKEHOLDER_LEADERSHIP: "CareerOS has stakeholder and cross-functional evidence; influence is not automatically people management.",
    DATA_ANALYSIS: "CareerOS has data or reporting evidence; this does not establish data-science or software-engineering expertise.",
    CUSTOMER_SOLUTIONS: "CareerOS has customer, partner, or solutions evidence; the review preserves the supported scope.",
    AI_AUTOMATION_WORKFLOWS: "CareerOS has AI or automation-related evidence; hands-on implementation and specialist AI depth remain distinct.",
    GOVERNANCE_RISK: "CareerOS has governance or risk-related evidence; regulated specialist domains remain fail-closed.",
  };
  return summaries[question.canonicalCapability] || "CareerOS has related source authority, but the reusable capability scope remains unresolved.";
}

export function capabilityReviewGraphSummary() {
  return { graphVersion: CAPABILITY_GRAPH_VERSION, capabilityCount: graph.capabilities.length, conceptCount: 41, questionCount: questions().length };
}
