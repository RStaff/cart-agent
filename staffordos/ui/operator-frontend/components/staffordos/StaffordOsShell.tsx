"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { STAFFORDOS_SECTIONS } from "../../lib/staffordos/workspaces";
import { DEFAULT_STAFFORDOS_WORKSPACE_ID } from "../../lib/staffordos/workspaceRegistry";
import { StaffordOsWorkspaceProvider, useStaffordOsWorkspace } from "./WorkspaceContext";
import { WorkspaceSelector } from "./WorkspaceSelector";

type StaffordOsShellProps = {
  children: ReactNode;
};

function isActive(pathname: string, href: string) {
  if (href === "/os") return pathname === "/os";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function StaffordOsShellFrame({ children }: StaffordOsShellProps) {
  const pathname = usePathname();
  const { activeWorkspace } = useStaffordOsWorkspace();
  const capabilityNavLabel =
    activeWorkspace.id === DEFAULT_STAFFORDOS_WORKSPACE_ID ? "Map of current working pages" : "Planned capability overview";

  return (
    <div className="staffordOsShell">
      <aside className="staffordOsSidebar">
        <div className="staffordOsBrand">
          <span>StaffordOS</span>
          <strong>Operating System</strong>
        </div>

        <WorkspaceSelector />

        <nav className="staffordOsNav" aria-label="StaffordOS workspaces">
          {STAFFORDOS_SECTIONS.map((section) => (
            <Link
              key={section.key}
              href={section.href}
              className={`staffordOsNavItem${isActive(pathname, section.href) ? " staffordOsNavItemActive" : ""}`}
              aria-current={isActive(pathname, section.href) ? "page" : undefined}
            >
              <span>{section.label}</span>
              <small>{section.purpose}</small>
            </Link>
          ))}
        </nav>

        <Link
          href="/os/capabilities"
          className={`staffordOsCapabilityNav${isActive(pathname, "/os/capabilities") ? " staffordOsCapabilityNavActive" : ""}`}
          aria-current={isActive(pathname, "/os/capabilities") ? "page" : undefined}
        >
          <span>What StaffordOS Can Do</span>
          <small>{capabilityNavLabel}</small>
        </Link>

        <Link
          href="/os/objectives"
          className={`staffordOsCapabilityNav${isActive(pathname, "/os/objectives") ? " staffordOsCapabilityNavActive" : ""}`}
          aria-current={isActive(pathname, "/os/objectives") ? "page" : undefined}
        >
          <span>What We Are Working Toward</span>
          <small>Objective alignment</small>
        </Link>

        <Link
          href="/os/evidence"
          className={`staffordOsCapabilityNav${isActive(pathname, "/os/evidence") ? " staffordOsCapabilityNavActive" : ""}`}
          aria-current={isActive(pathname, "/os/evidence") ? "page" : undefined}
        >
          <span>Why We Believe This</span>
          <small>Evidence behind current actions</small>
        </Link>
      </aside>

      <main className="staffordOsMain">
        <header className="staffordOsCommandBar">
          <div className="staffordOsCommandQuestion">
            <span>Operating question</span>
            <strong>What should I do next?</strong>
          </div>

          <label className="staffordOsSearch">
            <span>Global Search</span>
            <input readOnly value="" placeholder="Search evidence, work, people, decisions" aria-label="Global search" />
          </label>

          <div className="staffordOsNotifications" aria-label="Notifications">
            <span>Notifications</span>
            <strong>Placeholder</strong>
          </div>
        </header>

        <div className="staffordOsContent">{children}</div>
      </main>
    </div>
  );
}

export function StaffordOsShell({ children }: StaffordOsShellProps) {
  return (
    <StaffordOsWorkspaceProvider>
      <StaffordOsShellFrame>{children}</StaffordOsShellFrame>
    </StaffordOsWorkspaceProvider>
  );
}
