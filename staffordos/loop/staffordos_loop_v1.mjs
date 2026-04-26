import fs from "node:fs";
import { execSync } from "node:child_process";

const sh = (cmd) => {
  try { return execSync(cmd, { encoding: "utf8" }).trim(); }
  catch (e) { return ""; }
};

const request = process.argv.slice(2).join(" ").trim() || "No request supplied";
const branch = sh("git branch --show-current");
const status = sh("git status --short");
const timestamp = new Date().toISOString();

function exists(path) {
  return fs.existsSync(path);
}

function classify(input) {
  const t = input.toLowerCase();

  if (t.includes("shopifixer") || t.includes("surface") || t.includes("cta") || t.includes("page")) {
    return "PRODUCT_SURFACE_CHANGE";
  }

  if (t.includes("staffordos") || t.includes("system map") || t.includes("governance") || t.includes("loop")) {
    return "SYSTEM_GOVERNANCE_CHANGE";
  }

  if (t.includes("ci") || t.includes("vercel") || t.includes("workflow") || t.includes("deploy")) {
    return "DELIVERY_PIPELINE_CHANGE";
  }

  return "UNKNOWN_REVIEW_REQUIRED";
}

const requiredOwners = {
  registry: "staffordos/agents/agent_registry_v1.json",
  runner: "staffordos/agents/run_agent_v1.mjs",
  execution_driver: "staffordos/agents/execution_driver_v1.mjs",
  contract: "staffordos/agents/progress_contract_v1.json",
  contract_validator: "staffordos/agents/validate_progress_contract_v1.mjs",
  revenue_gate: "staffordos/gates/revenue_gate_v1.mjs",
  safe_write: "staffordos/lib/safe_write_v1.mjs",
  system_truth: "staffordos/system_map/system_map_truth_v1.json",
  runtime_policy: "staffordos/system_inventory/source_runtime_policy_register_v1.md"
};

function loadRegistry() {
  try {
    const raw = fs.readFileSync("staffordos/agents/agent_registry_v1.json", "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.agents) ? parsed.agents : [];
  } catch {
    return [];
  }
}

function requiredAgentsForClassification(classification) {
  if (classification === "PRODUCT_SURFACE_CHANGE") {
    return [
      "surface_patch_agent_v1",
      "change_pipeline_v1"
    ];
  }

  if (classification === "SYSTEM_GOVERNANCE_CHANGE") {
    return [
      "run_agent_v1"
    ];
  }

  if (classification === "DELIVERY_PIPELINE_CHANGE") {
    return [
      "run_agent_v1"
    ];
  }

  return [];
}

function verifyScopedRegistry(classification) {
  const agents = loadRegistry();
  const requiredIds = requiredAgentsForClassification(classification);

  const missing = requiredIds.flatMap((id) => {
    const agent = agents.find((a) => a.id === id);
    if (!agent) {
      return [{ id, reason: "missing_registry_entry" }];
    }

    if (!agent.entrypoint || !fs.existsSync(agent.entrypoint)) {
      return [{
        id,
        reason: "missing_entrypoint",
        entrypoint: agent.entrypoint || ""
      }];
    }

    return [];
  });

  return {
    required_agent_ids: requiredIds,
    missing
  };
}


const ownerStatus = Object.fromEntries(
  Object.entries(requiredOwners).map(([key, path]) => [key, { path, exists: exists(path) }])
);

const missingOwners = Object.values(ownerStatus).filter((x) => !x.exists).map((x) => x.path);

const classification = classify(request);
const scopedRegistry = verifyScopedRegistry(classification);

const issues = [];

if (branch === "main") {
  issues.push("STOP: running on protected branch main.");
}

const statusLines = status ? status.split("\n").filter(Boolean) : [];
const nonBootstrapDirty = statusLines.filter((line) => {
  const file = line.replace(/^..\s+/, "");
  return !file.startsWith("staffordos/loop/");
});

if (nonBootstrapDirty.length) {
  issues.push(`STOP: working tree has non-loop changes:\n${nonBootstrapDirty.join("\n")}`);
}

if (missingOwners.length) {
  issues.push(`STOP: required StaffordOS owners missing:\n${missingOwners.join("\n")}`);
}

if (scopedRegistry.missing.length) {
  issues.push(`STOP: scoped registry gate failed:\n${JSON.stringify(scopedRegistry.missing, null, 2)}`);
}

if (classification === "UNKNOWN_REVIEW_REQUIRED") {
  issues.push("REVIEW_ONLY: request classification is unknown.");
}

const packet = {
  id: `staffordos_loop_${Date.now()}`,
  request,
  classification,
  branch,
  status: status || "clean",
  flow: [
    "request_received",
    "classified",
    "owner_check",
    "gate_decision",
    "verification_contract_required",
    "truth_update_required"
  ],
  gate_decision: issues.length ? "STOP_OR_REVIEW" : "ALLOW_PACKET_PREP",
  verification_contract: {
    requires_progress_contract: true,
    requires_revenue_or_goal_gate: true,
    requires_pr_checks: true,
    requires_post_change_truth_update: true,
    requires_runtime_output_separation: true
  },
  issues,
  next_action: issues.length
    ? "Resolve issues before execution. Do not patch product code."
    : "Create or attach a change packet, then execute through existing agents only."
};

const report = {
  ok: issues.length === 0,
  artifact: "staffordos_loop_v1",
  mode: "governed_change_control_loop",
  generated_at: timestamp,
  owner_status: ownerStatus,
  scoped_registry_gate: scopedRegistry,
  packet
};

fs.writeFileSync(
  "staffordos/loop/output/latest_staffordos_loop_v1.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));

process.exit(issues.length ? 1 : 0);
