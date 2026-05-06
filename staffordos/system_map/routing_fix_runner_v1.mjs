import fs from "fs";

const registry = JSON.parse(
  fs.readFileSync("staffordos/system_map/surface_registry_v1.json", "utf-8")
);

const result = {
  schema: "staffordos.routing_fix_runner.v1",
  generated_at: new Date().toISOString(),
  status: "passed",
  fixes: []
};

for (const [key, surface] of Object.entries(registry.surfaces)) {
  if (surface.status === "fragmented" || surface.status === "active_local_unbound") {
    result.fixes.push({
      surface: key,
      action: "needs_routing_binding",
      path: surface.path
    });
  }
}

fs.writeFileSync(
  "staffordos/operator_daemon/output/routing_fix_runner_v1.json",
  JSON.stringify(result, null, 2)
);

console.log(JSON.stringify(result, null, 2));
