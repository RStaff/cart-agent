"use client";

import Link from "next/link";
import {
  ACTION_EFFORT_LABELS,
  ACTION_PRIORITY_LABELS,
  ACTION_SOURCE_LABELS,
  ACTION_STATUS_LABELS,
  getActionsForWorkspace,
  type StaffordOsAction,
} from "../../lib/staffordos/actionRegistry";
import { getDecisionById } from "../../lib/staffordos/decisionRegistry";
import { getObjectiveById } from "../../lib/staffordos/objectiveRegistry";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  WORKSPACE_AVAILABILITY_LABELS,
} from "../../lib/staffordos/workspaceRegistry";
import { useStaffordOsWorkspace } from "./WorkspaceContext";

function ActionCard({ action }: { action: StaffordOsAction }) {
  const objective = getObjectiveById(action.objectiveId);
  const decision = getDecisionById(action.decisionId);

  return (
    <article className="staffordObjectiveCard">
      <div className="staffordObjectiveMeta">
        <span>{ACTION_STATUS_LABELS[action.status]}</span>
        <span>{ACTION_SOURCE_LABELS[action.source]}</span>
        <span>{ACTION_PRIORITY_LABELS[action.priorityClassification]}</span>
      </div>

      <h2>{action.title}</h2>
      <p>{action.summary}</p>

      <dl className="staffordObjectiveFacts">
        <div>
          <dt>What to do</dt>
          <dd>{action.title}</dd>
        </div>
        <div>
          <dt>Why</dt>
          <dd>{action.reason}</dd>
        </div>
        <div>
          <dt>Success looks like</dt>
          <dd>{action.expectedResult}</dd>
        </div>
        <div>
          <dt>Proof needed</dt>
          <dd>{action.proofNeeded}</dd>
        </div>
        <div>
          <dt>Authority</dt>
          <dd>{action.authority}</dd>
        </div>
        <div>
          <dt>Effort</dt>
          <dd>{ACTION_EFFORT_LABELS[action.effortClassification]}</dd>
        </div>
      </dl>

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

      {action.continueHref ? (
        <div className="staffordObjectiveCapabilities">
          <span>Where this starts</span>
          <div>
            <Link href={action.continueHref}>{action.continueLabel}</Link>
          </div>
        </div>
      ) : null}

      <details className="staffordObjectiveEvidence">
        <summary>Evidence</summary>
        <ul>
          <li>Owner: {action.owner}</li>
          <li>Visibility: {action.visibility}</li>
          <li>Learning target: {action.learningTarget}</li>
          {action.createdFrom.map((reference) => (
            <li key={reference}>{reference}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function PlannedWorkspaceActions() {
  const { activeWorkspace, setActiveWorkspace } = useStaffordOsWorkspace();

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>What To Do Next</h1>
          <p>This workspace is planned. No current actions are connected here yet.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Planned only</strong>
        <p>
          Future actions here will stay inside this workspace. Stafford Media actions are not shown here.
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

function StaffordMediaActions() {
  const { activeWorkspace } = useStaffordOsWorkspace();
  const actions = getActionsForWorkspace(activeWorkspace.id);

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>What To Do Next</h1>
          <p>These are static, repository-backed actions. They explain where to continue and why.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Static foundation</strong>
        <p>
          The action list is not live ranking, automation, or execution. It connects current actions to goals,
          decisions, and proof.
        </p>
      </section>

      <div className="staffordObjectiveGrid">
        {actions.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
}

export function ActionSurface() {
  const { activeWorkspace } = useStaffordOsWorkspace();

  if (activeWorkspace.id !== DEFAULT_STAFFORDOS_WORKSPACE_ID) {
    return <PlannedWorkspaceActions />;
  }

  return <StaffordMediaActions />;
}
