import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { recordReplyTruth, getLeadTruth } from "../../staffordos/truth/lead_truth_store.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const sendConsolePath = resolve(repoRoot, ".tmp", "send_console_data.json");

const DEFAULT_REPLY_TEXT = "I’m still stuck on this. What do you need from me to get the setup stable?";
const DEFAULT_NOTE = "local hot lead proof seed";

async function readJson(path, fallback) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

async function main() {
  const leadId = String(getArgValue("--leadId") || "").trim();
  if (!leadId) {
    throw new Error("lead_id_required");
  }

  const sendConsole = await readJson(sendConsolePath, []);
  const lead = (Array.isArray(sendConsole) ? sendConsole : []).find((item) => item?.id === leadId) || null;
  const githubIssueUrl = String(lead?.sendTarget || "").trim();

  const truth = await getLeadTruth(leadId, githubIssueUrl);

  if (!truth.firstComment?.sent) {
    throw new Error("cannot_seed_reply_before_first_comment");
  }

  if (String(truth.payment?.status || "none") !== "none") {
    throw new Error("cannot_seed_reply_when_payment_is_not_none");
  }

  if (truth.reply?.exists) {
    throw new Error("reply_already_exists");
  }

  const result = await recordReplyTruth(
    leadId,
    githubIssueUrl,
    DEFAULT_REPLY_TEXT,
    DEFAULT_NOTE,
  );

  if (!result.ok) {
    throw new Error(result.reason || "seed_failed");
  }

  console.log(JSON.stringify({
    ok: true,
    leadId,
    reply: result.truth.reply,
    paymentStatus: result.truth.payment?.status || "none",
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
});
