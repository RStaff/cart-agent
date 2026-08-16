import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import * as path from "node:path";

export const REQUIREMENT_MAPPING_STATES = [
  "DIRECT",
  "TRANSFERABLE",
  "PARTIAL",
  "NO_SUPPORTED_EQUIVALENT",
  "NEEDS_MORE_EVIDENCE",
  "KEEP_UNRESOLVED",
] as const;
export type RequirementMappingState = (typeof REQUIREMENT_MAPPING_STATES)[number];
export const REQUIREMENT_MAPPING_SCHEMA_VERSION = "staffordos.professional.requirement_mapping_decision.v1";

export type RequirementMappingDecision = {
  schemaVersion: typeof REQUIREMENT_MAPPING_SCHEMA_VERSION;
  decisionId: string;
  requirementId: string;
  opportunityId: string;
  sourceRecordId: string | null;
  candidateCareerFactIds: string[];
  candidateCareerEvidenceIds: string[];
  state: RequirementMappingState;
  supportedPortion: string | null;
  unresolvedPortion: string | null;
  specialistCompatible: boolean;
  operatorNote: string | null;
  createdAt: string;
  operatorId: "ROSS";
  sourceAuthority: "PRIVATE_CAREER_AUTHORITY_REQUIREMENT_MAPPING";
  supersedesDecisionId: string | null;
  canonicalCareerFactMutated: false;
  canonicalCareerEvidenceCreated: false;
  workflowMutated: false;
};

export type RequirementMappingReviewItem = {
  requirementId: string;
  opportunityId: string;
  sourceRecordId: string | null;
  company: string;
  title: string;
  requirementText: string;
  requirementType: string;
  importance: string;
  section: string | null;
  specialist: boolean;
  capabilityFamily: string;
  careerFactIds: string[];
  careerEvidenceIds: string[];
  currentMappingState: string;
  priority: number;
  priorityReason: string;
  question: string;
  whyAsked: string;
  authoritySummary: string;
  decision: RequirementMappingDecision | null;
  allowedStates: readonly RequirementMappingState[];
};

function decisionPath(root: string) { return path.join(root, "requirement-mapping-decisions.ndjson"); }
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function list<T>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : []; }
function newest(directory: string, filename: string) {
  const found: { file: string; mtime: number }[] = [];
  function walk(dir: string) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const file = path.join(dir, name); const stat = statSync(file);
      if (stat.isDirectory()) walk(file); else if (name === filename) found.push({ file, mtime: stat.mtimeMs });
    }
  }
  walk(directory); found.sort((a, b) => b.mtime - a.mtime || a.file.localeCompare(b.file));
  return found[0] ? JSON.parse(readFileSync(found[0].file, "utf8")) : null;
}
function specialist(requirement: any) { return /finance|accounting|tax|payroll|legal|av[_ -]?media|software engineer|software development|data scientist|data science|specialist ai|machine learning scientist/i.test([requirement.requirementCategory, requirement.requirementLevel, requirement.requirementText, requirement.technologyOrSkill].filter(Boolean).join(" ")); }
function boilerplate(requirement: any) { const value = text(requirement.requirementText); return value.length < 28 || /benefits?|compensation|equal opportunity|visa sponsorship|privacy|how you.?ll make a difference|nice to haves?|about (the )?company/i.test(value); }
function roleFor(source: any, requirement: any) { return text(source?.title || source?.role) || text(requirement?.jobOpportunityId) || "Unknown role"; }
function capabilityFamily(requirement: any) {
  const value = text(requirement.requirementText).toLowerCase();
  if (/technical program|program manager|project manager|cross-functional|operating model|transformation/.test(value)) return "PROGRAM_DELIVERY";
  if (/product|backlog|roadmap|priorit/.test(value)) return "PRODUCT";
  if (/automation|ai-assisted|artificial intelligence|workflow/.test(value)) return "AI_AUTOMATION";
  if (/marketing technology|martech|marketing operations/.test(value)) return "MARKETING_TECHNOLOGY";
  if (/business systems|systems analyst|requirements translation/.test(value)) return "BUSINESS_SYSTEMS";
  if (/governance|compliance|risk|audit/.test(value)) return "GOVERNANCE";
  return "GENERAL_RESPONSIBILITY";
}
function latest(decisions: readonly RequirementMappingDecision[]) { const result = new Map<string, RequirementMappingDecision>(); for (const decision of decisions) result.set(decision.requirementId, decision); return result; }

