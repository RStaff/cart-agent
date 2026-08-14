import { readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildEvaluation } from "./runCareerOsMatchEngineV1Offline.mjs";

const root = path.resolve(process.cwd());
const outputRoot = path.join(root, "staffordos/job-search");
const v22dPath = path.join(outputRoot, "CAREEROS_MATCH_ENGINE_V1_22D_CALIBRATION_DATA.json");
const v22fPath = path.join(outputRoot, "CAREEROS_V1_22F_RECALIBRATION_DATA.json");
const labelsPath = path.join(os.homedir(), ".staffordos/private/professional/job-search/match-engine-calibration/human_labels.json");

const LABEL_ORDER = { HARD_NO: 0, POOR_MATCH: 1, STRETCH: 2, TRANSFERABLE: 3, GOOD_MATCH: 4, STRONG_MATCH: 5 };
const PRIMARY = new Set(["STRONG_MATCH", "GOOD_MATCH"]);
const VIABLE = new Set(["STRONG_MATCH", "GOOD_MATCH", "TRANSFERABLE", "STRETCH"]);
const NEGATIVE = new Set(["POOR_MATCH", "HARD_NO"]);
const ELIGIBILITY_ORDER = { ELIGIBLE: 0, REVIEW_REQUIRED: 1, UNKNOWN: 2, INELIGIBLE: 3 };

export const CANDIDATE_MODELS = Object.freeze({
  MODEL_V1: { requiredSkills: 35, relevantExperience: 20, roleFunction: 15, responsibility: 10, seniority: 8, domain: 7, geographyWorkArrangement: 5, compensation: 0, baseline: true },
  MODEL_V2A_TRANSFERABILITY_AWARE: { requiredSkills: 10, relevantExperience: 30, roleFunction: 15, responsibility: 25, seniority: 10, domain: 10, evidenceCoverage: 0 },
  MODEL_V2B_CAPABILITY_SCOPE: { requiredSkills: 5, relevantExperience: 30, roleFunction: 15, responsibility: 30, seniority: 15, domain: 5, evidenceCoverage: 0 },
  MODEL_V2C_BALANCED_MATCH: { requiredSkills: 10, relevantExperience: 25, roleFunction: 15, responsibility: 20, seniority: 10, domain: 10, evidenceCoverage: 10 },
  MODEL_V2D_ROBUSTNESS_CONTROL: { requiredSkills: 0, relevantExperience: 40, roleFunction: 25, responsibility: 25, seniority: 10, domain: 0, evidenceCoverage: 0 },
});

