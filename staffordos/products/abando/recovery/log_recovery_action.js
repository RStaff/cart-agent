import fs from "node:fs";
import path from "node:path";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const LOG_DIR = path.join(CANONICAL_ROOT, "staffordos/products/abando/logs");
export const LOG_PATH = path.join(LOG_DIR, "abando_recovery_action_log_v1.md");

function cleanText(value) {
  return String(value || "").trim();
}

function ensureLogFile() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(LOG_PATH, "# Abando Recovery Action Log v1\n\n", "utf8");
  }
}

export function appendRecoveryActionLog(entry = {}) {
  ensureLogFile();
  const timestamp = new Date().toISOString();
  const lines = [
    `## ${timestamp} · ${cleanText(entry.status) || "unknown"}`,
    "",
    `- queue_row_id: ${cleanText(entry.id) || "none"}`,
    `- shop: ${cleanText(entry.shop) || "none"}`,
    `- customer_email: ${cleanText(entry.customer_email) || "none"}`,
    `- channel: ${cleanText(entry.channel) || "none"}`,
    `- subject: ${cleanText(entry.subject) || "none"}`,
    `- status: ${cleanText(entry.status) || "none"}`,
    "",
    "### body",
    "",
    cleanText(entry.body) || "none",
    "",
  ];

  fs.appendFileSync(LOG_PATH, `${lines.join("\n")}\n`, "utf8");
  return {
    ok: true,
    log_path: LOG_PATH,
    timestamp,
    status: cleanText(entry.status),
  };
}
