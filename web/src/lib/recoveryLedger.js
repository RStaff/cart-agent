import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd().endsWith("/web")
  ? path.join(process.cwd(), "..")
  : process.cwd();

const LEDGER_PATH = path.join(
  repoRoot,
  "staffordos/system_inventory/output/recovery_ledger_v1.json"
);

function loadLedger() {
  if (!fs.existsSync(LEDGER_PATH)) {
    return { generated_at: new Date().toISOString(), entries: [] };
  }
  return JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8"));
}

function saveLedger(ledger) {
  ledger.generated_at = new Date().toISOString();
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2));
}

export function appendRecoveryLedger(entry) {
  const ledger = loadLedger();

  const record = {
    recovery_id: "rec_" + Date.now(),
    created_at: new Date().toISOString(),
    ...entry
  };

  ledger.entries.unshift(record);

  if (ledger.entries.length > 200) {
    ledger.entries = ledger.entries.slice(0, 200);
  }

  saveLedger(ledger);

  return record;
}
