#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";

const REGISTRY_PATH = "staffordos/leads/lead_registry_v1.json";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

function slug(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeLead(item, index) {
  const domain = item.domain || item.store_domain || item.send_target || item.sendTarget || item.url || "";
  const name = item.name || item.leadName || item.domain || item.store_domain || `Lead ${index + 1}`;
  const id = item.id || item.lead_id || `lead_${slug(name || domain || index + 1)}`;

  const currentStage =
    item.lifecycle_stage ||
    item.lead_state ||
    item.status?.current_stage ||
    item.status ||
    "new";

  const nextAction =
    item.status?.next_action ||
    item.next_action ||
    item.nextAction ||
    item.lifecycle_stage ||
    "Review lead";

  return {
    id,
    lead_id: item.lead_id || id,
    name,
    domain: item.domain || item.store_domain || null,
    product: item.product || item.product_intent || item.productSource || "shopifixer",
    product_surface: item.product_surface || "staffordmedia_shopifixer",
    source: item.source || "unknown",
    lifecycle_stage: currentStage,
    status: {
      current_stage: currentStage,
      current_bottleneck: item.status?.current_bottleneck || item.current_bottleneck || null,
      next_action: nextAction
    },
    score: item.score ?? item.urgencyScore ?? 0,
    contact: {
      email: item.contact?.email || item.email || "",
      name: item.contact?.name || "",
      role: item.contact?.role || "",
      confidence: item.contact?.confidence || item.contact_confidence || item.contactConfidence || null
    },
    engagement: {
      audit_viewed: Boolean(item.engagement?.audit_viewed),
      experience_viewed: Boolean(item.engagement?.experience_viewed),
      replied: Boolean(item.engagement?.replied),
      approved_for_send: Boolean(item.engagement?.approved_for_send),
      dry_run_ready: Boolean(item.engagement?.dry_run_ready),
      sent: Boolean(item.engagement?.sent || item.status === "sent")
    },
    routing: {
      primary_offer: item.routing?.primary_offer || item.routing?.primary || "shopifixer_audit",
      secondary_offer: item.routing?.secondary_offer || item.routing?.secondary || "abando_recovery",
      do_not_cross_sell_until: item.routing?.do_not_cross_sell_until || "qualified",
      rule: item.routing?.rule || "hold cross-sell until qualified"
    },
    refs: {
      outreach_queue: Boolean(item.refs?.outreach_queue ?? item.runtime_source),
      approval_queue_ids: item.refs?.approval_queue_ids || [],
      send_ledger_ids: item.refs?.send_ledger_ids || [],
      reply_ids: item.refs?.reply_ids || []
    },
    execution: {
      channel: item.channel || "manual",
      send_target: item.send_target || item.sendTarget || item.url || item.website || null,
      message: item.message || item.nextMessage || null,
      follow_up_message: item.follow_up_message || item.followUpMessage || null
    },
    payment: {
      status: item.payment_status || item.paymentStatus || null,
      url: item.payment_url || item.paymentUrl || null
    },
    problem_summary: item.problem_summary || item.problemSummary || item.detectedProblem || item.issueTitle || null,
    runtime_source: item.runtime_source || null,
    created_at: item.created_at || item.generated_at || item.updated_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

const registry = readJson(REGISTRY_PATH, {
  version: "lead_registry_v1",
  items: []
});

const items = Array.isArray(registry.items) ? registry.items : [];
const normalized = items.map(normalizeLead);

writeFileSync(REGISTRY_PATH, JSON.stringify({
  version: "lead_registry_v1",
  schema: "canonical_lead_registry_v1",
  normalized_at: new Date().toISOString(),
  source: registry.source || "lead_registry_shape_normalizer",
  items: normalized
}, null, 2) + "\n");

console.log(JSON.stringify({
  ok: true,
  normalized_count: normalized.length,
  registry_path: REGISTRY_PATH
}, null, 2));
