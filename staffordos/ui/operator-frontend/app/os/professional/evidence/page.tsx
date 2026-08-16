import { redirect } from "next/navigation";
import L2TargetInspector from "../../../../components/staffordos/L2TargetInspector";
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
import {
  appendRequirementMappingDecision,
  loadRequirementMappingQueue,
  privateRequirementMappingRoot,
  requirementMappingProgress,
  loadScopeSafeRequirementMappingQueue,
  scopeSafeRequirementMappingProgress,
  REQUIREMENT_MAPPING_STATES,
  type RequirementMappingState,
} from "../../../../lib/staffordos/requirementMapping";

export const dynamic = "force-dynamic";

function answerFromForm(value: FormDataEntryValue | null): ReviewClusterAnswer | null {
  const answer = String(value || "").trim();
  return REVIEW_CLUSTER_ANSWERS.includes(answer as ReviewClusterAnswer) ? answer as ReviewClusterAnswer : null;
}

function mappingStateFromForm(value: FormDataEntryValue | null): RequirementMappingState | null {
  const answer = String(value || "").trim();
  return REQUIREMENT_MAPPING_STATES.includes(answer as RequirementMappingState) ? answer as RequirementMappingState : null;
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

async function adjudicateRequirementMappingAction(formData: FormData) {
  "use server";
  const reviewSetId = String(formData.get("reviewSetId") || "").trim() || null;
  const compressedQuestionId = String(formData.get("compressedQuestionId") || "").trim() || null;
  const requirementId = String(formData.get("requirementId") || "").trim();
  const state = mappingStateFromForm(formData.get("state"));
  const queue = reviewSetId === "V1_26M2_SCOPE_SAFE_ROUND2_REVIEW"
    ? loadScopeSafeRequirementMappingQueue({ repositoryRoot: process.cwd(), decisionRoot: privateRequirementMappingRoot(), reviewSetId })
    : loadRequirementMappingQueue({ repositoryRoot: process.cwd(), decisionRoot: privateRequirementMappingRoot(), limit: 24 });
  const item = compressedQuestionId
    ? queue.find((entry) => entry.compressedQuestionId === compressedQuestionId)
    : queue.find((entry) => entry.requirementId === requirementId);
  if (!item || !state) redirect("/os/professional/evidence?view=requirement-mapping&status=NOT_SAVED");
  try {
    appendRequirementMappingDecision({
      decisionRoot: privateRequirementMappingRoot(),
      repositoryRoot: process.cwd(),
      item,
      state,
      supportedPortion: String(formData.get("supportedPortion") || "").trim() || null,
      unresolvedPortion: String(formData.get("unresolvedPortion") || "").trim() || null,
      operatorNote: String(formData.get("operatorNote") || "").trim() || null,
      specialistCompatible: formData.get("specialistCompatible") === "true",
      reviewSetId: reviewSetId || undefined,
      compressedQuestionId: compressedQuestionId || undefined,
      targetRequirementIds: item.targetRequirementIds,
      targetOpportunityIds: item.targetOpportunityIds,
      projectionRulesVersion: reviewSetId ? "CAREEROS_V1_26L2_TARGET_PROJECTION_RULES" : undefined,
    });
    const readbackQueue = reviewSetId === "V1_26M2_SCOPE_SAFE_ROUND2_REVIEW"
      ? loadScopeSafeRequirementMappingQueue({ repositoryRoot: process.cwd(), decisionRoot: privateRequirementMappingRoot(), reviewSetId })
      : loadRequirementMappingQueue({ repositoryRoot: process.cwd(), decisionRoot: privateRequirementMappingRoot(), limit: 24 });
    const readback = compressedQuestionId ? readbackQueue.find((entry) => entry.compressedQuestionId === compressedQuestionId) : readbackQueue.find((entry) => entry.requirementId === requirementId);
    if (!readback?.decision || readback.decision.state !== state || (reviewSetId && JSON.stringify(readback.decision.targetRequirementIds || []) !== JSON.stringify(item.targetRequirementIds || []))) throw new Error("EXACT_READBACK_FAILED");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "SAVE_FAILED";
    redirect(`/os/professional/evidence?view=requirement-mapping${reviewSetId ? `&set=v1_26m2&question=${encodeURIComponent(compressedQuestionId || "")}` : `&requirement=${encodeURIComponent(requirementId)}`}&status=NOT_SAVED&reason=${encodeURIComponent(reason)}`);
  }
  redirect(`/os/professional/evidence?view=requirement-mapping${reviewSetId ? `&set=v1_26m2&question=${encodeURIComponent(compressedQuestionId || "")}` : `&requirement=${encodeURIComponent(requirementId)}`}&status=SAVED`);
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
  const requirementMappingMode = params.view === "requirement-mapping";
  if (requirementMappingMode) {
    const scopeSafeMode = params.set === "v1_26m2";
    const mappingQueue = scopeSafeMode
      ? loadScopeSafeRequirementMappingQueue({ repositoryRoot: process.cwd(), decisionRoot: privateRequirementMappingRoot(), reviewSetId: "V1_26M2_SCOPE_SAFE_ROUND2_REVIEW" })
      : loadRequirementMappingQueue({ repositoryRoot: process.cwd(), decisionRoot: privateRequirementMappingRoot(), limit: 24 });
    const mappingProgress = scopeSafeMode ? scopeSafeRequirementMappingProgress(mappingQueue) : requirementMappingProgress(mappingQueue);
    const requestedRequirement = typeof params.requirement === "string" ? params.requirement : null;
    const requestedQuestion = typeof params.question === "string" ? params.question : null;
    const item = (scopeSafeMode ? mappingQueue.find((entry) => entry.compressedQuestionId === requestedQuestion) : mappingQueue.find((entry) => entry.requirementId === requestedRequirement)) || mappingQueue.find((entry) => !entry.decision) || mappingQueue[0] || null;
    const index = item ? mappingQueue.findIndex((entry) => scopeSafeMode ? entry.compressedQuestionId === item.compressedQuestionId : entry.requirementId === item.requirementId) : -1;
    const previous = index > 0 ? mappingQueue[index - 1] : null;
    const next = index >= 0 && index < mappingQueue.length - 1 ? mappingQueue[index + 1] : null;
    const nextUnreviewed = mappingQueue.find((entry) => !entry.decision) || null;
    const href = (entry: typeof item) => scopeSafeMode ? `/os/professional/evidence?view=requirement-mapping&set=v1_26m2&question=${encodeURIComponent(entry?.compressedQuestionId || "")}` : `/os/professional/evidence?view=requirement-mapping&requirement=${encodeURIComponent(entry?.requirementId || "")}`;
    const status = typeof params.status === "string" ? params.status : null;
    const reason = typeof params.reason === "string" ? params.reason : null;
    return (
      <div className="careerEvidenceAdjudicationPage">
        <section className="careerEvidenceAdjudicationHeader"><div><span className="staffordEyebrow">Professional / {scopeSafeMode ? "Round 2 scope-safe review" : "Requirement mapping"}</span><h1>{scopeSafeMode ? "Scope-Safe Requirement Review" : "Requirement-Level Evidence Mapping"}</h1><p>{scopeSafeMode ? "CareerOS groups only compatible exact requirements. Your answer is applied only through each target's approved projection rules." : "CareerOS asks a bounded question about one exact job requirement. This does not create or rewrite career evidence."}</p></div><div className="careerEvidenceAdjudicationStatus"><strong>Owner-private review</strong><span>CareerFact and CareerEvidence remain unchanged.</span></div></section>
        <section className="careerEvidenceAdjudicationNotice"><strong>Requirement mapping</strong><p>This changes evidence authority only. It does not change ranking, application status, workflow decisions, preferences, or source truth.</p></section>
        <section className="careerEvidenceProgress" aria-label="Requirement mapping progress">{scopeSafeMode ? <><div><span>Round 1 requirement mapping</span><strong>24 / 24</strong></div><div><span>Round 2 scope-safe review</span><strong>{mappingProgress.decisionsCompleted} / {mappingProgress.decisionTotal}</strong></div><div><span>Round 2 exact targets addressed</span><strong>{mappingProgress.requirementsAddressed} / {mappingProgress.requirementTotal}</strong></div><div><span>Total active requirement authority</span><strong>{24 + mappingProgress.decisionsCompleted}</strong></div></> : <><div><span>Requirement mapping decisions</span><strong>{mappingProgress.decisionsCompleted} / {mappingProgress.decisionTotal}</strong></div><div><span>Requirements addressed</span><strong>{mappingProgress.requirementsAddressed} / {mappingProgress.requirementTotal}</strong></div><div><span>High-value review</span><strong>{progress.operatorDecisions} / {progress.operatorDecisionTotal}</strong></div></>}</section>
        <nav className="careerEvidenceFocus" aria-label="Evidence review focus"><span>Review focus:</span><a href="/os/professional/evidence">High-value review</a><a href="/os/professional/evidence?view=conflicts">Conflict resolution</a><a href="/os/professional/evidence?view=requirement-mapping">Requirement mapping</a>{scopeSafeMode ? <a href="/os/professional/evidence?view=requirement-mapping&set=v1_26m2">Round 2</a> : null}</nav>
        {status ? <p className={`careerEvidenceFeedback ${status === "NOT_SAVED" ? "is-error" : "is-success"}`} role="status">{status === "NOT_SAVED" ? `NOT SAVED${reason ? `: ${reason}` : ""}` : status}</p> : null}
        {item ? <>
          <nav className="careerEvidenceNavigation" aria-label="Requirement mapping navigation">{previous ? <a href={href(previous)}>Previous</a> : <span>Previous</span>}<span>Question {index + 1} of {mappingQueue.length}</span>{next ? <a href={href(next)}>Next</a> : <span>Next</span>}</nav>
          {nextUnreviewed ? <p className="careerEvidenceNextUnreviewed"><a href={href(nextUnreviewed)}>Next unreviewed</a></p> : null}
          <article className="careerEvidenceReviewCard"><div className="careerEvidenceReviewMeta"><span>{item.company}</span><span>{item.title}</span><span>{item.capabilityFamily}</span>{item.scopeClassification ? <span>{displayLabel(item.scopeClassification)}</span> : null}{item.specialist ? <span>Specialist boundary</span> : null}<span>{item.targetRequirementIds?.length || 1} exact targets</span></div><h2>{item.question}</h2><p>{item.explanation || item.whyAsked}</p>{scopeSafeMode ? <p>CareerOS applies your answer only according to the approved scope and projection rules for each exact requirement.</p> : null}<dl className="careerEvidenceReviewFacts"><div><dt>Why CareerOS is asking</dt><dd>{item.whyAsked} {item.priorityReason}</dd></div><div><dt>Representative targets</dt><dd>{item.representativeTargets?.map((target) => `${target.company || "Unknown company"} / ${target.title || "Unknown role"}: ${target.requirementText}`).join(" · ")}</dd></div><div><dt>Exact target requirements</dt><dd>{item.targetSummaries ? <L2TargetInspector targets={item.targetSummaries} /> : null}</dd></div><div><dt>Existing Ross authority</dt><dd>{item.authoritySummary}</dd></div><div><dt>Current system interpretation</dt><dd>{displayLabel(item.currentMappingState)}; no positive requirement relationship is currently authorized.</dd></div><div><dt>What this affects</dt><dd>Only the exact target set and target-specific projection rules for this compressed question.</dd></div><div><dt>What this does not affect</dt><dd>CareerFact, CareerEvidence, ranking, J002, J003, J010, workflow, preferences, or applications.</dd></div></dl><form action={adjudicateRequirementMappingAction} className="careerEvidenceDecisionForm"><input type="hidden" name="requirementId" value={scopeSafeMode ? "" : item.requirementId} />{scopeSafeMode ? <><input type="hidden" name="reviewSetId" value="V1_26M2_SCOPE_SAFE_ROUND2_REVIEW" /><input type="hidden" name="compressedQuestionId" value={item.compressedQuestionId || ""} /></> : null}<label htmlFor="supportedPortion">Supported portion, if applicable</label><textarea id="supportedPortion" name="supportedPortion" defaultValue={item.decision?.supportedPortion || ""} placeholder="Keep this bounded to the requirement." /><label htmlFor="unresolvedPortion">Unresolved portion, if applicable</label><textarea id="unresolvedPortion" name="unresolvedPortion" defaultValue={item.decision?.unresolvedPortion || ""} placeholder="Record what remains unproven." /><label htmlFor="operatorNote">Operator note</label><textarea id="operatorNote" name="operatorNote" defaultValue={item.decision?.operatorNote || ""} placeholder="Optional bounded context." />{item.specialist ? <label><input type="checkbox" name="specialistCompatible" value="true" /> I confirm the cited authority is specialist-compatible with this requirement.</label> : null}<div className="careerEvidenceDecisionActions">{item.allowedStates.map((state) => <button key={state} type="submit" name="state" value={state}>{displayLabel(state)}</button>)}</div></form></article>
        </> : <p className="careerEvidenceEmpty">No bounded unmapped requirements are available.</p>}
      </div>
    );
  }
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