export function loadRequirementMappingDecisions(options: { decisionRoot: string; repositoryRoot: string }) {
  const file = decisionPath(options.decisionRoot); if (!existsSync(file)) return [] as RequirementMappingDecision[];
  const decisionRoot = path.resolve(options.decisionRoot); const repositoryRoot = path.resolve(options.repositoryRoot);
  if (decisionRoot === repositoryRoot || decisionRoot.startsWith(repositoryRoot + path.sep)) throw new Error("PRIVATE_DECISION_ROOT_REQUIRED");
  return readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as RequirementMappingDecision);
}

export function appendRequirementMappingDecision(options: {
  decisionRoot: string;
  repositoryRoot: string;
  item: RequirementMappingReviewItem;
  state: RequirementMappingState;
  supportedPortion?: string | null;
  unresolvedPortion?: string | null;
  operatorNote?: string | null;
  specialistCompatible?: boolean;
  createdAt?: string;
}) {
  if (!REQUIREMENT_MAPPING_STATES.includes(options.state)) throw new Error("INVALID_MAPPING_STATE");
  if (options.item.specialist && ["DIRECT", "TRANSFERABLE", "PARTIAL"].includes(options.state) && options.specialistCompatible !== true) throw new Error("SPECIALIST_COMPATIBILITY_REQUIRED");
  const decisionRoot = path.resolve(options.decisionRoot); const repositoryRoot = path.resolve(options.repositoryRoot);
  if (decisionRoot === repositoryRoot || decisionRoot.startsWith(repositoryRoot + path.sep)) throw new Error("PRIVATE_DECISION_ROOT_REQUIRED");
  const prior = options.item.decision;
  const createdAt = options.createdAt || new Date().toISOString();
  const seed = `${options.item.requirementId}|${createdAt}|${options.state}`;
  const decision: RequirementMappingDecision = {
    schemaVersion: REQUIREMENT_MAPPING_SCHEMA_VERSION,
    decisionId: `requirement_mapping_decision_${createHash("sha256").update(seed).digest("hex").slice(0, 24)}`,
    requirementId: options.item.requirementId,
    opportunityId: options.item.opportunityId,
    sourceRecordId: options.item.sourceRecordId,
    candidateCareerFactIds: [...options.item.careerFactIds],
    candidateCareerEvidenceIds: [...options.item.careerEvidenceIds],
    state: options.state,
    supportedPortion: options.supportedPortion || null,
    unresolvedPortion: options.unresolvedPortion || null,
    specialistCompatible: options.specialistCompatible === true,
    operatorNote: options.operatorNote || null,
    createdAt,
    operatorId: "ROSS",
    sourceAuthority: "PRIVATE_CAREER_AUTHORITY_REQUIREMENT_MAPPING",
    supersedesDecisionId: prior?.decisionId || null,
    canonicalCareerFactMutated: false,
    canonicalCareerEvidenceCreated: false,
    workflowMutated: false,
  };
  mkdirSync(options.decisionRoot, { recursive: true, mode: 0o700 });
  appendFileSync(decisionPath(options.decisionRoot), `${JSON.stringify(decision)}\n`, { encoding: "utf8", mode: 0o600 });
  return decision;
}

