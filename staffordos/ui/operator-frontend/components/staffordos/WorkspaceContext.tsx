"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  STAFFORDOS_WORKSPACES,
  workspaceById,
  type StaffordOsWorkspace,
  type StaffordOsWorkspaceId,
} from "../../lib/staffordos/workspaceRegistry";

type StaffordOsWorkspaceContextValue = {
  activeWorkspaceId: StaffordOsWorkspaceId;
  activeWorkspace: StaffordOsWorkspace;
  availableWorkspaces: StaffordOsWorkspace[];
  setActiveWorkspace: (workspaceId: StaffordOsWorkspaceId) => void;
};

const StaffordOsWorkspaceContext = createContext<StaffordOsWorkspaceContextValue | null>(null);

export function StaffordOsWorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<StaffordOsWorkspaceId>(DEFAULT_STAFFORDOS_WORKSPACE_ID);

  const value = useMemo<StaffordOsWorkspaceContextValue>(() => {
    return {
      activeWorkspaceId,
      activeWorkspace: workspaceById(activeWorkspaceId),
      availableWorkspaces: STAFFORDOS_WORKSPACES,
      // This context controls the current /os presentation only. It is not an authorization boundary.
      setActiveWorkspace: (workspaceId) => setActiveWorkspaceId(workspaceById(workspaceId).id),
    };
  }, [activeWorkspaceId]);

  return <StaffordOsWorkspaceContext.Provider value={value}>{children}</StaffordOsWorkspaceContext.Provider>;
}

export function useStaffordOsWorkspace() {
  const context = useContext(StaffordOsWorkspaceContext);
  if (!context) {
    throw new Error("useStaffordOsWorkspace must be used inside StaffordOsWorkspaceProvider");
  }
  return context;
}
