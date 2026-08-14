import { redirect } from "next/navigation";
import {
  FIT_LABELS,
  GEOGRAPHY_LABELS,
  INTEREST_LABELS,
  PURSUIT_LABELS,
  SELF_CONFIDENCE_LABELS,
  loadCalibrationReviewAuthority,
  loadReviewAuthority,
  deriveCalibrationReviewProgress,
  isCompleteCalibrationReview,
  saveCalibrationReview,
} from "../../../../../lib/staffordos/careerOsMatchCalibrationAuthority";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import Link from "next/link";

export const dynamic = "force-dynamic";

type EvaluationRecord = {
  sampleId: string;
  set?: "CALIBRATION_SET" | "HOLDOUT_SET";
  company: string;
  role: string;
  location: string;
  workArrangement: string;
  existingJ010State: string;
  existingJ003Recommendation: string;
  existingShortlisted: boolean;
  experimentalFitScore: number | null;
  experimentalConfidenceScore: number | null;
  eligibility: string;
  preferenceCompatibility: string;
  preferenceReason: string;
  requirementSummary?: { mandatoryCount?: number; supportedMandatoryCount?: number; unsupportedMandatoryCount?: number; preferredCount?: number; supportedPreferredCount?: number; unsupportedPreferredCount?: number };
  evidenceSummary?: { exactEvidenceCount?: number; transferableEvidenceCount?: number; weakEvidenceCount?: number; unsupportedCount?: number };
  topFitReasons: string[];
  topGaps: string[];
  hardBlockers: string[];
  components: Array<{ name: string; value: number | null; status: string }>;
  roleFamily?: string;
};

function evaluationData(evaluationSet: "calibration" | "holdout"): { records: EvaluationRecord[] } {
  if (evaluationSet === "holdout") {
    const candidates = [
      path.resolve(process.cwd(), "staffordos/job-search/CAREEROS_V1_24_EVALUATION_DATA.json"),
      path.resolve(process.cwd(), "../../../staffordos/job-search/CAREEROS_V1_24_EVALUATION_DATA.json"),
    ];
    const file = candidates.find((candidate) => {
      try { readFileSync(candidate, "utf8"); return true; } catch { return false; }
    });
    if (!file) throw new Error("Holdout evaluation manifest is unavailable.");
    const manifest = JSON.parse(readFileSync(file, "utf8")) as { holdoutSet: Array<Record<string, unknown>> };
    return {
      records: manifest.holdoutSet.map((row) => ({
        sampleId: String(row.sampleId),
        set: "HOLDOUT_SET" as const,
        company: String(row.company),
        role: String(row.role),
        location: String(row.location || "Unknown"),
        workArrangement: String(row.workArrangement || "Unknown"),
        existingJ010State: String(row.existingJ010 || "UNKNOWN"),
        existingJ003Recommendation: String(row.existingJ003 || "UNKNOWN"),
        existingShortlisted: row.shortlisted === true,
        experimentalFitScore: null,
        experimentalConfidenceScore: null,
        eligibility: "PENDING_HOLDOUT_PROJECTION",
        preferenceCompatibility: "PENDING_HOLDOUT_PROJECTION",
        preferenceReason: "Frozen V2D projection is completed after independent holdout review; no score is shown here.",
        evidenceSummary: (() => {
          const coverage = (row.explainableFitCoverage || {}) as Record<string, unknown>;
          return {
            exactEvidenceCount: Number(coverage.PROVEN || 0),
            transferableEvidenceCount: Number(coverage.TRANSFERABLE || 0),
            weakEvidenceCount: Number(coverage.PARTIAL || 0),
            unsupportedCount: Number(coverage.MISSING || 0) + Number(coverage.UNKNOWN || 0),
          };
        })(),
        topFitReasons: [],
        topGaps: [],
        hardBlockers: [],
        components: [],
        roleFamily: String(row.roleFamily || "OTHER"),
      })),
    };
  }
  const candidates = [
    path.resolve(process.cwd(), "staffordos/job-search/CAREEROS_MATCH_ENGINE_V1_EVALUATION_DATA.json"),
    path.resolve(process.cwd(), "../../../staffordos/job-search/CAREEROS_MATCH_ENGINE_V1_EVALUATION_DATA.json"),
  ];
  const file = candidates.find((candidate) => {
    try { readFileSync(candidate, "utf8"); return true; } catch { return false; }
  });
  if (!file) throw new Error("Calibration evaluation data is unavailable.");
  return JSON.parse(readFileSync(file, "utf8")) as { records: EvaluationRecord[] };
}

