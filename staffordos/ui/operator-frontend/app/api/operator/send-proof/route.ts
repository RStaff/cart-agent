import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const ROOT = path.resolve(process.cwd(), "../../..");
const LEDGER_PATH = path.join(ROOT, "staffordos/leads/send_ledger_v1.json");

function readJson(filePath: string, fallback: any) {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

export async function GET() {
  const ledger = readJson(LEDGER_PATH, { version: "send_ledger_v1", items: [] });
  const items = Array.isArray(ledger.items) ? ledger.items : [];

  const dryRun = items.filter((i: any) => i.status === "dry_run_proof_recorded");
  const live = items.filter((i: any) => i.live_send_attempted === true);

  return NextResponse.json({
    ok: true,
    source: "staffordos/leads/send_ledger_v1.json",
    proof_count: items.length,
    dry_run_proof_count: dryRun.length,
    live_send_attempted_count: live.length,
    latest_proofs: items.slice(-10).reverse()
  });
}
