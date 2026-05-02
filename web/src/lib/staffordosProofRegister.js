import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

async function readJsonIfExists(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

export async function recordAbandoRealSendProof({ repoRoot, proof }) {
  const outputDir = join(repoRoot, "staffordos", "system_inventory", "output");
  const registerPath = join(outputDir, "execution_proof_register_v1.json");
  const proofLogPath = join(outputDir, "abando_real_send_proof_log_v1.json");

  await mkdir(dirname(registerPath), { recursive: true });

  const proofEvent = {
    id: `abando_real_send_${Date.now()}`,
    generated_at: new Date().toISOString(),
    capability: "Abando Real Email Send",
    status: proof?.status || "UNKNOWN",
    proof_type: proof?.proof_type || "abando_real_sender_attempt",
    route: proof?.route || "/api/recovery-actions/send-live-test",
    source: proof?.source || "/demo/playground",
    shop: proof?.shop || "",
    channel: proof?.channel || "",
    recipient: proof?.email || proof?.phone || "",
    provider: proof?.sends?.[0]?.provider || "",
    messageId: proof?.sends?.[0]?.messageId || proof?.sends?.[0]?.sid || null,
    accepted: proof?.sends?.[0]?.accepted || [],
    success: Boolean(proof?.ok && proof?.status === "REAL_SEND_SUCCEEDED"),
    evidence: {
      latest_proof_file: "staffordos/system_inventory/output/proof_runs/latest_abando_live_test_proof.json",
      status: proof?.status || "",
      sends: proof?.sends || [],
      errors: proof?.errors || []
    }
  };

  const log = await readJsonIfExists(proofLogPath, []);
  const nextLog = Array.isArray(log) ? [...log, proofEvent] : [proofEvent];
  await writeFile(proofLogPath, JSON.stringify(nextLog, null, 2) + "\n");

  const register = await readJsonIfExists(registerPath, {});
  let nextRegister;

  if (Array.isArray(register)) {
    nextRegister = [...register, proofEvent];
  } else {
    nextRegister = {
      ...register,
      updated_at: new Date().toISOString(),
      latest_abando_real_send_proof: proofEvent,
      proof_events: Array.isArray(register.proof_events)
        ? [...register.proof_events, proofEvent]
        : [proofEvent]
    };
  }

  await writeFile(registerPath, JSON.stringify(nextRegister, null, 2) + "\n");
  return proofEvent;
}
