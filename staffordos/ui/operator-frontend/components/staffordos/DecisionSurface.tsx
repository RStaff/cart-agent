"use client";

import Link from "next/link";
import {
  DECISION_AUTHORITY_LABELS,
  DECISION_CONFIDENCE_LABELS,
  DECISION_OUTCOME_LABELS,
  DECISION_SOURCE_LABELS,
  DECISION_STATUS_LABELS,
  getChosenDecisionsForWorkspace,
  getDecisionsForWorkspace,
  type StaffordOsDecision,
} from "../../lib/staffordos/decisionRegistry";
import { getEvidenceForDecision } from "../../lib/staffordos/evidenceFoundation";
import { getObjectiveById } from "../../lib/staffordos/objectiveRegistry";
import { getProofForDecision } from "../../lib/staffordos/proofFoundation";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  WORKSPACE_AVAILABILITY_LABELS,
} from "../../lib/staffordos/workspaceRegistry";
import { useStaffordOsWorkspace } from "./WorkspaceContext";

function DecisionCard({ decision }: { decision: StaffordOsDecision }) {
  const objective = getObjectiveById(decision.objectiveId);
  const evidence = getEvidenceForDecision(decision.id);
  const proof = getProofForDecision(decision.id);

  return (
    <article className="staffordObjectiveCard">
      <div className="staffordObjectiveMeta">
        <span>{DECISION_STATUS_LABELS[decision.approvalStatus]}</span>
        <span>{DECISION_SOURCE_LABELS[decision.sourceClassification]}</span>
        <span>{DECISION_AUTHORITY_LABELS[decision.authorityClassification]}</span>
      </div>

      <h2>{decision.title}</h2>
      <p>{decision.summary}</p>

      <dl className="staffordObjectiveFacts">
        <div>
          <dt>What we chose</dt>
          <dd>{decision.decision}</dd>
        </div>
        <div>
          <dt>Why</dt>
          <dd>{decision.why}</dd>
        </div>
        <div>
          <dt>Other options</dt>
          <dd>{decision.alternativesConsidered.join(" ")}</dd>
        </div>
        <div>
          <dt>Authority</dt>
          <dd>{decision.decisionOwner}. {decision.authorityStatus}</dd>
        </div>
        <div>
          <dt>Expected result</dt>
          <dd>{decision.expectedResult}</dd>
        </div>
        <div>
          <dt>Proof needed</dt>
          <dd>{decision.proofRequirement}</dd>
        </div>
      </dl>

      {objective ? (
        <div className="staffordObjectiveCapabilities">
          <span>Supports</span>
          <div>
            <Link href="/os/objectives">{objective.title}</Link>
          </div>
        </div>
      ) : null}

      <div className="staffordObjectiveCapabilities">
        <span>Supporting evidence</span>
        <div>
          {evidence.length ? (
            evidence.map((record) => (
              <Link key={record.id} href="/os/evidence">
                {record.title}
              </Link>
            ))
          ) : (
            <span>Needs review</span>
          )}
        </div>
      </div>

      <div className="staffordObjectiveCapabilities">
        <span>Proof</span>
        <div>
          {proof.length ? (
            proof.map((record) => (
              <Link key={record.id} href="/os/proof">
                {record.title}
              </Link>
            ))
          ) : (
            <span>Not yet proven</span>
          )}
        </div>
      </div>

      <details className="staffordObjectiveEvidence">
        <summary>Evidence and tradeoffs</summary>
        <ul>
          <li>Situation: {decision.situation}</li>
          <li>Confidence: {DECISION_CONFIDENCE_LABELS[decision.confidenceClassification]}</li>
          <li>Outcome status: {DECISION_OUTCOME_LABELS[decision.outcomeStatus]}</li>
          <li>Uncertainty: {decision.uncertainty}</li>
          <li>Risks: {decision.risks.join(" ")}</li>
          <li>Tradeoffs: {decision.tradeoffs.join(" ")}</li>
          <li>Learning destination: {decision.learningDestination}</li>
          {decision.evidenceReferences.map((reference) => (
            <li key={reference}>{reference}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function PlannedWorkspaceDecisions() {
  const { activeWorkspace, setActiveWorkspace } = useStaffordOsWorkspace();
  const decisions = getDecisionsForWorkspace(activeWorkspace.id);

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>Decisions and Why We Made Them</h1>
          <p>This workspace is planned. No decisions are recorded here yet.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Planned only</strong>
        <p>
          Decisions shown here later will stay inside this workspace. Stafford Media decisions are not shown here.
        </p>
      </section>

      {decisions.length ? (
        <div className="staffordObjectiveGrid">
          {decisions.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      ) : null}

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

function StaffordMediaDecisions() {
  const { activeWorkspace } = useStaffordOsWorkspace();
  const decisions = getChosenDecisionsForWorkspace(activeWorkspace.id);

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>Decisions and Why We Made Them</h1>
          <p>These records explain established architecture choices. They do not approve or execute work.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Decision memory</strong>
        <p>
          These are repository-backed architecture decisions. Live customer, payment, staffing, job, family, and
          personal decisions are not recorded here.
        </p>
      </section>

      <div className="staffordObjectiveGrid">
        {decisions.map((decision) => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
      </div>
    </div>
  );
}

export function DecisionSurface() {
  const { activeWorkspace } = useStaffordOsWorkspace();

  if (activeWorkspace.id !== DEFAULT_STAFFORDOS_WORKSPACE_ID) {
    return <PlannedWorkspaceDecisions />;
  }

  return <StaffordMediaDecisions />;
}
