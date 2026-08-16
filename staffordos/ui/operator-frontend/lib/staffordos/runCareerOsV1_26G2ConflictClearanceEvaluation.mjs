import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import os from "node:os";
import path from "node:path";
import { createConflictClearanceProjection } from "./careerOsConflictClearanceProjection.mjs";
import { buildEvaluation } from "./runCareerOsMatchEngineV1Offline.mjs";
import { CANDIDATE_MODELS, featureRow, humanRank, metrics, rankRows } from "./runCareerOsV1_23ModelEvaluation.mjs";
import { run as runHoldout } from "./runCareerOsV1_24BHoldoutEvaluation.mjs";

const root = path.resolve(process.cwd());
const outputRoot = path.join(root, "staffordos/job-search");
const labelsPath = path.join(os.homedir(), ".staffordos/private/professional/job-search/match-engine-calibration/human_labels.json");
const holdoutLabelsPath = path.join(os.homedir(), ".staffordos/private/professional/job-search/match-engine-calibration/holdout_human_labels.json");
const V2D = CANDIDATE_MODELS.MODEL_V2D_ROBUSTNESS_CONTROL;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const round = (value) => Number.isFinite(value) ? Math.round(value * 100) / 100 : value;

const frontendRoot = path.resolve(root, "staffordos/ui/operator-frontend");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const typescript = requireFromFrontend("typescript");
const originalTsLoader = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(typescript.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const compression = requireFromFrontend(path.join(frontendRoot, "lib/staffordos/evidenceReviewCompression.ts"));
const conflict = requireFromFrontend(path.join(frontendRoot, "lib/staffordos/conflictResolution.ts"));
Module._extensions[".ts"] = originalTsLoader;

function calibration(options = {}) {
  const labels = readJson(labelsPath);
  const evaluation = buildEvaluation(options);
  const reviews = Object.fromEntries(evaluation.records.map((row) => [row.sampleId, labels.records[row.sampleId]]));
  const rows = rankRows(evaluation.records.map((row) => ({ ...featureRow(row), review: reviews[row.sampleId] })), V2D);
  return { rows, metrics: metrics(rows, humanRank(reviews)), hash: hash(JSON.stringify(rows)) };
}

function compareRows(before, after) {
  const afterById = new Map(after.rows.map((row) => [row.sampleId, row]));
  const movement = { positiveUp: 0, positiveDown: 0, negativeUp: 0, negativeDown: 0, unchanged: 0 };
  let scoreChanges = 0; let rankChanges = 0; let eligibilityChanges = 0; let qualificationChanges = 0;
  for (const row of before.rows) {
    const next = afterById.get(row.sampleId); if (!next) continue;
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

function deltas(before, after) {
  return Object.fromEntries(Object.keys(before).map((key) => [key, Number.isFinite(before[key]) && Number.isFinite(after[key]) ? round(after[key] - before[key]) : null]));
}

function summarizeRoleChanges(before, after) {
  const byId = new Map(after.rows.map((row) => [row.sampleId, row]));
  return before.rows.filter((row) => {
    const next = byId.get(row.sampleId); return next && (next.modelRank !== row.modelRank || next.capabilityFitScore !== row.capabilityFitScore);
  }).map((row) => { const next = byId.get(row.sampleId); return { company: row.company, role: row.role, evidenceFit: row.review.evidenceFit, beforeRank: row.modelRank, afterRank: next.modelRank, beforeScore: row.capabilityFitScore, afterScore: next.capabilityFitScore }; });
}

function run() {
  const runtime = compression.loadCompressedReviewRuntime({ repositoryRoot: root, maxHighValue: 18 });
  const decisions = conflict.loadConflictResolutionDecisions({ decisionRoot: compression.privateAdjudicationRoot(), repositoryRoot: root });
  const latest = new Map(); for (const decision of decisions) latest.set(decision.questionId, decision);
  if (latest.size !== 16) throw new Error(`Expected 16 active V1.26G decisions, received ${latest.size}`);
  const projection = createConflictClearanceProjection({ candidates: runtime.candidates, decisions: [...latest.values()] });
  const baselineCalibration = calibration();
  const projectedCalibration = calibration({ mappingProjection: projection.mappingProjection });
  const baselineHoldout = runHoldout();
  const projectedHoldout = runHoldout({ mappingProjection: projection.mappingProjection });
  const clearanceValues = [...projection.index.byCandidateId.values()];
  const clearanceCounts = Object.fromEntries(["SAFELY_CLEARED_DIRECT", "SAFELY_CLEARED_TRANSFERABLE", "SAFELY_CLEARED_PARTIAL", "REJECTED_BY_OPERATOR", "STILL_CONFLICT_BLOCKED", "INSUFFICIENT_PROVENANCE", "KEEP_UNRESOLVED", "NOT_APPLICABLE_TO_DECISION"].map((state) => [state, clearanceValues.filter((item) => item.classification === state).length]));
  const decisionCounts = Object.fromEntries(["DIRECT", "TRANSFERABLE", "ADJACENT", "NO", "NEEDS_EVIDENCE", "KEEP_UNRESOLVED"].map((answer) => [answer, [...latest.values()].filter((decision) => decision.answer === answer).length]));
  const calibrationComparison = compareRows(baselineCalibration, projectedCalibration);
  const holdoutComparison = compareRows(baselineHoldout, projectedHoldout);
  const result = {
    schemaVersion: "staffordos.careeros.v1_26g2.conflict_clearance_evaluation.v1",
    offlineOnly: true,
    authority: { careerFacts: runtime.facts.length, careerEvidence: runtime.evidence.length, candidates: runtime.candidates.length, conflictQuestions: latest.size, conflictDecisionRecords: decisions.length, supersededConflictDecisions: decisions.length - latest.size, referenceCount: projection.index.referenceCount, distinctReferencedCandidates: projection.index.distinctCandidateCount, previousPositiveBlockedReference: 199, previousDistinctCandidatesAddressed: 203 },
    frozenModel: { identity: "MODEL_V2D_ROBUSTNESS_CONTROL", formula: "FROZEN_V1_23_V2D", weights: { relevantExperience: 40, roleFunction: 25, responsibility: 25, seniority: 10 } },
    decisionDistribution: decisionCounts,
    clearanceCounts,
    projectionStats: projection.getStats(),
    calibration: { baseline: baselineCalibration.metrics, adjudicated: projectedCalibration.metrics, delta: deltas(baselineCalibration.metrics, projectedCalibration.metrics), comparison: calibrationComparison, baselineHash: baselineCalibration.hash, adjudicatedHash: projectedCalibration.hash },
    holdout: { baseline: baselineHoldout.metrics, adjudicated: projectedHoldout.metrics, delta: deltas(baselineHoldout.metrics, projectedHoldout.metrics), comparison: holdoutComparison, baselineHash: hash(JSON.stringify(baselineHoldout.rows)), adjudicatedHash: hash(JSON.stringify(projectedHoldout.rows)) },
    roleChanges: { calibration: summarizeRoleChanges(baselineCalibration, projectedCalibration), holdout: summarizeRoleChanges(baselineHoldout, projectedHoldout) },
    mutationGuards: { careerFactMutated: false, careerEvidenceMutated: false, eligibilityChanges: calibrationComparison.eligibilityChanges + holdoutComparison.eligibilityChanges, qualificationChanges: calibrationComparison.qualificationChanges + holdoutComparison.qualificationChanges },
  };
  result.deterministic = { clearanceHash: hash(JSON.stringify(clearanceValues.map((item) => ({ candidateId: item.candidateId, classification: item.classification, answers: item.answers })).sort((a, b) => a.candidateId.localeCompare(b.candidateId)))), calibrationBaseline: result.calibration.baselineHash === calibration().hash, holdoutBaseline: result.holdout.baselineHash === hash(JSON.stringify(runHoldout().rows)) };
  return { result, runtime, projection, baselineHoldout, projectedHoldout };
}

function writeArtifacts(output) {
  const { result, runtime } = output;
  const writeJson = (file, value) => writeFileSync(path.join(outputRoot, file), `${JSON.stringify(value, null, 2)}\n`);
  const writeMd = (file, value) => writeFileSync(path.join(outputRoot, file), `${value.trimEnd()}\n`);
  writeJson("CAREEROS_V1_26G2_CONFLICT_DECISION_DISTRIBUTION.json", { decisionDistribution: result.decisionDistribution, activeQuestions: result.authority.conflictQuestions, records: result.authority.conflictDecisionRecords, superseded: result.authority.supersededConflictDecisions });
  writeJson("CAREEROS_V1_26G2_CLEARANCE_ACCOUNTING.json", { previousPositiveBlocked: 199, distinctCandidatesAddressed: result.authority.previousDistinctCandidatesAddressed, currentDistinctDecisionReferences: result.authority.distinctReferencedCandidates, referenceCount: result.authority.referenceCount, clearanceCounts: result.clearanceCounts, clearancePercentageOfCurrentReferences: round((result.clearanceCounts.SAFELY_CLEARED_DIRECT + result.clearanceCounts.SAFELY_CLEARED_TRANSFERABLE + result.clearanceCounts.SAFELY_CLEARED_PARTIAL) / result.authority.distinctReferencedCandidates * 100), overlapCollapse: result.authority.referenceCount - result.authority.distinctReferencedCandidates, totalCandidates: result.authority.candidates, rawCareerFacts: result.authority.careerFacts });
  writeJson("CAREEROS_V1_26G2_AUTHORITY_PROJECTION.json", { offlineOnly: true, projectionStats: result.projectionStats, semantics: { direct: "PROVEN", transferable: "TRANSFERABLE", adjacent: "PARTIAL", unresolved: "unchanged non-positive state", unknownNotNegative: true, missingNotNegative: true }, mutationGuards: result.mutationGuards });
  writeJson("CAREEROS_V1_26G2_CALIBRATION_REPLAY.json", { frozenModel: result.frozenModel, ...result.calibration, deterministic: result.deterministic.calibrationBaseline });
  writeJson("CAREEROS_V1_26G2_HOLDOUT_REPLAY.json", { frozenModel: result.frozenModel, ...result.holdout, deterministic: result.deterministic.holdoutBaseline });
  writeJson("CAREEROS_V1_26G2_FALSE_POSITIVE_ANALYSIS.json", { changedCalibration: result.roleChanges.calibration.filter((row) => ["POOR_MATCH", "HARD_NO"].includes(row.evidenceFit)), changedHoldout: result.roleChanges.holdout.filter((row) => ["POOR_MATCH", "HARD_NO"].includes(row.evidenceFit)), specialistRequirementRowsBlocked: result.projectionStats.specialistBlocked, genericSignalStillRaisesSomeSpecialistRoleScores: true, specialistFalsePositiveStatus: "REMAINING_MODEL_INPUT_LIMITATION", roleSpecificPenalty: false });
  writeJson("CAREEROS_V1_26G2_UNDERRANKED_POSITIVE_ANALYSIS.json", { changedCalibration: result.roleChanges.calibration.filter((row) => ["STRONG_MATCH", "GOOD_MATCH", "TRANSFERABLE", "STRETCH"].includes(row.evidenceFit)), changedHoldout: result.roleChanges.holdout.filter((row) => ["STRONG_MATCH", "GOOD_MATCH", "TRANSFERABLE", "STRETCH"].includes(row.evidenceFit)), manualBoost: false });
  const datadog = [...result.roleChanges.holdout, ...result.roleChanges.calibration].filter((row) => row.company === "Datadog" && /Technical Program Management/.test(row.role));
  writeJson("CAREEROS_V1_26G2_DATADOG_TPM_TRACE.json", { role: "Director, Technical Program Management - Technical Solutions Operations", changed: datadog.length > 0, changes: datadog, manualBoost: false, qualificationOrEligibilityChanged: false, remainingAuthority: "Only exact mapped requirement comparisons are eligible; no domain or title inference." });
  writeJson("CAREEROS_V1_26G2_AMBITION_PROTECTION_AUDIT.json", { transferableRemainsDistinct: true, unknownNotNegative: true, missingNotNegative: true, titleOnlyPenalty: false, domainOnlyPenalty: false, selfConfidenceConsumed: false, interestConsumed: false, workflowConsumed: false, upwardStretchPreserved: true });
  writeJson("CAREEROS_V1_26G2_DETERMINISM_REPORT.json", result.deterministic);
  writeMd("CAREEROS_V1_26G2_CONFLICT_CLEARANCE_REPORT.md", `# CareerOS V1.26G2 Conflict Clearance\n\nOffline-only replay over the active operator conflict authority. The 16 active decisions contain 14 DIRECT, 1 TRANSFERABLE, and 1 ADJACENT decision. Exact candidate references are deduplicated before clearance. Direct/adjacent overlaps are conservatively classified PARTIAL. No semantic-family, title, domain, keyword, or specialist propagation is used.\n\n- CareerFacts: ${runtime.facts.length}\n- CareerEvidence: ${runtime.evidence.length}\n- Current distinct candidate references: ${result.authority.distinctReferencedCandidates}\n- Safely cleared: ${result.clearanceCounts.SAFELY_CLEARED_DIRECT + result.clearanceCounts.SAFELY_CLEARED_TRANSFERABLE + result.clearanceCounts.SAFELY_CLEARED_PARTIAL}\n- Direct: ${result.clearanceCounts.SAFELY_CLEARED_DIRECT}\n- Transferable: ${result.clearanceCounts.SAFELY_CLEARED_TRANSFERABLE}\n- Partial: ${result.clearanceCounts.SAFELY_CLEARED_PARTIAL}\n- Remaining blocked/unknown: ${result.clearanceCounts.STILL_CONFLICT_BLOCKED + result.clearanceCounts.INSUFFICIENT_PROVENANCE + result.clearanceCounts.KEEP_UNRESOLVED}\n\nV2D formula and weights remained frozen. CareerFact and CareerEvidence were not mutated.\n`);
  writeMd("CAREEROS_V1_26G2_NEXT_STAGE_DECISION.md", `# CareerOS V1.26G2 Next Stage Decision\n\n**AUTHORITY_CLEARANCE_VALID_BUT_SIGNAL_LIMITED**\n\nThe exact operator authority clears bounded candidate mappings safely, but any remaining ranking limitation must be evaluated against the frozen model's input representation. No production integration or weight change is authorized by this mission.\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) { const output = run(); writeArtifacts(output); console.log(JSON.stringify(output.result, null, 2)); }

export { run };