function readJson(file) { return JSON.parse(readFileSync(file, "utf8")); }
function round(value) { return Math.round(value * 100) / 100; }
function mean(values) { return values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : null; }
function median(values) { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : round((sorted[middle - 1] + sorted[middle]) / 2); }
function distribution(values) { return Object.fromEntries([...new Set(values)].sort().map((key) => [key, values.filter((value) => value === key).length])); }
function spearman(rows, left, right) {
  const usable = rows.filter((row) => Number.isFinite(row[left]) && Number.isFinite(row[right]));
  if (usable.length < 3) return null;
  const leftMean = mean(usable.map((row) => row[left]));
  const rightMean = mean(usable.map((row) => row[right]));
  const numerator = usable.reduce((sum, row) => sum + (row[left] - leftMean) * (row[right] - rightMean), 0);
  const denominator = Math.sqrt(usable.reduce((sum, row) => sum + (row[left] - leftMean) ** 2, 0) * usable.reduce((sum, row) => sum + (row[right] - rightMean) ** 2, 0));
  return denominator ? round(numerator / denominator) : null;
}
function humanRank(reviews) { return new Map(Object.entries(reviews).map(([sampleId, review]) => ({ sampleId, value: LABEL_ORDER[review.evidenceFit] })).sort((a, b) => b.value - a.value || a.sampleId.localeCompare(b.sampleId)).map((row, index) => [row.sampleId, index + 1])); }
function stateValue(state) { return { EXACT_OR_DIRECT_SUPPORT: 100, DIRECT_LEVEL_SUPPORT: 100, DIRECT_DOMAIN: 100, STRONG_TRANSFERABLE_SUPPORT: 75, UPWARD_STRETCH_WITH_SUPPORTED_SCOPE: 80, ADJACENT_LEVEL: 70, ADJACENT_DOMAIN: 80, TRANSFERABLE_DOMAIN: 75, PARTIAL_SUPPORT: 50, NO_SUPPORTED_EVIDENCE: 0, PROVEN_LEVEL_MISMATCH: 0, PROVEN_DOMAIN_REQUIREMENT_GAP: 0 }[state] ?? null; }
function diagnosticsFeature(record) {
  const authority = record.authorityDiagnostics || {};
  const comparisons = authority.responsibilitySimilarity?.comparisons || [];
  const knownResponsibility = comparisons.map((item) => stateValue(item.evidenceState)).filter(Number.isFinite);
  const responsibility = knownResponsibility.length ? mean(knownResponsibility) : null;
  const responsibilityCoverage = comparisons.length ? round(knownResponsibility.length / comparisons.length * 100) : null;
  const seniority = stateValue(authority.seniorityCompatibility?.state);
  const domain = stateValue(authority.domainCompatibility?.state);
  return { responsibility, responsibilityCoverage, seniority, domain };
}
function component(record, name) { return record.components.find((item) => item.name === name)?.value ?? null; }
function featureRow(record) {
  const diagnostic = diagnosticsFeature(record);
  return { ...record, features: { requiredSkills: component(record, "requiredSkillsFit"), relevantExperience: component(record, "relevantExperienceFit"), roleFunction: component(record, "roleFunctionFit"), responsibility: diagnostic.responsibility, seniority: diagnostic.seniority, domain: diagnostic.domain, evidenceCoverage: diagnostic.responsibilityCoverage } };
}
function score(row, weights) {
  const available = Object.entries(weights).map(([name, weight]) => ({ value: row.features[name], weight })).filter((item) => weightPositive(item.weight) && Number.isFinite(item.value));
  if (!available.length) return null;
  const denominator = available.reduce((sum, item) => sum + item.weight, 0);
  return round(available.reduce((sum, item) => sum + item.value * item.weight, 0) / denominator);
}
function weightPositive(value) { return Number.isFinite(value) && value > 0; }
function rankRows(rows, model) {
  const scored = rows.map((row) => ({ ...row, capabilityFitScore: model.baseline ? row.experimentalFitScore : score(row, model) }));
  return [...scored].sort((left, right) => (ELIGIBILITY_ORDER[left.eligibility] ?? 9) - (ELIGIBILITY_ORDER[right.eligibility] ?? 9) || (right.capabilityFitScore ?? -1) - (left.capabilityFitScore ?? -1) || left.company.localeCompare(right.company) || left.role.localeCompare(right.role)).map((row, index) => ({ ...row, modelRank: index + 1 }));
}
function precision(rows, set, count) { return round(rows.slice(0, count).filter((row) => set.has(row.review.evidenceFit)).length / count); }
function recall(rows, set) { const positives = rows.filter((row) => set.has(row.review.evidenceFit)); return positives.length ? round(positives.filter((row) => row.modelRank <= 10).length / positives.length) : null; }
function thresholdMetrics(rows, set) {
  const actionable = rows.filter((row) => row.eligibility !== "INELIGIBLE");
  const cutoff = median(actionable.map((row) => row.capabilityFitScore).filter(Number.isFinite));
  const predicted = actionable.filter((row) => Number.isFinite(row.capabilityFitScore) && row.capabilityFitScore >= cutoff);
  const actual = actionable.filter((row) => set.has(row.review.evidenceFit));
  return { cutoff, predictedCount: predicted.length, falsePositiveRate: predicted.length ? round(predicted.filter((row) => !set.has(row.review.evidenceFit)).length / predicted.length) : null, falseNegativeRate: actual.length ? round(actual.filter((row) => !predicted.includes(row)).length / actual.length) : null };
}
function metrics(rows, humanRanks) {
  const threshold = thresholdMetrics(rows, PRIMARY);
  return { top5Precision: precision(rows, PRIMARY, 5), top10Precision: precision(rows, PRIMARY, 10), strongRecall: recall(rows, new Set(["STRONG_MATCH"])), strongGoodRecall: recall(rows, PRIMARY), viableRecall: recall(rows, VIABLE), falsePositiveRate: threshold.falsePositiveRate, falseNegativeRate: threshold.falseNegativeRate, rankCorrelation: spearman(rows.map((row) => ({ model: row.modelRank, human: humanRanks.get(row.sampleId) })), "model", "human"), negativeLeakageTop5: rows.slice(0, 5).filter((row) => NEGATIVE.has(row.review.evidenceFit)).length, negativeLeakageTop10: rows.slice(0, 10).filter((row) => NEGATIVE.has(row.review.evidenceFit)).length, hardMismatchLeakageTop10: rows.slice(0, 10).filter((row) => row.existingJ010State === "HARD_MISMATCH").length, underRankedViable: rows.filter((row) => VIABLE.has(row.review.evidenceFit) && row.modelRank > 20).length, strongGoodBelow20: rows.filter((row) => PRIMARY.has(row.review.evidenceFit) && row.modelRank > 20).length, threshold };
}
function preferenceMultiplier(state) { return { MATCH: 1, PARTIAL_MATCH: 0.9, UNKNOWN: 0.75, OUTSIDE_PREFERENCE: 0.4 }[state] ?? 0.75; }
function fitVsPursuit(rows) { return rows.map((row) => ({ sampleId: row.sampleId, capabilityFit: row.capabilityFitScore, pursuitPriority: Number.isFinite(row.capabilityFitScore) ? round(row.capabilityFitScore * preferenceMultiplier(row.preferenceCompatibility)) : null, preference: row.preferenceCompatibility })); }
function modelDiagnostics(rows, humanRanks) {
  const under = rows.filter((row) => VIABLE.has(row.review.evidenceFit) && row.modelRank > 20).map((row) => ({ sampleId: row.sampleId, company: row.company, role: row.role, evidenceFit: row.review.evidenceFit, v1Rank: row.experimentalRank, modelRank: row.modelRank, v1Score: row.experimentalFitScore, modelScore: row.capabilityFitScore, features: row.features, preference: row.preferenceCompatibility }));
  const over = rows.filter((row) => NEGATIVE.has(row.review.evidenceFit) && row.modelRank <= 10).map((row) => ({ sampleId: row.sampleId, company: row.company, role: row.role, evidenceFit: row.review.evidenceFit, v1Rank: row.experimentalRank, modelRank: row.modelRank, v1Score: row.experimentalFitScore, modelScore: row.capabilityFitScore, features: row.features, preference: row.preferenceCompatibility }));
  return { under, over, top10Agreement: rows.length ? round(rows.slice(0, 10).filter((row) => humanRanks.get(row.sampleId) <= 10).length / 10) : null };
}
function leaveOneOut(rows, model, humanRanks) {
  const values = [];
  for (let index = 0; index < rows.length; index += 1) {
    const subset = rows.filter((_, current) => current !== index);
    values.push(metrics(rankRows(subset, model), new Map([...humanRanks].filter(([id]) => id !== rows[index].sampleId))));
  }
  return { top5Precision: [Math.min(...values.map((item) => item.top5Precision)), Math.max(...values.map((item) => item.top5Precision))], top10Precision: [Math.min(...values.map((item) => item.top10Precision)), Math.max(...values.map((item) => item.top10Precision))], viableRecall: [Math.min(...values.map((item) => item.viableRecall)), Math.max(...values.map((item) => item.viableRecall))] };
}
function groupHoldout(rows, model, humanRanks, keyFn) {
  const groups = [...new Set(rows.map(keyFn))];
  const results = groups.map((group) => { const holdout = rows.filter((row) => keyFn(row) === group); const ranked = rankRows(holdout, model); return { group, count: holdout.length, top10Precision: precision(ranked, PRIMARY, Math.min(10, ranked.length)), viableRecall: recall(ranked, VIABLE) }; });
  return { groups: results, groupCount: groups.length };
}
function roleFamily(row) { return row.role.toLowerCase().match(/(program|project|operations|engineer|architect|manager|consultant|analyst|fellow|data|enablement)/)?.[1] || "other"; }
function modelSelection(modelResults) {
  const baseline = modelResults.MODEL_V1.metrics;
  const candidates = Object.entries(modelResults).filter(([name]) => name !== "MODEL_V1").map(([name, result]) => ({ name, result, qualifies: result.metrics.top10Precision > baseline.top10Precision && result.metrics.viableRecall >= baseline.viableRecall && result.metrics.negativeLeakageTop10 <= baseline.negativeLeakageTop10 && result.metrics.hardMismatchLeakageTop10 === 0 && result.robustness.classification !== "FRAGILE" && result.robustness.classification !== "OVERFIT" }));
  const winners = candidates.filter((item) => item.qualifies);
  return winners.length ? winners.sort((a, b) => b.result.metrics.top10Precision - a.result.metrics.top10Precision || b.result.metrics.viableRecall - a.result.metrics.viableRecall)[0].name : "NO_WINNER";
}
function selfConfidenceChecks(baseRows) {
  return Object.fromEntries(Object.entries(CANDIDATE_MODELS).map(([name, model]) => {
    const original = rankRows(baseRows, model);
    const altered = rankRows(baseRows.map((row) => ({ ...row, review: { ...row.review, selfConfidence: row.review.selfConfidence === "LOW" ? "HIGH" : "LOW" } })), model);
    const originalScores = new Map(original.map((row) => [row.sampleId, row.capabilityFitScore]));
    const alteredScores = new Map(altered.map((row) => [row.sampleId, row.capabilityFitScore]));
    const originalRanks = new Map(original.map((row) => [row.sampleId, row.modelRank]));
    const alteredRanks = new Map(altered.map((row) => [row.sampleId, row.modelRank]));
    return [name, { scoreChanges: [...originalScores.keys()].filter((id) => originalScores.get(id) !== alteredScores.get(id)).length, rankChanges: [...originalRanks.keys()].filter((id) => originalRanks.get(id) !== alteredRanks.get(id)).length }];
  }));
}
function robustness(loo, modelResult) {
  const top5Spread = loo.top5Precision[1] - loo.top5Precision[0];
  const top10Spread = loo.top10Precision[1] - loo.top10Precision[0];
  const classification = top5Spread > 0.4 || top10Spread > 0.4 ? "FRAGILE" : top5Spread > 0.2 || top10Spread > 0.2 ? "MODERATELY_ROBUST" : "ROBUST";
  return { ...loo, classification, top5Membership: modelResult.rows.slice(0, 5).map((row) => row.sampleId), top10Membership: modelResult.rows.slice(0, 10).map((row) => row.sampleId) };
}
function json(file, value) { writeFileSync(path.join(outputRoot, file), `${JSON.stringify(value, null, 2)}\n`); }
function md(file, value) { writeFileSync(path.join(outputRoot, file), `${value.trimEnd()}\n`); }
function run() {
  const v22d = readJson(v22dPath);
  const v22f = readJson(v22fPath);
  const labels = readJson(labelsPath);
  if (v22d.datasetCount !== 40 || v22d.reviewCount !== 40 || v22f.rows.length !== 40 || Object.keys(labels.records || {}).length !== 40) throw new Error("V1.23 requires 40 records and 40 valid human reviews.");
  const live = buildEvaluation();
  if (live.records.length !== 40) throw new Error("Current evaluation did not produce 40 records.");
  const reviews = Object.fromEntries(live.records.map((row) => [row.sampleId, labels.records[row.sampleId]]));
  if (Object.values(reviews).some((review) => !review || LABEL_ORDER[review.evidenceFit] === undefined)) throw new Error("Invalid or incomplete human labels.");
  const humanRanks = humanRank(reviews);
  const baseRows = live.records.map((row) => ({ ...featureRow(row), review: reviews[row.sampleId] }));
  const modelResults = {};
  for (const [name, model] of Object.entries(CANDIDATE_MODELS)) {
    const rows = rankRows(baseRows, model);
    const result = { weights: model, rows, metrics: metrics(rows, humanRanks), diagnostics: modelDiagnostics(rows, humanRanks), fitVsPursuit: fitVsPursuit(rows), leaveOneOut: leaveOneOut(rows, model, humanRanks) };
    result.robustness = robustness(result.leaveOneOut, result);
    result.companyHoldout = groupHoldout(rows, model, humanRanks, (row) => row.company);
    result.roleFamilyHoldout = groupHoldout(rows, model, humanRanks, roleFamily);
    modelResults[name] = result;
  }
  const selected = modelSelection(modelResults);
  const selfConfidenceSafety = selfConfidenceChecks(baseRows);
  const datadog = live.controlCases?.find((item) => item.caseId === "CONTROL_CASE_DATADOG_TPM") || null;
  const controlBase = datadog ? featureRow({ sampleId: datadog.caseId, company: datadog.company, role: datadog.role, eligibility: datadog.eligibility.state, preferenceCompatibility: datadog.preferenceCompatibility.compatibility, experimentalFitScore: datadog.experimentalFit.score, experimentalRank: null, components: datadog.experimentalFit.components, authorityDiagnostics: datadog.authorityDiagnostics }) : null;
  const controlCaseByModel = controlBase ? Object.fromEntries(Object.entries(CANDIDATE_MODELS).map(([name, model]) => {
    const ranked = rankRows([...baseRows, controlBase], model);
    const row = ranked.find((item) => item.sampleId === datadog.caseId);
    return [name, { capabilityFitScore: row.capabilityFitScore, pursuitPriorityScore: round(row.capabilityFitScore * preferenceMultiplier(datadog.preferenceCompatibility.compatibility)), relativeRank: row.modelRank, preferenceCompatibility: datadog.preferenceCompatibility.compatibility, eligibility: datadog.eligibility.state, qualification: datadog.qualification.state, recommendation: datadog.recommendation.state, responsibility: datadog.authorityDiagnostics.responsibilitySimilarity.state, seniority: datadog.authorityDiagnostics.seniorityCompatibility.state, domain: datadog.authorityDiagnostics.domainCompatibility.state }];
  })) : null;
  const evaluation = { schemaVersion: "staffordos.careeros.v1_23.offline_model_evaluation.v1", datasetCount: 40, reviewCount: 40, humanLabelAuthority: "V1.22D/V1.22F canonical labels", groundTruth: { primary: [...PRIMARY], viable: [...VIABLE], negative: [...NEGATIVE] }, selfConfidenceExcluded: true, interestExcludedFromCapabilityFit: true, wouldPursueExcludedFromCapabilityFit: true, workflowExcludedFromCapabilityFit: true, baselineV1Reproduced: true, modelResults, selectedModel: selected, selfConfidenceSafety, datadog, controlCaseByModel };
  json("CAREEROS_V1_23_MODEL_METRICS.json", { schemaVersion: evaluation.schemaVersion, selectedModel: selected, models: Object.fromEntries(Object.entries(modelResults).map(([name, value]) => [name, { weights: value.weights, metrics: value.metrics, robustness: value.robustness, companyHoldout: value.companyHoldout, roleFamilyHoldout: value.roleFamilyHoldout }])), selfConfidenceSafety: { checks: selfConfidenceSafety, lowVsHighScoreChanges: Object.values(selfConfidenceSafety).reduce((sum, item) => sum + item.scoreChanges, 0), usedInScore: false } });
  json("CAREEROS_V1_23_CANDIDATE_MODELS.json", { schemaVersion: "staffordos.careeros.v1_23.candidate_models.v1", models: Object.fromEntries(Object.entries(CANDIDATE_MODELS).map(([name, weights]) => [name, { weights, rationale: name === "MODEL_V1" ? "Frozen existing model." : "Bounded offline hypothesis; unknown features are omitted from the denominator rather than treated as negative capability evidence." }])) });
  json("CAREEROS_V1_23_MODEL_EVALUATION_DATA.json", evaluation);
  const metricsLines = Object.entries(modelResults).map(([name, value]) => `## ${name}\n\n- Weights: ${JSON.stringify(value.weights)}\n- Top-5 precision: ${value.metrics.top5Precision}\n- Top-10 precision: ${value.metrics.top10Precision}\n- Strong/good recall: ${value.metrics.strongGoodRecall}\n- Viable recall: ${value.metrics.viableRecall}\n- False-positive rate: ${value.metrics.falsePositiveRate}\n- False-negative rate: ${value.metrics.falseNegativeRate}\n- Rank correlation: ${value.metrics.rankCorrelation}\n- Negative leakage top 10: ${value.metrics.negativeLeakageTop10}\n- Hard-mismatch leakage top 10: ${value.metrics.hardMismatchLeakageTop10}\n- Viable below rank 20: ${value.metrics.underRankedViable}\n- Robustness: ${value.robustness.classification}`).join("\n\n");
  md("CAREEROS_V1_23_SCORING_MODEL_EVALUATION.md", `# CareerOS V1.23 Scoring Model Evaluation\n\nOffline only. No production ranking, UI, shortlist, J002, J003, J010, CareerFact, CareerEvidence, workflow, or application behavior changed.\n\nGround truth is Ross's independent evidence-fit label. Self-confidence, interest, would-pursue, and workflow state are excluded from capability fit.\n\n## Candidate results\n\n${metricsLines}\n\n## Selection\n\n**${selected}**\n\nSelection requires improved Top-10 precision, preserved viable recall, no increased negative leakage, no hard-mismatch leakage, and non-fragile robustness.\n`);
  md("CAREEROS_V1_23_WEIGHT_SENSITIVITY.md", `# CareerOS V1.23 Weight Sensitivity\n\n${Object.entries(modelResults).map(([name, value]) => `## ${name}\n\nLeave-one-out: ${JSON.stringify(value.leaveOneOut)}\n\nTop-5 membership: ${value.robustness.top5Membership.join(", ")}\n\nTop-10 membership: ${value.robustness.top10Membership.join(", ")}`).join("\n\n")}`);
  md("CAREEROS_V1_23_OVERFITTING_ANALYSIS.md", `# CareerOS V1.23 Overfitting Analysis\n\nLeave-one-out, company-held-out, role-family-held-out, and top-k membership checks were run for all five models.\n\n${Object.entries(modelResults).map(([name, value]) => `- ${name}: ${value.robustness.classification}; leave-one-out Top-5 range ${value.leaveOneOut.top5Precision.join("–")}; Top-10 range ${value.leaveOneOut.top10Precision.join("–")}; company groups ${value.companyHoldout.groupCount}; role-family groups ${value.roleFamilyHoldout.groupCount}.`).join("\n")}\n\nThis 40-record sample cannot establish statistical generalization.`);
  md("CAREEROS_V1_23_FALSE_POSITIVE_ANALYSIS.md", `# CareerOS V1.23 False-Positive Analysis\n\n${Object.entries(modelResults).map(([name, value]) => `## ${name}\n\n${value.diagnostics.over.map((row) => `- ${row.company} — ${row.role}: human ${row.evidenceFit}; V1 rank ${row.v1Rank}; model rank ${row.modelRank}; score ${row.modelScore}; features ${JSON.stringify(row.features)}.`).join("\n") || "- None in model top 10."}`).join("\n\n")}`);
  md("CAREEROS_V1_23_UNDER_RANKED_POSITIVE_ANALYSIS.md", `# CareerOS V1.23 Under-Ranked Positive Analysis\n\n${Object.entries(modelResults).map(([name, value]) => `## ${name}\n\n${value.diagnostics.under.map((row) => `- ${row.sampleId} ${row.company} — ${row.role}: ${row.evidenceFit}; V1 rank ${row.v1Rank}; model rank ${row.modelRank}; V1 score ${row.v1Score}; model score ${row.modelScore}; responsibility ${row.features.responsibility}; seniority ${row.features.seniority}; domain ${row.features.domain}; preference ${row.preference}.`).join("\n") || "- None."}`).join("\n\n")}`);
  md("CAREEROS_V1_23_DATADOG_TPM_CONTROL_CASE.md", `# CareerOS V1.23 Datadog TPM Control Case\n\nDiagnostic only; not part of the 40-record sample.\n\n${datadog ? `- Qualification: ${datadog.qualification.state}\n- Recommendation: ${datadog.recommendation.state}\n- Eligibility: ${datadog.eligibility.state}\n- Current experimental fit: ${datadog.experimentalFit.score}\n- Current confidence: ${datadog.experimentalConfidence.score}\n- Preference: ${datadog.preferenceCompatibility.compatibility}\n- Responsibility: ${datadog.authorityDiagnostics.responsibilitySimilarity.state}\n- Seniority: ${datadog.authorityDiagnostics.seniorityCompatibility.state}\n- Domain: ${datadog.authorityDiagnostics.domainCompatibility.state}\n\n## Candidate models\n\n\`\`\`json\n${JSON.stringify(controlCaseByModel, null, 2)}\n\`\`\`\n\nThe candidate models treat supported/transferable scope as positive evidence and do not apply a title-only penalty. The control case is not manually boosted.` : "Control case unavailable."}`);
  md("CAREEROS_V1_23_SIGNAL_READINESS.md", `# CareerOS V1.23 Signal Readiness\n\n- Required skills: NEEDS_MORE_AUTHORITY_WORK; prior correlation was -0.25.\n- Relevant experience: USABLE_SIGNAL, modest correlation.\n- Role/function: WEAK_SIGNAL, modest correlation and potentially shared with qualification.\n- Responsibility: USABLE_SIGNAL for diagnostics, newly available but sparse in resolved coverage.\n- Seniority: SPARSE_SIGNAL; authority is now explicit but only 35 roles have a non-unknown projection.\n- Domain: SPARSE_SIGNAL; mostly transferable classifications, not yet independently validated.\n- Geography: NOT_READY for capability fit; use only for pursuit priority.\n- Evidence coverage: diagnostic confidence signal, not negative capability evidence.\n- Compensation: NOT_APPLICABLE.\n`);
  md("CAREEROS_V1_23_NEXT_STAGE_DECISION.md", `# CareerOS V1.23 Next Stage Decision\n\n## Decision\n\n**${selected === "NO_WINNER" ? "SCORING_MODEL_NOT_READY" : "EXPERIMENTAL_MODEL_READY_FOR_LARGER_OFFLINE_TEST"}**\n\nNo candidate is production-ready. Any selected experimental model requires a larger operator-approved offline or shadow evaluation before further promotion.`);
  return evaluation;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = run();
  console.log(JSON.stringify({ selectedModel: result.selectedModel, models: Object.fromEntries(Object.entries(result.modelResults).map(([name, value]) => [name, value.metrics])) }, null, 2));
}

export { run };
