#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadLeads, makeLeadId } from "./pipeline_manager.mjs";
import { buildFollowUpMessage, buildMessage } from "./generate_outreach_messages.mjs";

const OUTPUT_PATH = ".tmp/contact_targets.json";
const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

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

function githubProfileUrl(name) {
  const login = String(name || "").trim();
  return login ? `https://github.com/${login}` : null;
}

function confidenceRank(value) {
  return value === "high" ? 3 : value === "medium" ? 2 : 1;
}

function determineChannels(lead) {
  const issueUrl = String(lead?.url || "").trim();
  const source = String(lead?.platform || "unknown").trim() || "unknown";
  const fallbackUrl = source === "github" ? githubProfileUrl(lead?.name) : null;

  if (source === "github" && issueUrl) {
    return {
      primaryChannel: "github_issue_comment",
      primaryUrl: issueUrl,
      fallbackChannel: fallbackUrl ? "github_profile" : "unknown",
      fallbackUrl,
      contactConfidence: "high",
      contactNotes: "Issue comment is the clearest first-touch route.",
      status: "ready_to_send",
    };
  }

  if (fallbackUrl) {
    return {
      primaryChannel: "github_profile",
      primaryUrl: fallbackUrl,
      fallbackChannel: "unknown",
      fallbackUrl: null,
      contactConfidence: "medium",
      contactNotes: "Profile is the best available public route from current lead data.",
      status: "ready_to_send",
    };
  }

  return {
    primaryChannel: "unknown",
    primaryUrl: null,
    fallbackChannel: "unknown",
    fallbackUrl: null,
    contactConfidence: "low",
    contactNotes: "No clear contact route was derivable from current lead data.",
    status: "needs_review",
  };
}

export async function main() {
  const [rawLeads, outreach, pipeline] = await Promise.all([
    readJson(".tmp/shopify_dev_leads.json", true),
    readJson(".tmp/shopify_outreach.json", false),
    loadLeads(),
  ]);

  if (!Array.isArray(rawLeads)) {
    throw new Error("Expected .tmp/shopify_dev_leads.json to contain an array");
  }

  const outreachByUrl = new Map(
    Array.isArray(outreach)
      ? outreach.map((entry) => [String(entry?.url || "").trim(), entry])
      : [],
  );
  const pipelineById = new Map(pipeline.map((lead) => [lead.id, lead]));

  const records = rawLeads.map((lead, index) => {
    const id = makeLeadId(lead?.url);
    const pipelineLead = pipelineById.get(id);
    const outreachEntry = outreachByUrl.get(String(lead?.url || "").trim());
    const channelInfo = determineChannels(lead);
    const message = outreachEntry?.message || buildMessage(lead?.name, lead?.detectedProblem, index);
    const followUpMessage =
      outreachEntry?.followUpMessage || buildFollowUpMessage(lead?.name, lead?.detectedProblem, index);

    return {
      id,
      name: String(lead?.name || pipelineLead?.name || "unknown").trim() || "unknown",
      source: String(lead?.platform || "unknown").trim() || "unknown",
      issueUrl: String(lead?.url || "").trim() || null,
      issueTitle: issueTitleFromLead(lead),
      problemSummary: String(pipelineLead?.problem || lead?.detectedProblem || "Shopify dev issue").trim(),
      score: Number(lead?.urgencyScore || 0),
      ...channelInfo,
      message,
      followUpMessage,
      pipelineStatus: pipelineLead?.status || "new",
      confidenceRank: confidenceRank(channelInfo.contactConfidence),
    };
  });

  await writeFile(OUTPUT_PATH, `${JSON.stringify(records, null, 2)}\n`, "utf8");

  console.table(
    records.map((record) => ({
      id: record.id,
      name: record.name,
      primaryChannel: record.primaryChannel,
      primaryUrl: record.primaryUrl,
      contactConfidence: record.contactConfidence,
      status: record.status,
    })),
  );

  console.log(`\nSaved ${records.length} contact targets to ${OUTPUT_PATH}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[contact-enrich] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
