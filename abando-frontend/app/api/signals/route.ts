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

function generateSignals(rootDir: string) {
  try {
    execFileSync("node", [join(rootDir, "staffordos", "signals", "generate_signals.js")], {
      cwd: rootDir,
      stdio: "ignore",
    });
  } catch {
    // Fall back to the last successfully generated registry if generation fails.
  }
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const registryPath = join(rootDir, "staffordos", "signals", "signal_registry.json");

  generateSignals(rootDir);

  try {
    const registry = JSON.parse(readFileSync(registryPath, "utf8"));
    return NextResponse.json(registry, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ generated_at: "", source_status: {}, signals: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
