#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { loadLeads } from "./pipeline_manager.mjs";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const SEND_QUEUE_PATH = ".tmp/send_queue.json";
const CONTACT_TARGETS_PATH = ".tmp/contact_targets.json";
const PAYMENT_OFFERS_PATH = ".tmp/payment_offers.json";
const OUTPUT_PATH = ".tmp/send_console_data.json";

async function readJson(path, label) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      throw new Error(`${label} missing at ${path}`);
    }
    throw error;
  }
}

function asMap(items) {
  return new Map(
    (Array.isArray(items) ? items : []).map((item) => [String(item?.id || "").trim(), item]).filter(([id]) => id),
  );
}

function nextActionForStatus(status, fallbackAction) {
  if (status === "new") return "send_initial_outreach";
  if (status === "contacted") return "await_reply_or_followup";
  if (status === "qualified") return "prepare_offer";
  if (status === "replied") return "review_manually";
  if (status === "skipped") return "review_manually";
  return String(fallbackAction || "review_manually").trim() || "review_manually";
}

export async function exportSendConsoleData() {
  const [sendQueue, contactTargets, pipeline] = await Promise.all([
    readJson(SEND_QUEUE_PATH, "send queue"),
    readJson(CONTACT_TARGETS_PATH, "contact targets"),
    loadLeads(),
  ]);
  const paymentOffers = await readJson(PAYMENT_OFFERS_PATH, "payment offers").catch((error) => {
    if (String(error.message || "").includes("missing at")) {
      return [];
    }
    throw error;
  });

  if (!Array.isArray(sendQueue)) {
    throw new Error(`Expected an array in ${SEND_QUEUE_PATH}`);
  }

  const targetById = asMap(contactTargets);
  const pipelineById = asMap(pipeline);
  const paymentByLeadId = new Map(
    (Array.isArray(paymentOffers) ? paymentOffers : [])
      .map((offer) => [String(offer?.leadId || "").trim(), offer])
      .filter(([leadId]) => leadId),
  );
  const generatedAt = new Date().toISOString();

  const records = sendQueue.map((entry) => {
    const id = String(entry?.id || "").trim();
    const target = targetById.get(id) || {};
    const lead = pipelineById.get(id) || {};
    const paymentOffer = paymentByLeadId.get(id) || null;
    return {
      id,
      priorityRank: Number(entry?.priorityRank || 0),
      name: String(entry?.name || target?.name || lead?.name || "unknown").trim() || "unknown",
      score: Number(entry?.score || target?.score || 0),
      status: String(lead?.status || entry?.status || target?.pipelineStatus || "new").trim() || "new",
      nextAction: nextActionForStatus(
        String(lead?.status || entry?.status || target?.pipelineStatus || "new").trim() || "new",
        entry?.nextAction,
      ),
      source: String(entry?.source || target?.source || "unknown").trim() || "unknown",
      channel: String(entry?.channel || target?.primaryChannel || "unknown").trim() || "unknown",
      sendTarget: String(entry?.sendTarget || target?.primaryUrl || lead?.url || "").trim(),
      issueTitle: String(entry?.issueTitle || target?.issueTitle || "").trim(),
      problemSummary: String(entry?.problemSummary || target?.problemSummary || lead?.problem || "").trim(),
      message: String(entry?.message || target?.message || "").trim(),
      followUpMessage: String(entry?.followUpMessage || target?.followUpMessage || "").trim(),
      contactConfidence: String(entry?.contactConfidence || target?.contactConfidence || "low").trim() || "low",
      generatedAt: String(entry?.generatedAt || generatedAt).trim() || generatedAt,
      paymentStatus: paymentOffer?.status || null,
      paymentUrl: paymentOffer?.paymentUrl || null,
      paymentOfferTitle: paymentOffer?.offerTitle || null,
      paymentPriceUsd: paymentOffer?.priceUsd || null,
    };
  });

  await mkdir(".tmp", { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(records, null, 2)}\n`, "utf8");

  console.table(
    records.map((record) => ({
      priorityRank: record.priorityRank,
      id: record.id,
      name: record.name,
      status: record.status,
      nextAction: record.nextAction,
      channel: record.channel,
    })),
  );

  console.log(`\nSaved ${records.length} send console records to ${OUTPUT_PATH}`);
  return records;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  exportSendConsoleData().catch((error) => {
    console.error("[send-console-export] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
