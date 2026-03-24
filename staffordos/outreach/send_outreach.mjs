#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const SEND_CONSOLE_PATH = ".tmp/send_console_data.json";

function parseLeadId(argv) {
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--leadId") {
      return String(argv[index + 1] || "").trim();
    }
  }
  return "";
}

async function loadSendConsoleData() {
  const raw = await readFile(SEND_CONSOLE_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`invalid_send_console_data:${SEND_CONSOLE_PATH}`);
  }
  return parsed;
}

function normalizeProblem(record) {
  return String(record?.problemSummary || record?.issueTitle || record?.status || "Shopify dev issue").trim();
}

function buildShopifyDevFixMessage(username, problem) {
  return `Hey ${username} — your post about ${problem} stood out.

I’ve worked through similar Shopify dev issues and built a stable fix path for them.

Happy to take a quick look if you want another set of eyes:
http://dev.abando.ai/fix`;
}

function buildFallbackMessage(username, problem) {
  return `Hey ${username} — your post about ${problem} stood out.

I’ve worked through similar Shopify app setup issues and can usually spot the blocker pretty quickly.

Happy to take a quick look if you want another set of eyes:
http://dev.abando.ai/fix`;
}

function selectMessage(username, problem) {
  const lowered = problem.toLowerCase();
  if (lowered.includes("tunnel") || lowered.includes("preview")) {
    return buildShopifyDevFixMessage(username, problem);
  }
  return buildFallbackMessage(username, problem);
}

export async function sendOutreach(leadId) {
  if (!leadId) {
    throw new Error("missing_lead_id");
  }

  const records = await loadSendConsoleData();
  const lead = records.find((item) => item.id === leadId);
  if (!lead) {
    throw new Error(`lead_not_found:${leadId}`);
  }

  const username = String(lead.name || "there").trim() || "there";
  const problem = normalizeProblem(lead);
  const status = String(lead.status || "").trim() || "unknown";
  const message = selectMessage(username, problem);

  const result = {
    leadId,
    username,
    problem,
    status,
    message,
    copyReady: true,
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  const leadId = parseLeadId(process.argv);
  await sendOutreach(leadId);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[send-outreach] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
