import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { listSignals } from "../signals/signal_registry/index.js";
import { listInterpretedSignals } from "../signal_interpreter/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "registry.json");
const CANDIDATE_OPPORTUNITY_SCHEMA_VERSION = "v1";

function normalizeText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeRegistry(candidates) {
  await writeFile(REGISTRY_PATH, JSON.stringify(candidates, null, 2) + "\n", "utf8");
}

function inferLegacyScore(base, fallbackWeight) {
  const normalizedBase = Number(base) || 0;
  return Math.max(0, Math.min(100, Math.round(normalizedBase / fallbackWeight)));
}

function normalizeCandidateOpportunity(candidate) {
  const impactScore = Number(candidate?.impact_score) || 0;
  const frequencyScore = Number(candidate?.frequency_score) || inferLegacyScore(impactScore, 80);
  const easeScore = Number(candidate?.ease_score) || inferLegacyScore(impactScore, 100);
  const strategicFitScore = Number(candidate?.strategic_fit_score) || inferLegacyScore(impactScore, 75);
  return {
    ...candidate,
    schema_version: candidate?.schema_version || CANDIDATE_OPPORTUNITY_SCHEMA_VERSION,
    source_signals: Array.isArray(candidate?.source_signals) ? candidate.source_signals : [],
    interpreted_signal_ids: Array.isArray(candidate?.interpreted_signal_ids) ? candidate.interpreted_signal_ids : [],
    impact_score: impactScore,
    frequency_score: frequencyScore,
    ease_score: easeScore,
    strategic_fit_score: strategicFitScore,
    total_score:
      Number(candidate?.total_score) || (impactScore + frequencyScore + easeScore + strategicFitScore),
    status: candidate?.status || "generated",
    created_at: candidate?.created_at || new Date().toISOString(),
  };
}

function buildFrequencyScore(sampleSize) {
  return Math.max(0, Math.min(100, Math.round((Number(sampleSize) || 0) / 2)));
}

function buildEaseScore(signalType) {
  switch (signalType) {
    case "checkout_shipping_dropoff":
    case "payment_failure_rate":
      return 80;
    case "mobile_checkout_abandonment":
      return 75;
    case "sms_recovery_success_rate":
    case "discount_dependency_rate":
      return 70;
    default:
      return 60;
  }
}

function buildStrategicFitScore(signalType) {
  switch (signalType) {
    case "checkout_shipping_dropoff":
    case "mobile_checkout_abandonment":
    case "payment_failure_rate":
      return 90;
    case "sms_recovery_success_rate":
      return 85;
    case "discount_dependency_rate":
      return 80;
    default:
      return 60;
  }
}

function buildImpactScoreFromHint(hint) {
  switch (hint) {
    case "high":
      return 90;
    case "medium":
      return 70;
    default:
      return 45;
  }
}

function buildFrequencyScoreFromHint(hint) {
  switch (hint) {
    case "high":
      return 80;
    case "medium":
      return 60;
    default:
      return 35;
  }
}

function buildConfidenceFromInterpretedSignal(signal) {
  const confidence = normalizeText(signal?.confidence)?.toLowerCase();
  return confidence || "medium";
}

function confidenceFromSampleSize(sampleSize) {
  if (sampleSize >= 100) return "high";
  if (sampleSize >= 40) return "medium";
  return "low";
}

