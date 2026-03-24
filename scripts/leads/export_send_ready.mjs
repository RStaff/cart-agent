#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { loadLeads, makeLeadId } from "./pipeline_manager.mjs";
import { buildMessage } from "./generate_outreach_messages.mjs";

const LEADS_PATH = ".tmp/shopify_dev_leads.json";
const OUTREACH_PATH = ".tmp/shopify_outreach.json";
const OUTPUT_PATH = ".tmp/send_ready.json";
const DEFAULT_LIMIT = 10;
const EXCLUDED_STATUSES = new Set(["closed", "won", "lost", "do_not_contact"]);
const DEFAULT_INCLUDED_STATUSES = new Set(["new", "qualified"]);

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

function issueTitleFromLead(lead) {
  const text = String(lead?.text || "").trim();
  if (!text) return null;
  const [title] = text.split(" — ");
  return title || null;
}

function fallbackMessage(lead) {
  return buildMessage(lead?.name, lead?.problem || lead?.detectedProblem || "Shopify app dev issue", 0);
}

function shouldIncludeLead(pipelineLead) {
  if (!pipelineLead || EXCLUDED_STATUSES.has(pipelineLead.status)) {
    return false;
  }
  return DEFAULT_INCLUDED_STATUSES.has(pipelineLead.status);
}

export async function main() {
  const limitArgIndex = process.argv.indexOf("--limit");
  const limit =
    limitArgIndex >= 0 && Number.isFinite(Number(process.argv[limitArgIndex + 1]))
      ? Number(process.argv[limitArgIndex + 1])
      : DEFAULT_LIMIT;

  const [pipeline, rawLeads, outreach] = await Promise.all([
    loadLeads(),
    readJson(LEADS_PATH, true),
    readJson(OUTREACH_PATH, false),
  ]);

  if (!Array.isArray(rawLeads)) {
    throw new Error("Expected .tmp/shopify_dev_leads.json to contain an array");
  }

  const leadById = new Map(
    rawLeads.map((lead) => [makeLeadId(lead?.url), lead]),
  );
  const outreachByUrl = new Map(
    Array.isArray(outreach)
      ? outreach.map((entry) => [String(entry?.url || "").trim(), entry])
      : [],
  );

  const sendReady = pipeline
    .filter(shouldIncludeLead)
    .map((pipelineLead) => {
      const rawLead = leadById.get(pipelineLead.id) || {};
      const outreachEntry = outreachByUrl.get(String(pipelineLead.url || "").trim());
      const score = Number(rawLead?.urgencyScore || 0);
      const issueTitle = issueTitleFromLead(rawLead);
      const outboundMessages = Array.isArray(pipelineLead.messages)
        ? pipelineLead.messages.filter((message) => message.role !== "system")
        : [];
      const nextAction = outboundMessages.length === 0 ? "send_initial_outreach" : "review_manually";

      return {
        id: pipelineLead.id,
        name: pipelineLead.name,
        url: pipelineLead.url,
        score,
        status: pipelineLead.status,
        issueTitle,
        problemSummary: pipelineLead.problem,
        nextMessage: outreachEntry?.message || fallbackMessage({ ...pipelineLead, ...rawLead }),
        nextAction,
        source: rawLead?.platform || "unknown",
        generatedAt: new Date().toISOString(),
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);

  await writeFile(OUTPUT_PATH, `${JSON.stringify(sendReady, null, 2)}\n`, "utf8");

  console.table(
    sendReady.map((lead) => ({
      id: lead.id,
      name: lead.name,
      score: lead.score,
      status: lead.status,
      nextAction: lead.nextAction,
      url: lead.url,
    })),
  );

  console.log(`\nExported ${sendReady.length} send-ready leads to ${OUTPUT_PATH}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[send-ready] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
