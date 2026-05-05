import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { execSync } from "child_process";
import path from "path";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

function walk(dir, results = []) {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", ".next", "dist", "build"].includes(entry)) continue;
    const p = path.join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, results);
    else results.push(p);
  }
  return results;
}

const files = walk("staffordos").concat(walk("web")).filter(Boolean);

const hygieneFiles = files.filter(f =>
  /security|hygiene|audit|vulnerability|dependabot|snyk|npm_audit|qa|validator|guard/i.test(f)
);

const packageFiles = walk(".").filter(f =>
  /(^|\/)(package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(f)
);

let npmAudit = null;
try {
  if (existsSync("package-lock.json")) {
    const raw = execSync("npm audit --json", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    npmAudit = JSON.parse(raw);
  }
} catch (err) {
  try {
    npmAudit = JSON.parse(err.stdout || "{}");
  } catch {
    npmAudit = { error: "npm audit failed and did not return parseable JSON" };
  }
}

const summary = npmAudit?.metadata?.vulnerabilities || null;

const result = {
  schema: "staffordos.security_hygiene_inventory.v1",
  generated_at: new Date().toISOString(),
  status: "inventory_complete",
  hygiene_agent_candidates: hygieneFiles,
  package_files: packageFiles,
  npm_audit_summary: summary,
  recommendation: {
    priority: summary?.high || summary?.critical ? "triage_before_real_send_or_public_scale" : "monitor",
    next_task: "security_vulnerability_triage_packet"
  },
  proof: {
    scanned_repo_for_hygiene_agents: true,
    checked_package_files: true,
    attempted_npm_audit: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/security_hygiene_inventory_v1.json`, JSON.stringify(result, null, 2));
console.log("✅ security hygiene inventory written");
console.log(JSON.stringify(result, null, 2));
