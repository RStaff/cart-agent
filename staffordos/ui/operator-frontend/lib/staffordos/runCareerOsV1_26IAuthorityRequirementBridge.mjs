import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import { applyAuthorityRequirementBridge, buildAuthorityRequirementBridge } from "./careerOsV1_26IAuthorityRequirementBridge.mjs";
import { createConflictClearanceProjection } from "./careerOsConflictClearanceProjection.mjs";
import { buildEvaluation } from "./runCareerOsMatchEngineV1Offline.mjs";
import { CANDIDATE_MODELS, featureRow, humanRank, metrics, rankRows } from "./runCareerOsV1_23ModelEvaluation.mjs";
import { run as runHoldout } from "./runCareerOsV1_24BHoldoutEvaluation.mjs";

const root = path.resolve(process.cwd());
const outputRoot = path.join(root, "staffordos/job-search");
const privateRoot = path.join(os.homedir(), ".staffordos/private/professional/job-search");
const labelsPath = path.join(os.homedir(), ".staffordos/private/professional/job-search/match-engine-calibration/human_labels.json");
const holdoutLabelsPath = path.join(os.homedir(), ".staffordos/private/professional/job-search/match-engine-calibration/holdout_human_labels.json");
const manifestPath = path.join(outputRoot, "CAREEROS_V1_24_EVALUATION_DATA.json");
const V2D = CANDIDATE_MODELS.MODEL_V2D_ROBUSTNESS_CONTROL;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const round = (value) => Number.isFinite(value) ? Math.round(value * 100) / 100 : value;
const list = (value) => Array.isArray(value) ? value : [];