export function loadRequirementMappingQueue(options: { repositoryRoot: string; decisionRoot: string; limit?: number } ): RequirementMappingReviewItem[] {
  const privateRoot = path.join(process.env.HOME || "", ".staffordos/private/professional/job-search");
  const discovery = path.join(privateRoot, "greenhouse-discovery");
  const fits: any[] = newest(discovery, "explainable_fit_artifacts.json") || [];
  const queue = newest(discovery, "job_source_import_queue_result.json") || {};
  const manifestFile = path.join(options.repositoryRoot, "staffordos/job-search/CAREEROS_V1_24_EVALUATION_DATA.json");
  const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, "utf8")) : null;
  const lockedOpportunityIds = manifest ? new Set([...list<any>(manifest.calibrationSet), ...list<any>(manifest.holdoutSet)].map((item) => item.opportunityId)) : null;
  const sourceById = new Map(list<any>(queue.normalizedSourceRecords).map((source) => [source.jobSourceRecordId, source]));
  const opportunities = new Map<string, { sourceRecordId: string | null; company: string; title: string }>();
  for (const fit of fits) {
    if (lockedOpportunityIds && !lockedOpportunityIds.has(fit.opportunityId)) continue;
    const source = sourceById.get(fit.sourceRecordId) || {};
    opportunities.set(fit.opportunityId, { sourceRecordId: fit.sourceRecordId || null, company: text(source.company) || "Unknown company", title: roleFor(source, fit.requirements?.[0]) });
  }
  const grouped = new Map<string, any>();
  for (const fit of fits) {
    if (lockedOpportunityIds && !lockedOpportunityIds.has(fit.opportunityId)) continue;
    for (const requirement of list<any>(fit.requirements)) {
    const mapping = list<any>(fit.mappings).find((item) => item.requirementId === requirement.id);
    if (!mapping || !["UNKNOWN", "MISSING"].includes(mapping.classification) || boilerplate(requirement)) continue;
    const opportunity = opportunities.get(fit.opportunityId) || { sourceRecordId: fit.sourceRecordId || null, company: "Unknown company", title: "Unknown role" };
    const current = grouped.get(requirement.id) || { requirement, mapping, opportunity, occurrences: 0, companies: new Set<string>(), roles: new Set<string>() };
    current.occurrences += 1; current.companies.add(opportunity.company); current.roles.add(opportunity.title); grouped.set(requirement.id, current);
    }
  }
  const decisions = latest(loadRequirementMappingDecisions({ decisionRoot: options.decisionRoot, repositoryRoot: options.repositoryRoot }));
  const rows = [...grouped.values()].map((entry) => {
    const requirement = entry.requirement; const source = entry.opportunity; const isSpecialist = specialist(requirement); const family = capabilityFamily(requirement);
    const recurringBonus = Math.min(entry.occurrences, 5) * 10; const controlBonus = /datadog/i.test(`${source.company} ${source.title}`) ? 50 : 0; const familyBonus = ["PROGRAM_DELIVERY", "PRODUCT", "AI_AUTOMATION", "MARKETING_TECHNOLOGY", "BUSINESS_SYSTEMS", "GOVERNANCE"].includes(family) ? 15 : 0; const priority = controlBonus + recurringBonus + familyBonus + (isSpecialist ? 0 : 5);
    const decision = decisions.get(requirement.id) || null;
    return { requirementId: requirement.id, opportunityId: requirement.jobOpportunityId, sourceRecordId: source.sourceRecordId, company: source.company, title: source.title, requirementText: text(requirement.requirementText), requirementType: text(requirement.requirementLevel || requirement.requirementCategory) || "UNKNOWN", importance: text(requirement.importanceClassification) || "UNKNOWN", section: text(requirement.sourceLocation?.sectionHint) || null, specialist: isSpecialist, capabilityFamily: family, careerFactIds: [...list<string>(entry.mapping.careerFactIds)], careerEvidenceIds: [...list<string>(entry.mapping.careerEvidenceIds)], currentMappingState: entry.mapping.classification, priority, priorityReason: controlBonus ? "Datadog control requirement." : entry.occurrences > 1 ? `Recurring requirement authority across ${entry.occurrences} saved occurrences.` : "Capability-bearing unresolved requirement with existing authority references.", question: "Does the existing Ross authority support this requirement as DIRECT, TRANSFERABLE, PARTIAL, NO_SUPPORTED_EQUIVALENT, NEEDS_MORE_EVIDENCE, or KEEP_UNRESOLVED?", whyAsked: "The requirement has no governed positive relationship to Ross authority. CareerOS is asking for a bounded requirement relationship, not a global career conclusion.", authoritySummary: `Existing authority references ${entry.mapping.careerFactIds?.length || 0} CareerFacts and ${entry.mapping.careerEvidenceIds?.length || 0} CareerEvidence records. Source facts remain unchanged.`, decision, allowedStates: REQUIREMENT_MAPPING_STATES } as RequirementMappingReviewItem;
  }).sort((a, b) => b.priority - a.priority || a.requirementId.localeCompare(b.requirementId));
  return rows.slice(0, options.limit || 24);
}

export function requirementMappingProgress(queue: readonly RequirementMappingReviewItem[]) { return { decisionsCompleted: queue.filter((item) => Boolean(item.decision)).length, decisionTotal: queue.length, requirementsAddressed: queue.filter((item) => Boolean(item.decision)).length, requirementTotal: queue.length }; }

export function privateRequirementMappingRoot() { return path.join(process.env.HOME || "", ".staffordos/private/professional/job-search/adjudication"); }
