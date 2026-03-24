#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadLeads } from "./pipeline_manager.mjs";
import { buildMessage } from "./generate_outreach_messages.mjs";

const OUTPUT_PATH = ".tmp/send_queue.json";
const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);
const INCLUDED_STATUSES = new Set(["new", "contacted", "qualified"]);
const CONFIDENCE_ORDER = { high: 3, medium: 2, low: 1 };

async function readJson(path, required = false) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (!required && error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function actionForStatus(status) {
  if (status === "contacted") return "await_reply_or_followup";
  if (status === "qualified") return "prepare_offer";
  return "send_initial_outreach";
}

export async function main() {
  const [targets, pipeline] = await Promise.all([
    readJson(".tmp/contact_targets.json", true),
    loadLeads(),
  ]);

  if (!Array.isArray(targets)) {
    throw new Error("Expected .tmp/contact_targets.json to contain an array");
  }

  const pipelineById = new Map(pipeline.map((lead) => [lead.id, lead]));

  const queue = targets
    .map((target) => {
      const pipelineLead = pipelineById.get(target.id);
      const status = pipelineLead?.status || target.pipelineStatus || "new";
      if (!INCLUDED_STATUSES.has(status)) {
        return null;
      }

      const nextAction = actionForStatus(status);
      const nextMessage =
        nextAction === "await_reply_or_followup"
          ? target.followUpMessage
          : target.message || buildMessage(target.name, target.problemSummary, 0);

      return {
        id: target.id,
        name: target.name,
        score: Number(target.score || 0),
        status,
        nextAction,
        channel: target.primaryChannel,
        sendTarget: target.primaryUrl,
        message: nextMessage,
        followUpMessage: target.followUpMessage,
        offerTrigger: "after_reply",
        priorityRank: 0,
        issueTitle: target.issueTitle || null,
        source: target.source || "unknown",
        problemSummary: target.problemSummary,
        contactConfidence: target.contactConfidence,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      const confidenceDiff =
        (CONFIDENCE_ORDER[b.contactConfidence] || 0) - (CONFIDENCE_ORDER[a.contactConfidence] || 0);
      if (confidenceDiff !== 0) return confidenceDiff;
      return a.id.localeCompare(b.id) || a.name.localeCompare(b.name);
    })
    .map((item, index) => ({
      ...item,
      priorityRank: index + 1,
      generatedAt: new Date().toISOString(),
    }));

  await writeFile(OUTPUT_PATH, `${JSON.stringify(queue, null, 2)}\n`, "utf8");

  console.table(
    queue.map((item) => ({
      priorityRank: item.priorityRank,
      id: item.id,
      name: item.name,
      score: item.score,
      nextAction: item.nextAction,
      channel: item.channel,
      sendTarget: item.sendTarget,
    })),
  );

  console.log(`\nSaved ${queue.length} send-queue records to ${OUTPUT_PATH}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[send-queue] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
