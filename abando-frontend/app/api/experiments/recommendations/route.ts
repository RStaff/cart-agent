import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExperimentEntry = {
  experiment_id: string;
  title: string;
  signal_source: string;
  hypothesis: string;
  proposed_change: string;
  expected_metric: string;
  impact_score: number;
  priority_label?: string;
  status: string;
  created_at: string;
};

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "experiments"))) {
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

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function approvalIdFor(experimentId: string) {
  return `approval-${experimentId}`;
}

function generateRecommendations(rootDir: string) {
  try {
    execFileSync("node", [join(rootDir, "staffordos", "experiments", "generate_experiment_recommendations.js")], {
      cwd: rootDir,
      stdio: "ignore",
    });
  } catch {
    // Use existing registry when generation cannot run.
  }
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const registryPath = join(rootDir, "staffordos", "experiments", "experiment_registry.json");

  generateRecommendations(rootDir);

  const registry = readJson(registryPath, { generated_at: "", experiments: [] as ExperimentEntry[] });
  return NextResponse.json(registry, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const rootDir = findCanonicalRoot();
  const registryPath = join(rootDir, "staffordos", "experiments", "experiment_registry.json");
  const approvalsPath = join(rootDir, "staffordos", "approvals", "approval_queue.json");
  const historyPath = join(rootDir, "staffordos", "experiments", "experiment_history.json");

  const body = (await request.json()) as {
    experiment_id?: string;
    action?: "approve" | "reject";
  };

  if (!body.experiment_id || !body.action) {
    return NextResponse.json({ error: "experiment_id and action are required" }, { status: 400 });
  }

  const registry = readJson(registryPath, { generated_at: "", experiments: [] as ExperimentEntry[] });
  const approvals = readJson(approvalsPath, { approvals: [] as Array<Record<string, unknown>> });
  const history = readJson(historyPath, { experiments: [] as Array<Record<string, unknown>> });

  const experiment = Array.isArray(registry.experiments)
    ? registry.experiments.find((entry) => entry.experiment_id === body.experiment_id)
    : null;

  if (!experiment) {
    return NextResponse.json({ error: `Experiment not found: ${body.experiment_id}` }, { status: 404 });
  }

  experiment.status = body.action === "approve" ? "approved" : "rejected";

  if (Array.isArray(approvals.approvals)) {
    const approval = approvals.approvals.find(
      (item) => item && item.approval_id === approvalIdFor(body.experiment_id!),
    ) as { status?: string } | undefined;

    if (approval) {
      approval.status = experiment.status;
    }
  }

  const now = new Date().toISOString();
  if (Array.isArray(history.experiments)) {
    history.experiments.push({
      experiment_id: experiment.experiment_id,
      title: experiment.title,
      target_surface: experiment.signal_source,
      executed_at: now,
      result: experiment.status,
    });
  }

  writeJson(registryPath, registry);
  writeJson(approvalsPath, approvals);
  writeJson(historyPath, history);

  return NextResponse.json({ ok: true, experiment }, { headers: { "Cache-Control": "no-store" } });
}
