import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "approvals", "approval_queue.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

export async function GET() {
  const rootDir = findCanonicalRoot();
  const queuePath = join(rootDir, "staffordos", "approvals", "approval_queue.json");

  try {
    const parsed = JSON.parse(readFileSync(queuePath, "utf8"));
    const approvals = Array.isArray(parsed.approvals) ? parsed.approvals : [];
    return NextResponse.json({ approvals }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ approvals: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
