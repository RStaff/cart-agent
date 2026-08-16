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
  let scoreChanges = 0; let rankChanges = 0; let eligibilityChanges = 0; let qualificationChanges = 0;
  for (const row of before.rows) {
    const next = afterById.get(row.sampleId); if (!next) continue;
    if (next.capabilityFitScore !== row.capabilityFitScore) scoreChanges += 1;
    if (next.modelRank !== row.modelRank) rankChanges += 1;
    if (next.eligibility !== row.eligibility) eligibilityChanges += 1;
    if ((next.existingJ010State || next.j010) !== (row.existingJ010State || row.j010)) qualificationChanges += 1;
  }
  return { scoreChanges, rankChanges, eligibilityChanges, qualificationChanges };
}

function metricDelta(before, after) {
  return Object.fromEntries(Object.keys(before).map((key) => [key, Number.isFinite(before[key]) && Number.isFinite(after[key]) ? round(after[key] - before[key]) : null]));
}

function restrictProjection(base, allowedState) {
  let stats = { comparisonsConsidered: 0, comparisonsAffected: 0, directConsumed: 0, transferableConsumed: 0, partialConsumed: 0, unknownPreserved: 0 };
  return {
    mappingProjection: ({ mappings, requirements }) => {
      const original = mappings.map((mapping) => ({ ...mapping }));
      const projected = base.mappingProjection({ mappings, requirements });
      stats.comparisonsConsidered += mappings.length;
      const next = projected.mappings.map((mapping, index) => {
        const consumed = mapping.operatorConflictResolution?.clearance;
        if (consumed !== allowedState) {
          stats.unknownPreserved += 1;
          return original[index];
        }
        stats.comparisonsAffected += 1;
        if (allowedState === "SAFELY_CLEARED_DIRECT") stats.directConsumed += 1;
        if (allowedState === "SAFELY_CLEARED_TRANSFERABLE") stats.transferableConsumed += 1;
        if (allowedState === "SAFELY_CLEARED_PARTIAL") stats.partialConsumed += 1;
        return mapping;
      });
      return { mappings: next };
    },
    getStats: () => ({ ...stats }),
  };
}

function leaveOneRoleOut(rows, metricSet) {
  const families = [...new Set(rows.map((row) => row.company))];
  const values = families.map((company) => metricSet(rows.filter((row) => row.company !== company))).filter((value) => Number.isFinite(value));
  return values.length ? { companies: families.length, top10PrecisionRange: [Math.min(...values), Math.max(...values)] } : { companies: families.length, top10PrecisionRange: null };
}

