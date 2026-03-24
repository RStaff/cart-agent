import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { loadLeadTruthStore, saveLeadTruthStore } from "../../truth/lead_truth_store.mjs";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..", "..");
const eventsPath = resolve(repoRoot, ".tmp", "github_reply_events.json");
const sendConsoleDataPath = resolve(repoRoot, ".tmp", "send_console_data.json");

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(path, value) {
  await mkdir(resolve(repoRoot, ".tmp"), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function previewText(value = "", maxLength = 140) {
  const singleLine = String(value || "").replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLength) {
    return singleLine;
  }
  return `${singleLine.slice(0, maxLength - 1)}…`;
}

export async function processGithubReplies(parsedReplies = [], emails = []) {
  const [store, events, sendConsoleData] = await Promise.all([
    loadLeadTruthStore(),
    readJson(eventsPath, []),
    readJson(sendConsoleDataPath, []),
  ]);

  const byIssueUrl = new Map(
    Object.entries(store.leads || {})
      .filter(([, truth]) => String(truth?.githubIssueUrl || "").trim())
      .map(([leadId, truth]) => [String(truth.githubIssueUrl).trim(), { leadId, truth }]),
  );

  const namesByLeadId = new Map(
    (Array.isArray(sendConsoleData) ? sendConsoleData : [])
      .map((item) => [String(item?.id || "").trim(), String(item?.name || "").trim()])
      .filter(([leadId]) => leadId),
  );

  let repliesDetected = 0;
  let leadsUpdated = 0;
  let newReplyAlerts = 0;
  const alerts = [];

  for (let index = 0; index < parsedReplies.length; index += 1) {
    const parsed = parsedReplies[index];
    if (!parsed?.githubIssueUrl || !parsed?.replyText) {
      continue;
    }

    repliesDetected += 1;
    const match = byIssueUrl.get(String(parsed.githubIssueUrl).trim());
    if (!match) {
      continue;
    }

    const { leadId, truth } = match;
    if (!truth.firstComment.sent || truth.reply.exists) {
      continue;
    }

    truth.reply = {
      exists: true,
      timestamp: String(parsed.timestamp || "").trim() || new Date().toISOString(),
      text: String(parsed.replyText || "").trim(),
      note: "auto-detected from gmail github notification",
    };

    events.push({
      leadId,
      githubIssueUrl: truth.githubIssueUrl,
      detectedAt: new Date().toISOString(),
      emailSubject: String(emails[index]?.subject || "").trim() || null,
    });

    const alert = {
      leadId,
      name: namesByLeadId.get(leadId) || "unknown",
      issue: truth.githubIssueUrl,
      replyPreview: previewText(parsed.replyText),
      timestamp: truth.reply.timestamp,
    };

    alerts.push(alert);
    leadsUpdated += 1;
    newReplyAlerts += 1;
  }

  await Promise.all([
    saveLeadTruthStore(store),
    writeJson(eventsPath, events),
  ]);

  return {
    repliesDetected,
    leadsUpdated,
    newReplyAlerts,
    alerts,
  };
}
