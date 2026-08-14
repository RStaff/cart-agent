import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(process.cwd());
const dataPath = path.join(root, "staffordos/job-search/CAREEROS_MATCH_ENGINE_V1_EVALUATION_DATA.json");
const labelsPath = path.join(os.homedir(), ".staffordos/private/professional/job-search/match-engine-calibration/human_labels.json");
const outputRoot = path.join(root, "staffordos/job-search");

const LABEL_ORDER = { HARD_NO: 0, POOR_MATCH: 1, STRETCH: 2, TRANSFERABLE: 3, GOOD_MATCH: 4, STRONG_MATCH: 5 };
const PRIMARY = new Set(["STRONG_MATCH", "GOOD_MATCH"]);
const VIABLE = new Set(["STRONG_MATCH", "GOOD_MATCH", "TRANSFERABLE", "STRETCH"]);
const NEGATIVE = new Set(["POOR_MATCH", "HARD_NO"]);
const ELIGIBILITY_ORDER = { ELIGIBLE: 0, REVIEW_REQUIRED: 1, UNKNOWN: 2, INELIGIBLE: 3 };

export const WEIGHT_SETS = Object.freeze({
  EXPERIMENTAL_WEIGHT_SET_V1: { requiredSkillsFit: 35, relevantExperienceFit: 20, roleFunctionFit: 15, responsibilitySimilarity: 10, seniorityFit: 8, domainFit: 7, geographyWorkArrangementFit: 5, compensationFit: 0 },
  EXPERIMENTAL_WEIGHT_SET_V1B: { requiredSkillsFit: 32, relevantExperienceFit: 20, roleFunctionFit: 18, responsibilitySimilarity: 13, seniorityFit: 8, domainFit: 6, geographyWorkArrangementFit: 3, compensationFit: 0 },
  EXPERIMENTAL_WEIGHT_SET_V1C: { requiredSkillsFit: 32, relevantExperienceFit: 26, roleFunctionFit: 15, responsibilitySimilarity: 11, seniorityFit: 8, domainFit: 5, geographyWorkArrangementFit: 3, compensationFit: 0 },
  EXPERIMENTAL_WEIGHT_SET_V1D: { requiredSkillsFit: 29, relevantExperienceFit: 22, roleFunctionFit: 18, responsibilitySimilarity: 15, seniorityFit: 8, domainFit: 5, geographyWorkArrangementFit: 3, compensationFit: 0 },
});

