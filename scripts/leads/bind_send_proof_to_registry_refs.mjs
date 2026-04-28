#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";

const REGISTRY_PATH = "staffordos/leads/lead_registry_v1.json";
const LEDGER_PATH = "staffordos/leads/send_ledger_v1.json";
const EVENTS_PATH = "staffordos/leads/lead_events_v1.json";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

const registry = readJson(REGISTRY_PATH, {
  version: "lead_registry_v1",
  schema: "canonical_lead_registry_v1",
  items: []
});

const ledger = readJson(LEDGER_PATH, {
  version: "send_ledger_v1",
  items: []
});

const eventsRaw = readJson(EVENTS_PATH, {
  version: "lead_events_v1",
  events: []
});

const items = Array.isArray(registry.items) ? registry.items : [];
const proofs = Array.isArray(ledger.items) ? ledger.items : [];
const events = Array.isArray(eventsRaw.events) ? eventsRaw.events : [];

const proofsByLead = new Map();

for (const proof of proofs) {
  const leadId = proof.lead_id;
  if (!leadId) continue;
  if (!proofsByLead.has(leadId)) proofsByLead.set(leadId, []);
  proofsByLead.get(leadId).push(proof);
}

let updated = 0;
const now = new Date().toISOString();

for (const lead of items) {
  const leadId = lead.id || lead.lead_id;
  const leadProofs = proofsByLead.get(leadId) || [];
  if (!leadProofs.length) continue;

  const existingRefs = lead.refs || {};
  const existingSendIds = Array.isArray(existingRefs.send_ledger_ids)
    ? existingRefs.send_ledger_ids
    : [];

  const nextSendIds = Array.from(
    new Set([
      ...existingSendIds,
      ...leadProofs.map((proof) => proof.id).filter(Boolean)
    ])
  );

  const latestProof = leadProofs
    .slice()
    .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")))[0];

  lead.refs = {
    ...existingRefs,
    send_ledger_ids: nextSendIds
  };

  lead.execution = {
    ...(lead.execution || {}),
    latest_send_proof_id: latestProof?.id || lead.execution?.latest_send_proof_id || null,
    latest_send_proof_status: latestProof?.status || lead.execution?.latest_send_proof_status || null,
    live_send_attempted: latestProof?.live_send_attempted === true
  };

  lead.engagement = {
    ...(lead.engagement || {}),
    sent: nextSendIds.length > 0 || lead.engagement?.sent === true
  };

  lead.updated_at = now;
  updated += 1;

  events.push({
    id: `event_${Date.now()}_${updated}`,
    lead_id: leadId,
    type: "send_proof_bound_to_registry",
    send_ledger_ids: nextSendIds,
    source: "bind_send_proof_to_registry_refs",
    created_at: now
  });
}

registry.items = items;
registry.updated_at = now;
registry.send_proof_bound_at = now;

writeJson(REGISTRY_PATH, registry);
writeJson(EVENTS_PATH, {
  version: "lead_events_v1",
  events
});

console.log(JSON.stringify({
  ok: true,
  proofs_seen: proofs.length,
  leads_updated: updated,
  registry_path: REGISTRY_PATH,
  ledger_path: LEDGER_PATH
}, null, 2));
