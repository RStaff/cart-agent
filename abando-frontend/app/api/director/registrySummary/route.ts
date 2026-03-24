import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegistryTask = {
  task_id: string;
  type: string;
  title: string;
  status: string;
  created_at: string;
};

type RegistryResult = {
  result_id: string;
  result_type: string;
  status: string;
  summary: string;
  created_at: string;
};

type RegistryApproval = {
  approval_id: string;
  title: string;
  status: string;
  created_at: string;
};

type RegistrySignal = {
  signal_id: string;
  signal_type: string;
  title: string;
  summary: string;
  status: string;
  score: number;
  priority: string;
  recommended_action: string;
  created_at: string;
};

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "registries", "entity_registry.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function sortByCreatedAt<T extends { created_at?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
    return rightTime - leftTime;
  });
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const entityRegistry = readJson<{ entities?: Array<unknown> }>(
    join(rootDir, "staffordos", "registries", "entity_registry.json"),
    { entities: [] },
  );
  const taskRegistry = readJson<{ tasks?: RegistryTask[] }>(
    join(rootDir, "staffordos", "registries", "task_registry.json"),
    { tasks: [] },
  );
  const resultRegistry = readJson<{ results?: RegistryResult[] }>(
    join(rootDir, "staffordos", "registries", "result_registry.json"),
    { results: [] },
  );
  const approvalRegistry = readJson<{ approvals?: RegistryApproval[] }>(
    join(rootDir, "staffordos", "registries", "approval_registry.json"),
    { approvals: [] },
  );
  const signalRegistry = readJson<{ signals?: RegistrySignal[] }>(
    join(rootDir, "staffordos", "registries", "signal_registry.json"),
    { signals: [] },
  );

  const entities = Array.isArray(entityRegistry.entities) ? entityRegistry.entities : [];
  const tasks = Array.isArray(taskRegistry.tasks) ? taskRegistry.tasks : [];
  const results = Array.isArray(resultRegistry.results) ? resultRegistry.results : [];
  const approvals = Array.isArray(approvalRegistry.approvals) ? approvalRegistry.approvals : [];
  const signals = Array.isArray(signalRegistry.signals) ? signalRegistry.signals : [];

  const activeSignals = signals
    .filter((signal) => signal.status === "active")
    .sort((left, right) => Number(right.score || 0) - Number(left.score || 0));

  const payload = {
    counts: {
      entities: entities.length,
      tasks: tasks.length,
      results: results.length,
      approvals: approvals.length,
      signals: signals.length,
    },
    pendingApprovals: approvals.filter((approval) => approval.status === "pending").length,
    topActiveSignal: activeSignals[0] || null,
    mostRecentTask: sortByCreatedAt(tasks)[0] || null,
    mostRecentResult: sortByCreatedAt(results)[0] || null,
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
