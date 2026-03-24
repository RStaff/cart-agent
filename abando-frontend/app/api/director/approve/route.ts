import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { approval_id?: string } | null;
  const approvalId = body?.approval_id;

  if (!approvalId) {
    return NextResponse.json({ error: "approval_id is required" }, { status: 400 });
  }

  const rootDir = findCanonicalRoot();
  const queuePath = join(rootDir, "staffordos", "approvals", "approval_queue.json");

  try {
    const parsed = JSON.parse(readFileSync(queuePath, "utf8"));
    const approvals = Array.isArray(parsed.approvals) ? parsed.approvals : [];
    const item = approvals.find((entry: { approval_id?: string }) => entry.approval_id === approvalId);

    if (!item) {
      return NextResponse.json({ error: `Approval not found: ${approvalId}` }, { status: 404 });
    }

    item.status = "approved";
    writeFileSync(queuePath, `${JSON.stringify({ approvals }, null, 2)}\n`);
    return NextResponse.json({ ok: true, item }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Failed to update approval queue" }, { status: 500 });
  }
}
