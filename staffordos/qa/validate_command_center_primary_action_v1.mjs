import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const now = new Date().toISOString();

mkdirSync("staffordos/qa/output", { recursive: true });

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function readJson(path, fallback = {}) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

const commandPage = read("staffordos/ui/operator-frontend/app/operator/command-center/page.tsx");
const operatorHome = read("staffordos/ui/operator-frontend/components/operator/OperatorHomeV1.tsx");
const snapshot = readJson("staffordos/snapshots/primary_action_snapshot_v1.json");
const preflight = readJson("staffordos/preflight/output/preflight_report_v1.json");
const findings = [];

function add(severity, area, finding, recommendation) {
  findings.push({ severity, area, finding, recommendation });
}

if (!commandPage.includes("OperatorHomeV1")) {
  add(
    "critical",
    "composition",
    "Command Center does not render OperatorHomeV1.",
    "Command Center must use OperatorHomeV1 as the front door."
  );
}

for (const banned of ["ActionFirstDashboard", "LeadQueue", "RossCommandCenterSurface", "PrimaryActionPanel"]) {
  if (commandPage.includes(banned)) {
    add(
      "high",
      "page_scope",
      `Command Center page still directly renders or imports ${banned}.`,
      "Keep Command Center to OperatorHomeV1 only; move old surfaces behind separate routes or collapsed diagnostics."
    );
  }
}

if (!operatorHome.includes("Prepare / execute action")) {
  add(
    "high",
    "cta",
    "Operator Home does not expose a clear prepare/execute CTA.",
    "Add one clear button for the resolved primary action."
  );
}

if (!operatorHome.includes("operatorHomeProofRow")) {
  add(
    "medium",
    "proof_badges",
    "Operator Home does not expose the three proof badges.",
    "Show Preflight, QA Gate, and Confidence proof badges."
  );
}

if (!operatorHome.includes("<details")) {
  add(
    "medium",
    "progressive_disclosure",
    "Supporting system context is not collapsed.",
    "Keep evidence, risks, and supporting work collapsed by default."
  );
}

if (!snapshot.primary_action?.action_label || !snapshot.primary_action?.next_step) {
  add(
    "critical",
    "snapshot_contract",
    "Primary action snapshot is missing action_label or next_step.",
    "Fix resolve_primary_action_v1.mjs before UI work."
  );
}

if (String(preflight.status || "").toUpperCase() !== "GO") {
  add(
    "critical",
    "preflight",
    "Preflight status is not GO.",
    "Run inventory, validator map, and preflight before completion."
  );
}

const penalty = findings.reduce((sum, f) => {
  if (f.severity === "critical") return sum + 25;
  if (f.severity === "high") return sum + 12;
  if (f.severity === "medium") return sum + 6;
  return sum + 2;
}, 0);

const score = Math.max(0, Math.min(100, 100 - penalty));

const report = {
  schema: "staffordos.command_center_qa_gate.v1",
  generated_at: now,
  page: "/operator/command-center",
  version: "operator_home_v1",
  verdict: score >= 80 ? "pass" : score >= 65 ? "partial" : "fail",
  score,
  findings,
  required_next_move:
    findings.length === 0
      ? "Proceed to CTA execution wiring or Loop D review."
      : "Resolve QA findings before CTA execution.",
  snapshot_primary_action: snapshot.primary_action || null
};

writeFileSync(
  "staffordos/qa/output/command_center_primary_action_qa_v1.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));

if (report.verdict !== "pass") {
  process.exit(1);
}
