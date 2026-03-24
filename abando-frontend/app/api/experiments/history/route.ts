import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "experiments", "experiment_history.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const historyPath = join(rootDir, "staffordos", "experiments", "experiment_history.json");

  try {
    return NextResponse.json(JSON.parse(readFileSync(historyPath, "utf8")), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ experiments: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
