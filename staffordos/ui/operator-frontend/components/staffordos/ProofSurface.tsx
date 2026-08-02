"use client";

import Link from "next/link";
import {
  PROOF_AUTHORITY_LABELS,
  PROOF_CONFIDENCE_LABELS,
  PROOF_LEARNING_LABELS,
  PROOF_SOURCE_LABELS,
  PROOF_TYPE_LABELS,
  PROOF_VERIFICATION_LABELS,
  getProofForWorkspace,
  type StaffordOsProof,
} from "../../lib/staffordos/proofFoundation";
import { getActionById } from "../../lib/staffordos/actionRegistry";
import { getDecisionById } from "../../lib/staffordos/decisionRegistry";
import { getLearningForProof } from "../../lib/staffordos/learningFoundation";
import { getObjectiveById } from "../../lib/staffordos/objectiveRegistry";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  WORKSPACE_AVAILABILITY_LABELS,
} from "../../lib/staffordos/workspaceRegistry";
import { useStaffordOsWorkspace } from "./WorkspaceContext";

function ProofCard({ proof }: { proof: StaffordOsProof }) {
  const action = getActionById(proof.actionId);
  const decision = getDecisionById(proof.decisionId);
  const learning = getLearningForProof(proof.id);
  const objective = getObjectiveById(proof.objectiveId);

  return (
    <article className="staffordObjectiveCard">
      <div className="staffordObjectiveMeta">
        <span>{PROOF_VERIFICATION_LABELS[proof.verificationStatus]}</span>
        <span>{PROOF_SOURCE_LABELS[proof.sourceClassification]}</span>
        <span>{PROOF_TYPE_LABELS[proof.proofType]}</span>
      </div>

      <h2>{proof.title}</h2>
      <p>{proof.summary}</p>

      <dl className="staffordObjectiveFacts">
        <div>
          <dt>Expected result</dt>
          <dd>{proof.expectedResult}</dd>
        </div>
        <div>
          <dt>What happened</dt>
          <dd>{proof.observedOutcome}</dd>
        </div>
        <div>
          <dt>What proves it</dt>
          <dd>{proof.notes}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{PROOF_SOURCE_LABELS[proof.sourceClassification]}</dd>
        </div>
        <div>
          <dt>Verified by</dt>
          <dd>{proof.verifiedBy}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{PROOF_CONFIDENCE_LABELS[proof.confidenceClassification]}</dd>
        </div>
      </dl>

      <div className="staffordObjectiveCapabilities">
        <span>Related action</span>
        <div>
          {action ? <Link href="/os/actions">{action.title}</Link> : <span>Needs review</span>}
        </div>
      </div>

      <div className="staffordObjectiveCapabilities">
        <span>Related goal</span>
        <div>
          {objective ? <Link href="/os/objectives">{objective.title}</Link> : <span>Needs review</span>}
        </div>
      </div>

      <div className="staffordObjectiveCapabilities">
        <span>Related decision</span>
        <div>
          {decision ? <Link href="/os/decisions">{decision.title}</Link> : <span>Needs review</span>}
        </div>
      </div>

      <div className="staffordObjectiveCapabilities">
        <span>Lesson captured</span>
        <div>
          {learning.length ? (
            learning.map((record) => (
              <Link key={record.id} href="/os/learning">
                {record.title}
              </Link>
            ))
          ) : (
            <span>No lesson recorded yet</span>
          )}
        </div>
      </div>

      <details className="staffordObjectiveEvidence">
        <summary>Proof details</summary>
        <ul>
          <li>Authority: {PROOF_AUTHORITY_LABELS[proof.authorityClassification]}</li>
          <li>Verified at: {proof.verifiedAt}</li>
          <li>Visibility: {proof.visibility}</li>
          <li>Privacy: {proof.privacyClassification}</li>
          <li>Learning: {PROOF_LEARNING_LABELS[proof.learningStatus]}</li>
          {proof.evidenceReferences.map((reference) => (
            <li key={reference}>Evidence: {reference}</li>
          ))}
          {proof.sourceArtifacts.map((artifact) => (
            <li key={artifact}>{artifact}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function PlannedWorkspaceProof() {
  const { activeWorkspace, setActiveWorkspace } = useStaffordOsWorkspace();

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>What Has Been Proven</h1>
          <p>This workspace is planned. No current proof is connected here yet.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Planned only</strong>
        <p>
          Future proof here will stay inside this workspace. Stafford Media proof is not shown here.
        </p>
      </section>

      <button
        type="button"
        className="staffordReturnWorkspace"
        onClick={() => setActiveWorkspace(DEFAULT_STAFFORDOS_WORKSPACE_ID)}
      >
        Return to Stafford Media
      </button>
    </div>
  );
}

function StaffordMediaProof() {
  const { activeWorkspace } = useStaffordOsWorkspace();
  const proofRecords = getProofForWorkspace(activeWorkspace.id);

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>What Has Been Proven</h1>
          <p>These records show narrow S008 validation results. They do not prove live business outcomes.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Proof after evidence</strong>
        <p>
          Evidence explains why an action was worth considering. Proof shows what happened afterward.
          Completion still requires future governed authority.
        </p>
      </section>

      <div className="staffordObjectiveGrid">
        {proofRecords.map((proof) => (
          <ProofCard key={proof.id} proof={proof} />
        ))}
      </div>
    </div>
  );
}

export function ProofSurface() {
  const { activeWorkspace } = useStaffordOsWorkspace();

  if (activeWorkspace.id !== DEFAULT_STAFFORDOS_WORKSPACE_ID) {
    return <PlannedWorkspaceProof />;
  }

  return <StaffordMediaProof />;
}