function optionList(values: readonly string[], labels?: Record<string, string>) {
  return values.map((value) => <option key={value} value={value}>{labels?.[value] || value.replaceAll("_", " ")}</option>);
}

async function saveCalibrationReviewAction(formData: FormData) {
  "use server";
  const result = saveCalibrationReview({
    sampleId: String(formData.get("sampleId") || ""),
    evidenceFit: String(formData.get("evidenceFit") || ""),
    interest: String(formData.get("interest") || ""),
    geography: String(formData.get("geography") || ""),
    wouldPursue: String(formData.get("wouldPursue") || ""),
    selfConfidence: String(formData.get("selfConfidence") || ""),
    reason: String(formData.get("reason") || ""),
    operatorId: "ROSS",
    evaluationSet: formData.get("evaluationSet") === "holdout" ? "holdout" : "calibration",
  });
  const index = Math.max(0, Number(formData.get("index") || 0));
  const query = result.ok ? "saved=1" : `error=${encodeURIComponent(result.errors[0] || "Review was not saved.")}`;
  const set = formData.get("evaluationSet") === "holdout" ? "&set=holdout" : "";
  redirect(`/os/professional/jobs/calibration?index=${index}${set}&${query}`);
}

export default async function MatchCalibrationPage({ searchParams }: { searchParams?: Promise<{ index?: string; set?: string; saved?: string; error?: string }> }) {
  const params = (await searchParams) || {};
  const evaluationSet = params.set === "holdout" ? "holdout" : "calibration";
  const isHoldout = evaluationSet === "holdout";
  const evaluation = evaluationData(evaluationSet);
  const authority = isHoldout ? loadReviewAuthority("holdout") : loadCalibrationReviewAuthority();
  const index = Math.min(Math.max(Number(params.index || 0), 0), Math.max(0, evaluation.records.length - 1));
  const record = evaluation.records[index];
  const review = authority.records[record.sampleId];
  const progress = deriveCalibrationReviewProgress(evaluation.records.map((item) => item.sampleId), authority);
  const savedReview = isCompleteCalibrationReview(review) ? review : null;
  const saveConfirmed = params.saved === "1" && savedReview?.sampleId === record.sampleId;
  const setQuery = isHoldout ? "&set=holdout" : "";
  const nextUnreviewedHref = progress.nextUnreviewedIndex === null
    ? null
    : `/os/professional/jobs/calibration?index=${progress.nextUnreviewedIndex}${setQuery}`;
  const labels = { ACCEPTABLE: "Acceptable", NOT_ACCEPTABLE: "Not acceptable", UNKNOWN: "Unknown" };
  return (
    <main className="staffordUnifiedHome">
      <section className="staffordHomeHeader">
        <div>
          <span className="staffordEyebrow">{isHoldout ? "Match Engine Holdout Review" : "Match Engine Calibration"}</span>
          <h1>{isHoldout ? "Independent holdout review" : "Offline evaluation review"}</h1>
          <p>Does not affect production recommendations, ranking, or workflow decisions.</p>
        </div>
        <div className="staffordWorkspaceStatus"><span>{isHoldout ? "Holdout review progress" : "Review progress"}: {progress.completed} / {progress.total} reviewed</span><strong>Ross review required</strong></div>
      </section>
      <section className="staffordHomeSupport" aria-label="Calibration opportunity">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">{isHoldout ? "Holdout opportunity" : "Viewing opportunity"} {index + 1} of {evaluation.records.length}</span>
          <h2>{record.role}</h2>
          <p>{record.company} · {record.location}</p>
        </div>
        <dl className="staffordCareerCommandDetails">
          <div><dt>Work arrangement</dt><dd>{record.workArrangement || "Unknown"}</dd></div>
          <div><dt>J010 qualification</dt><dd>{record.existingJ010State}</dd></div>
          <div><dt>J003 recommendation</dt><dd>{record.existingJ003Recommendation}</dd></div>
          <div><dt>Shortlist</dt><dd>{record.existingShortlisted ? "Shortlisted" : "Not shortlisted"}</dd></div>
          <div><dt>Eligibility</dt><dd>{record.eligibility}</dd></div>
          <div><dt>{isHoldout ? "Frozen V2D capability fit" : "Experimental fit"}</dt><dd>{record.experimentalFitScore ?? (isHoldout ? "Pending independent review" : "Unknown")}</dd></div>
          <div><dt>{isHoldout ? "Frozen V2D confidence" : "Experimental confidence"}</dt><dd>{record.experimentalConfidenceScore ?? (isHoldout ? "Pending independent review" : "Unknown")}</dd></div>
          <div><dt>Preference compatibility</dt><dd>{record.preferenceCompatibility}: {record.preferenceReason}</dd></div>
        </dl>
      </section>
      <section className="staffordHomeSupport" aria-label="CareerOS explanation">
        <details>
          <summary>Why CareerOS thinks this</summary>
          <h3>Evidence summary</h3>
          <p>Mandatory: {record.requirementSummary?.mandatoryCount ?? "Unknown"}; supported: {record.requirementSummary?.supportedMandatoryCount ?? "Unknown"}; unresolved or missing: {record.requirementSummary?.unsupportedMandatoryCount ?? "Unknown"}.</p>
          <p>Exact evidence: {record.evidenceSummary?.exactEvidenceCount ?? "Unknown"}; transferable: {record.evidenceSummary?.transferableEvidenceCount ?? "Unknown"}; unsupported: {record.evidenceSummary?.unsupportedCount ?? "Unknown"}.</p>
          <h3>Supported / transferable</h3>
          <ul>{record.topFitReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          <h3>Unresolved / missing</h3>
          <ul>{[...record.topGaps, ...record.hardBlockers].map((gap) => <li key={gap}>{gap}</li>)}</ul>
          <h3>Components</h3>
          <ul>{record.components.map((component) => <li key={component.name}>{component.name}: {component.value ?? "Unknown"} ({component.status})</li>)}</ul>
        </details>
      </section>
      <section className="staffordHomeSupport" aria-label="Review progress">
        <strong>Review progress</strong>
        <p>{progress.completed} of {progress.total} completed · {progress.remaining} remaining</p>
        {nextUnreviewedHref ? <a className="staffordHomeActionLink" href={nextUnreviewedHref}>Next unreviewed</a> : null}
      </section>
      {saveConfirmed ? (
        <article className="staffordHomeStatusNote" role="status">
          <span>SAVED</span>
          <strong>Review saved for {record.company} — {record.role}</strong>
        </article>
      ) : null}
      {params.saved === "1" && !saveConfirmed ? <p role="alert">NOT SAVED: CareerOS could not confirm the saved review after readback.</p> : null}
      {params.error ? <p role="alert">{params.error}</p> : null}
      <section className="staffordHomeSupport" aria-label="Ross review">
        <p>Changing opportunity discards unsaved edits and loads the destination review.</p>
        <form key={record.sampleId} action={saveCalibrationReviewAction} autoComplete="off">
          <input type="hidden" name="sampleId" value={record.sampleId} />
          <input type="hidden" name="index" value={index} />
          <input type="hidden" name="evaluationSet" value={evaluationSet} />
          <fieldset><legend>Evidence fit</legend><select name="evidenceFit" defaultValue={review?.evidenceFit || ""} required><option value="" disabled>Select one</option>{optionList(FIT_LABELS)}</select></fieldset>
          <fieldset><legend>Interest</legend><select name="interest" defaultValue={review?.interest || ""} required><option value="" disabled>Select one</option>{optionList(INTEREST_LABELS)}</select></fieldset>
          <fieldset><legend>Geography</legend><select name="geography" defaultValue={review?.geography || ""} required><option value="" disabled>Select one</option>{optionList(GEOGRAPHY_LABELS, labels)}</select></fieldset>
          <fieldset><legend>Would pursue</legend><select name="wouldPursue" defaultValue={review?.wouldPursue || ""} required><option value="" disabled>Select one</option>{optionList(PURSUIT_LABELS)}</select></fieldset>
          <fieldset><legend>Self-confidence</legend><select name="selfConfidence" defaultValue={review?.selfConfidence || ""} required><option value="" disabled>Select one</option>{optionList(SELF_CONFIDENCE_LABELS)}</select></fieldset>
          <label>Optional reason<textarea name="reason" defaultValue={review?.reason || ""} maxLength={500} /></label>
          <button type="submit" className="staffordHomeActionLink">Save review</button>
        </form>
        <nav aria-label="Calibration review navigation">
          {index > 0 ? <a className="staffordHomeActionLink" href={`/os/professional/jobs/calibration?index=${index - 1}${setQuery}`}>Previous</a> : null}
          {index < evaluation.records.length - 1 ? <a className="staffordHomeActionLink" href={`/os/professional/jobs/calibration?index=${index + 1}${setQuery}`}>Next</a> : null}
        </nav>
      </section>
      <Link href="/os/professional/jobs">Return to Job Search</Link>
    </main>
  );
}
