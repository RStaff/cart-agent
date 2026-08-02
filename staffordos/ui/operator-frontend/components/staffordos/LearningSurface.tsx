"use client";

import Link from "next/link";
import {
  LEARNING_AUTHORITY_LABELS,
  LEARNING_CONFIDENCE_LABELS,
  LEARNING_SOURCE_LABELS,
  LEARNING_STATUS_LABELS,
  getLearningForWorkspace,
  type StaffordOsLearning,
} from "../../lib/staffordos/learningFoundation";
import { getActionById } from "../../lib/staffordos/actionRegistry";
import { getDecisionById } from "../../lib/staffordos/decisionRegistry";
import { getObjectiveById } from "../../lib/staffordos/objectiveRegistry";
import { getProofById, type StaffordOsProof } from "../../lib/staffordos/proofFoundation";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  WORKSPACE_AVAILABILITY_LABELS,
} from "../../lib/staffordos/workspaceRegistry";
import { useStaffordOsWorkspace } from "./WorkspaceContext";

function LearningCard({ learning }: { learning: StaffordOsLearning }) {
  const action = getActionById(learning.actionId);
  const decision = getDecisionById(learning.decisionId);
  const objective = getObjectiveById(learning.objectiveId);
  const proofRecords = learning.proofIds
    .map((proofId) => getProofById(proofId))
    .filter((proof): proof is StaffordOsProof => Boolean(proof));

  return (
    <article className="staffordObjectiveCard">
      <div className="staffordObjectiveMeta">
        <span>{LEARNING_STATUS_LABELS[learning.status]}</span>
        <span>{LEARNING_SOURCE_LABELS[learning.sourceClassification]}</span>
        <span>{LEARNING_CONFIDENCE_LABELS[learning.confidenceClassification]}</span>
      </div>

      <h2>{learning.title}</h2>
      <p>{learning.operatorFacingSummary}</p>

      <dl className="staffordObjectiveFacts">
        <div>
          <dt>What happened</dt>
          <dd>{learning.observedOutcome}</dd>
        </div>
        <div>
          <dt>What we learned</dt>
          <dd>{learning.lesson}</dd>
        </div>
        <div>
          <dt>Where this applies</dt>
          <dd>{learning.applicability}</dd>
        </div>
        <div>
          <dt>Where this may not apply</dt>
          <dd>{learning.nonApplicability}</dd>
        </div>
        <div>
          <dt>How this may help next time</dt>
          <dd>{learning.futureUse}</dd>
        </div>
        <div>
          <dt>Who confirmed it</dt>
          <dd>{LEARNING_AUTHORITY_LABELS[learning.authorityClassification]}</dd>
        </div>
      </dl>

      <div className="staffordObjectiveCapabilities">
        <span>What supports this</span>
        <div>
          {proofRecords.map((proof) => (
            <Link key={proof.id} href="/os/proof">
              {proof.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="staffordObjectiveCapabilities">
        <span>Related action</span>
        <div>
          {action ? <Link href="/os/actions">{action.title}</Link> : <span>Needs review</span>}
        </div>
      </div>

      <div className="staffordObjectiveCapabilities">
        <span>Related decision</span>
        <div>
          {decision ? <Link href="/os/decisions">{decision.title}</Link> : <span>Needs review</span>}
        </div>
      </div>

      <div className="staffordObjectiveCapabilities">
        <span>Related goal</span>
        <div>
          {objective ? <Link href="/os/objectives">{objective.title}</Link> : <span>Needs review</span>}
        </div>
      </div>

      <details className="staffordObjectiveEvidence">
        <summary>Source details</summary>
        <ul>
          <li>Situation: {learning.situation}</li>
          <li>Owner: {learning.owner}</li>
          <li>Reviewed by: {learning.reviewedBy}</li>
          <li>Visibility: {learning.visibility}</li>
          <li>Privacy: {learning.privacyClassification}</li>
          <li>Policy candidate: {learning.policyCandidate ? "Needs separate approval" : "No"}</li>
          <li>{learning.notes}</li>
          {learning.sourceArtifacts.map((artifact) => (
            <li key={artifact}>{artifact}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function PlannedWorkspaceLearning() {
  const { activeWorkspace, setActiveWorkspace } = useStaffordOsWorkspace();

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>What We Have Learned</h1>
          <p>This workspace is planned. No current lessons are connected here yet.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Planned only</strong>
        <p>
          Future lessons here will stay inside this workspace. Stafford Media learning is not shown here.
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

function StaffordMediaLearning() {
  const { activeWorkspace } = useStaffordOsWorkspace();
  const learningRecords = getLearningForWorkspace(activeWorkspace.id);

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>What We Have Learned</h1>
          <p>These are narrow lessons from S008 architecture and validation work. They do not change priorities or policy.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Learning after proof</strong>
        <p>
          Evidence explains why something looked worth doing. Proof shows what happened. Learning records what should
          be remembered next time after the scope and authority are clear.
        </p>
      </section>

      <div className="staffordObjectiveGrid">
        {learningRecords.map((learning) => (
          <LearningCard key={learning.id} learning={learning} />
        ))}
      </div>
    </div>
  );
}

export function LearningSurface() {
  const { activeWorkspace } = useStaffordOsWorkspace();

  if (activeWorkspace.id !== DEFAULT_STAFFORDOS_WORKSPACE_ID) {
    return <PlannedWorkspaceLearning />;
  }

  return <StaffordMediaLearning />;
}
