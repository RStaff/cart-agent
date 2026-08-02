"use client";

import Link from "next/link";
import {
  STAFFORDOS_CAPABILITIES,
  type StaffordOsCapability,
} from "../../lib/staffordos/capabilities";
import {
  getActiveObjectivesForWorkspace,
  getObjectivesForWorkspace,
  OBJECTIVE_PRIORITY_LABELS,
  OBJECTIVE_SOURCE_LABELS,
  OBJECTIVE_STATUS_LABELS,
  type StaffordOsObjective,
} from "../../lib/staffordos/objectiveRegistry";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  WORKSPACE_AVAILABILITY_LABELS,
} from "../../lib/staffordos/workspaceRegistry";
import { useStaffordOsWorkspace } from "./WorkspaceContext";

const capabilityById = new Map<string, StaffordOsCapability>(
  STAFFORDOS_CAPABILITIES.map((capability) => [capability.id, capability]),
);

function capabilityForId(capabilityId: string) {
  return capabilityById.get(capabilityId) || null;
}

function ObjectiveCard({ objective }: { objective: StaffordOsObjective }) {
  const capabilities = objective.relatedCapabilities
    .map((capabilityId) => capabilityForId(capabilityId))
    .filter((capability): capability is StaffordOsCapability => Boolean(capability));

  return (
    <article className="staffordObjectiveCard">
      <div className="staffordObjectiveMeta">
        <span>{OBJECTIVE_STATUS_LABELS[objective.status]}</span>
        <span>{OBJECTIVE_SOURCE_LABELS[objective.source]}</span>
        <span>{OBJECTIVE_PRIORITY_LABELS[objective.priorityClass]}</span>
      </div>

      <h2>{objective.title}</h2>
      <p>{objective.description}</p>

      <dl className="staffordObjectiveFacts">
        <div>
          <dt>Why this matters</dt>
          <dd>{objective.whyItMatters}</dd>
        </div>
        <div>
          <dt>What completion looks like</dt>
          <dd>{objective.successCondition}</dd>
        </div>
        <div>
          <dt>Proof needed</dt>
          <dd>{objective.proofRequirement}</dd>
        </div>
        <div>
          <dt>Evidence status</dt>
          <dd>{objective.evidenceStatus}</dd>
        </div>
      </dl>

      {capabilities.length ? (
        <div className="staffordObjectiveCapabilities">
          <span>Supported by</span>
          <div>
            {capabilities.map((capability) =>
              capability.currentRoute ? (
                <Link key={capability.id} href={capability.currentRoute}>
                  {capability.title}
                </Link>
              ) : (
                <span key={capability.id}>{capability.title}</span>
              ),
            )}
          </div>
        </div>
      ) : null}

      <details className="staffordObjectiveEvidence">
        <summary>Evidence sources</summary>
        <ul>
          {objective.sourceArtifacts.map((artifact) => (
            <li key={artifact}>{artifact}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function PlannedWorkspaceObjectives() {
  const { activeWorkspace, setActiveWorkspace } = useStaffordOsWorkspace();
  const plannedObjectives = getObjectivesForWorkspace(activeWorkspace.id);

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>What We Are Working Toward</h1>
          <p>This workspace is planned. No active objectives or live work data are connected here yet.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Planned only</strong>
        <p>
          These are future objective categories. They are not current operating truth and do not link to Stafford
          Media work.
        </p>
      </section>

      <div className="staffordObjectiveGrid">
        {plannedObjectives.map((objective) => (
          <ObjectiveCard key={objective.id} objective={objective} />
        ))}
      </div>

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

function StaffordMediaObjectives() {
  const { activeWorkspace } = useStaffordOsWorkspace();
  const activeObjectives = getActiveObjectivesForWorkspace(activeWorkspace.id);

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>What We Are Working Toward</h1>
          <p>These objectives explain what current Stafford Media actions should support.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Static foundation</strong>
        <p>
          Objective alignment is based on repository-backed structure. Live measurement and automatic objective
          tracking are not connected yet.
        </p>
      </section>

      <div className="staffordObjectiveGrid">
        {activeObjectives.map((objective) => (
          <ObjectiveCard key={objective.id} objective={objective} />
        ))}
      </div>
    </div>
  );
}

export function ObjectiveSurface() {
  const { activeWorkspace } = useStaffordOsWorkspace();

  if (activeWorkspace.id !== DEFAULT_STAFFORDOS_WORKSPACE_ID) {
    return <PlannedWorkspaceObjectives />;
  }

  return <StaffordMediaObjectives />;
}
