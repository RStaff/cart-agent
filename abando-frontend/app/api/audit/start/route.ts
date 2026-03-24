import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join, resolve } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

type AuditRegistryEntry = {
  audit_id: string;
  store_domain: string;
  email_optional: string | null;
  status: "processing" | "complete" | "failed";
  created_at: string;
  updated_at?: string;
  error?: string | null;
};

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "audit"))) {
      return candidate;
    }
  }
  return process.cwd();
}

function validateStoreDomain(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  const pattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9-]+)+$/i;
  return pattern.test(normalized) ? normalized : "";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { store_domain?: string; email_optional?: string } | null;
  const storeDomain = validateStoreDomain(body?.store_domain || "");

  if (!storeDomain) {
    return NextResponse.json({ error: "Valid store_domain is required" }, { status: 400 });
  }

  const rootDir = findCanonicalRoot();
  const registryPath = join(rootDir, "staffordos", "audit", "audit_request_registry.json");
  const scriptPath = join(rootDir, "staffordos", "audit", "run_free_audit.js");
  const registry = existsSync(registryPath) ? JSON.parse(readFileSync(registryPath, "utf8")) : { audits: [] };
  const audits = Array.isArray(registry.audits) ? registry.audits : [];
  const auditId = `audit-${Date.now()}`;

  const entry: AuditRegistryEntry = {
    audit_id: auditId,
    store_domain: storeDomain,
    email_optional: body?.email_optional ? String(body.email_optional) : null,
    status: "processing",
    created_at: new Date().toISOString(),
  };

  audits.push(entry);
  writeFileSync(registryPath, `${JSON.stringify({ audits }, null, 2)}\n`);

  try {
    await execFileAsync("node", [scriptPath, storeDomain], { cwd: rootDir });
    entry.status = "complete";
    entry.updated_at = new Date().toISOString();
  } catch (error) {
    entry.status = "failed";
    entry.updated_at = new Date().toISOString();
    entry.error = error instanceof Error ? error.message : "Audit failed";
  }

  writeFileSync(registryPath, `${JSON.stringify({ audits }, null, 2)}\n`);

  return NextResponse.json(
    {
      audit_id: auditId,
      status: entry.status === "failed" ? "processing" : entry.status,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
