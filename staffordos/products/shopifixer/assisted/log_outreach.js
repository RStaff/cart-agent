import fs from "node:fs";
import path from "node:path";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const LOG_DIR = path.join(CANONICAL_ROOT, "staffordos/products/shopifixer/logs");
const LOG_PATH = path.join(LOG_DIR, "shopifixer_conversation_log_v1.md");

function cleanText(value) {
  return String(value || "").trim();
}

function ensureLogFile() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(LOG_PATH, "# Shopifixer Conversation Log v1\n\n", "utf8");
  }
}

function toBullet(label, value) {
  return `- ${label}: ${cleanText(value) || "none"}`;
}

export function appendShopifixerOutreachLog(entry = {}) {
  const status = cleanText(entry.status);
  if (!["draft_generated", "sent"].includes(status)) {
    throw new Error("invalid_status");
  }

  ensureLogFile();
  const timestamp = new Date().toISOString();
  const lines = [
    `## ${timestamp} · ${status}`,
    "",
    toBullet("store_url", entry.store_url),
    toBullet("contact_email", entry.contact_email),
    toBullet("contact_name", entry.contact_name),
    toBullet("niche", entry.niche),
    toBullet("selected_template", entry.selected_template),
    toBullet("issue_hypothesis", entry.issue_hypothesis),
    toBullet("subject", entry.subject),
    toBullet("gmail_draft_url", entry.gmail_draft_url),
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
    status,
    timestamp,
  };
}

function main() {
  const payload = JSON.parse(fs.readFileSync(0, "utf8"));
  console.log(JSON.stringify(appendShopifixerOutreachLog(payload), null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export { LOG_PATH };
