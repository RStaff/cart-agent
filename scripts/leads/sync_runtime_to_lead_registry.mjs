#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const SOURCES = [
  ".tmp/send_console_data.json",
  ".tmp/send_ready.json",
  ".tmp/send_queue.json",
  ".tmp/leads_pipeline.json"
];

const REGISTRY_PATH = "staffordos/leads/lead_registry_v1.json";
const EVENTS_PATH = "staffordos/leads/lead_events_v1.json";

function readJson(filePath, fallback) {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.leads)) return payload.leads;
  return [];
}

function stableId(item, index) {
  return (
    item.id ||
    item.lead_id ||
    item.url ||
    item.sendTarget ||
    item.name ||
    `runtime_lead_${index + 1}`
  );
}

function normalize(item, index, sourcePath) {
  const now = new Date().toISOString();

  return {
    id: stableId(item, index),
    name: item.name || item.leadName || item.domain || item.store_domain || `Lead ${index + 1}`,
    product: item.product || item.productSource || "shopifixer",
    source: item.source || item.platform || "runtime_pipeline",
    status: item.status || item.leadStage || "new",
    lifecycle_stage: item.lifecycle_stage || item.nextAction || "send_initial_outreach",
    score: item.score ?? item.urgencyScore ?? 0,
    send_target: item.sendTarget || item.url || item.website || null,
    channel: item.channel || "manual",
    problem_summary: item.problemSummary || item.detectedProblem || item.issueTitle || null,
    message: item.message || item.nextMessage || null,
    follow_up_message: item.followUpMessage || null,
    contact_confidence: item.contactConfidence || null,
    payment_status: item.paymentStatus || null,
    payment_url: item.paymentUrl || null,
    generated_at: item.generatedAt || now,
    updated_at: now,
    runtime_source: sourcePath,
    routing: {
      primary: "shopifixer",
      secondary: "abando_recovery",
      rule: "hold cross-sell until qualified"
    }
  };
}

function merge(existing, incoming) {
  return {
    ...existing,
    ...incoming,
    created_at: existing.created_at || incoming.generated_at || incoming.updated_at,
    updated_at: incoming.updated_at
  };
}

const registry = readJson(REGISTRY_PATH, {
  version: "lead_registry_v1",
  items: []
});

const rawEvents = readJson(EVENTS_PATH, {
  version: "lead_events_v1",
  events: []
});

const events = {
  version: rawEvents?.version || "lead_events_v1",
  events: Array.isArray(rawEvents?.events)
    ? rawEvents.events
    : Array.isArray(rawEvents)
      ? rawEvents
      : []
};

const existingItems = Array.isArray(registry.items)
  ? registry.items.map((item) => ({
      ...item,
      id: item.id || item.lead_id || item.domain || item.name
    }))
  : [];
const byId = new Map(existingItems.map((item) => [item.id, item]));

let imported = 0;
let sourceUsed = null;

for (const sourcePath of SOURCES) {
  const payload = readJson(sourcePath, null);
  const records = asArray(payload);

  if (!records.length) continue;

  sourceUsed = sourcePath;

  records.forEach((item, index) => {
    const normalized = normalize(item, index, sourcePath);
    const previous = byId.get(normalized.id);

    byId.set(normalized.id, previous ? merge(previous, normalized) : {
      ...normalized,
      created_at: normalized.generated_at || normalized.updated_at
    });

    events.events.push({
      id: `event_${Date.now()}_${index}`,
      lead_id: normalized.id,
      type: previous ? "lead_registry_updated" : "lead_registry_created",
      source: sourcePath,
      created_at: normalized.updated_at
    });

    imported += 1;
  });

  break;
}

const nextRegistry = {
  version: "lead_registry_v1",
  updated_at: new Date().toISOString(),
  source: sourceUsed || "no-runtime-source-found",
  items: Array.from(byId.values())
};

writeJson(REGISTRY_PATH, nextRegistry);
writeJson(EVENTS_PATH, events);

console.log(JSON.stringify({
  ok: true,
  source_used: sourceUsed,
  imported,
  registry_count: nextRegistry.items.length,
  registry_path: REGISTRY_PATH,
  events_path: EVENTS_PATH
}, null, 2));
