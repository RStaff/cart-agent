"use client";

import Link from "next/link";
import {
  EVIDENCE_CONFIDENCE_LABELS,
  EVIDENCE_SOURCE_LABELS,
  EVIDENCE_TYPE_LABELS,
  getEvidenceForWorkspace,
  type StaffordOsEvidence,
} from "../../lib/staffordos/evidenceFoundation";
import { getActionById } from "../../lib/staffordos/actionRegistry";
import { getDecisionById } from "../../lib/staffordos/decisionRegistry";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  WORKSPACE_AVAILABILITY_LABELS,
} from "../../lib/staffordos/workspaceRegistry";
import { useStaffordOsWorkspace } from "./WorkspaceContext";

function EvidenceCard({ evidence }: { evidence: StaffordOsEvidence }) {
  const action = getActionById(evidence.actionId);
  const decision = getDecisionById(evidence.decisionId);

  return (
    <article className="staffordObjectiveCard">
      <div className="staffordObjectiveMeta">
        <span>{EVIDENCE_SOURCE_LABELS[evidence.source]}</span>
        <span>{EVIDENCE_TYPE_LABELS[evidence.evidenceType]}</span>
        <span>{EVIDENCE_CONFIDENCE_LABELS[evidence.confidence]}</span>
      </div>

      <h2>{evidence.title}</h2>
      <p>{evidence.summary}</p>

      <dl className="staffordObjectiveFacts">
        <div>
          <dt>What we know</dt>
          <dd>{evidence.summary}</dd>
        </div>
        <div>
          <dt>Why we believe it</dt>
          <dd>{evidence.notes}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{EVIDENCE_SOURCE_LABELS[evidence.source]}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{EVIDENCE_CONFIDENCE_LABELS[evidence.confidence]}</dd>
        </div>
      </dl>

      <div className="staffordObjectiveCapabilities">
        <span>Supports</span>
        <div>
          {action ? <Link href="/os/actions">{action.title}</Link> : <span>{evidence.supports}</span>}
        </div>
      </div>

      <div className="staffordObjectiveCapabilities">
        <span>Related decision</span>
        <div>
          {decision ? <Link href="/os/decisions">{decision.title}</Link> : <span>Needs review</span>}
        </div>
      </div>

      <details className="staffordObjectiveEvidence">
        <summary>Source details</summary>
        <ul>
          <li>Collected: {evidence.collectedAt}</li>
          <li>Owner: {evidence.owner}</li>
          <li>Visibility: {evidence.visibility}</li>
          <li>Authority: {evidence.authority}</li>
          {evidence.sourceArtifacts.map((artifact) => (
            <li key={artifact}>{artifact}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function PlannedWorkspaceEvidence() {
  const { activeWorkspace, setActiveWorkspace } = useStaffordOsWorkspace();

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>Why We Believe This</h1>
          <p>This workspace is planned. No current evidence is connected here yet.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Planned only</strong>
        <p>
          Future evidence here will stay inside this workspace. Stafford Media evidence is not shown here.
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

function StaffordMediaEvidence() {
  const { activeWorkspace } = useStaffordOsWorkspace();
  const evidenceRecords = getEvidenceForWorkspace(activeWorkspace.id);

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>Why We Believe This</h1>
          <p>These records explain why the current static actions are worth reviewing before proof exists.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Evidence before proof</strong>
        <p>
          Evidence explains why an action is worth considering. Proof comes later and shows whether the result
          happened.
        </p>
      </section>

      <div className="staffordObjectiveGrid">
        {evidenceRecords.map((evidence) => (
          <EvidenceCard key={evidence.id} evidence={evidence} />
        ))}
      </div>
    </div>
  );
}

export function EvidenceSurface() {
  const { activeWorkspace } = useStaffordOsWorkspace();

  if (activeWorkspace.id !== DEFAULT_STAFFORDOS_WORKSPACE_ID) {
    return <PlannedWorkspaceEvidence />;
  }

  return <StaffordMediaEvidence />;
}
