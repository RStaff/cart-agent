#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { appendMessage, loadLeads, saveLeads, updateStatus } from "./pipeline_manager.mjs";
import { exportSendConsoleData } from "./export_send_console_data.mjs";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const ALLOWED_STATUSES = new Set(["contacted", "skipped", "replied", "qualified"]);

function parseArgs(argv) {
  const args = { note: "", refresh: true };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--id") {
      args.id = argv[index + 1];
      index += 1;
    } else if (token === "--status") {
      args.status = argv[index + 1];
      index += 1;
    } else if (token === "--note") {
      args.note = argv[index + 1] || "";
      index += 1;
    } else if (token === "--no-refresh") {
      args.refresh = false;
    }
  }
  return args;
}

async function updateWithNote(id, status, note) {
  const lead = await updateStatus(id, status);
  if (String(note || "").trim()) {
    await appendMessage(id, "note", note);
    const leads = await loadLeads();
    return leads.find((item) => item.id === id) || lead;
  }
  return lead;
}

export async function main(argv = process.argv) {
  const args = parseArgs(argv);
  const id = String(args.id || "").trim();
  const status = String(args.status || "").trim();

  if (!id) {
    throw new Error("Missing required --id");
  }
  if (!ALLOWED_STATUSES.has(status)) {
    throw new Error(`Invalid --status. Expected one of: ${Array.from(ALLOWED_STATUSES).join(", ")}`);
  }

  const lead = await updateWithNote(id, status, args.note);
  if (args.refresh) {
    await exportSendConsoleData();
  }

  console.table([
    {
      id: lead.id,
      name: lead.name,
      status: lead.status,
      lastUpdated: lead.lastUpdated,
    },
  ]);

  return lead;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[send-console-update] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
