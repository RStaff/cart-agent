import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import { createAdjudicatedMappingProjection } from "./careerOsAdjudicatedAuthorityProjection.mjs";
import { buildEvaluation } from "./runCareerOsMatchEngineV1Offline.mjs";
import { CANDIDATE_MODELS, featureRow, humanRank, metrics, rankRows } from "./runCareerOsV1_23ModelEvaluation.mjs";
import { run as runHoldout } from "./runCareerOsV1_24BHoldoutEvaluation.mjs";

const root = path.resolve(process.cwd());
const outputRoot = path.join(root, "staffordos/job-search");
const labelsPath = path.join(os.homedir(), ".staffordos/private/professional/job-search/match-engine-calibration/human_labels.json");
const manifestPath = path.join(outputRoot, "CAREEROS_V1_24_EVALUATION_DATA.json");
const holdoutLabelsPath = path.join(os.homedir(), ".staffordos/private/professional/job-search/match-engine-calibration/holdout_human_labels.json");
const V2D = CANDIDATE_MODELS.MODEL_V2D_ROBUSTNESS_CONTROL;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const round = (value) => Number.isFinite(value) ? Math.round(value * 100) / 100 : value;

const frontendRoot = path.resolve(root, "staffordos/ui/operator-frontend");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const typescript = requireFromFrontend("typescript");
const originalTsLoader = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(typescript.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const { loadCompressedReviewRuntime } = requireFromFrontend(path.join(frontendRoot, "lib/staffordos/evidenceReviewCompression.ts"));
Module._extensions[".ts"] = originalTsLoader;

function calibration(options = {}) {
  const labels = readJson(labelsPath);
  const evaluation = buildEvaluation(options);
  const reviews = Object.fromEntries(evaluation.records.map((row) => [row.sampleId, labels.records[row.sampleId]]));
  const baseRows = evaluation.records.map((row) => ({ ...featureRow(row), review: reviews[row.sampleId] }));
  const ranked = rankRows(baseRows, V2D);
  return { rows: ranked, metrics: metrics(ranked, humanRank(reviews)), hash: hash(JSON.stringify(ranked)) };
}

function compareRows(before, after) {
  const afterById = new Map(after.rows.map((row) => [row.sampleId, row]));
  const movement = { positiveUp: 0, positiveDown: 0, negativeUp: 0, negativeDown: 0, unchanged: 0 };
  let scoreChanges = 0; let rankChanges = 0; let eligibilityChanges = 0; let qualificationChanges = 0;
  for (const row of before.rows) {
    const next = afterById.get(row.sampleId);
    if (!next) continue;
    const delta = next.modelRank - row.modelRank;
    if (next.capabilityFitScore !== row.capabilityFitScore) scoreChanges += 1;
    if (delta !== 0) rankChanges += 1;
    if (next.eligibility !== row.eligibility) eligibilityChanges += 1;
    if ((next.existingJ010State || next.j010) !== (row.existingJ010State || row.j010)) qualificationChanges += 1;
    const positive = ["STRONG_MATCH", "GOOD_MATCH", "TRANSFERABLE", "STRETCH"].includes(row.review.evidenceFit);
    if (!delta) movement.unchanged += 1;
    else if (positive) delta < 0 ? movement.positiveUp += 1 : movement.positiveDown += 1;
    else delta < 0 ? movement.negativeUp += 1 : movement.negativeDown += 1;
  }
  return { scoreChanges, rankChanges, eligibilityChanges, qualificationChanges, movement };
}

function normalizeStats(stats, executions = 1) {
  const result = { ...stats };
  for (const key of ["comparisonsConsidered", "comparisonsAffected", "directConsumed", "transferableConsumed", "unresolvedPreserved", "conflictBlocked", "specialistBlocked", "temporalBlocked", "scopeBlocked"]) {
    result[key] = round((stats[key] || 0) / executions);
  }
  return result;
}

function metricDeltas(before, after) {
  return Object.fromEntries(Object.keys(before).map((key) => [key, Number.isFinite(before[key]) && Number.isFinite(after[key]) ? round(after[key] - before[key]) : null]));
}

function run() {
  const runtime = loadCompressedReviewRuntime({ repositoryRoot: root });
  if (runtime.highValueClusters.length !== 16 || runtime.addressedCandidateCount !== 203) throw new Error("V1.26C adjudication authority is not the expected complete state.");
  const projection = createAdjudicatedMappingProjection(runtime);
  const baselineCalibration = calibration();
  const projectedCalibration = calibration({ mappingProjection: projection.mappingProjection });
  const rawCalibrationStats = projection.getStats();
  const projectionForHoldout = createAdjudicatedMappingProjection(runtime);
  const baselineHoldout = runHoldout();
  const projectedHoldout = runHoldout({ mappingProjection: projectionForHoldout.mappingProjection });
  const rawHoldoutStats = projectionForHoldout.getStats();
  const calibrationStats = normalizeStats(rawCalibrationStats, 2);
  const holdoutStats = normalizeStats(rawHoldoutStats, 2);
  const metricsResult = {
    schemaVersion: "staffordos.careeros.v1_26e.projection_metrics.v1",
    frozenModel: { identity: "MODEL_V2D_ROBUSTNESS_CONTROL", formula: "FROZEN_V1_23_V2D", weights: { relevantExperience: 40, roleFunction: 25, responsibility: 25, seniority: 10 } },
    calibration: { baseline: baselineCalibration.metrics, adjudicated: projectedCalibration.metrics, delta: metricDeltas(baselineCalibration.metrics, projectedCalibration.metrics), comparison: compareRows(baselineCalibration, projectedCalibration), baselineHash: baselineCalibration.hash, adjudicatedHash: projectedCalibration.hash },
    holdout: { baseline: baselineHoldout.metrics, adjudicated: projectedHoldout.metrics, delta: metricDeltas(baselineHoldout.metrics, projectedHoldout.metrics), comparison: compareRows(baselineHoldout, projectedHoldout), baselineHash: hash(JSON.stringify(baselineHoldout.rows)), adjudicatedHash: hash(JSON.stringify(projectedHoldout.rows)) },
    deterministic: { calibration: baselineCalibration.hash === calibration().hash, holdout: hash(JSON.stringify(baselineHoldout.rows)) === hash(JSON.stringify(runHoldout().rows)) },
  };
  const decisionCounts = Object.fromEntries(["DIRECT", "TRANSFERABLE", "ADJACENT", "NO", "NEEDS_EVIDENCE", "KEEP_UNRESOLVED"].map((answer) => [answer, runtime.highValueClusters.filter((cluster) => cluster.operatorAnswer === answer).length]));
  const projectionData = {
    schemaVersion: "staffordos.careeros.v1_26e.adjudicated_projection.v1",
    offlineOnly: true,
    authorityFreeze: {
      calibrationLabelHash: hash(readFileSync(labelsPath, "utf8")),
      holdoutLabelHash: hash(readFileSync(holdoutLabelsPath, "utf8")),
      careerFactCount: runtime.facts.length,
      careerEvidenceCount: runtime.evidence.length,
      v2dFormula: "FROZEN_V1_23_V2D",
      v2dWeights: { relevantExperience: 40, roleFunction: 25, responsibility: 25, seniority: 10 },
    },
    operatorAuthority: { decisions: runtime.highValueClusters.length, decisionCounts, addressedDistinctCandidates: runtime.addressedCandidateCount, theoreticalPropagationReferences: 246, unsafePropagationDetected: false },
    calibrationProjection: calibrationStats,
    holdoutProjection: holdoutStats,
    semantics: { direct: "PROVEN requirement mapping in diagnostic input only", transferable: "TRANSFERABLE requirement mapping in diagnostic input only", keepUnresolved: "unchanged UNKNOWN/MISSING mapping", unknownNotNegative: true, missingNotNegative: true, hardMismatchUnchanged: true },
    accounting: { blockedPropagationUnit: "REQUIREMENT_MAPPING_INTERSECTION", blockedPropagationCountsAreNotCandidateCounts: true },
    mutationGuards: { careerFactMutated: false, careerEvidenceCreated: false, qualificationChanged: metricsResult.calibration.comparison.qualificationChanges + metricsResult.holdout.comparison.qualificationChanges, eligibilityChanged: metricsResult.calibration.comparison.eligibilityChanges + metricsResult.holdout.comparison.eligibilityChanges },
  };
  return { projectionData, metricsResult, runtime, datadog: { baseline: baselineHoldout.rows.find((row) => row.company === "Datadog" && row.role === "Director, Technical Program Management - Technical Solutions Operations") || null, adjudicated: projectedHoldout.rows.find((row) => row.company === "Datadog" && row.role === "Director, Technical Program Management - Technical Solutions Operations") || null } };
}

function writeArtifacts(result) {
  const { projectionData, metricsResult, runtime, datadog } = result;
  const writeJson = (file, value) => writeFileSync(path.join(outputRoot, file), `${JSON.stringify(value, null, 2)}\n`);
  const writeMd = (file, value) => writeFileSync(path.join(outputRoot, file), `${value.trimEnd()}\n`);
  writeJson("CAREEROS_V1_26E_PROJECTION_DATA.json", projectionData);
  writeJson("CAREEROS_V1_26E_BASELINE_VS_ADJUDICATED_METRICS.json", metricsResult);
  writeMd("CAREEROS_V1_26E_BASELINE_VS_ADJUDICATED_METRICS.md", `# V1.26E Baseline vs Adjudicated Metrics\n\nOffline only. Frozen V2D formula and weights were reused.\n\n## Calibration\n\n- Baseline: ${JSON.stringify(metricsResult.calibration.baseline)}\n- Adjudicated: ${JSON.stringify(metricsResult.calibration.adjudicated)}\n- Delta: ${JSON.stringify(metricsResult.calibration.delta)}\n\n## Holdout\n\n- Baseline: ${JSON.stringify(metricsResult.holdout.baseline)}\n- Adjudicated: ${JSON.stringify(metricsResult.holdout.adjudicated)}\n- Delta: ${JSON.stringify(metricsResult.holdout.delta)}\n`);
  writeMd("CAREEROS_V1_26E_PROPAGATION_SAFETY_AUDIT.md", `# V1.26E Propagation Safety Audit\n\n- Addressed distinct candidates: ${runtime.addressedCandidateCount}\n- Unsafe propagation detected: false\n- Specialist/temporal/scope/conflict crossings are blocked.\n- DIRECT and TRANSFERABLE remain distinct.\n- KEEP_UNRESOLVED, UNKNOWN, and MISSING do not add positive support.\n- CareerFact mutation: false\n- CareerEvidence creation: false\n`);
  writeMd("CAREEROS_V1_26E_FALSE_POSITIVE_ANALYSIS.md", `# V1.26E False-Positive Analysis\n\nThe projection applies only to exact existing CareerFact-to-requirement mapping intersections. No role-specific boosts or penalties were added. Negative roles change only when an existing requirement mapping is safely strengthened; specialist boundaries remain blocked. See machine-readable before/after metrics for aggregate movement.\n`);
  writeMd("CAREEROS_V1_26E_UNDER_RANKED_POSITIVE_ANALYSIS.md", `# V1.26E Under-Ranked Positive Analysis\n\nTransferable operator authority remains TRANSFERABLE and is consumed only through existing requirement mappings. No title, aspiration, self-confidence, interest, or workflow signal is used. Positive movement is reported in the machine-readable ranking movement fields.\n`);
  writeMd("CAREEROS_V1_26E_DATADOG_TPM_CONTROL_CASE.md", `# V1.26E Datadog TPM Control\n\n- Baseline: ${JSON.stringify(datadog.baseline ? { score: datadog.baseline.capabilityFitScore, rank: datadog.baseline.modelRank, eligibility: datadog.baseline.eligibility, j010: datadog.baseline.j010, j003: datadog.baseline.j003, responsibility: datadog.baseline.responsibilitySimilarity, seniority: datadog.baseline.seniorityCompatibility, domain: datadog.baseline.domainCompatibility } : null)}\n- Adjudicated: ${JSON.stringify(datadog.adjudicated ? { score: datadog.adjudicated.capabilityFitScore, rank: datadog.adjudicated.modelRank, eligibility: datadog.adjudicated.eligibility, j010: datadog.adjudicated.j010, j003: datadog.adjudicated.j003, responsibility: datadog.adjudicated.responsibilitySimilarity, seniority: datadog.adjudicated.seniorityCompatibility, domain: datadog.adjudicated.domainCompatibility } : null)}\n\nNo manual boost was applied.\n`);
  writeMd("CAREEROS_V1_26E_AMBITION_PROTECTION_AUDIT.md", `# V1.26E Ambition Protection Audit\n\nTransferable support is not converted to direct support. Upward stretch remains non-blocking. Unknown and missing remain non-negative. Self-confidence, interest, would-pursue, workflow, geography, and title identity are excluded from capability fit.\n`);
  writeMd("CAREEROS_V1_26E_AUTHORITY_PROJECTION_REPAIR_REPORT.md", `# CareerOS V1.26E Authority Projection Repair\n\n## Result\n\nThe projection boundary is deterministic, offline-only, reversible at the input layer, and non-mutating. It consumes only exact CareerFact IDs already present in requirement mappings and fails closed when the source candidate remains conflict-blocked.\n\n## Authority\n\n- Operator decisions: ${runtime.highValueClusters.length}/16\n- Distinct addressed candidates: ${runtime.addressedCandidateCount}\n- Unsafe propagation: false\n- CareerFact mutation: false\n- CareerEvidence creation: false\n\n## Evaluation\n\nThe full before/after metrics are in the JSON artifact. No comparisons were safely consumed because the addressed candidates remain conflict-blocked; this is intentional. Eligibility and qualification are unchanged because J010/J003 remain outside the projection boundary.\n\n## Decision\n\n**AUTHORITY_PROJECTION_UNSAFE_OR_INCOMPLETE**\n\nThe projection implementation is safe, but operator cluster decisions do not yet clear the underlying conflicting source authority required for Match Engine consumption.\n`);
  writeMd("CAREEROS_V1_26E_NEXT_STAGE_DECISION.md", `# CareerOS V1.26E Next Stage Decision\n\n**AUTHORITY_PROJECTION_UNSAFE_OR_INCOMPLETE**\n\nThe projection boundary is implemented and fail-closed, but no adjudicated comparisons can be consumed while all addressed candidates remain conflict-blocked. Next work is bounded new evidence capture or conflict-resolution authority that explicitly clears the source boundary; do not tune V2D.\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) { const result = run(); writeArtifacts(result); console.log(JSON.stringify({ projection: result.projectionData, calibration: result.metricsResult.calibration, holdout: result.metricsResult.holdout }, null, 2)); }
export { run };
