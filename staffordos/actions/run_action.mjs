#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { diagnoseIssue } from "../../scripts/fix/diagnose_issue.mjs";
import { applyFixTemplate } from "../../scripts/fix/apply_fix_template.mjs";
import { generatePaymentOffer } from "../../scripts/leads/generate_payment_offer.mjs";
import { createDeliveryRecord } from "../../scripts/leads/create_delivery_record.mjs";
import { completeDelivery } from "../../scripts/leads/complete_delivery.mjs";
import { loadLeads } from "../../scripts/leads/pipeline_manager.mjs";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

async function loadJsonArray(path) {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--action") {
      args.action = String(argv[index + 1] || "").trim();
      index += 1;
    } else if (token === "--leadId") {
      args.leadId = String(argv[index + 1] || "").trim();
      index += 1;
    } else if (token === "--caseType") {
      args.caseType = String(argv[index + 1] || "").trim();
      index += 1;
    }
  }
  return args;
}

async function withMutedConsole(fn) {
  const original = {
    log: console.log,
    error: console.error,
    table: console.table,
    warn: console.warn,
  };

  console.log = () => {};
  console.error = () => {};
  console.table = () => {};
  console.warn = () => {};

  try {
    return await fn();
  } finally {
    console.log = original.log;
    console.error = original.error;
    console.table = original.table;
    console.warn = original.warn;
  }
}

async function loadLead(leadId) {
  const leads = await loadLeads();
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) {
    throw new Error(`lead_not_found:${leadId}`);
  }
  return lead;
}

async function deriveDiagnosisText(lead) {
  const parts = [lead.problem, lead.name];

  const queueItems = await loadJsonArray(".tmp/send_queue.json");
  const queueItem = queueItems.find((item) => item.id === lead.id);
  if (queueItem) {
    parts.push(queueItem.problemSummary, queueItem.issueTitle);
  }

  for (const message of Array.isArray(lead.messages) ? lead.messages : []) {
    parts.push(message?.text);
  }

  return parts
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean)
    .join("\n");
}

async function runDiagnose(leadId) {
  const lead = await loadLead(leadId);
  const text = await deriveDiagnosisText(lead);
  const diagnosis = await withMutedConsole(() => diagnoseIssue(text));
  return {
    status: "success",
    action: "diagnose",
    leadId,
    caseType: diagnosis.caseType,
    confidence: diagnosis.confidence,
    suggestedFix: diagnosis.suggestedFix,
  };
}

async function runApplyFix(leadId, caseType) {
  let resolvedCaseType = String(caseType || "").trim();
  if (!resolvedCaseType) {
    const diagnosis = await runDiagnose(leadId);
    resolvedCaseType = diagnosis.caseType;
  }

  const steps = await withMutedConsole(() => applyFixTemplate(resolvedCaseType));
  return {
    status: "success",
    action: "apply_fix",
    leadId,
    caseType: resolvedCaseType,
    steps,
  };
}

async function runGeneratePayment(leadId) {
  const offer = await withMutedConsole(() => generatePaymentOffer(leadId));
  return {
    status: "success",
    action: "generate_payment",
    leadId,
    offerId: offer.offerId,
    paymentUrl: offer.paymentUrl,
    priceUsd: offer.priceUsd,
    offerTitle: offer.offerTitle,
  };
}

async function runStartFix(leadId) {
  const delivery = await withMutedConsole(() => createDeliveryRecord(leadId));
  return {
    status: "success",
    action: "start_fix",
    leadId,
    deliveryId: delivery.deliveryId,
    deliveryStatus: delivery.status,
  };
}

async function runComplete(leadId) {
  const delivery = await withMutedConsole(() => completeDelivery(leadId));
  return {
    status: "success",
    action: "complete",
    leadId,
    deliveryId: delivery.deliveryId,
    deliveryStatus: delivery.status,
  };
}

export async function runAction({ action, leadId, caseType = "" }) {
  if (!action) {
    throw new Error("missing_action");
  }
  if (!leadId) {
    throw new Error("missing_lead_id");
  }

  switch (action) {
    case "diagnose":
      return runDiagnose(leadId);
    case "apply_fix":
      return runApplyFix(leadId, caseType);
    case "generate_payment":
      return runGeneratePayment(leadId);
    case "start_fix":
      return runStartFix(leadId);
    case "complete":
      return runComplete(leadId);
    default:
      throw new Error(`unsupported_action:${action}`);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const result = await runAction(args);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.log(
      JSON.stringify(
        {
          status: "error",
          action: parseArgs(process.argv).action || null,
          leadId: parseArgs(process.argv).leadId || null,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exit(1);
  });
}
