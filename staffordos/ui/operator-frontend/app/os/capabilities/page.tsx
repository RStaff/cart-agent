"use client";

import { CapabilityLinkPanel } from "../../../components/staffordos/CapabilityLinkPanel";
import { STAFFORDOS_SECTIONS } from "../../../lib/staffordos/workspaces";
import { capabilitiesForWorkspaceSection } from "../../../lib/staffordos/capabilities";
import { DEFAULT_STAFFORDOS_WORKSPACE_ID, WORKSPACE_AVAILABILITY_LABELS } from "../../../lib/staffordos/workspaceRegistry";
import { useStaffordOsWorkspace } from "../../../components/staffordos/WorkspaceContext";

export default function StaffordOsCapabilitiesPage() {
  const { activeWorkspace, setActiveWorkspace } = useStaffordOsWorkspace();
  const isStaffordMedia = activeWorkspace.id === DEFAULT_STAFFORDOS_WORKSPACE_ID;

  return (
    <div className="staffordCapabilityPage">
      <section className="staffordWorkspaceHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>What StaffordOS Can Help With</h1>
          <p>
            {isStaffordMedia
              ? "Start here when you want to know which current StaffordOS page can help with a decision, customer, money, work, evidence, or operating check."
              : "This workspace is planned. Stafford Media is the part of StaffordOS you can use today."}
          </p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{isStaffordMedia ? "Read-only links to current pages" : "Planned overview only"}</strong>
        </div>
      </section>

      <section className="staffordCapabilityNote">
        <strong>No work is moved from this page.</strong>
        <p>
          This map points to existing working pages. It does not copy their data, start actions, contact customers,
          change payments, or change ShopiFixer behavior.
        </p>
        {!isStaffordMedia ? (
          <button
            type="button"
            className="staffordReturnWorkspace"
            onClick={() => setActiveWorkspace(DEFAULT_STAFFORDOS_WORKSPACE_ID)}
          >
            Return to Stafford Media
          </button>
        ) : null}
      </section>

      {STAFFORDOS_SECTIONS.map((section) => {
        const sectionCapabilities = capabilitiesForWorkspaceSection(activeWorkspace.id, section.key);
        if (!sectionCapabilities.length) return null;

        return (
          <CapabilityLinkPanel
            key={section.key}
            workspaceId={activeWorkspace.id}
            sectionKey={section.key}
            heading={section.label}
            intro={section.operatingQuestion}
          />
        );
      })}
    </div>
  );
}