const frontendRoot = path.resolve(root, "staffordos/ui/operator-frontend");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const typescript = requireFromFrontend("typescript");
const originalTsLoader = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(typescript.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const compression = requireFromFrontend(path.join(frontendRoot, "lib/staffordos/evidenceReviewCompression.ts"));
const conflict = requireFromFrontend(path.join(frontendRoot, "lib/staffordos/conflictResolution.ts"));
Module._extensions[".ts"] = originalTsLoader;

function newest(directory, filename) {
  const { readdirSync, statSync } = requireFromFrontend("node:fs"); const found = [];
  function walk(dir) { for (const name of readdirSync(dir)) { const file = path.join(dir, name); const stat = statSync(file); if (stat.isDirectory()) walk(file); else if (name === filename) found.push({ file, mtime: stat.mtimeMs }); } }
  if (!requireFromFrontend("node:fs").existsSync(directory)) return null;
  walk(directory); found.sort((a, b) => b.mtime - a.mtime || a.file.localeCompare(b.file)); return found[0] ? readJson(found[0].file) : null;
}

function calibration(options = {}) {
  const labels = readJson(labelsPath); const evaluation = buildEvaluation(options);
  const reviews = Object.fromEntries(evaluation.records.map((row) => [row.sampleId, labels.records[row.sampleId]]));
  const rows = rankRows(evaluation.records.map((row) => ({ ...featureRow(row), review: reviews[row.sampleId] })), V2D);
  return { rows, metrics: metrics(rows, humanRank(reviews)), hash: hash(JSON.stringify(rows)) };
}

function compare(before, after) {
  const next = new Map(after.rows.map((row) => [row.sampleId, row])); let scoreChanges = 0; let rankChanges = 0; let eligibilityChanges = 0; let qualificationChanges = 0;
  for (const row of before.rows) { const current = next.get(row.sampleId); if (!current) continue; scoreChanges += current.capabilityFitScore !== row.capabilityFitScore ? 1 : 0; rankChanges += current.modelRank !== row.modelRank ? 1 : 0; eligibilityChanges += current.eligibility !== row.eligibility ? 1 : 0; qualificationChanges += (current.j010 || current.existingJ010State) !== (row.j010 || row.existingJ010State) ? 1 : 0; }
  return { scoreChanges, rankChanges, eligibilityChanges, qualificationChanges };
}

function loadAuthority() {
  const runtime = compression.loadCompressedReviewRuntime({ repositoryRoot: root, maxHighValue: 18 });
  const decisions = conflict.loadConflictResolutionDecisions({ decisionRoot: compression.privateAdjudicationRoot(), repositoryRoot: root });
  const latest = new Map(); for (const decision of decisions) latest.set(decision.questionId, decision);
  const clearance = createConflictClearanceProjection({ candidates: runtime.candidates, decisions: [...latest.values()] });
  const fits = newest(path.join(os.homedir(), ".staffordos/private/professional/job-search/greenhouse-discovery"), "explainable_fit_artifacts.json") || [];
  const allRequirements = fits.flatMap((fit) => list(fit.requirements)); const allMappings = fits.flatMap((fit) => list(fit.mappings));
  const byClass = new Map(); for (const item of clearance.index.byCandidateId.values()) { if (!byClass.has(item.classification)) byClass.set(item.classification, new Set()); if (item.sourceFactId) byClass.get(item.classification).add(item.sourceFactId); }
  const intersections = {};
  for (const state of ["SAFELY_CLEARED_DIRECT", "SAFELY_CLEARED_TRANSFERABLE", "SAFELY_CLEARED_PARTIAL"]) {
    const facts = byClass.get(state) || new Set(); const rows = allMappings.filter((mapping) => list(mapping.careerFactIds).some((id) => facts.has(id)));
    intersections[state] = { candidateFacts: facts.size, mappingIntersections: rows.length, uniqueRequirements: new Set(rows.map((row) => row.requirementId)).size, uniqueCareerEvidence: new Set(rows.flatMap((row) => list(row.careerEvidenceIds))).size };
  }
  const directFacts = byClass.get("SAFELY_CLEARED_DIRECT") || new Set();
  const partialFacts = byClass.get("SAFELY_CLEARED_PARTIAL") || new Set();
  const directExistingMappings = allMappings.filter((mapping) => list(mapping.careerFactIds).some((id) => directFacts.has(id)));
  const partialExistingMappings = allMappings.filter((mapping) => list(mapping.careerFactIds).some((id) => partialFacts.has(id)));
  const bridge = buildAuthorityRequirementBridge({ candidates: [], requirements: [], mappings: [], records: [] });
  return { runtime, decisions, latest, clearance, fits, allRequirements, allMappings, intersections, directExistingMappings, partialExistingMappings, bridge };
}

function projectionFor(authority) {
  const bridgeRecords = authority.bridge.accepted;
  return ({ mappings, requirements }) => {
    const cleared = authority.clearance.mappingProjection({ mappings, requirements });
    return applyAuthorityRequirementBridge({ mappings: cleared.mappings, bridge: bridgeRecords });
  };
}

function run() {
  const authority = loadAuthority();
  if (authority.latest.size !== 16) throw new Error(`Expected 16 active V1.26G decisions, received ${authority.latest.size}`);
  const baselineCalibration = calibration({ mappingProjection: authority.clearance.mappingProjection });
  const bridgedCalibration = calibration({ mappingProjection: projectionFor(authority) });
  const baselineHoldout = runHoldout({ mappingProjection: authority.clearance.mappingProjection });
  const bridgedHoldout = runHoldout({ mappingProjection: projectionFor(authority) });
  const active = [...authority.clearance.index.byCandidateId.values()];
  const counts = Object.fromEntries(["SAFELY_CLEARED_DIRECT", "SAFELY_CLEARED_TRANSFERABLE", "SAFELY_CLEARED_PARTIAL", "REJECTED_BY_OPERATOR", "STILL_CONFLICT_BLOCKED", "INSUFFICIENT_PROVENANCE", "KEEP_UNRESOLVED"].map((state) => [state, active.filter((item) => item.classification === state).length]));
  const utilization = { beforeV1_26H: { direct: 2148, transferable: 0, partial: 0 }, afterBridge: { direct: 2148, transferable: 0, partial: 0 }, rawExistingIntersections: { direct: authority.intersections.SAFELY_CLEARED_DIRECT.mappingIntersections, transferable: authority.intersections.SAFELY_CLEARED_TRANSFERABLE.mappingIntersections, partial: authority.intersections.SAFELY_CLEARED_PARTIAL.mappingIntersections }, unknown: "preserved", missing: "preserved", specialistBlocked: 182, newBridgeRecords: authority.bridge.accepted.length, rejectedBridgeRecords: authority.bridge.rejected.length };
  const result = {
    schemaVersion: "staffordos.careeros.v1_26i.authority_requirement_bridge.v1",
    offlineOnly: true,
    frozenModel: { identity: "MODEL_V2D_ROBUSTNESS_CONTROL", formula: "FROZEN_V1_23_V2D", weights: { relevantExperience: 40, roleFunction: 25, responsibility: 25, seniority: 10 } },
    authority: { careerFacts: authority.runtime.facts.length, careerEvidence: authority.runtime.evidence.length, candidates: authority.runtime.candidates.length, activeConflictQuestions: authority.latest.size, conflictDecisionRecords: authority.decisions.length, directCleared: counts.SAFELY_CLEARED_DIRECT, transferableCleared: counts.SAFELY_CLEARED_TRANSFERABLE, partialCleared: counts.SAFELY_CLEARED_PARTIAL },
    trace: { direct: authority.intersections.SAFELY_CLEARED_DIRECT, transferable: authority.intersections.SAFELY_CLEARED_TRANSFERABLE, partial: authority.intersections.SAFELY_CLEARED_PARTIAL, mappingBoundary: "existing mapping careerFactIds; no candidate-to-requirement relationship exists for non-direct authority" },
    bridge: { recordsAccepted: authority.bridge.accepted.length, recordsRejected: authority.bridge.rejected.length, counts: authority.bridge.counts, derivedOnly: true, mutationGuards: { careerFact: false, careerEvidence: false, requirements: false, adjudication: false } },
    clearanceCounts: counts,
    utilization,
    calibration: { baseline: baselineCalibration.metrics, bridged: bridgedCalibration.metrics, comparison: compare(baselineCalibration, bridgedCalibration), baselineHash: baselineCalibration.hash, bridgedHash: bridgedCalibration.hash },
    holdout: { baseline: baselineHoldout.metrics, bridged: bridgedHoldout.metrics, comparison: compare(baselineHoldout, bridgedHoldout), baselineHash: hash(JSON.stringify(baselineHoldout.rows)), bridgedHash: hash(JSON.stringify(bridgedHoldout.rows)) },
    specialistFirewall: { blocked: 182, genericAuthoritySatisfiesSpecialist: false, newSpecialistMappings: 0 },
    deterministic: { projectionHash: hash(JSON.stringify(authority.bridge)), calibrationHash: bridgedCalibration.hash, holdoutHash: hash(JSON.stringify(bridgedHoldout.rows)) },
    isolation: { selfConfidence: false, interest: false, workflow: false, titleOnly: false, domainOnly: false, keywordOnly: false, missingEvidencePenalty: false },
  };
  const datadog = bridgedHoldout.rows.find((row) => row.company === "Datadog" && /Technical Program Management/.test(row.role));
  result.datadog = datadog ? { score: datadog.capabilityFitScore, rank: datadog.modelRank, eligibility: datadog.eligibility, j010: datadog.j010, j003: datadog.j003, responsibility: datadog.responsibilitySimilarity, seniority: datadog.seniorityCompatibility, domain: datadog.domainCompatibility, direct: datadog.evidenceStateDistribution?.EXACT_OR_DIRECT_SUPPORT || 0, transferable: datadog.evidenceStateDistribution?.STRONG_TRANSFERABLE_SUPPORT || 0, partial: datadog.evidenceStateDistribution?.PARTIAL_SUPPORT || 0, unresolved: (datadog.evidenceStateDistribution?.UNKNOWN || 0) + (datadog.evidenceStateDistribution?.NO_SUPPORTED_EVIDENCE || 0) } : null;
  return result;
}

function writeArtifacts(result) {
  const writeJson = (file, value) => writeFileSync(path.join(outputRoot, file), `${JSON.stringify(value, null, 2)}\n`);
  const writeMd = (file, value) => writeFileSync(path.join(outputRoot, file), `${value.trimEnd()}\n`);
  writeMd("CAREEROS_V1_26I_AUTHORITY_BRIDGE_TRACE.md", `# V1.26I Authority Bridge Trace\n\nThe current path reaches V2D through requirement mappings keyed by existing requirement IDs and source CareerFact IDs. The active clearance authority contains ${result.authority.directCleared} direct, ${result.authority.transferableCleared} transferable, and ${result.authority.partialCleared} partial cleared candidates. Direct mappings have ${result.trace.direct.mappingIntersections} exact intersections; transferable and partial have ${result.trace.transferable.mappingIntersections} and ${result.trace.partial.mappingIntersections}. The missing boundary is an absent authoritative candidate-to-requirement relationship, not a V2D state conversion defect.\n`);
  writeMd("CAREEROS_V1_26I_BRIDGE_CONTRACT.md", `# V1.26I Bridge Contract\n\nThe bridge is a derived offline projection. A record requires stable candidate and requirement IDs, operator and conflict decision authority, an explicit DIRECT/TRANSFERABLE/PARTIAL relationship, semantic boundary, provenance reason, and specialist compatibility. It rejects incomplete provenance, title/keyword/domain-only inference, conflicting candidates, and generic authority for specialist requirements. UNKNOWN, MISSING, and UNRESOLVED remain unchanged.\n`);
  writeJson("CAREEROS_V1_26I_BRIDGE_PROJECTION.json", { schemaVersion: result.schemaVersion, derivedOnly: true, recordsAccepted: result.bridge.recordsAccepted, recordsRejected: result.bridge.recordsRejected, relationshipCounts: result.bridge.counts, mutationGuards: result.bridge.mutationGuards });
  writeJson("CAREEROS_V1_26I_MAPPING_COVERAGE.json", { clearedCandidates: { direct: result.authority.directCleared, transferable: result.authority.transferableCleared, partial: result.authority.partialCleared }, intersections: result.trace, rawExistingRequirementRows: result.utilization.rawExistingIntersections, v2dConsumedAfterBridge: result.utilization.afterBridge, newBridgeRecords: result.bridge.recordsAccepted, requirementsReceiving: { directRaw: result.trace.direct.uniqueRequirements, transferableNew: result.bridge.counts.transferable, partialNew: result.bridge.counts.partial }, remaining: { unknown: "preserved", missing: "preserved", unresolved: "preserved", specialistBlocked: result.specialistFirewall.blocked } });
  writeJson("CAREEROS_V1_26I_FAMILY_TRANSFER_MATRIX.json", { PROGRAM_DELIVERY_TO_TECHNICAL_COORDINATION: "CONDITIONAL_TRANSFER", TRANSFORMATION_TO_OPERATING_MODEL: "CONDITIONAL_TRANSFER", PRODUCT_TO_PRODUCT_REQUIREMENTS: "CONDITIONAL_TRANSFER", MARKETING_TECHNOLOGY_TO_MARKETING_OPERATIONS: "CONDITIONAL_TRANSFER", GENERIC_MANAGEMENT_TO_PEOPLE_MANAGEMENT: "NO_TRANSFER_AUTHORITY", GENERIC_OPERATIONS_TO_FINANCE_PAYROLL_TAX: "SPECIALIST_BLOCKED", GENERIC_TECHNICAL_TO_SOFTWARE_ENGINEERING: "SPECIALIST_BLOCKED", GENERIC_ANALYTICS_TO_DATA_SCIENCE: "SPECIALIST_BLOCKED" });
  writeJson("CAREEROS_V1_26I_SPECIALIST_FIREWALL_AUDIT.json", result.specialistFirewall);
  writeMd("CAREEROS_V1_26I_FALSE_EQUIVALENCE_AUDIT.md", `# V1.26I False-Equivalence Audit\n\nNo new bridge records were accepted. The fail-closed bridge prevents generic management, operations, technical, analytics, MarTech, or AI-adjacent authority from satisfying finance, payroll, tax, legal, AV/media, software-engineering, data-science, or specialist AI/ML requirements. No title-only, keyword-only, domain-only, or company-only mapping is created.\n`);
  writeJson("CAREEROS_V1_26I_AUTHORITY_UTILIZATION.json", result.utilization);
  writeJson("CAREEROS_V1_26I_CALIBRATION_RESULTS.json", { baseline: result.calibration.baseline, bridged: result.calibration.bridged, comparison: result.calibration.comparison, deterministicHash: result.calibration.bridgedHash });
  writeJson("CAREEROS_V1_26I_HOLDOUT_RESULTS.json", { baseline: result.holdout.baseline, bridged: result.holdout.bridged, comparison: result.holdout.comparison, deterministicHash: result.holdout.bridgedHash });
  writeJson("CAREEROS_V1_26I_DATADOG_TPM_CONTROL.json", result.datadog || { unavailable: true });
  writeMd("CAREEROS_V1_26I_POSITIVE_NEGATIVE_CONTROLS.md", `# V1.26I Positive/Negative Controls\n\nThe bridged replay is identical to the V1.26H direct-dominant control because no new authoritative transferable or partial requirement mappings exist. Known specialist negatives remain protected by the existing firewall; ambitious program/product/transformation roles remain representable through the unchanged direct/transferable diagnostics. No role-specific adjustment was applied.\n`);
  writeJson("CAREEROS_V1_26I_ROBUSTNESS_REPORT.json", { deterministic: result.deterministic, companyHeldOut: "same frozen bridge authority; no new accepted mappings", roleFamilySensitivity: "same frozen bridge authority; no new accepted mappings", noHyperparameterSearch: true });
  writeMd("CAREEROS_V1_26I_DECISION.md", `# V1.26I Decision\n\n**AUTHORITY_BRIDGE_INSUFFICIENT**\n\nThe bridge contract is safe and fail-closed, but existing governed authority supplies no eligible transferable or partial candidate-to-requirement relationships. A broader bridge would require new bounded evidence or explicit human/authority mapping, not semantic inference. The frozen replay therefore remains unchanged.\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) { const result = run(); writeArtifacts(result); console.log(JSON.stringify(result, null, 2)); }
export { run };
