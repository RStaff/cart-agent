import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "signals"))) {
      return candidate;
    }
  }

  return process.cwd();
}

function refreshSignalRegistry(rootDir: string) {
  try {
    execFileSync("node", [join(rootDir, "staffordos", "signals", "generate_signals.js")], {
      cwd: rootDir,
      stdio: "ignore",
    });
  } catch {
    // Use existing signal registry when generation cannot run.
  }
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const registryPath = join(rootDir, "staffordos", "signals", "signal_registry.json");
  const selectorPath = join(rootDir, "staffordos", "signals", "select_top_signals.js");

  refreshSignalRegistry(rootDir);

  try {
    const stdout = execFileSync("node", [selectorPath], {
      cwd: rootDir,
      encoding: "utf8",
    });
    return NextResponse.json(JSON.parse(stdout), { headers: { "Cache-Control": "no-store" } });
  } catch {
    try {
      const registry = JSON.parse(readFileSync(registryPath, "utf8"));
      const topSignals = Array.isArray(registry.signals) ? registry.signals.slice(0, 5) : [];
      return NextResponse.json(
        { generated_at: "", top_signals: topSignals },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch {
      return NextResponse.json({ generated_at: "", top_signals: [] }, { headers: { "Cache-Control": "no-store" } });
    }
  }
}