function buildImpactScore(value, sampleSize) {
  const normalizedValue = Math.max(0, Math.min(1, Number(value) || 0));
  const normalizedSample = Math.max(0, Math.min(1, (Number(sampleSize) || 0) / 100));
  return Math.round((normalizedValue * 70 + normalizedSample * 30) * 100);
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

function buildCandidateFromSignal(signal) {
  const sampleSize = Number(signal.sample_size) || 0;
  const value = Number(signal.value) || 0;
  const confidence = confidenceFromSampleSize(sampleSize);
  const impactScore = buildImpactScore(value, sampleSize);
  const frequencyScore = buildFrequencyScore(sampleSize);
  const easeScore = buildEaseScore(signal.signal_type);
  const strategicFitScore = buildStrategicFitScore(signal.signal_type);
  const totalScore = impactScore + frequencyScore + easeScore + strategicFitScore;

  switch (signal.signal_type) {
    case "checkout_shipping_dropoff":
      if (value < 0.25) return null;
      return {
        id: `${signal.merchant_id}__shipping_transparency_improvement`,
        schema_version: CANDIDATE_OPPORTUNITY_SCHEMA_VERSION,
        title: "Shipping Transparency Improvement",
        opportunity_class: "checkout_optimization",
        source_signals: [signal.id],
        interpreted_signal_ids: [],
        pattern_summary: `Shipping-step dropoff is elevated at ${(value * 100).toFixed(1)}% across ${sampleSize} observed sessions.`,
        suggested_solution: "Test earlier shipping-cost visibility and clearer shipping threshold messaging before checkout.",
        confidence,
        impact_score: impactScore,
        frequency_score: frequencyScore,
        ease_score: easeScore,
        strategic_fit_score: strategicFitScore,
        total_score: totalScore,
        status: "generated",
        created_at: new Date().toISOString(),
      };

    case "mobile_checkout_abandonment":
      if (value < 0.28) return null;
      return {
        id: `${signal.merchant_id}__mobile_checkout_simplification`,
        schema_version: CANDIDATE_OPPORTUNITY_SCHEMA_VERSION,
        title: "Mobile Checkout Simplification",
        opportunity_class: "checkout_failure_intelligence",
        source_signals: [signal.id],
        interpreted_signal_ids: [],
        pattern_summary: `Mobile checkout abandonment is elevated at ${(value * 100).toFixed(1)}% with ${sampleSize} samples.`,
        suggested_solution: "Prioritize a mobile checkout simplification playbook focused on fewer steps and clearer field guidance.",
        confidence,
        impact_score: impactScore,
        frequency_score: frequencyScore,
        ease_score: easeScore,
        strategic_fit_score: strategicFitScore,
        total_score: totalScore,
        status: "generated",
        created_at: new Date().toISOString(),
      };

    case "payment_failure_rate":
      if (value < 0.08) return null;
      return {
        id: `${signal.merchant_id}__payment_option_optimization`,
        schema_version: CANDIDATE_OPPORTUNITY_SCHEMA_VERSION,
        title: "Payment Option Optimization",
        opportunity_class: "checkout_failure_intelligence",
        source_signals: [signal.id],
        interpreted_signal_ids: [],
        pattern_summary: `Payment failure rate is elevated at ${(value * 100).toFixed(1)}% across ${sampleSize} checkout attempts.`,
        suggested_solution: "Investigate payment option coverage, retry messaging, and fallback payment methods for failing sessions.",
        confidence,
        impact_score: impactScore,
        frequency_score: frequencyScore,
        ease_score: easeScore,
        strategic_fit_score: strategicFitScore,
        total_score: totalScore,
        status: "generated",
        created_at: new Date().toISOString(),
      };

    case "sms_recovery_success_rate":
      if (value < 0.15) return null;
      return {
        id: `${signal.merchant_id}__sms_first_recovery_workflow`,
        schema_version: CANDIDATE_OPPORTUNITY_SCHEMA_VERSION,
        title: "SMS-First Recovery Workflow",
        opportunity_class: "merchant_playbook_engine",
        source_signals: [signal.id],
        interpreted_signal_ids: [],
        pattern_summary: `SMS recovery success rate is strong at ${(value * 100).toFixed(1)}% with ${sampleSize} observed recoveries.`,
        suggested_solution: "Prioritize an SMS-first recovery workflow before discounting for similar checkout contexts.",
        confidence,
        impact_score: impactScore,
        frequency_score: frequencyScore,
        ease_score: easeScore,
        strategic_fit_score: strategicFitScore,
        total_score: totalScore,
        status: "generated",
        created_at: new Date().toISOString(),
      };

    case "discount_dependency_rate":
      if (value < 0.35) return null;
      return {
        id: `${signal.merchant_id}__non_discount_recovery_messaging_test`,
        schema_version: CANDIDATE_OPPORTUNITY_SCHEMA_VERSION,
        title: "Non-Discount Recovery Messaging Test",
        opportunity_class: "merchant_growth_radar",
        source_signals: [signal.id],
        interpreted_signal_ids: [],
        pattern_summary: `Discount dependency is elevated at ${(value * 100).toFixed(1)}% across ${sampleSize} recovery attempts.`,
        suggested_solution: "Test reassurance and urgency messaging before using discounts so margin loss is not the default recovery path.",
        confidence,
        impact_score: impactScore,
        frequency_score: frequencyScore,
        ease_score: easeScore,
        strategic_fit_score: strategicFitScore,
        total_score: totalScore,
        status: "generated",
        created_at: new Date().toISOString(),
      };

    default:
      return null;
  }
}

function candidateFromInterpretedSignal(interpretedSignal, sourceSignalIndex = new Map()) {
  const problem = normalizeText(interpretedSignal?.suggested_problem);
  const impactScore = buildImpactScoreFromHint(interpretedSignal?.impact_hint);
  const frequencyScore = buildFrequencyScoreFromHint(interpretedSignal?.frequency_hint);
  const confidence = buildConfidenceFromInterpretedSignal(interpretedSignal);

  let title = null;
  let opportunityClass = null;
  let suggestedSolution = null;
  let easeScore = 60;
  let strategicFitScore = 60;
  let opportunitySuffix = null;

  switch (problem) {
    case "shipping_cost_transparency":
      title = "Shipping Transparency Improvement";
      opportunityClass = "checkout_optimization";
      suggestedSolution = "Test earlier shipping-cost visibility and clearer shipping threshold messaging before checkout.";
      easeScore = 80;
      strategicFitScore = 90;
      opportunitySuffix = "shipping_transparency_improvement";
      break;
    case "mobile_checkout_simplification":
      title = "Mobile Checkout Simplification";
      opportunityClass = "checkout_failure_intelligence";
      suggestedSolution = "Prioritize a mobile checkout simplification playbook focused on fewer steps and clearer field guidance.";
      easeScore = 75;
      strategicFitScore = 90;
      opportunitySuffix = "mobile_checkout_simplification";
      break;
    case "payment_option_optimization":
      title = "Payment Option Optimization";
      opportunityClass = "checkout_failure_intelligence";
      suggestedSolution = "Investigate payment option coverage, retry messaging, and fallback payment methods for failing sessions.";
      easeScore = 80;
      strategicFitScore = 90;
      opportunitySuffix = "payment_option_optimization";
      break;
    case "sms_first_recovery_workflow":
      title = "SMS-First Recovery Workflow";
      opportunityClass = "merchant_playbook_engine";
      suggestedSolution = "Prioritize an SMS-first recovery workflow before discounting for similar checkout contexts.";
      easeScore = 70;
      strategicFitScore = 85;
      opportunitySuffix = "sms_first_recovery_workflow";
      break;
    case "non_discount_recovery_messaging":
      title = "Non-Discount Recovery Messaging Test";
      opportunityClass = "merchant_growth_radar";
      suggestedSolution = "Test reassurance and urgency messaging before using discounts so margin loss is not the default recovery path.";
      easeScore = 70;
      strategicFitScore = 80;
      opportunitySuffix = "non_discount_recovery_messaging_test";
      break;
    default:
      return null;
  }

  const totalScore = impactScore + frequencyScore + easeScore + strategicFitScore;
  const sourceSignalIds = Array.isArray(interpretedSignal?.source_signal_ids) ? interpretedSignal.source_signal_ids : [];
  const merchantId =
    sourceSignalIndex.get(sourceSignalIds[0])?.merchant_id ||
    sourceSignalIndex.get(sourceSignalIds[0])?.merchantId ||
    "merchant";

  return {
    id: `${merchantId}__${opportunitySuffix}`,
    schema_version: CANDIDATE_OPPORTUNITY_SCHEMA_VERSION,
    title,
    opportunity_class: opportunityClass,
    source_signals: sourceSignalIds,
    interpreted_signal_ids: [interpretedSignal.id],
    pattern_summary: interpretedSignal.pattern_summary,
    suggested_solution: suggestedSolution,
    confidence,
    impact_score: impactScore,
    frequency_score: frequencyScore,
    ease_score: easeScore,
    strategic_fit_score: strategicFitScore,
    total_score: totalScore,
    status: "generated",
    created_at: new Date().toISOString(),
  };
}

export async function listCandidateOpportunities() {
  const candidates = await readRegistry();
  return candidates
    .map(normalizeCandidateOpportunity)
    .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
}

export async function getCandidateOpportunityById(id) {
  const candidates = await readRegistry();
  const candidate = candidates.find((entry) => entry.id === id);
  return candidate ? normalizeCandidateOpportunity(candidate) : null;
}

export async function runPatternToOpportunityBridge() {
  const interpretedSignals = await listInterpretedSignals();
  const rawSignals = await listSignals();
  const sourceSignalIndex = new Map(rawSignals.map((signal) => [signal.id, signal]));
  let generated = interpretedSignals
    .map((signal) => candidateFromInterpretedSignal(signal, sourceSignalIndex))
    .filter(Boolean)
    .map(normalizeCandidateOpportunity)
    .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));

  let processedSignalCount = interpretedSignals.length;
  let bridgeInput = "interpreted_signals";

  if (generated.length === 0) {
    const latestSignals = latestSignalsByMerchantAndType(rawSignals);
    generated = latestSignals
      .map(buildCandidateFromSignal)
      .filter(Boolean)
      .map(normalizeCandidateOpportunity)
      .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    processedSignalCount = latestSignals.length;
    bridgeInput = "raw_signals_fallback";
  }

  await writeRegistry(generated);

  return {
    generated_count: generated.length,
    candidate_opportunities: generated,
    processed_signal_count: processedSignalCount,
    bridge_input: bridgeInput,
  };
}
