"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  validationExplanation,
  validationSummary,
} from "../../lib/operator/operatorValidationPresentation.mjs";

type ShellStatus = {
  architectureVersion: string;
  validationStatus: string;
  campaignRegistryStatus: string;
  campaignAttributionStatus: string;
  systemHealthStatus: string;
};

type NavItem = {
  href?: string;
  label: string;
  note: string;
  planned?: boolean;
  subtle?: boolean;
};

type OperatorShellProps = {
  children: ReactNode;
  status: ShellStatus;
};

type NavigationGroup = {
  label: "Today" | "Business" | "System";
  items: NavItem[];
};

const NAVIGATION_GROUPS: NavigationGroup[] = [
  { label: "Today", items: [{ href: "/operator/cockpit", label: "StaffordOS Cockpit", note: "Your daily co-operator" }] },
  {
    label: "Business",
    items: [
      { href: "/operator/products", label: "Products", note: "Product overview" },
      { href: "/operator/careeros/beta-users", label: "CareerOS Operations", note: "Beta operations" },
      { href: "/operator/careeros/missions/CAREEROS_V1_P1_OUTCOME_TRACKING_AND_DAILY_TRIAGE", label: "CareerOS Missions", note: "Mission observation" },
      { href: "/operator/command-center", label: "ShopiFixer Command Center", note: "ShopiFixer delivery" },
      { href: "/operator/campaigns", label: "Marketing", note: "Campaigns" },
      { href: "/operator/leads", label: "Sales", note: "Leads" },
      { href: "/operator/revenue-command", label: "Finance", note: "Revenue" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/operator/system-map", label: "Health", note: "System map and status" },
      { href: "/operator/execution-log", label: "Audit", note: "Execution history" },
    ],
  },
];

function isActive(pathname: string, href?: string) {
  if (!href) return false;
  return pathname === href;
}

function breadcrumbFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length <= 1) {
    return ["Operator Home"];
  }

  const segments = ["Operator"];
  for (const part of parts.slice(1)) {
    if (part === "command-center") segments.push("Executive");
    else if (part === "careeros") segments.push("CareerOS");
    else if (part === "beta-users") segments.push("Beta Users");
    else if (part === "campaigns") segments.push("Campaigns");
    else if (part === "leads") segments.push("Leads");
    else if (part === "revenue-command") segments.push("Finance");
    else if (part === "execution-log") segments.push("Execution Log");
    else if (part === "system-map") segments.push("System Map");
    else if (part === "relationship") segments.push("Relationships");
    else if (/^[a-z0-9_-]+$/i.test(part)) segments.push(part.replace(/[-_]/g, " "));
  }

  return segments;
}

function statusClass(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("missing") || normalized.includes("not yet")) return "statusPillMissing";
  if (normalized.includes("partial") || normalized.includes("limited")) return "statusPillPartial";
  if (normalized.includes("degraded") || normalized.includes("invalid") || normalized.includes("failed")) {
    return "statusPillDegraded";
  }
  if (normalized.includes("ready") || normalized.includes("implemented") || normalized.includes("live")) {
    return "statusPillReady";
  }
  return "statusPill";
}