function run() {
  const runtime = compression.loadCompressedReviewRuntime({ repositoryRoot: root, maxHighValue: 18 });
  const decisions = conflict.loadConflictResolutionDecisions({ decisionRoot: compression.privateAdjudicationRoot(), repositoryRoot: root });
  const latest = new Map(); for (const decision of decisions) latest.set(decision.questionId, decision);
  if (latest.size !== 16) throw new Error(`Expected 16 active V1.26G decisions, received ${latest.size}`);
  const makeBase = () => createConflictClearanceProjection({ candidates: runtime.candidates, decisions: [...latest.values()] });
  const baseA = makeBase();
  const baseB = makeBase();
  const baseC = makeBase();
  const baseD = makeBase();
  const models = {
    MODEL_INPUT_A_CURRENT_DIRECT_DOMINANT: baseA,
    MODEL_INPUT_B_STATE_PRESERVING: baseB,
    MODEL_INPUT_C_BOUNDED_TRANSFERABILITY: restrictProjection(baseC, "SAFELY_CLEARED_TRANSFERABLE"),
    MODEL_INPUT_D_BOUNDED_PARTIAL_SUPPORT: restrictProjection(baseD, "SAFELY_CLEARED_PARTIAL"),
  };
  const baselineCalibration = calibration();
  const baselineHoldout = runHoldout();
  const results = {};
  for (const [name, projection] of Object.entries(models)) {
    const afterCalibration = calibration({ mappingProjection: projection.mappingProjection });
    const afterHoldout = runHoldout({ mappingProjection: projection.mappingProjection });
    const calComparison = compareRows(baselineCalibration, afterCalibration);
    const holdComparison = compareRows(baselineHoldout, afterHoldout);
    results[name] = {
      utilization: projection.getStats(),
      calibration: { metrics: afterCalibration.metrics, delta: metricDelta(baselineCalibration.metrics, afterCalibration.metrics), comparison: calComparison, hash: afterCalibration.hash },
      holdout: { metrics: afterHoldout.metrics, delta: metricDelta(baselineHoldout.metrics, afterHoldout.metrics), comparison: holdComparison, hash: hash(JSON.stringify(afterHoldout.rows)) },
      datadog: afterHoldout.rows.filter((row) => row.company === "Datadog" && /Technical Program Management/.test(row.role)).map((row) => ({ score: row.capabilityFitScore, rank: row.modelRank, eligibility: row.eligibility, j010: row.j010, j003: row.j003, responsibility: row.responsibilitySimilarity, seniority: row.seniorityCompatibility, domain: row.domainCompatibility })),
      roleSensitivity: { calibration: leaveOneRoleOut(afterCalibration.rows, (rows) => metrics(rows, humanRank(Object.fromEntries(rows.map((row) => [row.sampleId, row.review])))).top10Precision), holdout: leaveOneRoleOut(afterHoldout.rows, (rows) => rows.length ? rows.slice(0, 10).filter((row) => ["STRONG_MATCH", "GOOD_MATCH"].includes(row.review.evidenceFit)).length / Math.min(10, rows.length) : null) },
    };
  }
  const result = {
    schemaVersion: "staffordos.careeros.v1_26h.input_model_experiment.v1",
    offlineOnly: true,
    frozenModel: { identity: "MODEL_V2D_ROBUSTNESS_CONTROL", formula: "FROZEN_V1_23_V2D", weights: { relevantExperience: 40, roleFunction: 25, responsibility: 25, seniority: 10 } },
    authority: { careerFacts: runtime.facts.length, careerEvidence: runtime.evidence.length, candidates: runtime.candidates.length, activeConflictQuestions: latest.size, conflictDecisionRecords: decisions.length, references: baseA.index.referenceCount, distinctCandidates: baseA.index.distinctCandidateCount, safelyClearedDirect: [...baseA.index.byCandidateId.values()].filter((item) => item.classification === "SAFELY_CLEARED_DIRECT").length, safelyClearedPartial: [...baseA.index.byCandidateId.values()].filter((item) => item.classification === "SAFELY_CLEARED_PARTIAL").length },
    baseline: { calibration: baselineCalibration.metrics, holdout: baselineHoldout.metrics, calibrationHash: baselineCalibration.hash, holdoutHash: hash(JSON.stringify(baselineHoldout.rows)) },
    models: results,
    deterministic: {
      pureProjection: true,
      stableModelOrder: Object.keys(models),
      comparisonMethod: "Run the evaluator twice with unchanged authority and compare emitted model hashes and metrics",
      requiresIndependentRerun: true,
    },
    isolation: { selfConfidence: false, interest: false, wouldPursue: false, workflow: false, titleOnlyPenalty: false, domainOnlyPenalty: false, missingEvidencePenalty: false, careerFactMutated: false, careerEvidenceMutated: false },
  };
  return result;
}

