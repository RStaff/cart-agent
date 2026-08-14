import { readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(process.cwd());
const outputRoot = path.join(root, "staffordos/job-search");
const recommendationPath = path.join(os.homedir(), ".staffordos/private/professional/job-search/opportunity-recommendations/J003_01_20260812120000/opportunity_recommendations.json");
const calibrationPath = path.join(outputRoot, "CAREEROS_V1_22F_RECALIBRATION_DATA.json");
const v23MetricsPath = path.join(outputRoot, "CAREEROS_V1_23_MODEL_METRICS.json");

function readJson(file) { return JSON.parse(readFileSync(file, "utf8")); }
function writeJson(file, value) { writeFileSync(path.join(outputRoot, file), `${JSON.stringify(value, null, 2)}\n`); }
function writeMd(file, value) { writeFileSync(path.join(outputRoot, file), `${value.trimEnd()}\n`); }
function category(role) {
  const text = role.toLowerCase();
  if (/finance|legal|accounting|intern|research|security/.test(text)) return "OBVIOUS_POOR_FIT_CONTROL";
  if (/business systems|business analyst|systems analyst|sales operations|revenue operations|revops/.test(text)) return "BUSINESS_SYSTEMS_ANALYST";
  if (/program|project|technical program|product operations/.test(text)) return "TECHNICAL_PROGRAM_PROJECT_PRODUCT";
  if (/product/.test(text)) return "PRODUCT";
  if (/marketing|martech|crm|salesforce|demand|growth|marketing automation/.test(text)) return "MARTECH_MARKETING_OPERATIONS";
  if (/transformation|solutions|consultant|operating model/.test(text)) return "TRANSFORMATION_SOLUTIONS";
  if (/ai|automation|agent|machine learning|\bml\b|artificial intelligence/.test(text)) return "AI_AUTOMATION_AGENT";
  if (/director|vice president|\bvp\b|head|chief|principal|senior|manager/.test(text)) return "SENIOR_LEADERSHIP_STRETCH";
  return "OTHER_CONTROL";
}
function neutralReview() { return { status: "PENDING_OPERATOR_REVIEW", evidenceFit: null, interest: null, wouldPursue: null, selfConfidence: null, reason: null }; }
function calibrationRecords(data) {
  return data.rows.map((row) => ({ sampleId: row.sampleId, set: "CALIBRATION_SET", company: row.company, role: row.role, opportunityId: row.opportunityId, location: row.location, workArrangement: row.workArrangement, existingJ010: row.existingJ010State, existingJ003: row.existingJ003Recommendation, v2dFit: row.experimentalFitScore, v2dConfidence: row.experimentalConfidenceScore, preferenceCompatibility: row.preferenceCompatibility, humanReview: { status: "COMPLETE", evidenceFit: row.evidenceFit, interest: row.interest, wouldPursue: row.wouldPursue, selfConfidence: row.selfConfidence, reason: null } }));
}
function holdoutRecords(recommendations, excludedIds) {
  const candidates = recommendations.filter((item) => !excludedIds.has(item.opportunityId)).sort((a, b) => a.company.localeCompare(b.company) || a.role.localeCompare(b.role));
  const buckets = new Map();
  for (const item of candidates) { const key = category(item.role); if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(item); }
  const preferred = ["AI_AUTOMATION_AGENT", "TECHNICAL_PROGRAM_PROJECT_PRODUCT", "PRODUCT", "MARTECH_MARKETING_OPERATIONS", "BUSINESS_SYSTEMS_ANALYST", "TRANSFORMATION_SOLUTIONS", "SENIOR_LEADERSHIP_STRETCH", "OBVIOUS_POOR_FIT_CONTROL"];
  const chosen = [];
  const chosenIds = new Set();
  for (const key of preferred) {
    const bucket = buckets.get(key) || [];
    for (const item of bucket.slice(0, 5)) { chosen.push({ item, category: key }); chosenIds.add(item.opportunityId); }
  }
  for (const item of candidates) {
    if (chosen.length >= 40) break;
    if (!chosenIds.has(item.opportunityId)) { chosen.push({ item, category: category(item.role) }); chosenIds.add(item.opportunityId); }
  }
  return chosen.slice(0, 40).map(({ item, category: roleFamily }, index) => ({ sampleId: `H24-${String(index + 1).padStart(3, "0")}`, set: "HOLDOUT_SET", roleFamily, company: item.company, role: item.role, opportunityId: item.opportunityId, sourceRecordId: item.sourceRecordId, queueItemId: item.queueItemId, sourceOrder: recommendations.indexOf(item) + 1, location: null, workArrangement: null, existingJ010: item.qualification?.state || "UNKNOWN", existingJ003: item.recommendation || "UNKNOWN", shortlisted: item.shortlistedForDecision === true, explainableFitCoverage: item.explainableFit?.coverage || {}, v2d: { status: "PENDING_HUMAN_REVIEW_AND_OFFLINE_PROJECTION", formula: "FROZEN_V1_23_V2D", score: null, rank: null }, humanReview: neutralReview() }));
}
function run() {
  const recommendations = readJson(recommendationPath);
  const v23 = readJson(calibrationPath);
  const metrics = readJson(v23MetricsPath);
  if (recommendations.length < 80) throw new Error("Canonical opportunity universe is smaller than the required evaluation target.");
  if (v23.rows.length !== 40 || v23.experimentFreeze?.sameLabels !== true) throw new Error("Locked calibration set is not complete 40/40.");
  const calibration = calibrationRecords(v23);
  const excludedIds = new Set(calibration.map((row) => row.opportunityId));
  const holdout = holdoutRecords(recommendations, excludedIds);
  if (holdout.length < 40) throw new Error(`Only ${holdout.length} new holdout records could be selected.`);
  const evaluation = { schemaVersion: "staffordos.careeros.v1_24.expanded_evaluation.v1", generatedFrom: "J003_01_20260812120000", opportunityUniverseCount: recommendations.length, calibrationSetCount: calibration.length, holdoutSetCount: holdout.length, holdoutHumanReviewComplete: holdout.filter((row) => row.humanReview.status === "COMPLETE").length, modelSelectionFrozen: { model: "MODEL_V2D_ROBUSTNESS_CONTROL", source: "V1.23", weightsUnchanged: true, formulaUnchanged: true }, calibrationSet: calibration, holdoutSet: holdout };
  writeJson("CAREEROS_V1_24_EVALUATION_DATA.json", evaluation);
  writeMd("CAREEROS_V1_24_EXPANDED_EVALUATION_PLAN.md", `# CareerOS V1.24 Expanded Evaluation Plan\n\n## Status\n\n**HOLDOUT_REVIEW_REQUIRED**\n\nThe canonical J003 universe contains ${recommendations.length} recommendation records. The locked calibration set contains 40 previously reviewed roles. This manifest adds ${holdout.length} new stratified holdout roles without labels.\n\nV2D is frozen from V1.23. No holdout label, workflow decision, interest value, self-confidence value, J002/J003/J010 state, or individual-role adjustment is used as fit truth.\n\n## Required operator review\n\nRoss must review each holdout through the governed CareerOS calibration surface with Evidence Fit, Interest, Would Pursue, Self-Confidence, and optional reason. Until all ${holdout.length} holdout reviews are complete, holdout metrics are intentionally not calculated.\n\n## Strata\n\n${JSON.stringify(Object.fromEntries([...new Set(holdout.map((row) => row.roleFamily))].map((key) => [key, holdout.filter((row) => row.roleFamily === key).length])), null, 2)}\n`);
  writeMd("CAREEROS_V1_24_HOLDOUT_RESULTS.md", `# CareerOS V1.24 Holdout Results\n\n**NOT_AVAILABLE: HUMAN_REVIEW_REQUIRED**\n\nHoldout records: ${holdout.length}. Completed holdout reviews: 0. No precision, recall, leakage, or generalization metric is reported because labels are not present. Existing 40-role calibration metrics remain in V1.23 artifacts and are not substituted for holdout performance.\n`);
  writeMd("CAREEROS_V1_24_ROLE_FAMILY_ANALYSIS.md", `# CareerOS V1.24 Role-Family Analysis\n\nRole-family metrics are blocked until independent holdout labels exist. The selected holdout strata are recorded in CAREEROS_V1_24_EVALUATION_DATA.json.\n`);
  writeMd("CAREEROS_V1_24_FALSE_POSITIVE_FORENSICS.md", `# CareerOS V1.24 False-Positive Forensics\n\nBlocked pending holdout Evidence Fit labels. No J003 recommendation or workflow state is used as a substitute.\n`);
  writeMd("CAREEROS_V1_24_UNDER_RANKED_POSITIVE_FORENSICS.md", `# CareerOS V1.24 Under-Ranked Positive Forensics\n\nBlocked pending holdout Evidence Fit labels. UNKNOWN and MISSING remain non-negative authority states.\n`);
  writeMd("CAREEROS_V1_24_REQUIRED_SKILLS_SIGNAL_AUDIT.md", `# CareerOS V1.24 Required-Skills Signal Audit\n\nThe V1.23 calibration signal remains the pre-holdout finding: required-skills correlation was -0.25 across 32 usable calibration records. The expanded holdout cannot confirm generalization until Ross labels the new roles. The current likely failure modes remain literal requirement vocabulary, noisy/duplicated extraction, and transferable evidence mapped as unresolved; no signal change is made here.\n`);
  writeMd("CAREEROS_V1_24_DATADOG_TPM_CONTROL.md", `# CareerOS V1.24 Datadog TPM Control\n\nDatadog remains a separate control case. V1.23 recorded V2D capability fit 72.25, pursuit priority 54.19, relative rank 4 including the control, ELIGIBLE, TRANSFERABLE_BUT_NOT_DIRECT, REVIEW, PARTIAL responsibility, UPWARD_STRETCH_WITH_SUPPORTED_SCOPE seniority, TRANSFERABLE_DOMAIN, and UNKNOWN preference compatibility. It is not added to the holdout and receives no boost.\n`);
  writeMd("CAREEROS_V1_24_GENERALIZATION_DECISION.md", `# CareerOS V1.24 Generalization Decision\n\n## Decision\n\n**V2D_PARTIALLY_GENERALIZES_AUTHORITY_REPAIR_REQUIRED**\n\nThe original calibration result remains reproducible, but no holdout generalization claim is permitted until the ${holdout.length} new roles receive independent Ross reviews. V2D is not eligible for shadow mode on this evidence.\n`);
  writeMd("CAREEROS_V1_24_NEXT_AUTHORITY_WORK.md", `# CareerOS V1.24 Next Authority Work\n\n1. Extend the existing calibration review surface to the holdout manifest with opportunity-ID-based persistence and neutral defaults.\n2. Resolve source location/work-arrangement normalization for holdout records.\n3. Improve requirement extraction and transferable evidence mapping, especially for literal/compound requirements.\n4. Re-run frozen V2D on completed holdout labels.\n\nNo repairs are implemented by this setup step.\n`);
  return evaluation;
}
if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(run(), null, 2).slice(0, 2000));
export { run };