export function OperatorShell({ children, status }: OperatorShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const breadcrumbs = breadcrumbFromPath(pathname);

  return (
    <div className="operatorShell">
      <aside className="operatorShellSidebar">
        <div className="operatorShellSidebarInner">
          <div className="operatorShellBrand">
            <p className="operatorShellBrandEyebrow">StaffordOS</p>
            <strong>Operator Shell</strong>
            <span>Version 1</span>
          </div>

          <nav className="operatorShellNav" aria-label="Operator navigation">
            {NAVIGATION_GROUPS.map((group) => (
              <div key={group.label} className="operatorShellNavGroup">
                <span className="operatorShellNavGroupLabel operatorShellNavNote">{group.label}</span>
                {group.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href!}
                    className={`operatorShellNavItem${isActive(pathname, item.href) ? " operatorShellNavItemActive" : ""}`}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  >
                    <span className="operatorShellNavLabel">{item.label}</span>
                    <span className="operatorShellNavNote">{item.note}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <div className="operatorShellMain">
        <div className="operatorShellMobileNav">
          <button
            type="button"
            className="operatorShellMobileNavToggle"
            aria-expanded={mobileNavOpen}
            aria-controls="operator-mobile-navigation"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <span>Operator navigation</span>
            <span aria-hidden="true">{mobileNavOpen ? "−" : "+"}</span>
          </button>
          <nav
            id="operator-mobile-navigation"
            className={`operatorShellMobileNavPanel${mobileNavOpen ? " operatorShellMobileNavPanelOpen" : ""}`}
            aria-label="Operator navigation"
            hidden={!mobileNavOpen}
          >
            {NAVIGATION_GROUPS.map((group) => (
              <div key={`mobile-${group.label}`} className="operatorShellNavGroup">
                <span className="operatorShellNavGroupLabel operatorShellNavNote">{group.label}</span>
                {group.items.map((item) => (
                  <Link
                    key={`mobile-${item.label}`}
                    href={item.href!}
                    className={`operatorShellNavItem${isActive(pathname, item.href) ? " operatorShellNavItemActive" : ""}`}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <span className="operatorShellNavLabel">{item.label}</span>
                    <span className="operatorShellNavNote">{item.note}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <header className="operatorShellHeader">
          <div className="operatorShellHeaderPrimary">
            <div>
              <p className="operatorShellHeaderLabel">Current workspace</p>
              <strong>StaffordOS Operator Workspace</strong>
            </div>
            <div>
              <p className="operatorShellHeaderLabel">Current operator</p>
              <strong>Ross</strong>
            </div>
            <label className="operatorShellSearch">
              <span className="operatorShellHeaderLabel">Search</span>
              <input
                type="text"
                value=""
                readOnly
                placeholder="Search operator state"
                aria-label="Search operator state"
              />
            </label>
            <div>
              <p className="operatorShellHeaderLabel">Validation status</p>
              <details className="operatorShellValidationDetails">
                <summary>
                  <span className={`statusPill ${statusClass(status.validationStatus)}`}>{validationSummary(status.validationStatus)}</span>
                </summary>
                <p className="operatorShellValidationExplanation">{validationExplanation(status.validationStatus)}</p>
                <div className="operatorShellValidationDetailText">{status.validationStatus}</div>
              </details>
            </div>
            <div>
              <p className="operatorShellHeaderLabel">Notifications</p>
              <span className="statusPill statusPillMissing">Not Yet Implemented</span>
            </div>
          </div>
        </header>

        <div className="operatorShellBreadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((item, index) => (
            <span key={`${item}-${index}`} className="operatorShellBreadcrumbItem">
              {item}
            </span>
          ))}
        </div>

        <section className="operatorShellStatusBar" aria-label="Global status">
          <div className="operatorShellStatusItem">
            <span className="operatorShellStatusLabel">Architecture Version</span>
            <strong>{status.architectureVersion}</strong>
          </div>
              <div className="operatorShellStatusItem">
                <span className="operatorShellStatusLabel">Validation Status</span>
                <strong>{validationSummary(status.validationStatus)}</strong>
              </div>
          <div className="operatorShellStatusItem">
            <span className="operatorShellStatusLabel">Campaign Registry</span>
            <strong>{status.campaignRegistryStatus}</strong>
          </div>
          <div className="operatorShellStatusItem">
            <span className="operatorShellStatusLabel">Campaign Attribution</span>
            <strong>{status.campaignAttributionStatus}</strong>
          </div>
          <div className="operatorShellStatusItem">
            <span className="operatorShellStatusLabel">System Health</span>
            <strong>{status.systemHealthStatus}</strong>
          </div>
        </section>

        <div className="operatorShellContent">{children}</div>
      </div>
    </div>
  );
}
