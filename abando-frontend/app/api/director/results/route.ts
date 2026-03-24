import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "results", "result_registry.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const registryPath = join(rootDir, "staffordos", "results", "result_registry.json");

  try {
    const parsed = JSON.parse(readFileSync(registryPath, "utf8"));
    const results = Array.isArray(parsed.results) ? parsed.results : [];
    return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ results: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
