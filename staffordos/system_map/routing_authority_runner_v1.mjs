import fs from "fs";

const registryPath = "staffordos/system_map/surface_registry_v1.json";

const result = {
  schema: "staffordos.routing_authority_runner.v1",
  generated_at: new Date().toISOString(),
  status: "passed",
  routes: [],
  failures: []
};

if (!fs.existsSync(registryPath)) {
  console.log(JSON.stringify({
    ...result,
    status: "failed",
    failures: ["missing_surface_registry"]
  }, null, 2));
  process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));

for (const [key, surface] of Object.entries(registry.surfaces)) {
  if (surface.path) {
    result.routes.push({
      route: surface.path,
      surface: key,
      status: surface.status
    });
  }
}

fs.writeFileSync(
  "staffordos/operator_daemon/output/routing_authority_runner_v1.json",
  JSON.stringify(result, null, 2)
);

console.log(JSON.stringify(result, null, 2));
