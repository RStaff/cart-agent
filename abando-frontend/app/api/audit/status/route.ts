import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "audit"))) {
      return candidate;
    }
  }
  return process.cwd();
}

export async function GET(request: NextRequest) {
  const rootDir = findCanonicalRoot();
  const registryPath = join(rootDir, "staffordos", "audit", "audit_request_registry.json");
  const resultPath = join(rootDir, "staffordos", "audit", "audit_result_surface.json");
  const auditId = request.nextUrl.searchParams.get("audit_id");

  const registry = existsSync(registryPath) ? JSON.parse(readFileSync(registryPath, "utf8")) : { audits: [] };
  const audits = Array.isArray(registry.audits) ? registry.audits : [];
  const entry = auditId ? audits.find((item: { audit_id?: string }) => item.audit_id === auditId) : audits[audits.length - 1];

  if (!entry) {
    return NextResponse.json({ status: "processing" }, { headers: { "Cache-Control": "no-store" } });
  }

  if (entry.status !== "complete" || !existsSync(resultPath)) {
    return NextResponse.json({ status: "processing" }, { headers: { "Cache-Control": "no-store" } });
  }

  const auditResult = JSON.parse(readFileSync(resultPath, "utf8"));
  return NextResponse.json(
    {
      status: "complete",
      audit_result: auditResult,
      redirect_to: "/audit-result",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
