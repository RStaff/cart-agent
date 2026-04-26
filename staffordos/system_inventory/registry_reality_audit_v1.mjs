import fs from "node:fs";

const registryPath = "staffordos/agents/agent_registry_v1.json";
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const agents = Array.isArray(registry.agents) ? registry.agents : [];

const results = agents.map((agent) => {
  const entrypoint = agent.entrypoint || "";
  const reads = Array.isArray(agent.reads) ? agent.reads : [];
  const writes = Array.isArray(agent.writes) ? agent.writes : [];

  return {
    id: agent.id,
    entrypoint,
    entrypoint_exists: entrypoint ? fs.existsSync(entrypoint) : false,
    requires_approval: Boolean(agent.requires_approval),
    reads: reads.map((path) => ({ path, exists: fs.existsSync(path) })),
    writes: writes.map((path) => ({ path, exists: fs.existsSync(path) }))
  };
});

const missing_entrypoints = results
  .filter((r) => !r.entrypoint_exists)
  .map((r) => ({ id: r.id, entrypoint: r.entrypoint }));

const missing_write_targets = results.flatMap((r) =>
  r.writes
    .filter((w) => !w.exists)
    .map((w) => ({ agent_id: r.id, missing_write_target: w.path }))
);

const report = {
  ok: missing_entrypoints.length === 0,
  artifact: "registry_reality_audit_v1",
  mode: "inspect_only",
  generated_at: new Date().toISOString(),
  summary: {
    total_agents: results.length,
    executable_agents: results.filter((r) => r.entrypoint_exists).length,
    missing_entrypoints: missing_entrypoints.length,
    missing_write_targets: missing_write_targets.length
  },
  missing_entrypoints,
  missing_write_targets,
  agents: results,
  maturity_blocker: missing_entrypoints.length
    ? "Registry references non-existent entrypoints."
    : "Registry entrypoints match repo reality."
};

fs.writeFileSync(
  "staffordos/system_inventory/registry_reality_audit_v1.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));
