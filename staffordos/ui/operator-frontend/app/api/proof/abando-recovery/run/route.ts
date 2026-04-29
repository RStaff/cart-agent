import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST() {
  const repoRoot = process.cwd().includes("staffordos/ui/operator-frontend")
    ? path.resolve(process.cwd(), "../../..")
    : process.cwd();

  const outDir = path.join(repoRoot, "staffordos/system_inventory/output/proof_runs");
  fs.mkdirSync(outDir, { recursive: true });

  const runId = `abando_recovery_loop_${Date.now()}`;

  const artifact = {
    proof_run_id: runId,
    proof_id: "proof_abando_recovery_loop",
    target: "Abando Recovery Loop",
    status: "REQUESTED_REQUIRES_RUNTIME_EXECUTION",
    created_at: new Date().toISOString(),
    required_runtime_proof: [
      "checkout captured",
      "recovery action created",
      "message delivered",
      "return tracked",
      "conversion/revenue attributed"
    ],
    rule: "This action creates a proof run artifact only. It does not mark proof as PROVEN."
  };

  const file = path.join(outDir, `${runId}.json`);
  const latest = path.join(outDir, "latest_abando_recovery_loop_run.json");

  fs.writeFileSync(file, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(latest, JSON.stringify(artifact, null, 2));

  return NextResponse.json({
    ok: true,
    artifact,
    file
  });
}
