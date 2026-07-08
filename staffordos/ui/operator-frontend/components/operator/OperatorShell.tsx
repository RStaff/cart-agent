"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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
};

type OperatorShellProps = {
  children: ReactNode;
  status: ShellStatus;
};

const SIDEBAR_ITEMS: NavItem[] = [
  { href: "/operator", label: "Operator Home", note: "Daily operating surface" },
  { href: "/operator/command-center", label: "Executive", note: "Company command center" },
  { href: "/operator/campaigns", label: "Marketing", note: "Campaign visibility" },
  { href: "/operator/campaigns", label: "Campaigns", note: "Campaign registry and coverage" },
  { href: "/operator/leads", label: "Sales", note: "Lead command center" },
  { href: "/operator/leads", label: "Leads", note: "Lead queue and readiness" },
  { label: "Relationships", note: "Planned — Coming Soon", planned: true },
  { label: "Delivery", note: "Planned — Coming Soon", planned: true },
  { label: "Customer Success", note: "Planned — Coming Soon", planned: true },
  { href: "/operator/revenue-command", label: "Finance", note: "Revenue command center" },
  { label: "Engineering", note: "Planned — Coming Soon", planned: true },
  { label: "AI Operations", note: "Planned — Coming Soon", planned: true },
  { label: "Validators", note: "Planned — Coming Soon", planned: true },
  { label: "Settings", note: "Planned — Coming Soon", planned: true },
];

const QUICK_ACTIONS = [
  { href: "/operator", label: "Home" },
  { href: "/operator/command-center", label: "Executive" },
  { href: "/operator/campaigns", label: "Campaigns" },
  { href: "/operator/leads", label: "Leads" },
  { href: "/operator/revenue-command", label: "Revenue" },
  { href: "/operator/execution-log", label: "Execution Log" },
  { href: "/operator/system-map", label: "System Map" },
] as const;

function isActive(pathname: string, href?: string) {
  if (!href) return false;
  if (href === "/operator") return pathname === "/operator";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function breadcrumbFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length <= 1) {
    return ["Operator Home"];
  }

  const segments = ["Operator"];
  for (const part of parts.slice(1)) {
    if (part === "command-center") segments.push("Executive");
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
            {SIDEBAR_ITEMS.map((item) =>
              item.planned || !item.href ? (
                <div key={item.label} className="operatorShellNavItem operatorShellNavItemPlanned">
                  <span className="operatorShellNavLabel">{item.label}</span>
                  <span className="operatorShellNavNote">{item.note}</span>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`operatorShellNavItem${isActive(pathname, item.href) ? " operatorShellNavItemActive" : ""}`}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                >
                  <span className="operatorShellNavLabel">{item.label}</span>
                  <span className="operatorShellNavNote">{item.note}</span>
                </Link>
              )
            )}
          </nav>

          <div className="operatorShellSidebarFooter">
            <span>Quick actions</span>
            <div className="operatorShellQuickActionStack">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.href} href={action.href} className="operatorShellQuickActionChip">
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className="operatorShellMain">
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
              <span className={`statusPill ${statusClass(status.validationStatus)}`}>{status.validationStatus}</span>
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
            <strong>{status.validationStatus}</strong>
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
