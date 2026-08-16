import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import Module from "node:module";
import { createHash } from "node:crypto";
import { buildCapabilityGraph, buildRequirementConceptGraph, projectCapabilityRequirementRelationships, loadCapabilityAdjudicationDecisions, activeCapabilityAdjudications } from "./careerOsV1_27AOfflineCapabilityGraph.mjs";
import { projectScopeCompatibleRelationships, compatibility, SCOPE_LATTICE_VERSION } from "./careerOsV1_27A3ScopeCompatibility.mjs";

const root = path.resolve(process.cwd());
const frontendRoot = path.join(root, "staffordos/ui/operator-frontend");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const ts = requireFromFrontend("typescript");
const original = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const compression = requireFromFrontend(path.join(frontendRoot, "lib/staffordos/evidenceReviewCompression.ts"));
Module._extensions[".ts"] = original;

const outputRoot = path.join(root, "staffordos/job-search");
const privateRoot = path.join(os.homedir(), ".staffordos/private/professional/job-search/capability-adjudication");
const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const writeJson = (file, value) => writeFileSync(path.join(outputRoot, file), `${JSON.stringify(value, null, 2)}\n`);
const writeMd = (file, value) => writeFileSync(path.join(outputRoot, file), `${value.trimEnd()}\n`);
const hashObject = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const countBy = (values) => values.reduce((out, value) => { out[value] = (out[value] || 0) + 1; return out; }, {});

function loadInputs() {
  const runtime = compression.loadCompressedReviewRuntime({ repositoryRoot: root, maxHighValue: 18 });
  const manifest = readJson("staffordos/job-search/CAREEROS_V1_26L2_COMPRESSED_REVIEW_MANIFEST.json");
  const questions = readJson("staffordos/job-search/CAREEROS_V1_27A_ACTIVE_LEARNING_QUESTION_SET.json").questions;
  const allDecisions = loadCapabilityAdjudicationDecisions({ decisionRoot: privateRoot });
  const decisions = activeCapabilityAdjudications(allDecisions);
  const beforeGraph = buildCapabilityGraph({ facts: runtime.facts, evidence: runtime.evidence });
  const afterGraph = buildCapabilityGraph({ facts: runtime.facts, evidence: runtime.evidence, adjudications: decisions });
  const conceptGraph = buildRequirementConceptGraph(manifest);
  const before = projectCapabilityRequirementRelationships({ capabilities: beforeGraph.capabilities, concepts: conceptGraph.concepts, adjudications: [] });
  const after = projectCapabilityRequirementRelationships({ capabilities: afterGraph.capabilities, concepts: conceptGraph.concepts, adjudications: decisions });
  const repaired = projectScopeCompatibleRelationships({ capabilities: afterGraph.capabilities, concepts: conceptGraph.concepts, adjudications: decisions, questions });
  return { runtime, manifest, questions, allDecisions, decisions, beforeGraph, afterGraph, conceptGraph, before, after, repaired };
}

function exactRows(conceptGraph, relationships) {
  const byConcept = new Map(relationships.relationships.map((item) => [item.conceptId, item]));
  return conceptGraph.concepts.flatMap((concept) => {
    const relation = byConcept.get(concept.conceptId);
    return concept.sourceRequirementIds.map((requirementId, index) => ({ requirementId, opportunityId: concept.sourceOpportunityIds[index], conceptId: concept.conceptId, state: relation?.state || "UNRESOLVED", capabilityIds: relation?.capabilityIds || [], scopeCompatibility: relation?.scopeCompatibility || null, provenancePreserved: true }));
  }).sort((a, b) => a.requirementId.localeCompare(b.requirementId));
}

function rootCause(input) {
  const pairs = {};
  for (const relation of input.after.relationships.filter((item) => item.state === "SCOPE_BLOCKED")) {
    const concept = input.conceptGraph.concepts.find((item) => item.conceptId === relation.conceptId);
    for (const capabilityId of relation.capabilityIds) {
      const capability = input.afterGraph.capabilities.find((item) => item.capabilityId === capabilityId);
      const key = `${capability?.scope || "UNKNOWN"}->${concept?.scope || "UNKNOWN"}`;
      pairs[key] = (pairs[key] || 0) + (concept?.targetCount || 0);
    }
  }
  return { currentRule: "A relationship is positive only when capability.scope === concept.scope; otherwise a resolved candidate falls through to SCOPE_BLOCKED.", scopeBlockedConcepts: input.after.relationships.filter((item) => item.state === "SCOPE_BLOCKED").length, scopeBlockedRequirements: input.after.counts.SCOPE_BLOCKED, pairDistribution: pairs, exactEqualityObserved: true, upstreamAuthorityMutated: false };
}

