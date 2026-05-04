import { existsSync, readFileSync, writeFileSync } from "node:fs";

const now = new Date().toISOString();

function read(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const files = {
  page: "staffordos/ui/operator-frontend/app/operator/command-center/page.tsx",
  primaryPanel: "staffordos/ui/operator-frontend/components/operator/PrimaryActionPanel.tsx",
  unitPanel: "staffordos/ui/operator-frontend/components/operator/UnitWorkSnapshotPanel.tsx",
  actionDashboard: "staffordos/ui/operator-frontend/components/operator/ActionFirstDashboard.tsx",
  loader: "staffordos/ui/operator-frontend/lib/operator/loadPrimaryActionSnapshot.ts",
  snapshot: "staffordos/snapshots/primary_action_snapshot_v1.json",
  uxReport: "staffordos/ux_audit/output/operator_command_center_ux_integrity_v1.json"
};

const content = Object.fromEntries(Object.entries(files).map(([k, p]) => [k, read(p)]));
const snapshot = json(files.snapshot);

const findings = [];

function add(severity, area, finding, recommendation) {
  findings.push({ severity, area, finding, recommendation });
}

if (!content.page.includes("PrimaryActionPanel")) {
  add("critical", "primary_action", "Command Center does not render PrimaryActionPanel.", "Render canonical PrimaryActionPanel at top.");
}

if (!content.page.includes("loadPrimaryActionSnapshot")) {
  add("critical", "snapshot_binding", "Command Center does not load primary_action_snapshot_v1.", "Bind top action to primary_action_snapshot_v1.");
}

const renderStart = content.page.indexOf("return (");
const renderBody = renderStart >= 0 ? content.page.slice(renderStart) : content.page;
const primaryRenderIndex = renderBody.indexOf("<PrimaryActionPanel");
const legacyRenderIndex = renderBody.indexOf("<RossCommandCenterSurface");

if (primaryRenderIndex < 0) {
  add("critical", "visual_hierarchy", "PrimaryActionPanel is not rendered in the Command Center return tree.", "Render PrimaryActionPanel first.");
} else if (legacyRenderIndex >= 0 && primaryRenderIndex > legacyRenderIndex) {
  add("high", "visual_hierarchy", "Legacy RossCommandCenterSurface renders before canonical primary action.", "Primary action must render before legacy artifact panels.");
}

if (content.page.includes("<ActionFirstDashboard")) {
  add("high", "duplicate_action", "Old ActionFirstDashboard is still rendered and asks a duplicate 'what should Ross do next?' question.", "Remove or demote ActionFirstDashboard from Command Center.");
}

if (content.page.includes("<UnitWorkSnapshotPanel") && !content.page.includes("Supporting Unit Work")) {
  add("medium", "duplicate_unit_question", "UnitWorkSnapshotPanel still appears on Command Center and can compete with primary action.", "Show unit work only as collapsed supporting context or move to separate page.");
}

if (content.page.includes("<LeadQueue")) {
  add("high", "page_scope", "Full LeadQueue is still embedded on Command Center.", "Replace with lead summary/link; keep full table on /operator/leads.");
}

if (content.primaryPanel.includes("React components must not invent") || content.primaryPanel.includes("priority_score")) {
  // acceptable
} else {
  add("medium", "priority_display", "PrimaryActionPanel may not clearly expose canonical priority.", "Display priority, confidence, urgency, owner, evidence, and risk.");
}

if (!snapshot.primary_action?.action_label || !snapshot.primary_action?.next_step) {
  add("critical", "snapshot_contract", "Primary action snapshot is missing action_label or next_step.", "Fix resolver output before UI work.");
}

if ((snapshot.primary_action?.confidence || 0) < 0.9 && !String(snapshot.primary_action?.confidence_band || "").includes("human")) {
  add("medium", "confidence_gate", "Confidence below auto-execution threshold but human validation is not clearly indicated.", "Show human validation required when confidence < 0.9.");
}

const severityPenalty = findings.reduce((sum, f) => {
  if (f.severity === "critical") return sum + 20;
  if (f.severity === "high") return sum + 12;
  if (f.severity === "medium") return sum + 6;
  return sum + 2;
}, 0);

const score = Math.max(0, Math.min(100, 100 - severityPenalty));

const report = {
  schema: "staffordos.command_center_qa_gate.v1",
  generated_at: now,
  page: "/operator/command-center",
  verdict: score >= 80 ? "pass" : score >= 65 ? "partial" : "fail",
  score,
  findings,
  required_next_move:
    findings.some(f => f.area === "duplicate_action" || f.area === "page_scope")
      ? "Remove duplicate ActionFirstDashboard and full LeadQueue from Command Center; keep canonical PrimaryActionPanel as the only top decision."
      : "Proceed to visual polish and revalidation.",
  snapshot_primary_action: snapshot.primary_action
};

writeFileSync(
  "staffordos/qa/output/command_center_primary_action_qa_v1.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));
