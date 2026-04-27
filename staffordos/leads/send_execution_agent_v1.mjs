import { existsSync, readFileSync, writeFileSync } from "node:fs";

const LEDGER = "staffordos/leads/send_ledger_v1.json";
const LOG = "staffordos/leads/send_execution_log_v1.json";

const args = process.argv.slice(2);
const liveUnlocked = args.includes("--live-send-unlocked");

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

const ledger = readJson(LEDGER, { version: "send_ledger_v1", items: [] });
ledger.items = Array.isArray(ledger.items) ? ledger.items : [];

const log = readJson(LOG, []);
let dryRunMarked = 0;
let liveBlocked = 0;

for (const item of ledger.items) {
  if (item.status !== "pending_send") continue;

  if (!liveUnlocked) {
    item.status = "dry_run_ready";
    item.stage = "send_blocked_until_live_unlock";
    item.dry_run_checked_at = new Date().toISOString();
    item.updated_at = new Date().toISOString();
    dryRunMarked += 1;
    continue;
  }

  item.status = "live_send_blocked";
  item.stage = "smtp_not_implemented_here";
  item.updated_at = new Date().toISOString();
  liveBlocked += 1;
}

writeJson(LEDGER, ledger);

log.push({
  agent: "send_execution_agent_v1",
  mode: liveUnlocked ? "live_unlock_requested_but_blocked" : "dry_run_only",
  dry_run_marked: dryRunMarked,
  live_blocked: liveBlocked,
  at: new Date().toISOString()
});

writeJson(LOG, log);

console.log(JSON.stringify({
  ok: true,
  agent: "send_execution_agent_v1",
  mode: liveUnlocked ? "live_unlock_requested_but_blocked" : "dry_run_only",
  dry_run_marked: dryRunMarked,
  live_blocked: liveBlocked,
  sends_attempted: 0
}, null, 2));
