"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { STAFFORDOS_SECTIONS } from "../../lib/staffordos/workspaces";

type StaffordOsShellProps = {
  children: ReactNode;
};

function isActive(pathname: string, href: string) {
  if (href === "/os") return pathname === "/os";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StaffordOsShell({ children }: StaffordOsShellProps) {
  const pathname = usePathname();

  return (
    <div className="staffordOsShell">
      <aside className="staffordOsSidebar">
        <div className="staffordOsBrand">
          <span>StaffordOS</span>
          <strong>Operating System</strong>
        </div>

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
          <small>Map of current working pages</small>
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
