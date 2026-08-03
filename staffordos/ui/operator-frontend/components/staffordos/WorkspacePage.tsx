"use client";

import { NextActionCard } from "./NextActionCard";
import type { ReactNode } from "react";
import type { StaffordOsSection } from "../../lib/staffordos/workspaces";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  WORKSPACE_AVAILABILITY_LABELS,
} from "../../lib/staffordos/workspaceRegistry";
import { useStaffordOsWorkspace } from "./WorkspaceContext";

type WorkspacePageProps = {
  section: StaffordOsSection;
  children?: ReactNode;
};

const FOUNDATION_STATES = [
  "Evidence before action",
  "AI-assisted, owner-approved",
  "Governed by default",
  "Reusable knowledge output",
] as const;

function PlannedWorkspaceSummary() {
  const { activeWorkspace, setActiveWorkspace } = useStaffordOsWorkspace();
  const isProfessional = activeWorkspace.id === "professional";
  const plannedItems = activeWorkspace.modeLabels || activeWorkspace.plannedModes || activeWorkspace.futureCapabilityGroups || [];

  return (
    <section className="staffordPlannedWorkspace">
      <div>
        <span className="staffordEyebrow">{isProfessional ? "Professional foundation" : "Planned workspace"}</span>
        <h2>{isProfessional ? "Professional modes" : `${activeWorkspace.name} is planned`}</h2>
        <p>
          {isProfessional
            ? "Professional supports finding work now and succeeding at work later. This section is not connected to Professional records yet."
            : "This workspace is planned. Stafford Media is the part of StaffordOS you can use today."}
        </p>
      </div>

      {plannedItems.length ? (
        <div className="staffordPlannedList" aria-label={`${activeWorkspace.name} planned areas`}>
          {plannedItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}

      <button type="button" className="staffordReturnWorkspace" onClick={() => setActiveWorkspace(DEFAULT_STAFFORDOS_WORKSPACE_ID)}>
        Return to Stafford Media
      </button>
    </section>
  );
}

export function WorkspacePage({ section, children }: WorkspacePageProps) {
  const { activeWorkspace } = useStaffordOsWorkspace();
  const isStaffordMedia = activeWorkspace.id === DEFAULT_STAFFORDOS_WORKSPACE_ID;
  const isProfessional = activeWorkspace.id === "professional";
  const heading = section.key === "home" ? activeWorkspace.name : section.label;
  const intro = isStaffordMedia
    ? section.key === "home"
      ? "What StaffordOS can help with today."
      : section.operatingQuestion
    : isProfessional
      ? "Professional has a read-only foundation. Live Professional records are not connected to this section yet."
      : "This workspace is planned. Stafford Media is the part of StaffordOS you can use today.";
  const statusLabel = isStaffordMedia ? "Current operating workspace" : activeWorkspace.currentAuthorityStatus;

  return (
    <div className="staffordWorkspace">
      <section className="staffordWorkspaceHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>{heading}</h1>
          <p>{intro}</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{statusLabel}</strong>
        </div>
      </section>

      {isStaffordMedia ? (
        <>
          <NextActionCard
            action={`${section.label} action placeholder`}
            whyNow={section.frame}
            evidence="Evidence placeholder"
            expectedValue="Value placeholder"
            risk="Risk placeholder"
            confidence="Confidence placeholder"
            governance="Authority placeholder"
            deadline="Deadline placeholder"
            proof="Proof placeholder"
          />

          <section className="staffordWorkspaceGrid" aria-label={`${section.label} foundation areas`}>
            {FOUNDATION_STATES.map((state) => (
              <article key={state} className="staffordWorkspaceTile">
                <span>{state}</span>
                <strong>Placeholder</strong>
              </article>
            ))}
          </section>

          {children}
        </>
      ) : (
        <PlannedWorkspaceSummary />
      )}
    </div>
  );
}
