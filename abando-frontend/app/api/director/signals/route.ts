import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegistrySignal = {
  signal_id: string;
  signal_type: string;
  title: string;
  summary: string;
  status: string;
  score: number;
  priority: "high" | "medium" | "low" | string;
  recommended_action: string;
  source_refs?: string[];
  created_at: string;
  resolved_at?: string | null;
};

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "registries", "signal_registry.json"))) {
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

function priorityRank(priority: string) {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function isInstallBlocking(signal: RegistrySignal) {
  return signal.signal_type === "conversion_dropoff" || signal.signal_type === "top_blocker";
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const registry = readJson<{ signals?: RegistrySignal[] }>(
    join(rootDir, "staffordos", "registries", "signal_registry.json"),
    { signals: [] },
  );
  const signals = Array.isArray(registry.signals) ? registry.signals : [];
  const activeSignals = signals
    .filter((signal) => signal.status === "active")
    .sort((left, right) => {
      const priorityDelta = priorityRank(right.priority) - priorityRank(left.priority);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return Number(right.score || 0) - Number(left.score || 0);
    })
    .map((signal, index) => ({
      ...signal,
      installBlocking: isInstallBlocking(signal),
      isTopPriority: index === 0,
    }));

  return NextResponse.json(
    {
      helperText: "The system should work on the biggest install bottleneck first.",
      signals: activeSignals,
      topSignal: activeSignals[0] || null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
