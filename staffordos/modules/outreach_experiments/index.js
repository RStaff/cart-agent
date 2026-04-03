import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readMessageVariantRegistry, generateMessagePerformanceSummary } from "../outreach_performance/index.js";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(MODULE_DIR, "../../..");
export const EXPERIMENT_CONFIG_PATH = resolve(ROOT, "staffordos", "outreach", "experiment_config.json");
export const OPERATOR_STATE_PATH = resolve(ROOT, "staffordos", "icp_engine", "output", "operator_state.json");
export const RANKED_LEADS_PATH = resolve(ROOT, "staffordos", "icp_engine", "output", "ranked_leads.json");

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function readExperimentConfig() {
  return readJson(EXPERIMENT_CONFIG_PATH, { active_experiment: null });
}

async function readOperatorState() {
  return readJson(OPERATOR_STATE_PATH, { overrides: {} });
}

async function writeOperatorState(state) {
  await writeJson(OPERATOR_STATE_PATH, state);
}

async function readRankedLeads() {
  const parsed = await readJson(RANKED_LEADS_PATH, { leads: [] });
  return Array.isArray(parsed?.leads) ? parsed.leads : [];
}

function normalizeVariantMeta(variants) {
  return new Map((variants || []).map((variant) => [variant.variant_id, variant]));
}

