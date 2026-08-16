import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { buildEvaluation } from "./runCareerOsMatchEngineV1Offline.mjs";
import { CANDIDATE_MODELS, featureRow, humanRank, metrics, rankRows } from "./runCareerOsV1_23ModelEvaluation.mjs";
import { run as runHoldout } from "./runCareerOsV1_24BHoldoutEvaluation.mjs";
import { buildCapabilityGraph, buildRequirementConceptGraph, loadCapabilityAdjudicationDecisions, activeCapabilityAdjudications } from "./careerOsV1_27AOfflineCapabilityGraph.mjs";
import { projectScopeCompatibleRelationships } from "./careerOsV1_27A3ScopeCompatibility.mjs";

const root = path.resolve(process.cwd());
const outputRoot = path.join(root, "staffordos/job-search");
const privateRoot = path.join(os.homedir(), ".staffordos/private/professional/job-search/capability-adjudication");
const labelsPath = path.join(os.homedir(), ".staffordos/private/professional/job-search/match-engine-calibration/human_labels.json");
const V2D = CANDIDATE_MODELS.MODEL_V2D_ROBUSTNESS_CONTROL;
const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const hash = (value) => createHash("sha256").update(value).digest("hex");

const frontendRoot = path.join(root, "staffordos/ui/operator-frontend");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const ts = requireFromFrontend("typescript");
const original = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const compression = requireFromFrontend(path.join(frontendRoot, "lib/staffordos/evidenceReviewCompression.ts"));
Module._extensions[".ts"] = original;

function sourceInputs() {
  const runtime = compression.loadCompressedReviewRuntime({ repositoryRoot: root, maxHighValue: 18 });
  const manifest = readJson("staffordos/job-search/CAREEROS_V1_26L2_COMPRESSED_REVIEW_MANIFEST.json");
  const questions = readJson("staffordos/job-search/CAREEROS_V1_27A_ACTIVE_LEARNING_QUESTION_SET.json").questions;
  const decisions = activeCapabilityAdjudications(loadCapabilityAdjudicationDecisions({ decisionRoot: privateRoot }));
  const graph = buildCapabilityGraph({ facts: runtime.facts, evidence: runtime.evidence, adjudications: decisions });
  const concepts = buildRequirementConceptGraph(manifest);
  const projection = projectScopeCompatibleRelationships({ capabilities: graph.capabilities, concepts: concepts.concepts, adjudications: decisions, questions });
  const rows = concepts.concepts.flatMap((concept) => {
    const relation = projection.relationships.find((item) => item.conceptId === concept.conceptId);
    return concept.sourceRequirementIds.map((requirementId, index) => ({ requirementId, opportunityId: concept.sourceOpportunityIds[index], state: relation?.state || "UNRESOLVED", capabilityIds: relation?.capabilityIds || [] }));
  });
  return { runtime, graph, decisions, rows, projection };
}

function mappingProjection(input, repaired, capabilityById, usage = null) {
  const additions = new Map(repaired.rows.filter((row) => ["DIRECT", "TRANSFERABLE", "PARTIAL"].includes(row.state)).map((row) => {
    const capabilities = row.capabilityIds.map((id) => capabilityById.get(id)).filter(Boolean);
    return [row.requirementId, { requirementId: row.requirementId, classification: row.state === "DIRECT" ? "PROVEN" : row.state === "TRANSFERABLE" ? "TRANSFERABLE" : "PARTIAL", careerFactIds: [...new Set(capabilities.flatMap((item) => item.sourceFactRefs || []))], careerEvidenceIds: [...new Set(capabilities.flatMap((item) => item.sourceEvidenceRefs || []))], source: "V1.27A3 derived scope-compatible capability projection" }];
  }));
  const mappings = [...(input.mappings || [])].map((mapping) => {
    const addition = additions.get(mapping.requirementId);
    if (!addition) return mapping;
    usage?.[addition.classification]?.add(mapping.requirementId);
    return { ...mapping, classification: addition.classification, careerFactIds: [...new Set([...(mapping.careerFactIds || []), ...addition.careerFactIds])], careerEvidenceIds: [...new Set([...(mapping.careerEvidenceIds || []), ...addition.careerEvidenceIds])], derivedProjection: addition.source };
  });
  for (const [id, addition] of additions) if (!mappings.some((mapping) => mapping.requirementId === id)) { usage?.[addition.classification]?.add(id); mappings.push(addition); }
  return { mappings };
}

function evaluate(options = {}) {
  const labels = JSON.parse(readFileSync(labelsPath, "utf8"));
  const evaluation = buildEvaluation(options);
  const reviews = Object.fromEntries(evaluation.records.map((row) => [row.sampleId, labels.records[row.sampleId]]));
  const rows = rankRows(evaluation.records.map((row) => ({ ...featureRow(row), review: reviews[row.sampleId] })), V2D);
  return { rows, metrics: metrics(rows, humanRank(reviews)), hash: hash(JSON.stringify(rows)) };
}

function compare(before, after) {
  const next = new Map(after.rows.map((row) => [row.sampleId, row])); let scoreChanges = 0; let rankChanges = 0; let eligibilityChanges = 0; let qualificationChanges = 0;
  for (const row of before.rows) { const current = next.get(row.sampleId); if (!current) continue; scoreChanges += current.capabilityFitScore !== row.capabilityFitScore ? 1 : 0; rankChanges += current.modelRank !== row.modelRank ? 1 : 0; eligibilityChanges += current.eligibility !== row.eligibility ? 1 : 0; qualificationChanges += (current.j010 || current.existingJ010State) !== (row.j010 || row.existingJ010State) ? 1 : 0; }
  return { scoreChanges, rankChanges, eligibilityChanges, qualificationChanges };
}