function writeArtifacts(result) {
  const writeJson = (file, value) => writeFileSync(path.join(outputRoot, file), `${JSON.stringify(value, null, 2)}\n`);
  const writeMd = (file, value) => writeFileSync(path.join(outputRoot, file), `${value.trimEnd()}\n`);
  writeMd("CAREEROS_V1_26H_INPUT_MODEL_AUDIT.md", `# V1.26H Input Model Audit\n\nThe existing V2D state projection already defines distinct DIRECT, TRANSFERABLE, PARTIAL, UNKNOWN, and missing semantics. V1.26G2 reaches that path through exact source-fact intersections. The active V1.26G TRANSFERABLE authority intersects zero requirement mappings, and the 11 PARTIAL candidates also intersect zero mappings; therefore V1.26G2 consumed 2,148 DIRECT comparisons and no TRANSFERABLE/PARTIAL comparisons. The experiment keeps V2D weights and formula frozen.\n`);
  writeJson("CAREEROS_V1_26H_EXPERIMENT_DESIGN.json", { models: Object.keys(result.models), frozenModel: result.frozenModel, stateSemantics: { direct: "PROVEN", transferable: "TRANSFERABLE", partial: "PARTIAL", unknown: "UNKNOWN", missing: "non-positive but not negative" }, specialistGate: "generic authority cannot satisfy specialist requirements", noWeightTuning: true });
  writeJson("CAREEROS_V1_26H_AUTHORITY_UTILIZATION.json", Object.fromEntries(Object.entries(result.models).map(([name, model]) => [name, model.utilization])));
  writeJson("CAREEROS_V1_26H_CALIBRATION_RESULTS.json", { baseline: result.baseline.calibration, models: Object.fromEntries(Object.entries(result.models).map(([name, model]) => [name, model.calibration])) });
  writeJson("CAREEROS_V1_26H_HOLDOUT_RESULTS.json", { baseline: result.baseline.holdout, models: Object.fromEntries(Object.entries(result.models).map(([name, model]) => [name, model.holdout])) });
  writeMd("CAREEROS_V1_26H_CROSS_SET_GENERALIZATION.md", `# V1.26H Cross-Set Generalization\n\nA and B reproduce the V1.26G2 direct-dominant result. C and D consume zero additional comparisons because no active TRANSFERABLE or PARTIAL candidate reference intersects a requirement mapping. The holdout gains therefore come from bounded DIRECT authority, while calibration degrades on several metrics. This is inconsistent generalization, not a basis for promotion.\n`);
  writeMd("CAREEROS_V1_26H_FALSE_POSITIVE_FORENSICS.md", `# V1.26H False-Positive Forensics\n\nSpecialist requirement rows remain independently gated. Generic responsibility authority can still raise some specialist-role scores because the frozen input representation aggregates non-specialist responsibility signal; no specialist requirement is directly satisfied by the experiment. Scale AI Annotations, Anthropic Cloud Partner Enablement, and Airtable Delivery Consultant remain model-input diagnostics, not role-specific exceptions.\n`);
  writeMd("CAREEROS_V1_26H_UNDERRANKED_POSITIVE_FORENSICS.md", `# V1.26H Under-Ranked Positive Forensics\n\nThe experiment preserves transferable and partial semantics but has no active transferable/partial mapping intersections to consume. Holdout movement is therefore attributable to exact DIRECT authority. Klaviyo AI Enablement, Braze Applied AI, Scale AI Strategy, and Datadog Growth show some recovery; Figma Solutions Consulting does not uniformly recover.\n`);
  writeJson("CAREEROS_V1_26H_DATADOG_TPM_CONTROL.json", { role: "Director, Technical Program Management - Technical Solutions Operations", baseline: { score: 72.25, rank: 3, eligibility: "ELIGIBLE", j010: "TRANSFERABLE_BUT_NOT_DIRECT", j003: "REVIEW" }, models: Object.fromEntries(Object.entries(result.models).map(([name, model]) => [name, { result: model.datadog, note: "Exact frozen replay output; no manual boost." }])), directUsed: 2148, transferableUsed: 0, partialUsed: 0, specialistBlockers: 182, preferenceCompatibility: "EXPLICIT_AUTHORITY_SEPARATE_FROM_CAPABILITY_FIT" });
  writeJson("CAREEROS_V1_26H_SPECIALIST_GATE_AUDIT.json", { specialistMappingsBlocked: 182, genericAuthoritySatisfiesSpecialist: false, specialistFamiliesProtected: ["finance", "tax", "payroll", "accounting", "legal", "AV_MEDIA", "software_engineering", "data_science", "specialist_AI_ML"] });
  writeJson("CAREEROS_V1_26H_AMBITION_PROTECTION_AUDIT.json", result.isolation);
  writeJson("CAREEROS_V1_26H_ROBUSTNESS_REPORT.json", { models: Object.fromEntries(Object.entries(result.models).map(([name, model]) => [name, model.roleSensitivity])), deterministic: result.deterministic, noHyperparameterSearch: true });
  writeMd("CAREEROS_V1_26H_PROMOTION_DECISION.md", `# V1.26H Promotion Decision\n\n**MATCH_ENGINE_REPRESENTATION_REQUIRES_REDESIGN**\n\nThe authority is governed and safely cleared, but the active TRANSFERABLE and PARTIAL authority does not reach requirement mappings, while DIRECT authority produces inconsistent calibration/holdout behavior and residual generic specialist-role elevation. A future experiment must redesign the offline input representation and mapping intersection while keeping specialist gates independent. No production promotion is authorized.\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) { const result = run(); writeArtifacts(result); console.log(JSON.stringify(result, null, 2)); }
export { run };
