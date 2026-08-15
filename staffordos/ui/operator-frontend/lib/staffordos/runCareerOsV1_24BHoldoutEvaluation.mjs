import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { buildOpportunityMatchResult } from "./careerOsMatchEngineV1.mjs";
import { projectMatchAuthorityDiagnostics } from "./careerOsMatchAuthorityProjections.mjs";
import { loadPreferenceAuthority } from "./runCareerOsMatchEngineV1Offline.mjs";

const root = path.resolve(process.cwd());
const outputRoot = path.join(root, "staffordos/job-search");
const privateRoot = path.join(os.homedir(), ".staffordos/private/professional/job-search");
const manifestPath = path.join(outputRoot, "CAREEROS_V1_24_EVALUATION_DATA.json");
const labelsPath = path.join(privateRoot, "match-engine-calibration/holdout_human_labels.json");
const calibrationMetricsPath = path.join(outputRoot, "CAREEROS_V1_23_MODEL_METRICS.json");
const V2D_WEIGHTS = Object.freeze({ requiredSkills: 0, relevantExperience: 40, roleFunction: 25, responsibility: 25, seniority: 10, domain: 0, evidenceCoverage: 0 });
const LABEL_ORDER = { HARD_NO: 0, POOR_MATCH: 1, STRETCH: 2, TRANSFERABLE: 3, GOOD_MATCH: 4, STRONG_MATCH: 5 };
const PRIMARY = new Set(["STRONG_MATCH", "GOOD_MATCH"]);
const VIABLE = new Set(["STRONG_MATCH", "GOOD_MATCH", "TRANSFERABLE", "STRETCH"]);
const NEGATIVE = new Set(["POOR_MATCH", "HARD_NO"]);
const ELIGIBILITY_ORDER = { ELIGIBLE: 0, REVIEW_REQUIRED: 1, UNKNOWN: 2, INELIGIBLE: 3 };

