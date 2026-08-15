import { redirect } from "next/navigation";
import {
  REVIEW_CLUSTER_ANSWERS,
  appendReviewClusterDecision,
  compressionProgress,
  loadCompressedReviewRuntime,
  privateAdjudicationRoot,
  type ReviewClusterAnswer,
} from "../../../../lib/staffordos/evidenceReviewCompression";
import {
  appendConflictResolutionDecision,
  buildConflictReviewQueue,
  conflictProgress,
  loadConflictResolutionDecisions,
  type ConflictReviewItem,
} from "../../../../lib/staffordos/conflictResolution";

export const dynamic = "force-dynamic";

function answerFromForm(value: FormDataEntryValue | null): ReviewClusterAnswer | null {
  const answer = String(value || "").trim();
  return REVIEW_CLUSTER_ANSWERS.includes(answer as ReviewClusterAnswer) ? answer as ReviewClusterAnswer : null;
}

async function adjudicateReviewClusterAction(formData: FormData) {
  "use server";
  const clusterId = String(formData.get("clusterId") || "").trim();
  const conflictMode = formData.get("conflictMode") === "true";
  const answer = answerFromForm(formData.get("answer"));
  const correction = String(formData.get("operatorCorrection") || "").trim() || null;
  const runtime = loadCompressedReviewRuntime({ repositoryRoot: process.cwd() });
  const cluster = runtime.allClusters.find((item) => item.clusterId === clusterId);
  if (!cluster || !answer) redirect("/os/professional/evidence?status=NOT_SAVED");
  try {
    if (conflictMode) {
      const conflictDecisions = loadConflictResolutionDecisions({ decisionRoot: privateAdjudicationRoot(), repositoryRoot: process.cwd() });
      const prior = [...conflictDecisions].reverse().find((decision) => decision.questionId === clusterId) || null;
      appendConflictResolutionDecision({
        decisionRoot: privateAdjudicationRoot(),
        repositoryRoot: process.cwd(),
        questionId: clusterId,
        answer,
        underlyingCandidateIds: cluster.underlyingCandidateIds,
        propagationEligibleCandidateIds: cluster.propagationEligibleCandidateIds,
        priorDecisionId: prior?.decisionId || null,
      });
    } else {
      appendReviewClusterDecision({
        decisionRoot: privateAdjudicationRoot(),
        repositoryRoot: process.cwd(),
        cluster,
        answer,
        operatorCorrection: correction,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "SAVE_FAILED";
    redirect(`/os/professional/evidence?view=${conflictMode ? "conflicts&" : ""}cluster=${encodeURIComponent(clusterId)}&status=NOT_SAVED&reason=${encodeURIComponent(message)}`);
  }
  redirect(`/os/professional/evidence?view=${conflictMode ? "conflicts&" : ""}cluster=${encodeURIComponent(clusterId)}&status=SAVED`);
}

function displayLabel(value: string) { return value.replaceAll("_", " "); }

export default async function ProfessionalEvidencePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const runtime = loadCompressedReviewRuntime({ repositoryRoot: process.cwd(), maxHighValue: 18 });
  const progress = compressionProgress(runtime);
  const requested = typeof params.cluster === "string" ? params.cluster : null;
  const showAll = params.view === "all";
  const conflictMode = params.view === "conflicts";
  const conflictDecisions = loadConflictResolutionDecisions({ decisionRoot: privateAdjudicationRoot(), repositoryRoot: process.cwd() });
  const conflictQueueWithDecisions = buildConflictReviewQueue(runtime.highValueClusters, conflictDecisions);
  const queue = (conflictMode ? conflictQueueWithDecisions : showAll ? runtime.allClusters : runtime.highValueClusters) as ConflictReviewItem[];
  const cluster = queue.find((item) => item.clusterId === requested) || queue.find((item) => !item.operatorAnswer) || queue[0] || null;
  const index = cluster ? queue.findIndex((item) => item.clusterId === cluster.clusterId) : -1;
  const previous = index > 0 ? queue[index - 1] : null;
  const next = index >= 0 && index < queue.length - 1 ? queue[index + 1] : null;
  const nextUnreviewed = queue.find((item) => conflictMode ? !item.conflictDecision : !item.operatorAnswer) || null;
  const conflictCompletion = conflictProgress(conflictQueueWithDecisions, conflictQueueWithDecisions.length);
  const clusterHref = (clusterId: string) => `/os/professional/evidence?${conflictMode ? "view=conflicts&" : ""}cluster=${encodeURIComponent(clusterId)}`;
  const status = typeof params.status === "string" ? params.status : null;
  const reason = typeof params.reason === "string" ? params.reason : null;
  return (
    <div className="careerEvidenceAdjudicationPage">
      <section className="careerEvidenceAdjudicationHeader">
        <div>
          <span className="staffordEyebrow">Professional / High-value review</span>
          <h1>Career Evidence Adjudication</h1>
          <p>CareerOS found {progress.underlyingCandidateTotal} underlying evidence candidates. You do not need to review them individually.</p>
        </div>
        <div className="careerEvidenceAdjudicationStatus">
          <strong>Owner-private review</strong>
          <span>CareerFact and CareerEvidence remain unchanged.</span>
        </div>
      </section>
      <section className="careerEvidenceAdjudicationNotice">
        <strong>{conflictMode ? "Conflict resolution" : "High-value review"}</strong>
        <p>{conflictMode ? "This changes evidence authority only. It does not change ranking, application status, or workflow decisions by itself." : "Each answer is a bounded operator decision over compatible candidates. It does not automatically create CareerEvidence."}</p>
      </section>
      <section className="careerEvidenceProgress" aria-label="Compressed adjudication progress">
        {conflictMode ? <div><span>Conflict resolution</span><strong>{conflictCompletion.completed} / {conflictCompletion.total}</strong></div> : <div><span>High-value review</span><strong>{progress.operatorDecisions} / {progress.operatorDecisionTotal}</strong></div>}
        {conflictMode ? <div><span>High-value review</span><strong>{progress.operatorDecisions} / {progress.operatorDecisionTotal}</strong></div> : null}
        <div><span>Underlying candidates addressed</span><strong>{progress.underlyingCandidatesAddressed} / {progress.underlyingCandidateTotal}</strong></div>
        <div><span>Raw candidates</span><strong>{runtime.candidates.length}</strong></div>
      </section>
      <nav className="careerEvidenceFocus" aria-label="Evidence review focus">
        <span>Review focus:</span><a href="/os/professional/evidence">High-value review</a><a href="/os/professional/evidence?view=conflicts">Conflict resolution</a><a href="/os/professional/evidence?view=all">All clusters</a>
      </nav>
      {status ? <p className={`careerEvidenceFeedback ${status === "NOT_SAVED" ? "is-error" : "is-success"}`} role="status">{status === "NOT_SAVED" ? `NOT SAVED${reason ? `: ${reason}` : ""}` : status}</p> : null}
      {cluster ? (
        <>
          <nav className="careerEvidenceNavigation" aria-label="Cluster navigation">
            {previous ? <a href={clusterHref(previous.clusterId)}>Previous</a> : <span>Previous</span>}
            <span>Question {index + 1} of {queue.length}</span>
            {next ? <a href={clusterHref(next.clusterId)}>Next</a> : <span>Next</span>}
          </nav>
          {nextUnreviewed ? <p className="careerEvidenceNextUnreviewed"><a href={clusterHref(nextUnreviewed.clusterId)}>Next unreviewed</a></p> : null}
          <article className="careerEvidenceReviewCard">
            <div className="careerEvidenceReviewMeta"><span>{displayLabel(cluster.clusterType)}</span><span>{displayLabel(cluster.directOrTransferable)}</span><span>{cluster.capabilityFamily}</span>{conflictMode ? <span>{displayLabel(cluster.conflictType)}</span> : null}</div>
            <h2>{cluster.operatorQuestion}</h2>
            <p>{cluster.whyAsked}</p>
            <dl className="careerEvidenceReviewFacts">
              <div><dt>Underlying candidates</dt><dd>{cluster.underlyingCandidateCount}</dd></div>
              <div><dt>Affected opportunities</dt><dd>{cluster.affectedOpportunityCount === null ? "Not linked in evidence authority" : cluster.affectedOpportunityCount}</dd></div>
              <div><dt>Provenance</dt><dd>{cluster.sourceProvenanceStates.join(", ")}</dd></div>
              <div><dt>Conflict state</dt><dd>{cluster.conflictStates.join(", ")}</dd></div>
              <div><dt>Propagation boundary</dt><dd>{cluster.propagationEligibleCandidateIds.length} candidates with operator-resolvable verification state; direct and transferable semantics remain separate.</dd></div>
              <div><dt>Priority reason</dt><dd>{cluster.priorityReason}</dd></div>
              <div><dt>Consequence</dt><dd>Answer remains an auditable private decision. No CareerFact rewrite and no CareerEvidence creation occur here.</dd></div>
              {conflictMode ? <><div><dt>Current authority outcome</dt><dd>{displayLabel(cluster.currentOutcome)}</dd></div><div><dt>What this affects</dt><dd>{cluster.authorityEffect}</dd></div><div><dt>What this does not affect</dt><dd>{cluster.excludedEffects}</dd></div></> : null}
            </dl>
            <form action={adjudicateReviewClusterAction} className="careerEvidenceDecisionForm">
              <input type="hidden" name="clusterId" value={cluster.clusterId} />
              <input type="hidden" name="conflictMode" value={conflictMode ? "true" : "false"} />
              <label htmlFor="operatorCorrection">Operator note, if needed</label>
              <textarea id="operatorCorrection" name="operatorCorrection" defaultValue={cluster.operatorCorrection || ""} placeholder="Record scope or context without rewriting the source fact." />
              {conflictMode && cluster.historicalHighValueAnswer ? <p className="careerEvidenceHistoricalContext">Earlier high-value review answer: {displayLabel(cluster.historicalHighValueAnswer)}</p> : null}
              <div className="careerEvidenceDecisionActions">
                <button type="submit" name="answer" value="DIRECT" disabled={!cluster.allowedAnswers.includes("DIRECT")}>Direct</button>
                <button type="submit" name="answer" value="TRANSFERABLE" disabled={!cluster.allowedAnswers.includes("TRANSFERABLE")}>Transferable</button>
                <button type="submit" name="answer" value="ADJACENT" disabled={!cluster.allowedAnswers.includes("ADJACENT")}>Adjacent</button>
                <button type="submit" name="answer" value="NO" disabled={!cluster.allowedAnswers.includes("NO")}>No</button>
                <button type="submit" name="answer" value="NEEDS_EVIDENCE" disabled={!cluster.allowedAnswers.includes("NEEDS_EVIDENCE")}>Needs evidence</button>
                <button type="submit" name="answer" value="KEEP_UNRESOLVED" disabled={!cluster.allowedAnswers.includes("KEEP_UNRESOLVED")}>Keep unresolved</button>
              </div>
            </form>
          </article>
        </>
      ) : <p className="careerEvidenceEmpty">No high-value review clusters are available.</p>}
      <section className="careerEvidenceDatadogNote"><strong>Datadog TPM control</strong><p>Use the same compressed questions for program delivery, leadership scope, technical depth, and domain context. This surface cannot boost Datadog's score or rank.</p></section>
    </div>
  );
}