function run() {
  const source = sourceInputs();
  const capById = new Map(source.graph.capabilities.map((item) => [item.capabilityId, item]));
  const repaired = { rows: source.rows };
  const calibrationUsage = { PROVEN: new Set(), TRANSFERABLE: new Set(), PARTIAL: new Set() };
  const holdoutUsage = { PROVEN: new Set(), TRANSFERABLE: new Set(), PARTIAL: new Set() };
  const baselineCalibration = evaluate();
  const repairedCalibration = evaluate({ mappingProjection: (input) => mappingProjection(input, repaired, capById, calibrationUsage) });
  const baselineHoldout = runHoldout();
  const repairedHoldout = runHoldout({ mappingProjection: (input) => mappingProjection(input, repaired, capById, holdoutUsage) });
  const datadog = repairedHoldout.rows.find((row) => row.company === "Datadog" && /Technical Program Management/.test(row.role));
  return { frozenModel: { identity: "MODEL_V2D_ROBUSTNESS_CONTROL", formula: "FROZEN_V1_23_V2D", weights: { relevantExperience: 40, roleFunction: 25, responsibility: 25, seniority: 10 } }, labels: { calibrationCount: Object.keys(JSON.parse(readFileSync(labelsPath, "utf8")).records).length, calibrationHash: hash(readFileSync(labelsPath, "utf8")) }, baseline: { calibration: baselineCalibration, holdout: baselineHoldout }, repaired: { calibration: repairedCalibration, holdout: repairedHoldout }, consumption: { calibration: { direct: calibrationUsage.PROVEN.size, transferable: calibrationUsage.TRANSFERABLE.size, partial: calibrationUsage.PARTIAL.size }, holdout: { direct: holdoutUsage.PROVEN.size, transferable: holdoutUsage.TRANSFERABLE.size, partial: holdoutUsage.PARTIAL.size } }, comparison: { calibration: compare(baselineCalibration, repairedCalibration), holdout: compare(baselineHoldout, repairedHoldout) }, datadog: datadog ? { score: datadog.capabilityFitScore, rank: datadog.modelRank, eligibility: datadog.eligibility, j010: datadog.j010, j003: datadog.j003, direct: datadog.evidenceStateDistribution?.EXACT_OR_DIRECT_SUPPORT || 0, transferable: datadog.evidenceStateDistribution?.STRONG_TRANSFERABLE_SUPPORT || 0, partial: datadog.evidenceStateDistribution?.PARTIAL_SUPPORT || 0, unresolved: (datadog.evidenceStateDistribution?.UNKNOWN || 0) + (datadog.evidenceStateDistribution?.NO_SUPPORTED_EVIDENCE || 0) } : null, deterministic: { calibration: baselineCalibration.hash === evaluate().hash, repairedCalibration: repairedCalibration.hash === evaluate({ mappingProjection: (input) => mappingProjection(input, repaired, capById) }).hash, holdout: hash(JSON.stringify(repairedHoldout.rows)) === hash(JSON.stringify(runHoldout({ mappingProjection: (input) => mappingProjection(input, repaired, capById) }).rows)) } };
}

const result = run();
writeFileSync(path.join(outputRoot, "CAREEROS_V1_27A3_CALIBRATION_REPLAY.json"), `${JSON.stringify({ frozenModel: result.frozenModel, baseline: result.baseline.calibration.metrics, repaired: result.repaired.calibration.metrics, consumption: result.consumption.calibration, comparison: result.comparison.calibration, deterministic: result.deterministic.repairedCalibration }, null, 2)}\n`);
writeFileSync(path.join(outputRoot, "CAREEROS_V1_27A3_HOLDOUT_REPLAY.json"), `${JSON.stringify({ frozenModel: result.frozenModel, baseline: result.baseline.holdout.metrics, repaired: result.repaired.holdout.metrics, consumption: result.consumption.holdout, comparison: result.comparison.holdout, deterministic: result.deterministic.holdout }, null, 2)}\n`);
const tracePath = path.join(outputRoot, "CAREEROS_V1_27A3_MATCH_INPUT_TRACE.json");
const trace = JSON.parse(readFileSync(tracePath, "utf8"));
writeFileSync(tracePath, `${JSON.stringify({ ...trace, evaluatorConsumption: result.consumption, replayDeterministic: result.deterministic, frozenEvaluatorReplayAuthorized: true }, null, 2)}\n`);
writeFileSync(path.join(outputRoot, "CAREEROS_V1_27A3_DATADOG_CONTROL.json"), `${JSON.stringify({ ...JSON.parse(readFileSync(path.join(outputRoot, "CAREEROS_V1_27A3_DATADOG_CONTROL.json"), "utf8")), frozenReplay: result.datadog, replay: "FROZEN_V2D_DIAGNOSTIC" }, null, 2)}\n`);
console.log(JSON.stringify({ calibration: result.repaired.calibration.metrics, holdout: result.repaired.holdout.metrics, comparison: result.comparison, deterministic: result.deterministic, datadog: result.datadog }, null, 2));
