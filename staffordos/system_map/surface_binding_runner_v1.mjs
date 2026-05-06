import fs from "fs";

const registryPath = "staffordos/system_map/surface_registry_v1.json";

const result = {
  schema: "staffordos.surface_binding_runner.v1",
  generated_at: new Date().toISOString(),
  status: "passed",
  bindings: [],
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
  result.bindings.push({
    surface: key,
    path: surface.path || surface.routes || null,
    status: surface.status
  });
}


import { writeFileSync } from "fs";

writeFileSync(
  "staffordos/operator_daemon/output/surface_binding_runner_v1.json",
  JSON.stringify(result, null, 2)
);

console.log(JSON.stringify(result, null, 2));

