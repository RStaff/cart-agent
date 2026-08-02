"use client";

import Link from "next/link";
import { NextActionCard } from "./NextActionCard";
import { useStaffordOsWorkspace } from "./WorkspaceContext";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  WORKSPACE_AVAILABILITY_LABELS,
} from "../../lib/staffordos/workspaceRegistry";
import { homePresentationForWorkspace, type HomeActionPresentation } from "../../lib/staffordos/homePresentation";

function StatusNote({ label, children }: { label: string; children: string }) {
  return (
    <article className="staffordHomeStatusNote">
      <span>{label}</span>
      <strong>{children}</strong>
    </article>
  );
}

function SupportingActionCard({ action }: { action: HomeActionPresentation }) {
  return (
    <article className="staffordHomeSupportCard">
      <div>
        <span>{action.availabilityLabel}</span>
        <h3>{action.title}</h3>
        <p>{action.whyNow}</p>
      </div>
      {action.continueHref ? (
        <Link href={action.continueHref} className="staffordHomeActionLink">
          Continue
        </Link>
      ) : null}
    </article>
  );
}

function PlannedHome() {
  const { activeWorkspace, setActiveWorkspace } = useStaffordOsWorkspace();
  const presentation = homePresentationForWorkspace(activeWorkspace.id);

  return (
    <div className="staffordUnifiedHome">
      <section className="staffordHomeHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>{presentation.heading}</h1>
          <p>{presentation.summary}</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordHomePlannedPanel">
        <div>
          <span className="staffordEyebrow">Planned</span>
          <h2>What this workspace will support</h2>
          <p>{presentation.limitationNote}</p>
        </div>

        <div className="staffordHomePlannedGrid">
          {presentation.plannedCapabilities.map((capability) => (
            <article key={capability.id} className="staffordHomePlannedCard">
              <h3>{capability.title}</h3>
              <p>{capability.summary}</p>
            </article>
          ))}
        </div>

        <div className="staffordHomeTransparency">
          <StatusNote label="Connected today">{presentation.evidenceNote}</StatusNote>
          <StatusNote label="Privacy">{presentation.authorityNote}</StatusNote>
        </div>

        <button
          type="button"
          className="staffordReturnWorkspace"
          onClick={() => setActiveWorkspace(DEFAULT_STAFFORDOS_WORKSPACE_ID)}
        >
          {presentation.returnWorkspaceLabel || "Return to Stafford Media"}
        </button>
      </section>
    </div>
  );
}

function StaffordMediaHome() {
  const { activeWorkspace } = useStaffordOsWorkspace();
  const presentation = homePresentationForWorkspace(activeWorkspace.id);
  const primaryAction = presentation.primaryAction;

  return (
    <div className="staffordUnifiedHome">
      <section className="staffordHomeHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>{presentation.heading}</h1>
          <p>{presentation.summary}</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordHomeAttention">
        <div className="staffordHomeAttentionCopy">
          <span className="staffordEyebrow">Start here</span>
          <h2>Look here first</h2>
          <p>{presentation.authorityNote}</p>
        </div>

        {primaryAction ? (
          <NextActionCard
            headerLabel="What to do"
            headerStatus="Available now"
            action={primaryAction.whatToDo}
            whyNow={primaryAction.whyNow}
            expectedResult={primaryAction.expectedResult}
            evidence={primaryAction.evidence}
            risk={primaryAction.risk}
            completionProof={primaryAction.completionProof}
            supports={primaryAction.supportedObjectiveTitle}
            continueHref={primaryAction.continueHref}
            continueLabel={primaryAction.continueLabel}
            transparencyNote={
              primaryAction.objectiveAlignmentNote ||
              "This is a static starting point based on the current StaffordOS structure."
            }
          />
        ) : null}
      </section>

      <section className="staffordHomeSupport">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Other useful places</span>
          <h2>Review next if this is where the work is</h2>
          <p>These links open the existing Stafford Media pages. They do not duplicate their data or actions.</p>
        </div>
        <div className="staffordHomeSupportGrid">
          {presentation.supportingActions.map((action) => (
            <SupportingActionCard key={action.id} action={action} />
          ))}
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Action list</strong>
        <p>Review the current static actions and the goal, decision, and evidence behind each one.</p>
        <Link href="/os/actions" className="staffordHomeActionLink">
          What To Do Next
        </Link>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Evidence behind actions</strong>
        <p>Current actions are supported by repository-backed evidence before any proof is claimed.</p>
        <Link href="/os/evidence" className="staffordHomeActionLink">
          Why We Believe This
        </Link>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Decision memory</strong>
        <p>Review the architecture choices behind this operating surface before changing direction.</p>
        <Link href="/os/decisions" className="staffordHomeActionLink">
          Decisions and Why We Made Them
        </Link>
      </section>

      <section className="staffordHomeTransparency" aria-label="What is real today">
        <StatusNote label="Available now">{presentation.evidenceNote}</StatusNote>
        <StatusNote label="Not connected yet">{presentation.limitationNote}</StatusNote>
      </section>
    </div>
  );
}

export function UnifiedHome() {
  const { activeWorkspace } = useStaffordOsWorkspace();

  if (activeWorkspace.id !== DEFAULT_STAFFORDOS_WORKSPACE_ID) {
    return <PlannedHome />;
  }

  return <StaffordMediaHome />;
}
