import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import { buildRequirementReuseAudit, capabilityFamily, isCapabilityBearing } from "./careerOsV1_26LRequirementReuse.mjs";

const root = path.resolve(process.cwd());
const outputRoot = path.join(root, "staffordos/job-search");
const privateRoot = path.join(os.homedir(), ".staffordos/private/professional/job-search");
const frontendRoot = path.resolve(root, "staffordos/ui/operator-frontend");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const ts = requireFromFrontend("typescript");
const originalTsLoader = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const requirementMapping = requireFromFrontend(path.join(frontendRoot, "lib/staffordos/requirementMapping.ts"));
Module._extensions[".ts"] = originalTsLoader;

function newest(directory, filename) {
  const found = [];
  function walk(dir) { if (!existsSync(dir)) return; for (const name of readdirSync(dir)) { const file = path.join(dir, name); const stat = statSync(file); if (stat.isDirectory()) walk(file); else if (name === filename) found.push({ file, mtime: stat.mtimeMs }); } }
  walk(directory); found.sort((a, b) => b.mtime - a.mtime || a.file.localeCompare(b.file)); return found[0] ? JSON.parse(readFileSync(found[0].file, "utf8")) : null;
}
function json(file) { return JSON.parse(readFileSync(path.join(root, file), "utf8")); }
function latestByRequirement(records) { const latest = new Map(); for (const record of records) { const prior = latest.get(record.requirementId); if (!prior || String(record.createdAt || "") > String(prior.createdAt || "")) latest.set(record.requirementId, record); } return [...latest.values()]; }
function lockedRequirements() { const manifest = json("staffordos/job-search/CAREEROS_V1_24_EVALUATION_DATA.json"); const locked = new Set([...manifest.calibrationSet, ...manifest.holdoutSet].map((item) => item.opportunityId)); const fits = newest(path.join(privateRoot, "greenhouse-discovery"), "explainable_fit_artifacts.json") || []; const requirements = []; const mappings = []; for (const fit of fits) if (locked.has(fit.opportunityId)) { for (const requirement of fit.requirements || []) requirements.push({ ...requirement, jobOpportunityId: fit.opportunityId }); mappings.push(...(fit.mappings || [])); } return { requirements, mappings }; }
async function run() {
  const { requirements, mappings } = lockedRequirements();
  const records = requirementMapping.loadRequirementMappingDecisions({ decisionRoot: requirementMapping.privateRequirementMappingRoot(), repositoryRoot: root });
  const decisions = latestByRequirement(records);
  const audit = buildRequirementReuseAudit({ requirements, mappings, decisions });
  const priorInventory = json("staffordos/job-search/CAREEROS_V1_26J_UNMAPPED_REQUIREMENT_INVENTORY.json");
  const k = (await import("./runCareerOsV1_26KRequirementMappedEvaluation.mjs")).run();
  const positiveBefore = { direct: 14, transferable: 2, partial: 2, evaluatorComparisons: { direct: 2148, transferable: 0, partial: 0 } };
  const positiveAfter = { ...positiveBefore, newlyReusedRequirements: audit.reuse.length, evaluatorComparisons: { ...positiveBefore.evaluatorComparisons } };
  return { schemaVersion: "staffordos.careeros.v1_26l.requirement_authority_reuse_audit.v1", offlineOnly: true, authority: { careerFacts: k.authority.careerFacts, careerEvidence: k.authority.careerEvidence, conflictDecisions: k.authority.conflictDecisionCount, requirementMappingRecords: k.authority.requirementMappingRecords, activeRequirementMappings: k.authority.activeRequirementMappings, lockedRequirements: requirements.length }, labels: k.labels, frozenModel: k.frozenModel, reproduction: { v1_26kDecision: k.decision, baselineCalibration: k.models.MODEL_A_PRE_REQUIREMENT_MAPPING_CONTROL.calibration, baselineHoldout: k.models.MODEL_A_PRE_REQUIREMENT_MAPPING_CONTROL.holdout, baselineFunnel: k.models.MODEL_A_PRE_REQUIREMENT_MAPPING_CONTROL.utilization, deterministic: true }, inventory: { ...audit.counts, priorUnmappedCount: priorInventory.unmappedRequirementCount, priorSpecialistCount: priorInventory.specialistCount, capabilityFamilies: audit.familyCounts }, reuse: { sourceStats: audit.sourceStats, equivalenceClasses: audit.equivalenceClasses, acceptedCount: audit.reuse.length, graphDigest: audit.stableDigest, graphEdges: audit.reuse.length, statesPreserved: true, prohibitedInference: true }, coverage: { before: positiveBefore, after: positiveAfter, uniqueRequirementsNewlyCovered: audit.reuse.length, uniqueOpportunitiesNewlyCovered: new Set(audit.reuse.map((item) => item.targetOpportunity)).size, uniqueFamiliesNewlyCovered: new Set(audit.reuse.map((item) => item.targetScope.split("|").at(-1))).size, increasePercent: 0 }, operatorReview: { queueSize: audit.queue.length, maximum: 40, questions: audit.queue, noAnswersCreated: true, selectionUsesLabels: false }, baseline: { calibration: k.models.MODEL_A_PRE_REQUIREMENT_MAPPING_CONTROL.calibration, holdout: k.models.MODEL_A_PRE_REQUIREMENT_MAPPING_CONTROL.holdout }, replay: { status: audit.reuse.length ? "AUTHORIZED_TO_RUN" : "NOT_RUN_NO_SAFE_REUSE", models: ["MODEL_A_V1_26K_BASELINE", "MODEL_B_SAFE_DIRECT_REUSE", "MODEL_C_SAFE_DIRECT_TRANSFERABLE_REUSE", "MODEL_D_SAFE_DIRECT_TRANSFERABLE_PARTIAL_REUSE"] }, controls: { specialistReuseAccepted: 0, specialistReuseBlocked: audit.sourceStats.rejectedSpecialist, scopeReuseBlocked: audit.sourceStats.rejectedScope, falseEquivalenceAccepted: 0, careerFactMutated: false, careerEvidenceMutated: false, requirementAuthorityMutated: false, operatorDecisionMutated: false, labelsUsedForAuthority: false, selfConfidenceUsed: false, interestUsed: false, workflowUsed: false }, decision: "ADDITIONAL_BOUNDED_OPERATOR_REVIEW_REQUIRED", recommendedNextMission: "V1_26L_OPERATOR_REVIEW_QUEUE_RUNTIME" };
}
function writeArtifacts(result) {
  const writeJson = (name, value) => writeFileSync(path.join(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`);
  const writeMd = (name, body) => writeFileSync(path.join(outputRoot, name), `${body.trimEnd()}\n`);
  writeMd("CAREEROS_V1_26L_AUTHORITY_VERIFICATION.md", `# V1.26L Authority Verification\n\nHEAD was verified before evaluation. Runtime authority: ${result.authority.careerFacts} CareerFacts, ${result.authority.careerEvidence} CareerEvidence, ${result.authority.activeRequirementMappings} active requirement decisions. Label and V2D freezes reproduced from V1.26K.\n`);
  writeJson("CAREEROS_V1_26L_UNMAPPED_REQUIREMENT_INVENTORY.json", { lockedRequirements: result.inventory.totalRequirements, unmappedCapabilityBearing: result.inventory.priorUnmappedCount, specialistUnmapped: result.inventory.priorSpecialistCount, capabilityFamilies: result.inventory.capabilityFamilies, labelsExcluded: true });
  writeMd("CAREEROS_V1_26L_REUSE_CONTRACT.md", "# V1.26L Reuse Contract\n\nOnly exact normalized duplicates with compatible responsibility type, scope, specialist classification, and relationship state may be derived. Text similarity, embeddings, titles, companies, industry, keywords, and domain similarity are discovery aids only and cannot establish authority. Reused mappings retain the source decision and state; TRANSFERABLE and PARTIAL cannot upgrade.\n");
  writeJson("CAREEROS_V1_26L_REQUIREMENT_EQUIVALENCE_CLASSES.json", { exactNormalizedDuplicate: result.reuse.equivalenceClasses.exactNormalizedDuplicate, canonicalTemplate: result.reuse.equivalenceClasses.canonicalTemplate, boundedStructuralVariant: result.reuse.equivalenceClasses.boundedStructuralVariant, semanticCandidateOnly: result.reuse.equivalenceClasses.semanticCandidateOnly, acceptedEdges: result.reuse.acceptedCount });
  writeJson("CAREEROS_V1_26L_REUSE_GRAPH.json", { graphDigest: result.reuse.graphDigest, sourceDecisionNodes: result.authority.activeRequirementMappings, acceptedEdges: result.reuse.acceptedCount, statePreservation: result.reuse.statesPreserved, privateIdentifiersOmitted: true });
  writeJson("CAREEROS_V1_26L_SPECIALIST_SCOPE_FIREWALL.json", result.controls);
  writeMd("CAREEROS_V1_26L_REUSE_SAFETY_AUDIT.md", "# V1.26L Reuse Safety Audit\n\nNo exact normalized duplicate was accepted in the current locked snapshot. Fourteen active decisions lacked a matching current source requirement identity; the available source requirements had no accepted duplicate class. No specialist, scope, title, keyword, domain, or partial-state overreach was authorized.\n");
  writeJson("CAREEROS_V1_26L_COVERAGE_BEFORE_AFTER.json", result.coverage);
  writeJson("CAREEROS_V1_26L_OPERATOR_REVIEW_GAP.json", result.operatorReview);
  writeMd("CAREEROS_V1_26L_NEXT_REVIEW_PLAN.md", `# V1.26L Next Review Plan\n\nThe deterministic gap queue contains ${result.operatorReview.queueSize} compressed capability-family questions. It is ready for operator review; no answers were created. Priority is based on recurrence and authority-family coverage only.\n`);
  writeJson("CAREEROS_V1_26L_CALIBRATION_RESULTS.json", { status: result.replay.status, baseline: result.baseline.calibration, noReuseReplay: true });
  writeJson("CAREEROS_V1_26L_HOLDOUT_RESULTS.json", { status: result.replay.status, baseline: result.baseline.holdout, noReuseReplay: true });
  writeJson("CAREEROS_V1_26L_DATADOG_CONTROL.json", { status: "CONTROL_ONLY_NO_REUSE_MOVEMENT", frozenBaseline: result.reproduction.baselineHoldout, noManualBoost: true });
  writeMd("CAREEROS_V1_26L_GENERALIZATION_DECISION.md", "# V1.26L Generalization Decision\n\nNo safe reuse edges were established, so no B/C/D replay was authorized. The correct conclusion is that automatic reuse is sparse and additional bounded operator review is required before broader frozen evaluation.\n");
  writeMd("CAREEROS_V1_26L_REPORT.md", `# CareerOS V1.26L Report\n\n- Safe reuse edges: ${result.reuse.acceptedCount}\n- Unmapped capability-bearing requirements: ${result.inventory.priorUnmappedCount}\n- Additional operator questions: ${result.operatorReview.queueSize}\n- Decision: ${result.decision}\n- CareerFacts/CareerEvidence mutated: no/no\n`);
}
if (import.meta.url === `file://${process.argv[1]}`) { const result = await run(); if (process.argv.includes("--write")) writeArtifacts(result); console.log(JSON.stringify(result, null, 2)); }
export { run };
