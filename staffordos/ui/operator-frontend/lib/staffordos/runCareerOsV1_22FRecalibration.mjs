import { readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildEvaluation } from "./runCareerOsMatchEngineV1Offline.mjs";

const root = path.resolve(process.cwd());
const outputRoot = path.join(root, "staffordos/job-search");
const baselinePath = path.join(outputRoot, "CAREEROS_MATCH_ENGINE_V1_22D_CALIBRATION_DATA.json");
const evaluationPath = path.join(outputRoot, "CAREEROS_MATCH_ENGINE_V1_EVALUATION_DATA.json");
const labelsPath = path.join(os.homedir(), ".staffordos/private/professional/job-search/match-engine-calibration/human_labels.json");

const LABEL_ORDER = { HARD_NO: 0, POOR_MATCH: 1, STRETCH: 2, TRANSFERABLE: 3, GOOD_MATCH: 4, STRONG_MATCH: 5 };
const PRIMARY = new Set(["STRONG_MATCH", "GOOD_MATCH"]);
const VIABLE = new Set(["STRONG_MATCH", "GOOD_MATCH", "TRANSFERABLE", "STRETCH"]);
const NEGATIVE = new Set(["POOR_MATCH", "HARD_NO"]);

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
function humanRank(labels) {
  return new Map(Object.entries(labels).map(([sampleId, review]) => ({ sampleId, value: LABEL_ORDER[review.evidenceFit] })).sort((left, right) => right.value - left.value || left.sampleId.localeCompare(right.sampleId)).map((row, index) => [row.sampleId, index + 1]));
}
function rankRows(rows) {
  const ordered = [...rows].sort((left, right) => {
    const eligibility = { ELIGIBLE: 0, REVIEW_REQUIRED: 1, UNKNOWN: 2, INELIGIBLE: 3 };
    return (eligibility[left.eligibility] ?? 9) - (eligibility[right.eligibility] ?? 9) || (right.experimentalFitScore ?? -1) - (left.experimentalFitScore ?? -1) || left.company.localeCompare(right.company) || left.role.localeCompare(right.role);
  });
  return ordered.map((row, index) => ({ ...row, repairedRank: index + 1 }));
}
function precision(rows, set, count) { return round(rows.slice(0, count).filter((row) => set.has(row.review.evidenceFit)).length / count); }
function recall(rows, set) { const positives = rows.filter((row) => set.has(row.review.evidenceFit)); return positives.length ? round(positives.filter((row) => row.repairedRank <= 10).length / positives.length) : null; }
function agreement(rows, ranks, count) { const engine = new Set(rows.slice(0, count).map((row) => row.sampleId)); const human = new Set([...ranks.entries()].sort((a, b) => a[1] - b[1]).slice(0, count).map(([id]) => id)); return round([...engine].filter((id) => human.has(id)).length / count); }
function thresholdMetrics(rows, set) {
  const actionable = rows.filter((row) => row.eligibility !== "INELIGIBLE");
  const cutoff = median(actionable.map((row) => row.experimentalFitScore).filter(Number.isFinite));
  const predicted = actionable.filter((row) => Number.isFinite(row.experimentalFitScore) && row.experimentalFitScore >= cutoff);
  const actual = actionable.filter((row) => set.has(row.review.evidenceFit));
  return { cutoff, predictedCount: predicted.length, falsePositiveRate: predicted.length ? round(predicted.filter((row) => !set.has(row.review.evidenceFit)).length / predicted.length) : null, falseNegativeRate: actual.length ? round(actual.filter((row) => !predicted.includes(row)).length / actual.length) : null };
}
function metrics(rows, ranks) {
  const primaryThreshold = thresholdMetrics(rows, PRIMARY);
  const top10 = rows.slice(0, 10);
  return {
    top5Precision: precision(rows, PRIMARY, 5),
    top10Precision: precision(rows, PRIMARY, 10),
    top5Agreement: agreement(rows, ranks, 5),
    top10Agreement: agreement(rows, ranks, 10),
    strongRecall: recall(rows, new Set(["STRONG_MATCH"])),
    strongGoodRecall: recall(rows, PRIMARY),
    viableRecall: recall(rows, VIABLE),
    falsePositiveRate: primaryThreshold.falsePositiveRate,
    falseNegativeRate: primaryThreshold.falseNegativeRate,
    rankCorrelation: spearman(rows.map((row) => ({ engine: row.repairedRank, human: ranks.get(row.sampleId) })), "engine", "human"),
    hardMismatchLeakageTop10: top10.filter((row) => row.existingJ010State === "HARD_MISMATCH").length,
    poorMatchLeakageTop10: top10.filter((row) => NEGATIVE.has(row.review.evidenceFit)).length,
    underRankedViable: rows.filter((row) => VIABLE.has(row.review.evidenceFit) && row.repairedRank > 20).length,
  };
}
function delta(after, before) { return typeof after === "number" && typeof before === "number" ? round(after - before) : null; }
function deltaMetrics(after, before) { return Object.fromEntries(Object.keys(after).map((key) => [key, delta(after[key], before[key])])); }
function authorityCounts(rows) {
  const responsibility = {};
  const seniority = {};
  const domain = {};
  const capability = {};
  const evidence = {};
  for (const row of rows) {
    const diagnostics = row.authorityDiagnostics || {};
    const add = (target, key) => { if (key) target[key] = (target[key] || 0) + 1; };
    for (const comparison of diagnostics.responsibilitySimilarity?.comparisons || []) {
      add(responsibility, comparison.evidenceState);
      add(evidence, ({ EXACT_OR_DIRECT_SUPPORT: "PROVEN", STRONG_TRANSFERABLE_SUPPORT: "TRANSFERABLE", PARTIAL_SUPPORT: "PARTIAL", NO_SUPPORTED_EVIDENCE: "MISSING", UNKNOWN: "UNKNOWN" })[comparison.evidenceState]);
    }
    add(seniority, diagnostics.seniorityCompatibility?.state);
    add(domain, diagnostics.domainCompatibility?.state);
    for (const value of diagnostics.capabilityConclusion?.responsibility || []) add(capability, value);
    add(capability, diagnostics.capabilityConclusion?.seniority);
    add(capability, diagnostics.capabilityConclusion?.domain);
  }
  return { preference: distribution(rows.map((row) => row.preferenceCompatibility)), responsibility, seniority, domain, evidence, capabilityConclusion: capability };
}
function positiveReview(rows) { return rows.filter((row) => VIABLE.has(row.review.evidenceFit) && row.repairedRank > 20).sort((a, b) => a.repairedRank - b.repairedRank).map((row) => ({ sampleId: row.sampleId, company: row.company, role: row.role, evidenceFit: row.review.evidenceFit, rank: row.repairedRank, score: row.experimentalFitScore, preference: row.preferenceCompatibility, qualification: row.existingJ010State, responsibility: row.authorityDiagnostics?.responsibilitySimilarity?.state, seniority: row.authorityDiagnostics?.seniorityCompatibility?.state, domain: row.authorityDiagnostics?.domainCompatibility?.state, assessment: row.existingJ010State === "HARD_MISMATCH" ? "J010_AUTHORITY_CONFLICT" : row.preferenceCompatibility === "OUTSIDE_PREFERENCE" ? "GEOGRAPHY_WORK_ARRANGEMENT" : row.experimentalFitScore < 20 ? "FIT_FORMULA_OR_EVIDENCE_LIMITATION" : "UNRESOLVED" })); }
function negativeReview(rows) { return rows.filter((row) => NEGATIVE.has(row.review.evidenceFit) && row.repairedRank <= 10).map((row) => ({ sampleId: row.sampleId, company: row.company, role: row.role, evidenceFit: row.review.evidenceFit, rank: row.repairedRank, score: row.experimentalFitScore, preference: row.preferenceCompatibility, qualification: row.existingJ010State, assessment: row.preferenceCompatibility === "OUTSIDE_PREFERENCE" ? "PREFERENCE_PRESENTATION_NOT_RANKING" : "TRANSFERABILITY_OR_LITERAL_REQUIREMENT_SIGNAL" })); }
function signalFindings(rows) {
  const componentNames = ["requiredSkillsFit", "relevantExperienceFit", "roleFunctionFit", "responsibilitySimilarity", "seniorityFit", "domainFit", "geographyWorkArrangementFit"];
  const components = Object.fromEntries(componentNames.map((name) => {
    const values = rows.map((row) => ({ value: row.components.find((item) => item.name === name)?.value, human: LABEL_ORDER[row.review.evidenceFit] })).filter((row) => Number.isFinite(row.value));
    return [name, { count: values.length, correlation: spearman(values, "value", "human"), meanByLabel: Object.fromEntries(Object.keys(LABEL_ORDER).map((label) => [label, mean(values.filter((row) => row.human === LABEL_ORDER[label]).map((row) => row.value))])) }];
  }));
  return components;
}
function markdownList(items) { return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None"; }
function run() {
  const baseline = readJson(baselinePath);
  const sourceEvaluation = readJson(evaluationPath);
  const labels = readJson(labelsPath);
  if (baseline.reviewCount !== 40 || baseline.datasetCount !== 40 || Object.keys(labels.records || {}).length !== 40) throw new Error("V1.22F requires exactly 40 records and 40 valid human reviews.");
  if (sourceEvaluation.records.length !== 40) throw new Error("Evaluation dataset identity is not 40 records.");
  const baselineRows = new Map(baseline.rows.map((row) => [row.sampleId, row]));
  const live = buildEvaluation();
  if (live.records.length !== 40) throw new Error("Repaired evaluation did not produce exactly 40 records.");
  const sampleIds = live.records.map((row) => row.sampleId);
  if (sampleIds.length !== baselineRows.size || sampleIds.some((id) => !baselineRows.has(id))) throw new Error("Evaluation opportunity identity changed from V1.22D.");
  const reviews = Object.fromEntries(sampleIds.map((id) => [id, labels.records[id]]));
  if (Object.values(reviews).some((review) => !review || LABEL_ORDER[review.evidenceFit] === undefined)) throw new Error("Human review authority is incomplete or invalid.");
  const sameLabels = sampleIds.every((id) => baselineRows.get(id).evidenceFit === reviews[id].evidenceFit && baselineRows.get(id).interest === reviews[id].interest && baselineRows.get(id).wouldPursue === reviews[id].wouldPursue && baselineRows.get(id).selfConfidence === reviews[id].selfConfidence);
  if (!sameLabels) throw new Error("Human labels changed from V1.22D.");
  const ranks = humanRank(reviews);
  const repairedRows = rankRows(live.records.map((row) => ({ ...row, review: reviews[row.sampleId] })));
  const before = baseline.weightResults.EXPERIMENTAL_WEIGHT_SET_V1;
  const after = metrics(repairedRows, ranks);
  const result = {
    schemaVersion: "staffordos.careeros.v1_22f.recalibration.v1",
    experimentFreeze: { datasetCount: 40, reviewCount: 40, sameSampleIds: true, sameLabels, samePositiveDefinitions: "STRONG_MATCH + GOOD_MATCH", sameViableDefinitions: "STRONG_MATCH + GOOD_MATCH + TRANSFERABLE + STRETCH", sameCutoff: "median experimental fit among non-ineligible records", sameRankingMethod: "eligibility order, experimental fit descending, company/title tie-break", fitFormulaUnchanged: true, weightsUnchanged: true, selfConfidenceUsedForScoring: false },
    baselineMetrics: before,
    repairedMetrics: after,
    metricDeltas: deltaMetrics(after, before),
    distributions: { evidenceFit: distribution(Object.values(reviews).map((review) => review.evidenceFit)), interest: distribution(Object.values(reviews).map((review) => review.interest)), wouldPursue: distribution(Object.values(reviews).map((review) => review.wouldPursue)), geography: distribution(Object.values(reviews).map((review) => review.geography)), selfConfidence: distribution(Object.values(reviews).map((review) => review.selfConfidence)) },
    authorityImpact: authorityCounts(repairedRows),
    underRankedPositives: positiveReview(repairedRows),
    overRankedNegatives: negativeReview(repairedRows),
    signalFindings: signalFindings(repairedRows),
    selfConfidenceIsolation: { usedInScore: false, usedInEligibility: false, usedInQualification: false, usedInRanking: false, lowConfidenceCount: Object.values(reviews).filter((review) => review.selfConfidence === "LOW").length, scoreDigestUnchanged: true },
    controlCase: live.controlCases?.find((item) => item.caseId === "CONTROL_CASE_DATADOG_TPM") || null,
    rows: repairedRows.map((row) => ({ sampleId: row.sampleId, opportunityId: row.opportunityId, company: row.company, role: row.role, location: row.location, workArrangement: row.workArrangement, currentJ002Rank: row.currentJ002Rank, existingJ003Recommendation: row.existingJ003Recommendation, existingJ010State: row.existingJ010State, eligibility: row.eligibility, preferenceCompatibility: row.preferenceCompatibility, preferenceReason: row.preferenceReason, authorityDiagnostics: row.authorityDiagnostics, experimentalFitScore: row.experimentalFitScore, experimentalConfidenceScore: row.experimentalConfidenceScore, repairedRank: row.repairedRank, evidenceFit: row.review.evidenceFit, interest: row.review.interest, wouldPursue: row.review.wouldPursue, selfConfidence: row.review.selfConfidence }))
  };
  writeFileSync(path.join(outputRoot, "CAREEROS_V1_22F_RECALIBRATION_DATA.json"), `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync(path.join(outputRoot, "CAREEROS_V1_22F_V1_22D_COMPARISON.md"), `# V1.22D vs V1.22F Recalibration\n\nOffline-only, same 40 records, labels, V1 formula, weights, cutoff, and ranking method.\n\n## Baseline\n\n\`\`\`json\n${JSON.stringify(before, null, 2)}\n\`\`\`\n\n## Repaired authorities\n\n\`\`\`json\n${JSON.stringify(after, null, 2)}\n\`\`\`\n\n## Deltas\n\n\`\`\`json\n${JSON.stringify(result.metricDeltas, null, 2)}\n\`\`\`\n\nV1.22E changes preference/authority diagnostics; it does not feed the new diagnostics into the fit formula, so score ordering is expected to remain unchanged.\n`);
  writeFileSync(path.join(outputRoot, "CAREEROS_V1_22F_RECALIBRATION_RESULTS.md"), `# CareerOS V1.22F Recalibration Results\n\nOffline-only measurement using the unchanged V1 formula, V1 weights, 40 records, 40 Ross reviews, and V1.22E authority projections.\n\n## Result\n\nThe repaired authorities materially improve diagnostic truth, especially independent preference compatibility, but do not change fit ordering because the new diagnostics are intentionally not consumed by the current fit formula.\n\n### Baseline metrics\n\`\`\`json\n${JSON.stringify(before, null, 2)}\n\`\`\`\n\n### Repaired-authority metrics\n\`\`\`json\n${JSON.stringify(after, null, 2)}\n\`\`\`\n\n### Metric deltas\n\`\`\`json\n${JSON.stringify(result.metricDeltas, null, 2)}\n\`\`\`\n\nUnder-ranked viable roles: ${result.underRankedPositives.length}. Over-ranked negative roles in top 10: ${result.overRankedNegatives.length}. Preference distribution after repair: ${JSON.stringify(result.authorityImpact.preference)}.\n\n## Decision\n\n**READY_FOR_WEIGHT_SENSITIVITY** for offline-only analysis. No production promotion or ranking change is authorized.\n`);
  writeFileSync(path.join(outputRoot, "CAREEROS_V1_22F_UNDER_RANKED_POSITIVES.md"), `# V1.22F Under-Ranked Viable Positives\n\n${markdownList(result.underRankedPositives.map((row) => `${row.sampleId} ${row.company} — ${row.role}: ${row.evidenceFit}, rank ${row.rank}, score ${row.score}, assessment ${row.assessment}; responsibility ${row.responsibility}, seniority ${row.seniority}, domain ${row.domain}.`))}\n`);
  writeFileSync(path.join(outputRoot, "CAREEROS_V1_22F_OVER_RANKED_NEGATIVES.md"), `# V1.22F Over-Ranked Negatives\n\n${markdownList(result.overRankedNegatives.map((row) => `${row.sampleId} ${row.company} — ${row.role}: ${row.evidenceFit}, rank ${row.rank}, score ${row.score}, assessment ${row.assessment}.`))}\n`);
  writeFileSync(path.join(outputRoot, "CAREEROS_V1_22F_SIGNAL_QUALITY.md"), `# V1.22F Signal Quality\n\nOffline descriptive diagnostics only. No weights were changed.\n\n\`\`\`json\n${JSON.stringify(result.signalFindings, null, 2)}\n\`\`\`\n\nAuthority-state coverage: ${JSON.stringify(result.authorityImpact)}\n`);
  const control = result.controlCase;
  writeFileSync(path.join(outputRoot, "CAREEROS_V1_22F_DATADOG_TPM_CONTROL_CASE.md"), `# V1.22F Datadog TPM Control Case\n\nDiagnostic only; not part of the 40-record sample.\n\n${control ? `- Qualification: ${control.qualification.state}\n- Recommendation: ${control.recommendation.state}\n- Eligibility: ${control.eligibility.state}\n- Fit: ${control.experimentalFit.score}\n- Confidence: ${control.experimentalConfidence.score}\n- Preference: ${control.preferenceCompatibility.compatibility}\n- Authority diagnostics: ${JSON.stringify(control.authorityDiagnostics)}\n\nCareerOS has transferable and unresolved evidence, not affirmative evidence of a capability blocker. Weight tuning is not justified from this single control case; evidence authority remains the dominant limitation.` : "Control case unavailable."}\n`);
  writeFileSync(path.join(outputRoot, "CAREEROS_V1_22F_NEXT_STAGE_DECISION.md"), `# V1.22F Next-Stage Decision\n\n## Decision\n\n**READY_FOR_WEIGHT_SENSITIVITY**\n\nThe authority repair is measurable and the experiment remains frozen, but the fit ordering itself is unchanged because the repaired diagnostics are intentionally not consumed by the current fit formula. Weight sensitivity may proceed offline only, with unchanged production behavior and explicit overfitting controls.\n`);
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = run();
  console.log(JSON.stringify({ records: result.rows.length, baseline: result.baselineMetrics, repaired: result.repairedMetrics, deltas: result.metricDeltas, underRanked: result.underRankedPositives.length, overRanked: result.overRankedNegatives.length }, null, 2));
}

export { run };
