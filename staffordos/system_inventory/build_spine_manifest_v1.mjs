import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";

const ROOT = process.cwd();
const OUT = "staffordos/system_inventory/output/spine_manifest_v1.json";

const TARGET_DIRS = [
  "staffordos/control_spine",
  "staffordos/system_map",
  "staffordos/system_inventory",
  "staffordos/operator_daemon",
  "staffordos/agents",
  "staffordos/execution"
];

function walk(dir, files = []) {
  try {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (p.includes("node_modules") || p.includes(".git")) continue;
      const st = statSync(p);
      if (st.isDirectory()) walk(p, files);
      else if (/\.(js|mjs|ts|json|sh|md)$/.test(p)) files.push(p);
    }
  } catch {}
  return files;
}

const allFiles = TARGET_DIRS.flatMap(d => walk(d));

function read(p) {
  try { return readFileSync(p, "utf8"); } catch { return ""; }
}

function classify(file, content) {
  const lower = content.toLowerCase();

  const signals = {
    isSpine:
      file.includes("spine") ||
      lower.includes("spine") ||
      lower.includes("control_spine"),

    isContract:
      lower.includes("contract") ||
      lower.includes("task_type") ||
      lower.includes("allowed") ||
      lower.includes("forbidden"),

    isValidator:
      lower.includes("validator") ||
      lower.includes("validate"),

    isRunner:
      lower.includes("run_task") ||
      file.includes("run_") ||
      lower.includes("runner"),

    isResolver:
      lower.includes("resolver"),

    isProof:
      lower.includes("proof") ||
      lower.includes("artifact"),

    isRevenue:
      lower.includes("revenue") ||
      lower.includes("pricing") ||
      lower.includes("payment"),

    isAgent:
      lower.includes("agent") ||
      lower.includes("owner")
  };

  let classification = "unknown";

  if (signals.isSpine && signals.isContract) classification = "canonical_spine_candidate";
  else if (signals.isSpine) classification = "spine_fragment";
  else if (signals.isContract) classification = "contract_fragment";
  else if (signals.isValidator) classification = "validator";
  else if (signals.isRunner) classification = "runner";
  else if (signals.isResolver) classification = "resolver";
  else if (signals.isProof) classification = "proof_logic";
  else if (signals.isRevenue) classification = "revenue_logic";
  else if (signals.isAgent) classification = "agent_logic";

  return {
    file,
    classification,
    signals
  };
}

const results = allFiles.map(f => classify(f, read(f)));

const summary = {
  canonical_spine_candidate: results.filter(r => r.classification === "canonical_spine_candidate").length,
  spine_fragment: results.filter(r => r.classification === "spine_fragment").length,
  contract_fragment: results.filter(r => r.classification === "contract_fragment").length,
  validator: results.filter(r => r.classification === "validator").length,
  runner: results.filter(r => r.classification === "runner").length,
  resolver: results.filter(r => r.classification === "resolver").length,
  proof_logic: results.filter(r => r.classification === "proof_logic").length,
  revenue_logic: results.filter(r => r.classification === "revenue_logic").length,
  agent_logic: results.filter(r => r.classification === "agent_logic").length
};

const output = {
  schema: "staffordos.spine_manifest.v1",
  generated_at: new Date().toISOString(),
  total_files: allFiles.length,
  summary,
  files: results.slice(0, 300)
};

writeFileSync(OUT, JSON.stringify(output, null, 2));

console.log("===== SPINE MANIFEST SUMMARY =====");
console.log(summary);
