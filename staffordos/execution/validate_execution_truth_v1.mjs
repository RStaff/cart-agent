#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function resolveRepoRoot() {
  const cwd = process.cwd();
  const candidates = [cwd, path.resolve(cwd, "..", ".."), path.resolve(cwd, "../../..")];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "staffordos/execution/execution_log_v1.json"))) return candidate;
  }

  return cwd;
}

const ROOT = resolveRepoRoot();
const EXECUTION_PATH = path.join(ROOT, "staffordos/execution/execution_log_v1.json");
const OUTCOME_PATH = path.join(ROOT, "staffordos/execution/outcome_events_v1.json");

const REQUIRED_EXECUTION_ACTIONS = new Set([
  "offer_sent",
  "follow_up_sent",
  "follow_up_recommended",
  "follow_up_action_selected",
  "follow_up_attempted_failed",
  "payment_followup_pending",
  "payment_received",
  "fulfillment_started",
  "proof_ready",
  "completion_marked",
  "referral_requested",
  "referral_received",
  "expansion_created",
  "account_marked_dormant",
  "account_marked_at_risk",
]);

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function assert(condition, message, issues) {
  if (!condition) issues.push(message);
}

function validateExecutionLog(filePath) {
  const report = readJson(filePath, { schema: "", events: [] });
  const issues = [];
  const events = Array.isArray(report.events) ? report.events : [];

  assert(report.schema === "staffordos.execution_log.v1", "execution schema mismatch", issues);
  assert(events.length > 0, "execution log is empty", issues);

  for (const event of events) {
    assert(Boolean(event.execution_id), "execution record missing execution_id", issues);
    assert(Boolean(event.timestamp), "execution record missing timestamp", issues);
    assert(Boolean(event.operator), "execution record missing operator", issues);
    assert(Boolean(event.action_type), "execution record missing action_type", issues);
    assert(REQUIRED_EXECUTION_ACTIONS.has(String(event.action_type)), `unsupported execution action_type: ${event.action_type}`, issues);
    assert(Boolean(event.customer), "execution record missing customer", issues);
    assert(Boolean(event.product), "execution record missing product", issues);
    assert(Boolean(event.stage), "execution record missing stage", issues);
    assert(Boolean(event.outcome), "execution record missing outcome", issues);
    assert(Boolean(event.revenue_impact), "execution record missing revenue_impact", issues);
    assert(Boolean(event.notes), "execution record missing notes", issues);
  }

  return {
    ok: issues.length === 0,
    file: filePath,
    count: events.length,
    latest_timestamp: events[0]?.timestamp || null,
    issues,
  };
}

function validateOutcomeLog(filePath) {
  const report = readJson(filePath, { schema: "", events: [] });
  const issues = [];
  const events = Array.isArray(report.events) ? report.events : [];

  assert(report.schema === "staffordos.outcome_events.v1", "outcome schema mismatch", issues);
  assert(events.length > 0, "outcome event log is empty", issues);

  for (const event of events) {
    assert(Boolean(event.event_id), "outcome record missing event_id", issues);
    assert(Boolean(event.timestamp), "outcome record missing timestamp", issues);
    assert(Boolean(event.customer), "outcome record missing customer", issues);
    assert(Boolean(event.previous_state), "outcome record missing previous_state", issues);
    assert(Boolean(event.new_state), "outcome record missing new_state", issues);
    assert(Boolean(event.trigger), "outcome record missing trigger", issues);
    assert(typeof event.confidence === "number" && event.confidence >= 0 && event.confidence <= 1, "outcome record confidence must be 0..1", issues);
  }

  return {
    ok: issues.length === 0,
    file: filePath,
    count: events.length,
    latest_timestamp: events[0]?.timestamp || null,
    issues,
  };
}

const execution = validateExecutionLog(EXECUTION_PATH);
const outcome = validateOutcomeLog(OUTCOME_PATH);
const ok = execution.ok && outcome.ok;

console.log(JSON.stringify({ ok, execution, outcome }, null, 2));

if (!ok) {
  process.exit(1);
}