function readJson(file) { return JSON.parse(readFileSync(file, "utf8")); }
function newest(directory, filename) {
  const { readdirSync, statSync } = createRequire(import.meta.url)("node:fs");
  const found = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const file = path.join(dir, name); const stat = statSync(file);
      if (stat.isDirectory()) walk(file); else if (name === filename) found.push({ file, mtime: stat.mtimeMs });
    }
  }
  walk(directory); found.sort((a, b) => b.mtime - a.mtime || a.file.localeCompare(b.file));
  return found[0] ? readJson(found[0].file) : null;
}
function round(value) { return Number.isFinite(value) ? Math.round(value * 100) / 100 : null; }
function mean(values) { return values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : null; }
function median(values) { if (!values.length) return null; const s = [...values].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : round((s[m - 1] + s[m]) / 2); }
function spearman(rows) {
  const usable = rows.filter((r) => Number.isFinite(r.modelRank) && Number.isFinite(r.humanRank));
  if (usable.length < 3) return null;
  const lm = mean(usable.map((r) => r.modelRank)); const hm = mean(usable.map((r) => r.humanRank));
  const n = usable.reduce((s, r) => s + (r.modelRank - lm) * (r.humanRank - hm), 0);
  const d = Math.sqrt(usable.reduce((s, r) => s + (r.modelRank - lm) ** 2, 0) * usable.reduce((s, r) => s + (r.humanRank - hm) ** 2, 0));
  return d ? round(n / d) : null;
}
function stateValue(state) { return { EXACT_OR_DIRECT_SUPPORT: 100, DIRECT_LEVEL_SUPPORT: 100, DIRECT_DOMAIN: 100, STRONG_TRANSFERABLE_SUPPORT: 75, UPWARD_STRETCH_WITH_SUPPORTED_SCOPE: 80, ADJACENT_LEVEL: 70, ADJACENT_DOMAIN: 80, TRANSFERABLE_DOMAIN: 75, PARTIAL_SUPPORT: 50, NO_SUPPORTED_EVIDENCE: 0, PROVEN_LEVEL_MISMATCH: 0, PROVEN_DOMAIN_REQUIREMENT_GAP: 0 }[state] ?? null; }
function diagnosticsFeature(record) {
  const d = record.authorityDiagnostics || {}; const comparisons = d.responsibilitySimilarity?.comparisons || [];
  const known = comparisons.map((x) => stateValue(x.evidenceState)).filter(Number.isFinite);
  return { responsibility: known.length ? mean(known) : null, responsibilityCoverage: comparisons.length ? round(known.length / comparisons.length * 100) : null, seniority: stateValue(d.seniorityCompatibility?.state), domain: stateValue(d.domainCompatibility?.state) };
}
function component(record, name) { return record.components.find((x) => x.name === name)?.value ?? null; }
export function frozenV2DFeatures(record) { const d = diagnosticsFeature(record); return { requiredSkills: component(record, "requiredSkillsFit"), relevantExperience: component(record, "relevantExperienceFit"), roleFunction: component(record, "roleFunctionFit"), responsibility: d.responsibility, seniority: d.seniority, domain: d.domain, evidenceCoverage: d.responsibilityCoverage }; }
export function scoreFrozenV2D(features = {}) {
  const available = Object.entries(V2D_WEIGHTS).filter(([name, weight]) => weight > 0 && Number.isFinite(features[name]));
  if (!available.length) return null;
  const denominator = available.reduce((s, [, w]) => s + w, 0);
  return round(available.reduce((s, [name, w]) => s + features[name] * w, 0) / denominator);
}
function sourceFor(record, sourceById) { return sourceById.get(record.sourceRecordId) || {}; }
function rank(rows) { return [...rows].sort((a, b) => (ELIGIBILITY_ORDER[a.eligibility] ?? 9) - (ELIGIBILITY_ORDER[b.eligibility] ?? 9) || (b.capabilityFitScore ?? -1) - (a.capabilityFitScore ?? -1) || a.company.localeCompare(b.company) || a.role.localeCompare(b.role)).map((x, i) => ({ ...x, modelRank: i + 1 })); }
function humanRanks(rows) { return new Map([...rows].sort((a, b) => LABEL_ORDER[b.review.evidenceFit] - LABEL_ORDER[a.review.evidenceFit] || a.sampleId.localeCompare(b.sampleId)).map((r, i) => [r.sampleId, i + 1])); }
function precision(rows, set, n) { return round(rows.slice(0, Math.min(n, rows.length)).filter((r) => set.has(r.review.evidenceFit)).length / Math.min(n, rows.length)); }
function recall(rows, set) { const positives = rows.filter((r) => set.has(r.review.evidenceFit)); return positives.length ? round(positives.filter((r) => r.modelRank <= 10).length / positives.length) : null; }
function threshold(rows, set) { const actionable = rows.filter((r) => r.eligibility !== "INELIGIBLE"); const cutoff = median(actionable.map((r) => r.capabilityFitScore).filter(Number.isFinite)); const predicted = actionable.filter((r) => Number.isFinite(r.capabilityFitScore) && r.capabilityFitScore >= cutoff); const actual = actionable.filter((r) => set.has(r.review.evidenceFit)); return { cutoff, predictedCount: predicted.length, falsePositiveRate: predicted.length ? round(predicted.filter((r) => !set.has(r.review.evidenceFit)).length / predicted.length) : null, falseNegativeRate: actual.length ? round(actual.filter((r) => !predicted.includes(r)).length / actual.length) : null }; }
function metrics(rows) { const t = threshold(rows, PRIMARY); return { top5Precision: precision(rows, PRIMARY, 5), top10Precision: precision(rows, PRIMARY, 10), strongRecall: recall(rows, new Set(["STRONG_MATCH"])), strongGoodRecall: recall(rows, PRIMARY), viableRecall: recall(rows, VIABLE), falsePositiveRate: t.falsePositiveRate, falseNegativeRate: t.falseNegativeRate, rankCorrelation: spearman(rows), negativeLeakageTop5: rows.slice(0, 5).filter((r) => NEGATIVE.has(r.review.evidenceFit)).length, negativeLeakageTop10: rows.slice(0, 10).filter((r) => NEGATIVE.has(r.review.evidenceFit)).length, hardMismatchLeakageTop10: rows.slice(0, 10).filter((r) => r.j010 === "HARD_MISMATCH").length, underRankedViable: rows.filter((r) => VIABLE.has(r.review.evidenceFit) && r.modelRank > 20).length, strongGoodBelow20: rows.filter((r) => PRIMARY.has(r.review.evidenceFit) && r.modelRank > 20).length, threshold: t }; }
function distribution(rows, selector) { return Object.fromEntries([...new Set(rows.map(selector))].sort().map((key) => [key, rows.filter((r) => selector(r) === key).length])); }
function aggregateCounts(rows, selector) { const counts = {}; for (const row of rows) for (const [key, value] of Object.entries(selector(row) || {})) counts[key] = (counts[key] || 0) + value; return Object.fromEntries(Object.entries(counts).sort()); }
function preferenceMultiplier(state) { return { MATCH: 1, PARTIAL_MATCH: 0.9, UNKNOWN: 0.75, OUTSIDE_PREFERENCE: 0.4 }[state] ?? 0.75; }
function buildRows(manifest, labels, options = {}) {
  const queue = newest(path.join(privateRoot, "greenhouse-discovery"), "job_source_import_queue_result.json") || {};
  const fits = newest(path.join(privateRoot, "greenhouse-discovery"), "explainable_fit_artifacts.json") || [];
  const recommendations = newest(path.join(privateRoot, "opportunity-recommendations"), "opportunity_recommendations.json") || [];
  const sourceById = new Map((queue.normalizedSourceRecords || []).map((x) => [x.jobSourceRecordId, x]));
  const queueById = new Map((queue.importQueue || []).map((x) => [x.queueItemId, x]));
  const fitByQueue = new Map(fits.map((x) => [x.queueItemId, x]));
  const recommendationByOpportunity = new Map(recommendations.map((x) => [x.opportunityId, x]));
  const { preferences, projectJobSearchCompatibility } = loadPreferenceAuthority();
  const rows = manifest.holdoutSet.map((item) => {
    const rec = recommendationByOpportunity.get(item.opportunityId); if (!rec) throw new Error(`Missing recommendation for ${item.sampleId}`);
    const source = sourceFor(rec, sourceById); const fitArtifact = fitByQueue.get(rec.queueItemId); const queueItem = queueById.get(rec.queueItemId) || {};
    const requirements = fitArtifact?.requirements || [];
    const projected = options.mappingProjection ? options.mappingProjection({ record: rec, requirements, mappings: fitArtifact?.mappings || [] }) : { mappings: fitArtifact?.mappings || [] };
    const authorityDiagnostics = projectMatchAuthorityDiagnostics({ title: source.title || rec.role, requirements, mappings: projected.mappings });
    const preferenceCompatibility = projectJobSearchCompatibility({ preferences, location: source.location, workArrangement: source.workArrangement || source.remoteState || null, relocationRequired: typeof source.relocationRequired === "boolean" ? source.relocationRequired : null, qualification: rec.qualification });
    const result = buildOpportunityMatchResult({ opportunity: { opportunityId: rec.opportunityId, canonicalOpportunityId: rec.canonicalOpportunityId, sourceRecordId: rec.sourceRecordId, providerJobId: source.providerJobId, providerName: source.providerName, sourceUrl: source.sourceUrl, company: source.company || rec.company, title: source.title || rec.role, role: rec.role, location: source.location, remoteState: source.remoteState, employmentType: source.employmentType, compensationText: source.compensationText, descriptionText: source.descriptionText, observedAt: source.observedAt, freshness: source.freshness, sourceAuthority: source.sourceAuthority }, requirements, mappings: projected.mappings, qualification: rec.qualification, recommendation: rec.recommendation, recommendationReasons: rec.recommendationReasons, preferenceCompatibility, queueItem, workflow: { rossDecision: "UNDECIDED", decidedAt: null }, application: {}, authorityDiagnostics });
    const features = frozenV2DFeatures({ components: result.fit.components, authorityDiagnostics }); const review = labels.records[item.sampleId];
    return { sampleId: item.sampleId, roleFamily: item.roleFamily, opportunityId: item.opportunityId, company: item.company, role: item.role, location: source.location || item.location || null, workArrangement: source.workArrangement || source.remoteState || item.workArrangement || null, j002Order: item.sourceOrder, j003: rec.recommendation, j010: rec.qualification?.state || "UNKNOWN", shortlisted: Boolean(rec.shortlistedForDecision), eligibility: result.eligibility.state, preferenceCompatibility: result.preferences.compatibility, preferenceReasons: result.preferences.reasons, responsibilitySimilarity: authorityDiagnostics.responsibilitySimilarity?.state || "UNKNOWN", seniorityCompatibility: authorityDiagnostics.seniorityCompatibility?.state || "UNKNOWN", domainCompatibility: authorityDiagnostics.domainCompatibility?.state || "UNKNOWN", evidenceStateDistribution: authorityDiagnostics.responsibilitySimilarity?.counts || {}, evidenceCoverage: authorityDiagnostics.evidenceCoverage || {}, capabilityConclusion: authorityDiagnostics.capabilityConclusion || {}, authorityDiagnostics, components: result.fit.components, confidence: result.confidence, experimentalFit: result.fit.score, experimentalFitStatus: result.fit.scoreStatus, features, review, requirements: (fitArtifact?.requirements || []).length, sourceDescriptionAvailable: Boolean(source.descriptionText), queueItemId: rec.queueItemId, reason: item.humanReview?.reason || null, pursuitPriority: Number.isFinite(scoreFrozenV2D(features)) ? round(scoreFrozenV2D(features) * preferenceMultiplier(result.preferences.compatibility)) : null };
  });
  const ranks = rank(rows.map((r) => ({ ...r, capabilityFitScore: scoreFrozenV2D(r.features) }))); const hRanks = humanRanks(ranks);
  return ranks.map((r) => ({ ...r, humanRank: hRanks.get(r.sampleId) }));
}
function roleFamilyResults(rows) { const groups = [...new Set(rows.map((r) => r.roleFamily))].sort(); return groups.map((family) => { const subset = rank(rows.filter((r) => r.roleFamily === family).map((r) => ({ ...r, modelRank: undefined }))); return { roleFamily: family, count: subset.length, humanFit: distribution(subset, (r) => r.review.evidenceFit), medianV2DScore: median(subset.map((r) => r.capabilityFitScore).filter(Number.isFinite)), top5Precision: precision(subset, PRIMARY, 5), top10Precision: precision(subset, PRIMARY, 10), strongGoodRecall: recall(subset, PRIMARY), viableRecall: recall(subset, VIABLE), negativeLeakageTop10: subset.slice(0, 10).filter((r) => NEGATIVE.has(r.review.evidenceFit)).length }; }); }
function diagnostics(rows) { return { falsePositivesTop20: rows.filter((r) => NEGATIVE.has(r.review.evidenceFit) && r.modelRank <= 20).map(summary), underRankedViable: rows.filter((r) => VIABLE.has(r.review.evidenceFit) && r.modelRank > 20).map(summary), requiredSkillsHighNegative: rows.filter((r) => NEGATIVE.has(r.review.evidenceFit)).sort((a, b) => (b.features.requiredSkills ?? -1) - (a.features.requiredSkills ?? -1)).slice(0, 10).map(summary), requiredSkillsLowViable: rows.filter((r) => VIABLE.has(r.review.evidenceFit)).sort((a, b) => (a.features.requiredSkills ?? 101) - (b.features.requiredSkills ?? 101)).slice(0, 10).map(summary) }; }
function summary(r) { return { sampleId: r.sampleId, company: r.company, role: r.role, roleFamily: r.roleFamily, evidenceFit: r.review.evidenceFit, rank: r.modelRank, score: r.capabilityFitScore, features: r.features, j010: r.j010, j003: r.j003, eligibility: r.eligibility, preference: r.preferenceCompatibility, responsibility: r.responsibilitySimilarity, seniority: r.seniorityCompatibility, domain: r.domainCompatibility, evidenceCoverage: r.evidenceCoverage, capabilityConclusion: r.capabilityConclusion }; }
function stable(value) { return JSON.stringify(value, Object.keys(value).sort()); }
function run(options = {}) {
  const manifest = readJson(manifestPath); const labels = readJson(labelsPath); const v23Metrics = readJson(calibrationMetricsPath); const holdout = manifest.holdoutSet;
  if (holdout.length !== 40 || Object.keys(labels.records || {}).length !== 40) throw new Error("Holdout must contain exactly 40 records and 40 completed reviews.");
  if (holdout.some((r) => r.set !== "HOLDOUT_SET" || !labels.records[r.sampleId]?.evidenceFit)) throw new Error("Invalid holdout review authority.");
  const rows = buildRows(manifest, labels, options); const rerun = buildRows(manifest, labels, options);
  if (stable(rows) !== stable(rerun)) throw new Error("Frozen V2D holdout evaluation is not deterministic.");
  const ranked = rows; const metricsResult = metrics(ranked); const calibration = v23Metrics.models.MODEL_V2D_ROBUSTNESS_CONTROL.metrics;
  const result = { schemaVersion: "staffordos.careeros.v1_24b.holdout_evaluation.v1", model: "MODEL_V2D_ROBUSTNESS_CONTROL", formula: "FROZEN_V1_23_V2D", weights: V2D_WEIGHTS, dataset: { holdoutCount: 40, reviewCount: 40, holdoutReviewAuthority: labels.schemaVersion, calibrationMetricsArtifact: "CAREEROS_V1_23_MODEL_METRICS.json" }, groundTruth: { primary: [...PRIMARY], viable: [...VIABLE], negative: [...NEGATIVE], selfConfidenceExcluded: true, interestExcluded: true, wouldPursueExcluded: true, workflowExcluded: true }, metrics: metricsResult, calibrationBaseline: calibration, preferenceDistribution: distribution(rows, (r) => r.preferenceCompatibility), responsibilityDistribution: distribution(rows, (r) => r.responsibilitySimilarity), seniorityDistribution: distribution(rows, (r) => r.seniorityCompatibility), domainDistribution: distribution(rows, (r) => r.domainCompatibility), evidenceDistribution: aggregateCounts(rows, (r) => r.evidenceStateDistribution), roleFamilies: roleFamilyResults(rows), diagnostics: diagnostics(rows), rows: rows.map((r) => ({ ...r, features: r.features, confidenceScore: r.confidence.score, confidenceStatus: r.confidence.scoreStatus, capabilityFitScore: r.capabilityFitScore })) };
  return result;
}
function markdown(result) {
  const m = result.metrics; const c = result.calibrationBaseline; const d = result.diagnostics;
  const line = (name) => `| ${name} | ${c[name] ?? "n/a"} | ${m[name] ?? "n/a"} | ${c[name] != null && m[name] != null ? round(m[name] - c[name]) : "n/a"} |`;
  return `# CareerOS V1.24B Frozen V2D Holdout Evaluation

Offline holdout evaluation only. The V2D formula, weights, labels, preferences, J002/J003/J010, production ranking, shortlist, CareerFact, CareerEvidence, workflow, and application state were not changed.

## Preconditions

- Holdout opportunities: 40
- Completed holdout reviews: 40
- Calibration/holdout overlap: 0 (verified by manifest identity audit)
- Frozen model: MODEL_V2D_ROBUSTNESS_CONTROL (FROZEN_V1_23_V2D)
- Deterministic rerun: PASS
- Self-confidence, interest, would-pursue, and workflow are excluded from capability fit.

## Calibration vs holdout

| Metric | Calibration | Holdout | Delta |
|---|---:|---:|---:|
${["top5Precision", "top10Precision", "strongRecall", "strongGoodRecall", "viableRecall", "falsePositiveRate", "falseNegativeRate", "rankCorrelation", "negativeLeakageTop5", "negativeLeakageTop10", "hardMismatchLeakageTop10", "underRankedViable", "strongGoodBelow20"].map(line).join("\n")}

Calibration values are the frozen V1.23 V2D artifact; holdout values use the same metric definitions and cutoff methodology.

## Holdout distributions

- Preference: ${JSON.stringify(result.preferenceDistribution)}
- Responsibility: ${JSON.stringify(result.responsibilityDistribution)}
- Seniority: ${JSON.stringify(result.seniorityDistribution)}
- Domain: ${JSON.stringify(result.domainDistribution)}

## Role families

| Family | Count | Top-5 precision | Top-10 precision | Strong/good recall | Viable recall | Negative leakage top 10 |
|---|---:|---:|---:|---:|---:|---:|
${result.roleFamilies.map((x) => `| ${x.roleFamily} | ${x.count} | ${x.top5Precision} | ${x.top10Precision} | ${x.strongGoodRecall} | ${x.viableRecall} | ${x.negativeLeakageTop10} |`).join("\n")}

## Generalization result

**${m.top10Precision > c.top10Precision && m.viableRecall >= c.viableRecall ? "PARTIALLY_GENERALIZES" : "FAILS_TO_GENERALIZE"}**. The holdout is independent evidence, not a tuning set. A 40-role holdout is too small for statistical certainty; the decision also requires review of leakage and family coverage below.

- False positives in model Top 20: ${d.falsePositivesTop20.length}
- Viable roles below rank 20: ${d.underRankedViable.length}
- Required-skills audit samples: 10 negative high-signal and 10 viable low-signal roles.
`;
}
function write(file, value) { writeFileSync(path.join(outputRoot, file), `${value.trimEnd()}\n`); }
function writeArtifacts(result) {
  write("CAREEROS_V1_24B_HOLDOUT_DATA.json", `${JSON.stringify(result, null, 2)}\n`);
  write("CAREEROS_V1_24B_HOLDOUT_RESULTS.md", markdown(result));
  write("CAREEROS_V1_24B_CALIBRATION_VS_HOLDOUT.md", `# Calibration vs Holdout\n\nThe frozen calibration baseline is compared with the independent 40-role holdout using unchanged definitions.\n\n${markdown(result).split("## Calibration vs holdout")[1].split("## Holdout distributions")[0]}`);
  write("CAREEROS_V1_24B_ROLE_FAMILY_ANALYSIS.md", `# Role-Family Analysis\n\n${result.roleFamilies.map((x) => `## ${x.roleFamily}\n\n- Count: ${x.count}\n- Human fit: ${JSON.stringify(x.humanFit)}\n- Median V2D: ${x.medianV2DScore}\n- Top-5 precision: ${x.top5Precision}\n- Top-10 precision: ${x.top10Precision}\n- Strong/good recall: ${x.strongGoodRecall}\n- Viable recall: ${x.viableRecall}\n- Negative leakage Top 10: ${x.negativeLeakageTop10}`).join("\n\n")}`);
  write("CAREEROS_V1_24B_FALSE_POSITIVE_FORENSICS.md", `# Holdout False-Positive Forensics\n\n${result.diagnostics.falsePositivesTop20.map((x) => `- ${x.sampleId} ${x.company} — ${x.role}: ${x.evidenceFit}, rank ${x.rank}, score ${x.score}; likely audit categories require requirement/function/responsibility review, not role-specific penalties.`).join("\n") || "No negative roles in Top 20."}`);
  write("CAREEROS_V1_24B_UNDER_RANKED_POSITIVES.md", `# Holdout Under-Ranked Positives\n\n${result.diagnostics.underRankedViable.map((x) => `- ${x.sampleId} ${x.company} — ${x.role}: ${x.evidenceFit}, rank ${x.rank}, score ${x.score}; missing authority is not evidence of missing capability.`).join("\n") || "No viable roles below rank 20."}`);
  write("CAREEROS_V1_24B_REQUIRED_SKILLS_AUDIT.md", `# Required-Skills Signal Audit\n\nThe V2D frozen model assigns requiredSkills weight 0. The audit below is diagnostic only and does not change extraction or weights.\n\n## High required-skills score / negative human label\n\n${result.diagnostics.requiredSkillsHighNegative.map((x) => `- ${x.sampleId} ${x.company} — ${x.role}: ${x.evidenceFit}; required-skills feature ${x.features.requiredSkills}`).join("\n") || "None."}\n\n## Low required-skills score / viable human label\n\n${result.diagnostics.requiredSkillsLowViable.map((x) => `- ${x.sampleId} ${x.company} — ${x.role}: ${x.evidenceFit}; required-skills feature ${x.features.requiredSkills}`).join("\n") || "None."}\n\nInterpretation remains bounded: literal requirement support is not independently trustworthy until extraction and evidence-linkage authority improve.`);
  write("CAREEROS_V1_24B_AMBITION_PROTECTION_AUDIT.md", `# Ambition Protection Audit\n\nThe evaluator excludes self-confidence, interest, would-pursue, title identity, and workflow state from scoring. UPWARD_STRETCH_WITH_SUPPORTED_SCOPE and TRANSFERABLE_DOMAIN remain diagnostics, not automatic blockers. Under-ranking rows are evidence-gap candidates and require human review before any capability conclusion.`);
  const datadog = result.rows.find((x) => x.company === "Datadog" && x.role === "Director, Technical Program Management - Technical Solutions Operations");
  write("CAREEROS_V1_24B_DATADOG_TPM_CONTROL.md", `# Datadog TPM Control Case\n\n${datadog ? `- Holdout position: ${datadog.modelRank}\n- Capability fit: ${datadog.capabilityFitScore}\n- Pursuit priority: ${datadog.pursuitPriority}\n- Eligibility: ${datadog.eligibility}\n- J010: ${datadog.j010}\n- J003: ${datadog.j003}\n- Responsibility: ${datadog.responsibilitySimilarity}\n- Seniority: ${datadog.seniorityCompatibility}\n- Domain: ${datadog.domainCompatibility}\n- Preference: ${datadog.preferenceCompatibility}\n- Evidence coverage: ${JSON.stringify(datadog.evidenceCoverage)}\n\nNo manual boost was applied. The holdout result supports only the bounded statement that this role is evaluated by the same frozen model; evidence gaps remain distinct from capability blockers.` : "Control case unavailable."}`);
  write("CAREEROS_V1_24B_GENERALIZATION_DECISION.md", `# Generalization Decision\n\n**${result.metrics.top10Precision > result.calibrationBaseline.top10Precision && result.metrics.viableRecall >= result.calibrationBaseline.viableRecall && result.metrics.hardMismatchLeakageTop10 === 0 ? "V2D_PARTIALLY_GENERALIZES_AUTHORITY_WORK_REQUIRED" : "V2D_FAILS_GENERALIZATION_REDESIGN_REQUIRED"}**\n\nNo production promotion is authorized. The holdout is one independent 40-role sample. Required next work is authority repair in the role families and signals documented by the forensic artifacts before any model change.`);
  write("CAREEROS_V1_24B_NEXT_AUTHORITY_WORK.md", `# Next Authority Work\n\n1. Repair requirement extraction noise and boilerplate classification.\n2. Improve responsibility/evidence mapping coverage without converting missing evidence into negative capability evidence.\n3. Validate seniority and domain-transfer projections across more independently reviewed roles.\n4. Expand holdout human review before any weight tuning.\n\nNo repairs are implemented by V1.24B.`);
}
if (import.meta.url === `file://${process.argv[1]}`) { const result = run(); writeArtifacts(result); console.log(JSON.stringify({ metrics: result.metrics, preference: result.preferenceDistribution, families: result.roleFamilies }, null, 2)); }
export { run, buildRows, V2D_WEIGHTS };
