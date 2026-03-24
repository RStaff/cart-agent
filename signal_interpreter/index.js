import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { listSignals } from "../signals/signal_registry/index.js";
import { getLatestSystemSnapshot } from "../system_state/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "registry.json");

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeRegistry(interpretedSignals) {
  await writeFile(REGISTRY_PATH, JSON.stringify(interpretedSignals, null, 2) + "\n", "utf8");
}

function confidenceRank(confidence) {
  switch (confidence) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function frequencyHint(sampleSize) {
  const value = Number(sampleSize) || 0;
  if (value >= 100) return "high";
  if (value >= 40) return "medium";
  return "low";
}

function impactHint(signalType, value) {
  const numericValue = Number(value) || 0;
  switch (signalType) {
    case "checkout_shipping_dropoff":
    case "mobile_checkout_abandonment":
      if (numericValue >= 0.35) return "high";
      if (numericValue >= 0.25) return "medium";
      return "low";
    case "payment_failure_rate":
      if (numericValue >= 0.15) return "high";
      if (numericValue >= 0.08) return "medium";
      return "low";
    case "sms_recovery_success_rate":
      if (numericValue >= 0.2) return "high";
      if (numericValue >= 0.15) return "medium";
      return "low";
    case "discount_dependency_rate":
      if (numericValue >= 0.5) return "high";
      if (numericValue >= 0.35) return "medium";
      return "low";
    default:
      return "low";
  }
}

function adjustConfidence(baseConfidence, systemState) {
  if (!systemState) return baseConfidence;
  if (systemState.system_health === "blocked") return "low";
  if (systemState.system_health === "partial" && baseConfidence === "high") return "medium";
  return baseConfidence;
}

function latestSignalsByMerchantAndType(signals) {
  const grouped = new Map();
  for (const signal of signals) {
    const key = `${signal.merchant_id}|${signal.signal_type}`;
    const current = grouped.get(key);
    const currentTs = current ? Date.parse(current.timestamp || "") || 0 : 0;
    const nextTs = Date.parse(signal.timestamp || "") || 0;
    if (!current || nextTs >= currentTs) {
      grouped.set(key, signal);
    }
  }
  return Array.from(grouped.values());
}

function maybeInterpretSignal(signal, systemState) {
  const value = Number(signal.value) || 0;
  const baseConfidence = signal.confidence || frequencyHint(signal.sample_size);
  const finalConfidence = adjustConfidence(baseConfidence, systemState);
  const base = {
    id: `interpreted__${signal.id}`,
    source_signal_ids: [signal.id],
    confidence: finalConfidence,
    impact_hint: impactHint(signal.signal_type, value),
    frequency_hint: frequencyHint(signal.sample_size),
    created_at: new Date().toISOString(),
  };

  switch (signal.signal_type) {
    case "checkout_shipping_dropoff":
      if (value < 0.25) return null;
      return {
        ...base,
        interpretation_type: "checkout_friction",
        pattern_summary: `Shipping-stage checkout friction is elevated at ${(value * 100).toFixed(1)}% for merchant ${signal.merchant_id}.`,
        suggested_problem: "shipping_cost_transparency",
      };
    case "mobile_checkout_abandonment":
      if (value < 0.28) return null;
      return {
        ...base,
        interpretation_type: "mobile_checkout_friction",
        pattern_summary: `Mobile checkout abandonment is elevated at ${(value * 100).toFixed(1)}% for merchant ${signal.merchant_id}.`,
        suggested_problem: "mobile_checkout_simplification",
      };
    case "payment_failure_rate":
      if (value < 0.08) return null;
      return {
        ...base,
        interpretation_type: "payment_friction",
        pattern_summary: `Payment failures are elevated at ${(value * 100).toFixed(1)}% for merchant ${signal.merchant_id}.`,
        suggested_problem: "payment_option_optimization",
      };
    case "sms_recovery_success_rate":
      if (value < 0.15) return null;
      return {
        ...base,
        interpretation_type: "recovery_channel_effectiveness",
        pattern_summary: `SMS recovery effectiveness is strong at ${(value * 100).toFixed(1)}% for merchant ${signal.merchant_id}.`,
        suggested_problem: "sms_first_recovery_workflow",
      };
    case "discount_dependency_rate":
      if (value < 0.35) return null;
      return {
        ...base,
        interpretation_type: "recovery_margin_pressure",
        pattern_summary: `Discount dependency is elevated at ${(value * 100).toFixed(1)}% for merchant ${signal.merchant_id}.`,
        suggested_problem: "non_discount_recovery_messaging",
      };
    default:
      return null;
  }
}

export function interpretSignals(signals, systemState = null) {
  return latestSignalsByMerchantAndType(signals)
    .map((signal) => maybeInterpretSignal(signal, systemState))
    .filter(Boolean)
    .sort((a, b) => {
      const confidenceDiff = confidenceRank(b.confidence) - confidenceRank(a.confidence);
      if (confidenceDiff !== 0) return confidenceDiff;
      return a.suggested_problem.localeCompare(b.suggested_problem);
    });
}

export async function listInterpretedSignals() {
  const interpretedSignals = await readRegistry();
  return interpretedSignals.sort((a, b) => {
    const timeA = Date.parse(a.created_at || "") || 0;
    const timeB = Date.parse(b.created_at || "") || 0;
    return timeB - timeA;
  });
}

export async function getLatestInterpretedSignals() {
  return listInterpretedSignals();
}

export async function runSignalInterpreter() {
  const [signals, systemState] = await Promise.all([
    listSignals(),
    getLatestSystemSnapshot(),
  ]);

  const interpretedSignals = interpretSignals(signals, systemState);
  await writeRegistry(interpretedSignals);

  return {
    interpreted_signals: interpretedSignals,
    count: interpretedSignals.length,
    recommended_next_action:
      interpretedSignals.length > 0
        ? "Use interpreted signals as the next input to candidate opportunity generation."
        : "Collect more merchant signals before generating interpreted signal output.",
    reasoning_summary:
      "Interpreted signals were generated deterministically from the latest merchant signals, with system state used only as an optional confidence side-input.",
  };
}
