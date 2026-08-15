import { redirect } from "next/navigation";
import {
  EVIDENCE_ADJUDICATION_ACTIONS,
  appendEvidenceAdjudicationDecision,
  adjudicationProgress,
  loadEvidenceAdjudicationRuntime,
  privateAdjudicationRoot,
  reviewQueueCandidates,
  type EvidenceAdjudicationAction,
} from "../../../../lib/staffordos/evidenceAdjudication";

export const dynamic = "force-dynamic";

function actionFromForm(value: FormDataEntryValue | null): EvidenceAdjudicationAction | null {
  const action = String(value || "").trim();
  return EVIDENCE_ADJUDICATION_ACTIONS.includes(action as EvidenceAdjudicationAction)
    ? action as EvidenceAdjudicationAction
    : null;
}

async function adjudicateEvidenceAction(formData: FormData) {
  "use server";
  const candidateId = String(formData.get("candidateId") || "").trim();
  const action = actionFromForm(formData.get("action"));
  const correction = String(formData.get("operatorCorrection") || "").trim() || null;
  const runtime = loadEvidenceAdjudicationRuntime({ repositoryRoot: process.cwd() });
  const candidate = runtime.candidates.find((item) => item.candidateId === candidateId);
  if (!candidate || !action) redirect("/os/professional/evidence?status=NOT_SAVED");
  try {
    appendEvidenceAdjudicationDecision({
      decisionRoot: privateAdjudicationRoot(),
      repositoryRoot: process.cwd(),
      candidate,
      action,
      operatorCorrection: correction,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SAVE_FAILED";
    redirect(`/os/professional/evidence?candidate=${encodeURIComponent(candidateId)}&status=NOT_SAVED&reason=${encodeURIComponent(message)}`);
  }
  redirect(`/os/professional/evidence?candidate=${encodeURIComponent(candidateId)}&status=${action === "KEEP_UNRESOLVED" ? "UNRESOLVED" : action === "CORRECT" ? "CORRECTED" : action === "CONFIRM" ? "CONFIRMED" : "REJECTED"}`);
}

function displayLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default async function ProfessionalEvidencePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const allCandidates = loadEvidenceAdjudicationRuntime({ repositoryRoot: process.cwd() }).candidates;
  const queue = reviewQueueCandidates(allCandidates);
  const progress = adjudicationProgress(allCandidates);
  const focus = params.focus === "datadog" ? "datadog" : null;
  const focusedQueue = focus === "datadog"
    ? queue.filter((candidate) => ["PROGRAM_AND_LEADERSHIP", "DELIVERY_AND_PRODUCT", "TECHNOLOGY_AND_AUTOMATION"].includes(candidate.capabilityFamily))
    : queue;
  const batch = focusedQueue.filter((candidate) => !candidate.operatorDecision).slice(0, 15);
  const requested = typeof params.candidate === "string" ? params.candidate : null;
  const candidate = focusedQueue.find((item) => item.candidateId === requested) || batch[0] || focusedQueue[0] || null;
  const index = candidate ? focusedQueue.findIndex((item) => item.candidateId === candidate.candidateId) : -1;
  const previous = index > 0 ? focusedQueue[index - 1] : null;
  const next = index >= 0 && index < focusedQueue.length - 1 ? focusedQueue[index + 1] : null;
  const nextUnreviewed = focusedQueue.find((item) => !item.operatorDecision) || null;
  const candidateHref = (candidateId: string) => `/os/professional/evidence?candidate=${encodeURIComponent(candidateId)}${focus ? "&focus=datadog" : ""}`;
  const status = typeof params.status === "string" ? params.status : null;
  const reason = typeof params.reason === "string" ? params.reason : null;
  return (
    <main className="careerEvidenceAdjudicationPage">
      <section className="careerEvidenceAdjudicationHeader">
        <div>
          <span className="staffordEyebrow">Professional / Private authority</span>
          <h1>Career Evidence Adjudication</h1>
          <p>Review what CareerOS thinks Ross has evidence for before anything becomes canonical matching evidence.</p>
        </div>
        <div className="careerEvidenceAdjudicationStatus">
          <strong>Owner-private review</strong>
          <span>CareerFact and CareerEvidence remain unchanged.</span>
        </div>
      </section>
      <section className="careerEvidenceAdjudicationNotice">
        <strong>Projection is gated</strong>
        <p>Confirming a candidate records an operator decision. It does not create CareerEvidence in this mission.</p>
      </section>
      <section className="careerEvidenceProgress" aria-label="Adjudication progress">
        <div><span>Valid adjudications</span><strong>{progress.reviewed} / {progress.total}</strong></div>
        <div><span>Remaining</span><strong>{progress.remaining}</strong></div>
        <div><span>First review batch</span><strong>{Math.min(15, progress.remaining)}</strong></div>
      </section>
      <nav className="careerEvidenceFocus" aria-label="Evidence review focus">
        <span>Review focus:</span>
        <a href="/os/professional/evidence">All candidates</a>
        <a href="/os/professional/evidence?focus=datadog">Datadog TPM capability families</a>
      </nav>
      {status ? <p className={`careerEvidenceFeedback ${status === "NOT_SAVED" ? "is-error" : "is-success"}`} role="status">{status === "NOT_SAVED" ? `NOT SAVED${reason ? `: ${reason}` : ""}` : status}</p> : null}
      {candidate ? (
        <>
          <nav className="careerEvidenceNavigation" aria-label="Candidate navigation">
            {previous ? <a href={candidateHref(previous.candidateId)}>Previous</a> : <span>Previous</span>}
            <span>Candidate {index + 1} of {focusedQueue.length}{focus ? " in Datadog focus" : ""}</span>
            {next ? <a href={candidateHref(next.candidateId)}>Next</a> : <span>Next</span>}
          </nav>
          {nextUnreviewed ? <p className="careerEvidenceNextUnreviewed"><a href={candidateHref(nextUnreviewed.candidateId)}>Next unreviewed</a></p> : null}
          <article className="careerEvidenceReviewCard">
            <div className="careerEvidenceReviewMeta">
              <span>{displayLabel(candidate.eligibilityState)}</span>
              <span>{displayLabel(candidate.directOrTransferable)}</span>
              <span>{candidate.factType}</span>
            </div>
            <h2>{candidate.statement}</h2>
            <dl className="careerEvidenceReviewFacts">
              <div><dt>Capability family</dt><dd>{candidate.capabilityFamily}</dd></div>
              <div><dt>Context</dt><dd>{candidate.organization || candidate.roleOrTitle || "Not stated in source fact"}</dd></div>
              <div><dt>Verification</dt><dd>{candidate.verificationStatus} / {candidate.supportLevel}</dd></div>
              <div><dt>Authority</dt><dd>{candidate.authorityClassification}</dd></div>
              <div><dt>Source support</dt><dd>{candidate.sourceEvidenceCount ? `${candidate.sourceEvidenceCount} linked source record(s): ${candidate.sourceEvidenceTypes.join(", ")}` : "No linked source evidence"}</dd></div>
              <div><dt>Why review is needed</dt><dd>{candidate.eligibilityReasons.join(" ")}</dd></div>
              <div><dt>Projection consequence</dt><dd>{candidate.eligibilityState === "AUTO_PROJECTABLE" ? "Eligible for a separate reversible projection test; no canonical write occurs here." : "This decision remains a private adjudication candidate; canonical CareerEvidence is unchanged."}</dd></div>
            </dl>
            <form action={adjudicateEvidenceAction} className="careerEvidenceDecisionForm">
              <input type="hidden" name="candidateId" value={candidate.candidateId} />
              <label htmlFor="operatorCorrection">Correction, if needed</label>
              <textarea id="operatorCorrection" name="operatorCorrection" defaultValue={candidate.operatorCorrection || ""} placeholder="Describe only what should be corrected; the source fact is never rewritten." />
              <div className="careerEvidenceDecisionActions">
                <button type="submit" name="action" value="CONFIRM">Confirm</button>
                <button type="submit" name="action" value="CORRECT">Correct</button>
                <button type="submit" name="action" value="REJECT">Reject</button>
                <button type="submit" name="action" value="KEEP_UNRESOLVED">Keep unresolved</button>
              </div>
            </form>
          </article>
        </>
      ) : <p className="careerEvidenceEmpty">No private career authority candidates are available.</p>}
      <section className="careerEvidenceDatadogNote">
        <strong>Datadog TPM control</strong>
        <p>The existing Datadog TPM review remains diagnostic only. This surface cannot boost its score or rank.</p>
      </section>
    </main>
  );
}
