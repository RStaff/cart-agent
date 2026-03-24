#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { sendOutreach } from "./send_outreach.mjs";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const SEND_CONSOLE_PATH = ".tmp/send_console_data.json";
const PREP_PATH = ".tmp/github_comment_prep.json";

function parseLeadId(argv) {
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--leadId") {
      return String(argv[index + 1] || "").trim();
    }
  }
  return "";
}

async function readJson(path, fallback) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(path, payload) {
  await mkdir(".tmp", { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function withMutedConsole(fn) {
  const originalLog = console.log;
  const originalTable = console.table;
  console.log = () => {};
  console.table = () => {};
  try {
    return await fn();
  } finally {
    console.log = originalLog;
    console.table = originalTable;
  }
}

export async function prepareGithubComment(leadId) {
  if (!leadId) {
    return { ok: false, error: "lead_not_found" };
  }

  const sendConsoleData = await readJson(SEND_CONSOLE_PATH, []);
  const lead = (Array.isArray(sendConsoleData) ? sendConsoleData : []).find((item) => item.id === leadId);
  if (!lead) {
    return { ok: false, error: "lead_not_found" };
  }

  const outreach = await withMutedConsole(() => sendOutreach(leadId));
  const prepRecords = await readJson(PREP_PATH, []);
  const list = Array.isArray(prepRecords) ? prepRecords : [];
  const existing = list.find((item) => item.leadId === leadId);
  const record = {
    leadId,
    name: lead.name,
    sendTarget: lead.sendTarget,
    message: outreach.message,
    statusBefore: String(lead.status || "unknown"),
    statusAfter: "ready_to_post",
    preparedAt: new Date().toISOString(),
  };

  if (existing) {
    Object.assign(existing, record);
  } else {
    list.push(record);
  }
  await writeJson(PREP_PATH, list);

  const result = {
    ok: true,
    leadId,
    name: lead.name,
    sendTarget: lead.sendTarget,
    message: outreach.message,
    statusBefore: String(lead.status || "unknown"),
    statusAfter: "ready_to_post",
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  const leadId = parseLeadId(process.argv);
  const result = await prepareGithubComment(leadId);
  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exit(1);
  });
}