function pickRoundRobinVariant(activeExperiment, overrides) {
  const variants = Array.isArray(activeExperiment?.variants) ? activeExperiment.variants : [];
  const counts = new Map(variants.map((variant) => [variant, 0]));

  for (const override of Object.values(overrides || {})) {
    const assigned = String(override?.assigned_variant_id || "");
    if (counts.has(assigned)) {
      counts.set(assigned, (counts.get(assigned) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => a[1] - b[1] || variants.indexOf(a[0]) - variants.indexOf(b[0]))[0]?.[0] || "";
}

function pickRandomVariant(activeExperiment) {
  const variants = Array.isArray(activeExperiment?.variants) ? activeExperiment.variants : [];
  if (!variants.length) return "";
  const index = Math.floor(Math.random() * variants.length);
  return variants[index] || "";
}

function pilotReadinessBand(score) {
  const numeric = Number(score || 0);
  if (numeric >= 16) return "PR3";
  if (numeric >= 12) return "PR2";
  return "PR1";
}

function biasBand(score) {
  const numeric = Number(score || 0);
  if (numeric > 0) return "FB2";
  if (numeric === 0) return "FB1";
  return "FB0";
}

function normalizeTier(tierValue) {
  const normalized = String(tierValue || "TierC").replace(/\s+/g, "");
  if (normalized.startsWith("Tier")) return normalized;
  return "TierC";
}

export function getLeadSegmentKey(lead) {
  const founderVisible = Boolean(lead?.signal_snapshot?.founder_visible) ? "F1" : "F0";
  const contactVisible = Boolean(lead?.signal_snapshot?.contact_visible) ? "C1" : "C0";
  const tier = normalizeTier(lead?.tier);
  return [
    tier,
    founderVisible,
    contactVisible,
    pilotReadinessBand(lead?.pilot_readiness_score),
    biasBand(lead?.first_customer_bias),
  ].join("_");
}

export const buildLeadSegmentKey = getLeadSegmentKey;

function pickSegmentRoundRobinVariant(activeExperiment, overrides, segmentKey) {
  const variants = Array.isArray(activeExperiment?.variants) ? activeExperiment.variants : [];
  const counts = new Map(variants.map((variant) => [variant, 0]));

  for (const override of Object.values(overrides || {})) {
    const assigned = String(override?.assigned_variant_id || "");
    const assignedSegment = String(override?.segment_key || override?.lead_segment_key || "");
    if (assignedSegment === segmentKey && counts.has(assigned)) {
      counts.set(assigned, (counts.get(assigned) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => a[1] - b[1] || variants.indexOf(a[0]) - variants.indexOf(b[0]))[0]?.[0] || "";
}

function countSegmentMembers(rankedLeads, segmentKey) {
  return (rankedLeads || []).filter((lead) => getLeadSegmentKey(lead) === segmentKey).length;
}

export async function assignVariantForLead(domain) {
  const normalizedDomain = String(domain || "").trim().toLowerCase();
  if (!normalizedDomain) return null;

  const [{ active_experiment: activeExperiment }, operatorState, { variants }, rankedLeads] = await Promise.all([
    readExperimentConfig(),
    readOperatorState(),
    readMessageVariantRegistry(),
    readRankedLeads(),
  ]);

  if (!activeExperiment || !Array.isArray(activeExperiment.variants) || activeExperiment.variants.length === 0) {
    return null;
  }

  const overrides = operatorState.overrides || {};
  const existing = overrides[normalizedDomain] || {};
  const lead = rankedLeads.find((item) => String(item?.domain || "").toLowerCase() === normalizedDomain);
  const leadSegmentKey = getLeadSegmentKey(lead || {});
  if (existing.assigned_variant_id) {
    const backfilled = {
      ...existing,
      segment_key: leadSegmentKey,
      lead_segment_key: leadSegmentKey,
    };
    if ((existing.lead_segment_key || "") !== leadSegmentKey || (existing.segment_key || "") !== leadSegmentKey) {
      overrides[normalizedDomain] = backfilled;
      await writeOperatorState({ overrides });
    }
    return backfilled;
  }

  const segmentMemberCount = countSegmentMembers(rankedLeads, leadSegmentKey);
  const shouldFallbackToGlobalRoundRobin =
    activeExperiment.assignment_strategy === "segment_round_robin" && segmentMemberCount < 2;
  const chosenVariantId = activeExperiment.assignment_strategy === "random"
    ? pickRandomVariant(activeExperiment)
    : activeExperiment.assignment_strategy === "segment_round_robin" && !shouldFallbackToGlobalRoundRobin
      ? pickSegmentRoundRobinVariant(activeExperiment, overrides, leadSegmentKey)
      : pickRoundRobinVariant(activeExperiment, overrides);
  const variantMeta = normalizeVariantMeta(variants).get(chosenVariantId);

  overrides[normalizedDomain] = {
    ...existing,
    assigned_variant_id: chosenVariantId || "",
    assigned_message_angle: variantMeta?.angle || "",
    experiment_name: activeExperiment.name || "",
    variant_assigned_at: new Date().toISOString(),
    segment_key: leadSegmentKey,
    lead_segment_key: leadSegmentKey,
  };

  await writeOperatorState({ overrides });
  return overrides[normalizedDomain];
}

export async function ensureVariantAssignments(domains) {
  const results = [];
  for (const domain of domains || []) {
    if (!domain) continue;
    const assigned = await assignVariantForLead(domain);
    if (assigned) results.push({ domain, assigned_variant_id: assigned.assigned_variant_id || "" });
  }
  return results;
}

export async function getAssignedVariantForLead(domain) {
  const operatorState = await readOperatorState();
  const override = operatorState.overrides?.[String(domain || "").trim().toLowerCase()] || null;
  return override && override.assigned_variant_id ? override : null;
}

export async function getExperimentStatus() {
  const [{ active_experiment: activeExperiment }, operatorState, performanceSummary] = await Promise.all([
    readExperimentConfig(),
    readOperatorState(),
    generateMessagePerformanceSummary(),
  ]);

  if (!activeExperiment) {
    return {
      active: false,
      active_experiment: null,
      assignment_counts: [],
      performance_readiness: "no active experiment",
    };
  }

  const variants = Array.isArray(activeExperiment.variants) ? activeExperiment.variants : [];
  const assignmentCounts = new Map(variants.map((variant) => [variant, 0]));
  const segmentAssignmentCounts = new Map();
  for (const override of Object.values(operatorState.overrides || {})) {
    const assigned = String(override?.assigned_variant_id || "");
    if (assignmentCounts.has(assigned)) {
      assignmentCounts.set(assigned, (assignmentCounts.get(assigned) || 0) + 1);
    }
    const segmentKey = String(override?.segment_key || override?.lead_segment_key || "");
    if (segmentKey && assigned) {
      const segmentCounts = segmentAssignmentCounts.get(segmentKey) || new Map(variants.map((variant) => [variant, 0]));
      if (segmentCounts.has(assigned)) {
        segmentCounts.set(assigned, (segmentCounts.get(assigned) || 0) + 1);
      }
      segmentAssignmentCounts.set(segmentKey, segmentCounts);
    }
  }

  const sendsByVariant = new Map((performanceSummary.variants || []).map((variant) => [variant.variant_id, variant.sends]));
  const minimumSends = Number(activeExperiment.minimum_sends_per_variant || 5);
  const ready = variants.length > 0 && variants.every((variant) => Number(sendsByVariant.get(variant) || 0) >= minimumSends);

  return {
    active: true,
    active_experiment: activeExperiment,
    assignment_counts: variants.map((variant) => ({
      variant_id: variant,
      assigned_leads: assignmentCounts.get(variant) || 0,
      sends: Number(sendsByVariant.get(variant) || 0),
    })),
    segment_assignment_counts: [...segmentAssignmentCounts.entries()].map(([segment_key, counts]) => ({
      segment_key,
      variants: variants.map((variant) => ({
        variant_id: variant,
        assigned_leads: counts.get(variant) || 0,
      })),
    })),
    performance_readiness: ready ? "ready" : "early data",
  };
}
