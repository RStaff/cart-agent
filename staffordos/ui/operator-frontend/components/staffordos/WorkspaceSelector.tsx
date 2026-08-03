"use client";

import { useStaffordOsWorkspace } from "./WorkspaceContext";
import { DEFAULT_STAFFORDOS_WORKSPACE_ID, WORKSPACE_AVAILABILITY_LABELS } from "../../lib/staffordos/workspaceRegistry";

export function WorkspaceSelector() {
  const { activeWorkspace, availableWorkspaces, setActiveWorkspace } = useStaffordOsWorkspace();
  const isStaffordMedia = activeWorkspace.id === DEFAULT_STAFFORDOS_WORKSPACE_ID;
  const isProfessional = activeWorkspace.id === "professional";

  return (
    <section className="staffordWorkspaceSelector" aria-label="Choose current workspace">
      <div className="staffordWorkspaceSelectorHeader">
        <span>Current workspace</span>
        <strong>{activeWorkspace.name}</strong>
      </div>

      <div className="staffordWorkspaceChoices">
        {availableWorkspaces.map((workspace) => (
          <button
            key={workspace.id}
            type="button"
            className={`staffordWorkspaceChoice${activeWorkspace.id === workspace.id ? " staffordWorkspaceChoiceActive" : ""}`}
            onClick={() => setActiveWorkspace(workspace.id)}
            aria-pressed={activeWorkspace.id === workspace.id}
          >
            <span>{workspace.name}</span>
            <small>{WORKSPACE_AVAILABILITY_LABELS[workspace.availability]}</small>
          </button>
        ))}
      </div>

      <p>
        {isStaffordMedia
          ? "Stafford Media is the part of StaffordOS you can use today."
          : isProfessional
            ? "Professional has a read-only Career foundation. This only changes what /os shows."
            : "This workspace is planned. Stafford Media is the part of StaffordOS you can use today."}
      </p>
    </section>
  );
}
