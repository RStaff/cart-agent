import { readFileSync, writeFileSync } from "node:fs";

type RegistryResult = {
  result_id: string;
  task_id: string;
  result_type: string;
  status?: string;
  summary: string;
  artifact_path?: string;
  created_at: string;
  consumed_by?: string[];
};

type ResultRegistryFile = {
  version: string;
  updated_at: string;
  results: RegistryResult[];
};

function nextResultId(results: RegistryResult[]) {
  let highest = 0;

  for (const result of results) {
    const match = /^result-(\d+)$/.exec(result.result_id || "");
    if (!match) {
      continue;
    }
    highest = Math.max(highest, Number(match[1]));
  }

  return `result-${String(highest + 1).padStart(3, "0")}`;
}

export function writeResultEntry({
  registryPath,
  taskId,
  resultType,
  summary,
}: {
  registryPath: string;
  taskId: string;
  resultType: string;
  summary: string;
}) {
  const now = new Date().toISOString();
  const registry = JSON.parse(readFileSync(registryPath, "utf8")) as ResultRegistryFile;
  const results = Array.isArray(registry.results) ? registry.results : [];
  const resultId = nextResultId(results);
  const entry: RegistryResult = {
    result_id: resultId,
    task_id: taskId,
    result_type: resultType,
    status: "created",
    summary,
    artifact_path: "staffordos/registries/result_registry.json",
    created_at: now,
    consumed_by: [],
  };

  const nextRegistry: ResultRegistryFile = {
    version: registry.version || "1.0",
    updated_at: now,
    results: [...results, entry],
  };

  writeFileSync(registryPath, `${JSON.stringify(nextRegistry, null, 2)}\n`, "utf8");

  return entry;
}
