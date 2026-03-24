#!/usr/bin/env node

import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const PIPELINE_PATH = ".tmp/leads_pipeline.json";
const VALID_STATUSES = new Set([
  "new",
  "contacted",
  "skipped",
  "replied",
  "qualified",
  "closed",
  "delivered",
  "won",
  "lost",
  "do_not_contact",
]);

function nowIso() {
  return new Date().toISOString();
}

export function makeLeadId(url) {
  return `lead_${crypto.createHash("sha1").update(String(url || "")).digest("hex").slice(0, 12)}`;
}

export async function loadLeads() {
  try {
    const raw = await readFile(PIPELINE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function saveLeads(leads) {
  await mkdir(".tmp", { recursive: true });
  await writeFile(PIPELINE_PATH, `${JSON.stringify(leads, null, 2)}\n`, "utf8");
  return leads;
}

export async function getLeadsByStatus(status) {
  const leads = await loadLeads();
  return leads.filter((lead) => lead.status === status);
}

export async function updateStatus(id, status) {
  if (!VALID_STATUSES.has(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  const leads = await loadLeads();
  const lead = leads.find((item) => item.id === id);
  if (!lead) {
    throw new Error(`Lead not found: ${id}`);
  }
  lead.status = status;
  lead.lastUpdated = nowIso();
  await saveLeads(leads);
  return lead;
}

export async function appendMessage(id, role, text) {
  const leads = await loadLeads();
  const lead = leads.find((item) => item.id === id);
  if (!lead) {
    throw new Error(`Lead not found: ${id}`);
  }
  lead.messages = Array.isArray(lead.messages) ? lead.messages : [];
  lead.messages.push({
    role: String(role || "note").trim() || "note",
    text: String(text || "").trim(),
    createdAt: nowIso(),
  });
  lead.lastUpdated = nowIso();
  await saveLeads(leads);
  return lead;
}

export async function upsertPipelineLeads(rawLeads, issueSummary = "") {
  const leads = await loadLeads();
  const byId = new Map(leads.map((lead) => [lead.id, lead]));
  const timestamp = nowIso();

  for (const rawLead of rawLeads) {
    const url = String(rawLead?.url || "").trim();
    if (!url) continue;

    const id = makeLeadId(url);
    const existing = byId.get(id);
    const problem = String(rawLead?.detectedProblem || rawLead?.problem || "Shopify dev issue").trim();
    const systemMessage = issueSummary
      ? {
          role: "system",
          text: `Current internal fix context: ${issueSummary}`,
          createdAt: timestamp,
        }
      : null;

    if (existing) {
      existing.name = String(rawLead?.name || existing.name || "unknown").trim() || "unknown";
      existing.url = url;
      existing.problem = problem;
      existing.lastUpdated = timestamp;
      existing.messages = Array.isArray(existing.messages) ? existing.messages : [];
      if (systemMessage) {
        const alreadyAttached = existing.messages.some(
          (message) => message.role === "system" && message.text === systemMessage.text,
        );
        if (!alreadyAttached) {
          existing.messages.push(systemMessage);
        }
      }
      continue;
    }

    const entry = {
      id,
      name: String(rawLead?.name || "unknown").trim() || "unknown",
      url,
      problem,
      status: "new",
      createdAt: timestamp,
      lastUpdated: timestamp,
      messages: systemMessage ? [systemMessage] : [],
    };
    byId.set(id, entry);
    leads.push(entry);
  }

  await saveLeads(leads);
  return leads;
}

function printTable(leads) {
  console.table(
    leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      status: lead.status,
      lastUpdated: lead.lastUpdated,
    })),
  );
}

export async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "--status" && args[1]) {
    const leads = await getLeadsByStatus(args[1]);
    printTable(leads);
    return;
  }

  if (args[0] === "--update" && args[1] && args[2]) {
    const lead = await updateStatus(args[1], args[2]);
    printTable([lead]);
    return;
  }

  if (args[0] === "--append" && args[1] && args[2] && args[3]) {
    const text = args.slice(3).join(" ");
    const lead = await appendMessage(args[1], args[2], text);
    printTable([lead]);
    return;
  }

  const leads = await loadLeads();
  printTable(leads);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[pipeline] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
