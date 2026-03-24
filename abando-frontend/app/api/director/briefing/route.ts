import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "briefing", "daily_briefing.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const filePath = join(rootDir, "staffordos", "briefing", "daily_briefing.json");

  try {
    return NextResponse.json(JSON.parse(readFileSync(filePath, "utf8")), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({
      generated_at: "",
      headline: "Daily briefing unavailable",
      summary: "Generate a fresh briefing from the director console.",
      top_metrics: {
        audit_runs: 0,
        install_clicks: 0,
        installs: 0,
      },
      top_opportunity: "",
      top_blocker: "",
      recommended_next_action: "",
    }, { headers: { "Cache-Control": "no-store" } });
  }
}
