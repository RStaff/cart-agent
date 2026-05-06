import fs from "fs";

const registryPath = "staffordos/system_map/surface_registry_v1.json";

const result = {
  schema: "staffordos.surface_validator.v1",
  generated_at: new Date().toISOString(),
  status: "passed",
  surfaces_checked: {},
  failures: [],
  warnings: []
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
  result.surfaces_checked[key] = {
    expected_path: surface.path || surface.routes || null,
    status: surface.status
  };

  if (surface.status === "missing") {
    result.warnings.push(`surface_missing:${key}`);
  }

  if (surface.status === "fragmented") {
    result.warnings.push(`surface_fragmented:${key}`);
  }
}

console.log(JSON.stringify(result, null, 2));
