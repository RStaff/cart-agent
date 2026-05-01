import fs from "node:fs";
import path from "node:path";

export function installRecoveryLedgerRoute(app) {
  app.get("/api/recovery-ledger", (_req, res) => {
    const repoRoot = process.cwd().endsWith("/web")
      ? path.join(process.cwd(), "..")
      : process.cwd();

    const file = path.join(
      repoRoot,
      "staffordos/system_inventory/output/recovery_ledger_v1.json"
    );

    if (!fs.existsSync(file)) {
      return res.json({ ok: true, entries: [] });
    }

    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return res.json(data);
  });
}
