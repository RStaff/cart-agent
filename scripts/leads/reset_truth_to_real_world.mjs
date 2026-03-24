#!/usr/bin/env node

import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { loadLeads } from "./pipeline_manager.mjs";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
const truthPath = resolve(repoRoot, ".tmp", "lead_truth.json");

function nowIso() {
  return new Date().toISOString();
}

function blankReply() {
  return {
    exists: false,
    timestamp: null,
    text: null,
    note: null,
  };
}

function blankPayment() {
  return {
    status: "none",
    timestamp: null,
    paymentUrl: null,
    offerId: null,
    note: null,
  };
}

function blankComment() {
  return {
    sent: false,
    timestamp: null,
    messageHash: null,
    note: null,
  };
}

function parseArgs(argv) {
  const args = { wipeAllComments: false, leadId: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--wipe-all-comments") {
      args.wipeAllComments = true;
      continue;
    }
    if (value === "--leadId") {
      args.leadId = String(argv[index + 1] || "").trim();
      index += 1;
    }
  }
  return args;
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function backupTruthFile() {
  await mkdir(resolve(repoRoot, ".tmp"), { recursive: true });
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const backupPath = resolve(repoRoot, `.tmp/lead_truth.backup.${stamp}.json`);
  try {
    await copyFile(truthPath, backupPath);
  } catch {
    await writeFile(backupPath, `${JSON.stringify({ version: 1, updatedAt: nowIso(), leads: {} }, null, 2)}\n`, "utf8");
  }
  return backupPath;
}

function countTruth(store) {
  const leads = Object.values(store?.leads || {});
  return {
    total: leads.length,
    firstCommentsSent: leads.filter((lead) => lead?.firstComment?.sent).length,
    replies: leads.filter((lead) => lead?.reply?.exists).length,
    linkSent: leads.filter((lead) => lead?.payment?.status === "link_sent").length,
    paid: leads.filter((lead) => lead?.payment?.status === "paid").length,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [existing, pipeline] = await Promise.all([
    readJson(truthPath, { version: 1, updatedAt: nowIso(), leads: {} }),
    loadLeads(),
  ]);

  const backupPath = await backupTruthFile();
  const store = existing && typeof existing === "object" && !Array.isArray(existing)
    ? existing
    : { version: 1, updatedAt: nowIso(), leads: {} };
  store.version = 1;
  store.updatedAt = nowIso();
  store.leads = store.leads && typeof store.leads === "object" ? store.leads : {};

  for (const lead of Array.isArray(pipeline) ? pipeline : []) {
    const leadId = String(lead?.id || "").trim();
    if (!leadId) continue;
    if (!store.leads[leadId]) {
      store.leads[leadId] = {
        leadId,
        githubIssueUrl: String(lead?.url || "").trim() || null,
        firstComment: blankComment(),
        reply: blankReply(),
        payment: blankPayment(),
      };
    } else if (!store.leads[leadId].githubIssueUrl && lead?.url) {
      store.leads[leadId].githubIssueUrl = String(lead.url).trim();
    }
  }

  const before = countTruth(store);
  const targetIds = args.leadId
    ? [args.leadId]
    : Object.keys(store.leads);

  for (const leadId of targetIds) {
    if (!store.leads[leadId]) {
      store.leads[leadId] = {
        leadId,
        githubIssueUrl: null,
        firstComment: blankComment(),
        reply: blankReply(),
        payment: blankPayment(),
      };
    }

    const record = store.leads[leadId];
    if (args.wipeAllComments) {
      record.firstComment = blankComment();
    } else {
      record.firstComment = {
        sent: true,
        timestamp: record.firstComment?.timestamp || null,
        messageHash: record.firstComment?.messageHash || null,
        note: record.firstComment?.note || null,
      };
    }
    record.reply = blankReply();
    record.payment = blankPayment();
  }

  store.updatedAt = nowIso();
  await writeFile(truthPath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  const after = countTruth(store);

  console.log(JSON.stringify({
    ok: true,
    backupPath,
    mode: args.wipeAllComments ? "wipe_all_comments" : "preserve_or_mark_comments_sent",
    leadId: args.leadId || null,
    before,
    after,
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[reset-truth] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
