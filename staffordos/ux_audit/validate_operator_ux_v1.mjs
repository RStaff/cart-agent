import { readFileSync, writeFileSync, existsSync } from "node:fs";

const now = new Date().toISOString();

function read(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function readJson(path) {
  try {
    return JSON.parse(read(path));
  } catch {
    return null;
  }
}

const files = {
  commandPage: "staffordos/ui/operator-frontend/app/operator/command-center/page.tsx",
  commandSurface: "staffordos/ui/operator-frontend/components/operator/RossCommandCenterSurface.tsx",
  actionDashboard: "staffordos/ui/operator-frontend/components/operator/ActionFirstDashboard.tsx",
  unitPanel: "staffordos/ui/operator-frontend/components/operator/UnitWorkSnapshotPanel.tsx",
  leadQueue: "staffordos/ui/operator-frontend/components/operator/LeadQueue.tsx",
  dashboardSnapshot: "staffordos/clients/operator_dashboard_snapshot_v1.json",
  unitSnapshot: "staffordos/snapshots/unit_work_snapshot_v1.json",
  clientRegistry: "staffordos/clients/client_registry_v1.json"
};

const content = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, read(path)])
);

const dashboardSnapshot = readJson(files.dashboardSnapshot);
const unitSnapshot = readJson(files.unitSnapshot);
const clientRegistry = readJson(files.clientRegistry);

const findings = [];

function add(severity, area, finding, evidence, recommendation) {
  findings.push({ severity, area, finding, evidence, recommendation });
}

if (content.commandPage.includes("<RossCommandCenterSurface />") && content.commandPage.includes("<ActionFirstDashboard")) {
  add(
    "high",
    "command_center_composition",
    "Command center renders old artifact command center before the newer revenue/unit action surfaces.",
    "RossCommandCenterSurface appears before ActionFirstDashboard and UnitWorkSnapshotPanel.",
    "Either promote current unit/revenue action to the top or clearly label the old artifact section as Legacy Build Artifact."
  );
}

if (content.commandSurface.includes("npm test -- auth") || content.commandSurface.includes("OAuth blocker")) {
  add(
    "critical",
    "stale_truth",
    "Old command center surface may display stale Abando OAuth blocker and auth test command.",
    "RossCommandCenterSurface still renders activeDecision/currentTruth/exactNextCommand from old artifacts.",
    "Do not let stale build artifacts compete with current business/operator next actions."
  );
}

if (dashboardSnapshot?.primary_focus?.next_action?.instructions && unitSnapshot?.open_work?.length) {
  const revenueAction = dashboardSnapshot.primary_focus.next_action.instructions;
  const unitActions = unitSnapshot.open_work.map(u => u.next_action);
  const hasAlignment = unitActions.some(a => String(a).includes("Follow up")) && String(revenueAction).includes("Follow up");

  if (!hasAlignment) {
    add(
      "high",
      "action_alignment",
      "Dashboard primary focus and unit-of-work snapshot are not clearly aligned.",
      { revenueAction, unitActions },
      "Create a single primary_action contract consumed by the dashboard."
    );
  } else {
    add(
      "medium",
      "action_alignment",
      "Revenue dashboard and unit work currently agree on follow-up/close as the business action, but they render in separate sections.",
      { revenueAction, unitActions },
      "Merge into one primary action block instead of separate competing panels."
    );
  }
}

if (content.unitPanel.includes("sorted[0]") && !content.unitPanel.includes("priority_score")) {
  add(
    "medium",
    "unit_prioritization",
    "Unit panel picks the first sorted item by local UI priority rules, not a canonical priority score.",
    "getPriority() is defined inside UI component.",
    "Move priority decision into a unit snapshot builder/engine, not the UI."
  );
}

if (content.unitPanel.includes("backgroundUnits") && content.unitPanel.includes("<details")) {
  add(
    "low",
    "progressive_disclosure",
    "Background work is collapsed, which is good.",
    "UnitWorkSnapshotPanel uses details/summary for background work.",
    "Keep this pattern."
  );
}

if (content.leadQueue.includes("Lead Queue") && content.commandPage.includes("<LeadQueue />")) {
  add(
    "medium",
    "page_scope",
    "Command center includes lead queue after revenue/unit panels, making the page long and mixed-purpose.",
    "LeadQueue is embedded directly in command-center page.",
    "Command center should show lead summary and link to Lead Command, not full lead table."
  );
}

if (content.actionDashboard.includes("What should Ross do next?") && content.unitPanel.includes("What should Ross do from the unit system?")) {
  add(
    "high",
    "duplicate_primary_question",
    "Two sections ask versions of the same primary question.",
    "ActionFirstDashboard and UnitWorkSnapshotPanel both frame the next action.",
    "Create one unified primary action section driven by unit/revenue truth."
  );
}

if (!content.commandPage.includes("OperatorNav") && content.commandSurface.includes("OperatorNav")) {
  add(
    "medium",
    "navigation_ownership",
    "Navigation appears owned by nested components rather than a single page shell.",
    "OperatorNav is inside RossCommandCenterSurface, not clearly page-level.",
    "Create one OperatorShell so every page has consistent navigation and layout."
  );
}

const score = {
  architecture: 78,
  ux: Math.max(25, 65 - findings.filter(f => f.severity === "critical").length * 15 - findings.filter(f => f.severity === "high").length * 8 - findings.filter(f => f.severity === "medium").length * 3),
  evidence_quality: 72
};

const report = {
  schema: "staffordos.ux_integrity_report.v1",
  generated_at: now,
  page: "/operator/command-center",
  verdict: score.ux >= 70 ? "sufficient" : score.ux >= 50 ? "needs_revision" : "not_sufficient",
  score,
  findings,
  recommended_next_move: "Build a canonical primary_action_snapshot_v1 from dashboard + unit truth, then make command center top section consume that single source instead of old artifact truth."
};

writeFileSync("staffordos/ux_audit/output/operator_command_center_ux_integrity_v1.json", JSON.stringify(report, null, 2) + "\n");

console.log(JSON.stringify(report, null, 2));