function readJson(file) { return JSON.parse(readFileSync(file, "utf8")); }
function round(value) { return Math.round(value * 100) / 100; }
function mean(values) { return values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : null; }
function median(values) { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : round((sorted[middle - 1] + sorted[middle]) / 2); }
function distribution(values) { return Object.fromEntries([...new Set(values)].sort().map((key) => [key, values.filter((value) => value === key).length])); }
function rankBy(values) { const sorted = [...values].sort((a, b) => b.value - a.value || a.sampleId.localeCompare(b.sampleId)); return new Map(sorted.map((item, index) => [item.sampleId, index + 1])); }
function spearman(rows, left, right) {
  const usable = rows.filter((row) => Number.isFinite(row[left]) && Number.isFinite(row[right]));
  if (usable.length < 3) return null;
  const leftMean = mean(usable.map((row) => row[left]));
  const rightMean = mean(usable.map((row) => row[right]));
  const numerator = usable.reduce((sum, row) => sum + (row[left] - leftMean) * (row[right] - rightMean), 0);
  const denominator = Math.sqrt(usable.reduce((sum, row) => sum + (row[left] - leftMean) ** 2, 0) * usable.reduce((sum, row) => sum + (row[right] - rightMean) ** 2, 0));
  return denominator ? round(numerator / denominator) : null;
}
function weightedScore(record, weights) {
  const available = (record.components || []).filter((component) => Number.isFinite(component.value) && weights[component.name] > 0);
  if (!available.length) return null;
  const denominator = available.reduce((sum, component) => sum + weights[component.name], 0);
  return round(available.reduce((sum, component) => sum + component.value * weights[component.name], 0) / denominator);
}
function rankRows(rows, weights, baseline = false) {
  const scored = rows.map((row) => ({ ...row, score: baseline ? row.experimentalFitScore : weightedScore(row, weights) }));
  const ordered = [...scored].sort((left, right) => (ELIGIBILITY_ORDER[left.eligibility] ?? 9) - (ELIGIBILITY_ORDER[right.eligibility] ?? 9) || (right.score ?? -1) - (left.score ?? -1) || left.company.localeCompare(right.company) || left.role.localeCompare(right.role));
  return { rows: ordered.map((row, index) => ({ ...row, engineRank: index + 1 })), rank: new Map(ordered.map((row, index) => [row.sampleId, index + 1])) };
}
function humanRank(labels) { return rankBy(Object.entries(labels.records).map(([sampleId, review]) => ({ sampleId, value: LABEL_ORDER[review.evidenceFit] ?? -1 }))); }
function top(rows, count) { return rows.slice(0, count); }
function positivePrecision(rows, set, count) { const selected = top(rows, count); return round(selected.filter((row) => set.has(row.review.evidenceFit)).length / count); }
function recall(rows, set) { const positives = rows.filter((row) => set.has(row.review.evidenceFit)); return positives.length ? round(positives.filter((row) => row.engineRank <= 10).length / positives.length) : null; }
function topAgreement(rows, humanRanks, count) { const engineIds = new Set(top(rows, count).map((row) => row.sampleId)); const humanIds = new Set([...humanRanks.entries()].sort((a, b) => a[1] - b[1]).slice(0, count).map(([id]) => id)); return round([...engineIds].filter((id) => humanIds.has(id)).length / count); }
function thresholdMetrics(rows, set) {
  const actionable = rows.filter((row) => row.eligibility !== "INELIGIBLE");
  const cutoff = median(actionable.map((row) => row.score).filter(Number.isFinite));
  const predicted = actionable.filter((row) => Number.isFinite(row.score) && row.score >= cutoff);
  const actual = actionable.filter((row) => set.has(row.review.evidenceFit));
  const fp = predicted.filter((row) => !set.has(row.review.evidenceFit)).length;
  const fn = actual.filter((row) => !predicted.includes(row)).length;
  return { cutoff, falsePositiveRate: predicted.length ? round(fp / predicted.length) : null, falseNegativeRate: actual.length ? round(fn / actual.length) : null, predictedCount: predicted.length };
}
function metricSet(rows, weightSet, humanRanks, baseline = false) {
  const ranked = rankRows(rows, weightSet, baseline).rows;
  const primaryThreshold = thresholdMetrics(ranked, PRIMARY);
  const viableThreshold = thresholdMetrics(ranked, VIABLE);
  const actionableTop10 = ranked.filter((row) => row.eligibility !== "INELIGIBLE").slice(0, 10);
  const highConfidence = ranked.filter((row) => (row.experimentalConfidenceScore ?? 0) >= 70);
  const lowConfidence = ranked.filter((row) => (row.experimentalConfidenceScore ?? 0) < 65);
  return {
    weightSet,
    top5Precision: positivePrecision(ranked, PRIMARY, 5),
    top10Precision: positivePrecision(ranked, PRIMARY, 10),
    top5Agreement: topAgreement(ranked, humanRanks, 5),
    top10Agreement: topAgreement(ranked, humanRanks, 10),
    strongRecall: recall(ranked, new Set(["STRONG_MATCH"])),
    strongGoodRecall: recall(ranked, PRIMARY),
    viableRecall: recall(ranked, VIABLE),
    falsePositiveRate: primaryThreshold.falsePositiveRate,
    falseNegativeRate: primaryThreshold.falseNegativeRate,
    viableFalsePositiveRate: viableThreshold.falsePositiveRate,
    rankCorrelation: spearman(ranked.map((row) => ({ engine: row.engineRank, human: humanRanks.get(row.sampleId), engineRank: row.engineRank, humanRank: humanRanks.get(row.sampleId) })), "engineRank", "humanRank"),
    hardMismatchLeakageTop10: ranked.slice(0, 10).filter((row) => row.existingJ010State === "HARD_MISMATCH").length,
    actionableHardMismatchLeakage: actionableTop10.filter((row) => row.existingJ010State === "HARD_MISMATCH").length,
    poorMatchLeakageTop10: ranked.slice(0, 10).filter((row) => ["POOR_MATCH", "HARD_NO"].includes(row.review.evidenceFit)).length,
    underRankedPrimary: ranked.filter((row) => PRIMARY.has(row.review.evidenceFit) && row.engineRank > 20).length,
    underRankedViable: ranked.filter((row) => VIABLE.has(row.review.evidenceFit) && row.engineRank > 20).length,
    highConfidencePrimaryRate: highConfidence.length ? round(highConfidence.filter((row) => PRIMARY.has(row.review.evidenceFit)).length / highConfidence.length) : null,
    lowConfidencePrimaryRate: lowConfidence.length ? round(lowConfidence.filter((row) => PRIMARY.has(row.review.evidenceFit)).length / lowConfidence.length) : null,
    threshold: primaryThreshold,
  };
}
function causeFor(row) {
  if (row.existingJ010State === "HARD_MISMATCH") return "AUTHORITY_CONFLICT";
  if (row.preferenceCompatibility === "OUTSIDE_PREFERENCE") return "GEOGRAPHY_GAP";
  if (row.experimentalFitScoreStatus === "PARTIAL" && row.experimentalFitScore < 35) return "EVIDENCE_GAP";
  if (row.role.includes("Director") || row.role.includes("Senior")) return "TITLE_GAP";
  if (row.existingJ010State === "TRANSFERABLE_BUT_NOT_DIRECT") return "TRANSFERABILITY_UNDERVALUE";
  return "UNKNOWN";
}
function diagnostics(rows, humanRanks) {
  const under = rows.filter((row) => VIABLE.has(row.review.evidenceFit) && row.engineRank > 20).sort((a, b) => b.reviewRank - a.reviewRank).map((row) => ({ sampleId: row.sampleId, company: row.company, role: row.role, evidenceFit: row.review.evidenceFit, engineRank: row.engineRank, score: row.score, j010: row.existingJ010State, j003: row.existingJ003Recommendation, preference: row.preferenceCompatibility, cause: causeFor(row) }));
  const over = rows.filter((row) => NEGATIVE.has(row.review.evidenceFit) && row.engineRank <= 10).map((row) => ({ sampleId: row.sampleId, company: row.company, role: row.role, evidenceFit: row.review.evidenceFit, engineRank: row.engineRank, score: row.score, cause: causeFor(row) }));
  return { under, over, categoryCounts: distribution([...under.map((row) => row.cause), ...over.map((row) => row.cause)]) };
}
function componentFindings(rows) {
  return Object.fromEntries(Object.keys(WEIGHT_SETS.EXPERIMENTAL_WEIGHT_SET_V1).map((name) => {
    const componentRows = rows.map((row) => ({ value: row.components.find((component) => component.name === name)?.value, human: LABEL_ORDER[row.review.evidenceFit] })).filter((row) => Number.isFinite(row.value));
    return [name, { count: componentRows.length, correlation: spearman(componentRows, "value", "human"), meanByLabel: Object.fromEntries(Object.keys(LABEL_ORDER).map((label) => [label, mean(componentRows.filter((row) => row.human === LABEL_ORDER[label]).map((row) => row.value))])) }];
  }));
}
function preferenceFindings(rows) {
  const geography = rows.map((row) => ({ compatibility: row.preferenceCompatibility, human: row.review.geography }));
  return { distribution: distribution(rows.map((row) => row.preferenceCompatibility)), geographyJudgment: distribution(rows.map((row) => row.review.geography)), mismatches: geography.filter((row) => (row.compatibility === "OUTSIDE_PREFERENCE") === (row.human === "ACCEPTABLE")).length };
}
function formatList(items) { return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None"; }
function makeMarkdown(result) {
  const metrics = result.weightResults;
  const lines = ["# CareerOS Match Engine V1 Calibration Results", "", "Offline evaluation only. No production ranking, fit percentage, shortlist, workflow, CareerFact, or CareerEvidence behavior was changed.", "", `- Dataset: ${result.datasetCount} real evaluation records`, `- Human reviews: ${result.reviewCount}/40 valid`, `- Preference authority: explicit; consumed for evaluation only`, `- Baseline: ${result.baselineName}`, "", "## Human labels", "", `Evidence fit: ${JSON.stringify(result.distributions.evidenceFit)}`, `Interest: ${JSON.stringify(result.distributions.interest)}`, `Would pursue: ${JSON.stringify(result.distributions.wouldPursue)}`, `Self-confidence: ${JSON.stringify(result.distributions.selfConfidence)}`, "", "## Baseline metrics", "", "Metrics use STRONG_MATCH + GOOD_MATCH as the primary positive set. Viable recall adds TRANSFERABLE + STRETCH. Top-k agreement is overlap with the human evidence-fit ordering; false-positive/false-negative rates use the documented median-score cutoff among non-ineligible records.", "", ...Object.entries(metrics).filter(([name]) => name === result.baselineName).map(([name, value]) => [`### ${name}`, "", "```json", JSON.stringify(value, null, 2), "```"].join("\n")), "", "## Under-ranking", "", `Found ${result.diagnostics.under.length} viable human-positive roles ranked below 20.`, formatList(result.diagnostics.under.map((row) => `${row.sampleId} ${row.company} — ${row.role}: ${row.evidenceFit}, rank ${row.engineRank}, score ${row.score}, cause ${row.cause}`)), "", "## Over-ranking", "", `Found ${result.diagnostics.over.length} POOR_MATCH/HARD_NO roles in the engine top 10.`, formatList(result.diagnostics.over.map((row) => `${row.sampleId} ${row.company} — ${row.role}: ${row.evidenceFit}, rank ${row.engineRank}, score ${row.score}, cause ${row.cause}`)), "", "## Component diagnostics", "", "Component correlations are Spearman correlations against the ordinal human evidence-fit labels. They are descriptive only and do not authorize new weights.", "", "```json", JSON.stringify(result.componentFindings, null, 2), "```", "", "## Confidence", "", "Confidence is evaluated separately from fit. Self-confidence is not used in any score, rank, or weight calculation.", "", "```json", JSON.stringify(result.confidenceFindings, null, 2), "```", "", "## Preference and geography", "", "```json", JSON.stringify(result.preferenceFindings, null, 2), "```", "", "## Robustness", "", "Leave-one-out results are descriptive because this sample is small; they are not statistical validation.", "", "```json", JSON.stringify(result.robustness, null, 2), "```", "", "## Promotion", "", "NOT_READY: the 40-role sample is useful for diagnosis, but the experimental model remains dependent on incomplete evidence authorities, contains known preference/qualification contamination in source compatibility, and has no approved production thresholds or weights.", "" ]; return lines.join("\n");
}
function run() {
  if (!existsSync(dataPath) || !existsSync(labelsPath)) throw new Error("Calibration data or human review authority is missing.");
  const data = readJson(dataPath); const labels = readJson(labelsPath);
  if (data.records.length !== 40 || Object.keys(labels.records || {}).length !== 40) throw new Error("Calibration requires exactly 40 records and 40 valid reviews.");
  const rows = data.records.map((record) => ({ ...record, review: labels.records[record.sampleId] })).filter((row) => row.review && LABEL_ORDER[row.review.evidenceFit] !== undefined);
  if (rows.length !== 40) throw new Error("One or more records do not have a valid evidence-fit review.");
  const humanRanks = humanRank(labels);
  const baseRows = rankRows(rows, WEIGHT_SETS.EXPERIMENTAL_WEIGHT_SET_V1, true).rows.map((row) => ({ ...row, reviewRank: humanRanks.get(row.sampleId) }));
  const weightResults = Object.fromEntries(Object.entries(WEIGHT_SETS).map(([name, weights]) => [name, metricSet(rows, weights, humanRanks, name === "EXPERIMENTAL_WEIGHT_SET_V1")]));
  const diagnosticsResult = diagnostics(baseRows, humanRanks);
  const confidenceRows = rows.map((row) => ({ confidence: row.experimentalConfidenceScore, evidenceFit: row.review.evidenceFit, lowSelfConfidence: row.review.selfConfidence === "LOW" }));
  const result = {
    schemaVersion: "staffordos.careeros.match_engine_v1.calibration.v1",
    datasetCount: rows.length, reviewCount: rows.length, baselineName: "EXPERIMENTAL_WEIGHT_SET_V1", originalWeightsUnchanged: true,
    distributions: { evidenceFit: distribution(rows.map((row) => row.review.evidenceFit)), interest: distribution(rows.map((row) => row.review.interest)), wouldPursue: distribution(rows.map((row) => row.review.wouldPursue)), geography: distribution(rows.map((row) => row.review.geography)), selfConfidence: distribution(rows.map((row) => row.review.selfConfidence)) },
    weightResults, diagnostics: diagnosticsResult, componentFindings: componentFindings(rows), confidenceFindings: { highConfidenceCount: confidenceRows.filter((row) => row.confidence >= 70).length, lowConfidenceCount: confidenceRows.filter((row) => row.confidence < 65).length, primaryRateHigh: mean(confidenceRows.filter((row) => row.confidence >= 70).map((row) => PRIMARY.has(row.evidenceFit) ? 1 : 0)), primaryRateLow: mean(confidenceRows.filter((row) => row.confidence < 65).map((row) => PRIMARY.has(row.evidenceFit) ? 1 : 0)), selfConfidenceNotUsed: true },
    preferenceFindings: preferenceFindings(rows),
    hardMismatchPreferenceContamination: { count: rows.filter((row) => row.existingJ010State === "HARD_MISMATCH" && row.preferenceCompatibility === "UNKNOWN").length, recommendation: "Repair independent preference compatibility contamination in a separate bounded mission; do not repair during calibration." },
    controlCase: data.controlCases?.find((item) => item.caseId === "CONTROL_CASE_DATADOG_TPM") || null,
    robustness: Object.fromEntries(Object.entries(WEIGHT_SETS).map(([name, weights]) => { const values = []; for (let i = 0; i < rows.length; i += 1) { const subset = rows.filter((_, index) => index !== i); values.push(metricSet(subset, weights, humanRank({ records: Object.fromEntries(subset.map((row) => [row.sampleId, row.review])) }))); } return [name, { leaveOneOutTop5PrecisionRange: [Math.min(...values.map((item) => item.top5Precision)), Math.max(...values.map((item) => item.top5Precision))], leaveOneOutStrongGoodRecallRange: [Math.min(...values.map((item) => item.strongGoodRecall)), Math.max(...values.map((item) => item.strongGoodRecall))] }]; })),
    rows: baseRows.map((row) => ({ sampleId: row.sampleId, company: row.company, role: row.role, location: row.location, evidenceFit: row.review.evidenceFit, interest: row.review.interest, geography: row.review.geography, wouldPursue: row.review.wouldPursue, selfConfidence: row.review.selfConfidence, existingJ010State: row.existingJ010State, existingJ003Recommendation: row.existingJ003Recommendation, eligibility: row.eligibility, preferenceCompatibility: row.preferenceCompatibility, experimentalFitScore: row.experimentalFitScore, experimentalConfidenceScore: row.experimentalConfidenceScore, engineRank: row.engineRank, humanRank: row.reviewRank, components: row.components })),
  };
  writeFileSync(path.join(outputRoot, "CAREEROS_MATCH_ENGINE_V1_22D_CALIBRATION_DATA.json"), `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync(path.join(outputRoot, "CAREEROS_MATCH_ENGINE_V1_22D_CALIBRATION_RESULTS.md"), `${makeMarkdown(result)}\n`);
  writeFileSync(path.join(outputRoot, "CAREEROS_MATCH_ENGINE_V1_22D_WEIGHT_SENSITIVITY.md"), `# Weight Sensitivity\n\nOffline only. Candidate weights are bounded hypotheses; none are production approved.\n\n${Object.entries(weightResults).map(([name, metrics]) => `## ${name}\n\nWeights: ${JSON.stringify(WEIGHT_SETS[name])}\n\n- Top-5 precision: ${metrics.top5Precision}\n- Top-10 precision: ${metrics.top10Precision}\n- Strong/good recall: ${metrics.strongGoodRecall}\n- Viable recall: ${metrics.viableRecall}\n- False-positive rate: ${metrics.falsePositiveRate}\n- False-negative rate: ${metrics.falseNegativeRate}\n- Rank correlation: ${metrics.rankCorrelation}\n- Hard-mismatch leakage: ${metrics.hardMismatchLeakageTop10}\n- Under-ranked viable count: ${metrics.underRankedViable}\n- Over-ranked negative count: ${metrics.poorMatchLeakageTop10}\n`).join("\n")}`);
  writeFileSync(path.join(outputRoot, "CAREEROS_MATCH_ENGINE_V1_22D_SYSTEMATIC_ERROR_ANALYSIS.md"), `# Systematic Error Analysis\n\n## Under-ranking\n\n${formatList(diagnosticsResult.under.map((row) => `${row.sampleId} ${row.company} — ${row.role}: ${row.evidenceFit}; ${row.cause}; score ${row.score}; rank ${row.engineRank}.`))}\n\n## Over-ranking\n\n${formatList(diagnosticsResult.over.map((row) => `${row.sampleId} ${row.company} — ${row.role}: ${row.evidenceFit}; ${row.cause}; score ${row.score}; rank ${row.engineRank}.`))}\n\nTitle gaps, domain gaps, evidence gaps, and confidence gaps remain separate diagnostic categories. No title or self-confidence signal is used as a blocker or ranking feature.\n`);
  const control = result.controlCase;
  writeFileSync(path.join(outputRoot, "CAREEROS_MATCH_ENGINE_V1_22D_CAREER_EVIDENCE_GAP_REPORT.md"), `# CareerOS Career Evidence Gap Report\n\nDiagnostic only. No CareerFact or CareerEvidence was created or changed.\n\n${formatList(diagnosticsResult.under.map((row) => `${row.sampleId} ${row.company} — ${row.role}: ${row.cause}; classify missing support as known capability with weak system evidence, true unknown, likely transferable, or proven missing requirement only after evidence review.`))}\n\n## Datadog TPM control case\n\n${control ? `Current qualification: ${control.qualification.state}. Eligibility: ${control.eligibility.state}. Experimental fit: ${control.experimentalFit.score}. Confidence: ${control.experimentalConfidence.score}. Preference compatibility: ${control.preferenceCompatibility.compatibility}. The record contains transferable evidence and unresolved/missing mappings; it does not establish that Ross cannot perform the role. Direct capability blockers are not proven by title or domain difference alone.` : "Control case unavailable."}\n`);
  writeFileSync(path.join(outputRoot, "CAREEROS_MATCH_ENGINE_V1_22D_PROMOTION_DECISION.md"), `# CareerOS Match Engine V1 Promotion Decision\n\n## Decision\n\n**NOT_READY**\n\nThe 40-role calibration is diagnostic, not sufficient for production promotion. The model remains dependent on incomplete evidence mappings, lacks approved production thresholds, and retains a known qualification/preference contamination defect in the evaluation source.\n\nNext bounded step: repair independent preference compatibility and run a larger, operator-approved shadow evaluation without changing production ranking.\n`);
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = run();
  console.log(JSON.stringify({ datasetCount: result.datasetCount, reviewCount: result.reviewCount, baseline: result.weightResults.EXPERIMENTAL_WEIGHT_SET_V1, outputs: 5 }, null, 2));
}