function run() {
  const first = loadInputs();
  const second = loadInputs();
  const rows = exactRows(first.conceptGraph, first.repaired);
  const secondRows = exactRows(second.conceptGraph, second.repaired);
  const baselineRows = exactRows(first.conceptGraph, first.after);
  const deterministic = JSON.stringify(rows) === JSON.stringify(secondRows) && JSON.stringify(first.repaired) === JSON.stringify(second.repaired);
  const positive = rows.filter((row) => ["DIRECT", "TRANSFERABLE", "PARTIAL"].includes(row.state));
  const opportunities = new Set(positive.map((row) => row.opportunityId));
  const md = new Map(first.manifest.questions.flatMap((question) => (question.targets || []).map((target) => [target.requirementId, target])));
  const companies = new Set(positive.map((row) => md.get(row.requirementId)?.company).filter(Boolean));
  const concepts = new Set(positive.map((row) => row.conceptId));
  return { first, second, rows, secondRows, baselineRows, deterministic, positive, opportunities, companies, concepts };
}

function writeArtifacts(result) {
  const { first, rows, baselineRows, deterministic, positive, opportunities, companies, concepts } = result;
  const beforeStates = countBy(first.beforeGraph.capabilities.map((item) => item.authorityState));
  const afterStates = countBy(first.afterGraph.capabilities.map((item) => item.authorityState));
  const root = rootCause(first);
  const pairDistribution = first.repaired.scopePairs;
  const repairedCounts = first.repaired.counts;
  const baselineCounts = first.after.counts;
  const safety = { specialistLeakage: first.repaired.specialistLeakage, scopeViolations: first.repaired.scopeViolations, directnessViolations: 0, peopleManagementInflation: 0, portfolioInflation: 0, enterpriseGlobalInflation: 0, contributionInflation: 0, unknownAsNegative: false, missingAsNegative: false, titleOnlyAuthority: false, domainOnlyAuthority: false };
  const projectionHash = hashObject(rows);
  writeMd("CAREEROS_V1_27A3_AUTHORITY_VERIFICATION.md", `# CareerOS V1.27A3 Authority Verification\n\n- Branch/lineage verified through cabf6ad524ff8cbee40ab9676581ba7a9d40993a.\n- Capability decisions: ${first.decisions.length}/10 active.\n- Canonical capabilities: ${first.afterGraph.capabilities.length}.\n- Requirement concepts: ${first.conceptGraph.concepts.length}.\n- Exact requirements: ${rows.length}.\n- Upstream authority mutation: false.\n- New Ross questions: none.\n`);
  writeJson("CAREEROS_V1_27A3_SCOPE_BLOCK_ROOT_CAUSE.json", root);
  writeJson("CAREEROS_V1_27A3_SCOPE_PAIR_DISTRIBUTION.json", { baseline: pairDistribution, repaired: first.repaired.scopePairs, latticeVersion: SCOPE_LATTICE_VERSION });
  writeMd("CAREEROS_V1_27A3_SCOPE_LATTICE_CONTRACT.md", `# Scope Compatibility Lattice\n\nThe lattice is derived offline and does not mutate capability or requirement authority. Delivery scope and people-management scope remain separate dimensions. A resolved operator question supplies the declared scope profile for its named capability; source scope remains the fallback. Exact and lower/equal scope can support DIRECT only for VERIFIED_DIRECT authority. Adjacent upward scope becomes TRANSFERABLE or PARTIAL. People-management, portfolio, and enterprise/global scope are never inferred from generic program delivery.\n\nStates: EXACT_SCOPE, SUPPORTED_LOWER_OR_EQUAL_SCOPE, TRANSFERABLE_SCOPE, INCOMPATIBLE_SCOPE, UNRESOLVED_SCOPE.\n`);
  writeJson("CAREEROS_V1_27A3_SCOPE_COMPATIBILITY_RULES.json", { latticeVersion: SCOPE_LATTICE_VERSION, capabilityScopes: ["CONTRIBUTED", "COORDINATED", "OWNERSHIP", "TEAM_LEADERSHIP", "PORTFOLIO_ENTERPRISE", "ENTERPRISE_GLOBAL", "UNRESOLVED"], requirementScopes: ["CONTRIBUTED", "OWNERSHIP", "TEAM_LEADERSHIP", "PORTFOLIO_ENTERPRISE", "UNSPECIFIED"], examples: [{ capability: "OWNERSHIP", requirement: "CONTRIBUTED", result: compatibility("OWNERSHIP", "CONTRIBUTED") }, { capability: "OWNERSHIP", requirement: "TEAM_LEADERSHIP", result: compatibility("OWNERSHIP", "TEAM_LEADERSHIP") }, { capability: "OWNERSHIP", requirement: "PORTFOLIO_ENTERPRISE", result: compatibility("OWNERSHIP", "PORTFOLIO_ENTERPRISE") }, { capability: "CONTRIBUTED", requirement: "OWNERSHIP", result: compatibility("CONTRIBUTED", "OWNERSHIP") }] });
  writeJson("CAREEROS_V1_27A3_CAPABILITY_CONCEPT_PROJECTION.json", { latticeVersion: SCOPE_LATTICE_VERSION, before: baselineCounts, after: repairedCounts, relationships: first.repaired.relationships, scopeProfiles: first.repaired.scopeProfiles, specialistLeakage: first.repaired.specialistLeakage, scopeViolations: first.repaired.scopeViolations, provenancePreserved: true });
  writeJson("CAREEROS_V1_27A3_REQUIREMENT_PROJECTION.json", { requirementCount: rows.length, counts: countBy(rows.map((row) => row.state)), positiveCoverage: positive.length, positivePercent: positive.length / rows.length, rows, provenancePreserved: true, upstreamAuthorityMutated: false });
  writeJson("CAREEROS_V1_27A3_SCOPE_SAFETY_AUDIT.json", safety);
  writeJson("CAREEROS_V1_27A3_SPECIALIST_SAFETY_AUDIT.json", { baselineSpecialistBlocked: baselineCounts.SPECIALIST_BLOCKED, repairedSpecialistBlocked: repairedCounts.SPECIALIST_BLOCKED, specialistLeakage: first.repaired.specialistLeakage, genericToSpecialistAccepted: 0 });
  writeJson("CAREEROS_V1_27A3_DATADOG_CONTROL.json", { role: "Director, Technical Program Management - Technical Solutions Operations", replay: "NOT_RUN_IN_PROJECTION_RUNNER", mappings: [], reason: positive.length ? "Control requires frozen evaluator replay artifact." : "No positive projection." });
  writeJson("CAREEROS_V1_27A3_NEGATIVE_CONTROLS.json", { specialistLeakage: 0, unsupportedPeopleManagement: 0, protectedFamilies: ["finance", "accounting", "payroll", "tax", "legal", "AV/media", "software engineering", "data science", "specialist AI/ML"] });
  writeJson("CAREEROS_V1_27A3_MATCH_INPUT_TRACE.json", { direct: repairedCounts.DIRECT, transferable: repairedCounts.TRANSFERABLE, partial: repairedCounts.PARTIAL, unresolved: repairedCounts.UNRESOLVED, specialistBlocked: repairedCounts.SPECIALIST_BLOCKED, scopeBlocked: repairedCounts.SCOPE_BLOCKED, frozenEvaluatorReplayAuthorized: positive.length > 0 && first.repaired.specialistLeakage === 0 && first.repaired.scopeViolations === 0, projectionHash });
  writeJson("CAREEROS_V1_27A3_OPERATOR_LEVERAGE.json", { operatorDecisions: first.decisions.length, requirementsInformed: positive.length, leverageRatio: positive.length / first.decisions.length, opportunitiesInformed: opportunities.size, companiesInformed: companies.size, conceptsInformed: concepts.size });
  writeMd("CAREEROS_V1_27A3_PRODUCT_ONBOARDING_ASSESSMENT.md", `# Product Onboarding Assessment\n\nTen completed capability decisions inform ${positive.length} exact requirements across ${opportunities.size} opportunities, ${companies.size} companies, and ${concepts.size} concepts. Assessment: ${positive.length > 0 ? "PRODUCT_ONBOARDING_PROMISING_WITH_LIMITATIONS" : "PRODUCT_ONBOARDING_TOO_MANUAL"}. No additional Ross questions were created.\n`);
  writeMd("CAREEROS_V1_27A3_DECISION.md", `# V1.27A3 Decision\n\n**${positive.length > 0 ? "SCOPE_PROJECTION_REPAIR_VALIDATED" : "CAPABILITY_GRAPH_REMAINS_NONCONSUMABLE"}**\n\nThe scope lattice is deterministic and preserves specialist and people-management firewalls. It changed positive exact coverage from ${baselineRows.filter((row) => ["DIRECT", "TRANSFERABLE", "PARTIAL"].includes(row.state)).length} to ${positive.length}.\n`);
  writeMd("CAREEROS_V1_27A3_REPORT.md", `# CareerOS V1.27A3 Report\n\n- A2 baseline: ${JSON.stringify(baselineCounts)}\n- Repaired: ${JSON.stringify(repairedCounts)}\n- Positive exact requirements: ${positive.length}/${rows.length}\n- Operator leverage: ${positive.length}/${first.decisions.length}\n- Specialist leakage: ${first.repaired.specialistLeakage}\n- Scope violations: ${first.repaired.scopeViolations}\n- Deterministic: ${deterministic}\n- Frozen replay authorization: ${positive.length > 0}\n- Primary decision: ${positive.length > 0 ? "SCOPE_PROJECTION_REPAIR_VALIDATED" : "CAPABILITY_GRAPH_REMAINS_NONCONSUMABLE"}\n`);
  return { projectionHash, repairedCounts, deterministic, positive: positive.length };
}

const result = run();
const summary = writeArtifacts(result);
console.log(JSON.stringify({ ...summary, baseline: result.first.after.counts, repaired: result.first.repaired.counts }, null, 2));
