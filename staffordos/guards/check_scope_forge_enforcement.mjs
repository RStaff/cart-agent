import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const command = process.argv.slice(2).join(" ");
const scopePath = "staffordos/scope/scope_forge_v1.json";
const scope = JSON.parse(readFileSync(scopePath, "utf8"));

function inferSystem(command) {
  const c = String(command || "").toLowerCase();

  if (c.includes("recovery-actions") || c.includes("abando") || c.includes("web run dev")) return "abando";
  if (c.includes("shopifixer") || c.includes("fix-audit") || c.includes("audit")) return "shopifixer";
  if (c.includes("staffordmedia") || c.includes("staffordmedia.ai")) return "staffordmedia";
  if (c.includes("lead") || c.includes("outreach")) return "outreach";
  if (c.includes("stripe") || c.includes("payment") || c.includes("pricing") || c.includes("revenue")) return "revenue";
  if (c.includes("staffordos") || c.includes("scope") || c.includes("execution")) return "staffordos";
  if (c.includes("agent")) return "agent_system";

  return null;
}

const systemId = inferSystem(command);
const system = scope.systems.find((s) => s.id === systemId);

const failures = [];

if (!command) failures.push("No command supplied to scope enforcement.");
if (!systemId) failures.push("Could not infer StaffordOS system from command.");
if (systemId && !system) failures.push(`Inferred system ${systemId}, but it is not defined in scope forge.`);

if (system && (!Array.isArray(system.proof_required) || system.proof_required.length === 0)) {
  failures.push(`System ${system.id} has no proof requirements.`);
}

if (system && (!Array.isArray(system.owners) || system.owners.length === 0)) {
  failures.push(`System ${system.id} has no owner chain.`);
}

const report = {
  generated_at: new Date().toISOString(),
  status: failures.length ? "FAILED" : "PASSED",
  command,
  inferred_system_id: systemId,
  system_name: system?.name || null,
  system_status: system?.status || null,
  next_slice: system?.next_slice || null,
  owners: system?.owners || [],
  proof_required: system?.proof_required || [],
  current_proof: system?.current_proof || [],
  failures
};

mkdirSync("staffordos/execution/output", { recursive: true });
writeFileSync(
  "staffordos/execution/output/scope_forge_enforcement_latest.json",
  JSON.stringify(report, null, 2) + "\n"
);

if (failures.length) {
  console.error("❌ Scope Forge enforcement failed:");
  for (const failure of failures) console.error("-", failure);
  process.exit(1);
}

console.log("✅ Scope Forge enforcement passed");
console.log(JSON.stringify(report, null, 2));
