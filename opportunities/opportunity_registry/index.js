import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "registry.json");

function normalizeText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => normalizeText(tag)?.toLowerCase())
    .filter(Boolean);
}

function normalizeBoolean(value) {
  return value === true || value === "true";
}

function normalizeScore(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeRegistry(opportunities) {
  await writeFile(REGISTRY_PATH, JSON.stringify(opportunities, null, 2) + "\n", "utf8");
}

function validateOpportunityInput(input) {
  const name = normalizeText(input?.name);
  if (!name) throw new Error("validation_error:name_required");

  const opportunityClass = normalizeText(input?.opportunity_class ?? input?.opportunityClass);
  if (!opportunityClass) throw new Error("validation_error:opportunity_class_required");

  const priority = normalizeText(input?.priority);
  if (!priority) throw new Error("validation_error:priority_required");

  const impact = normalizeText(input?.impact);
  if (!impact) throw new Error("validation_error:impact_required");

  const description = normalizeText(input?.description);
  if (!description) throw new Error("validation_error:description_required");

  return {
    id: normalizeText(input?.id) || crypto.randomUUID(),
    name,
    opportunity_class: opportunityClass,
    priority,
    impact,
    expected_value_score: normalizeScore(input?.expected_value_score ?? input?.expectedValueScore),
    discovery_source: normalizeText(input?.discovery_source ?? input?.discoverySource),
    strategic_anchor: normalizeBoolean(input?.strategic_anchor ?? input?.strategicAnchor),
    status: normalizeText(input?.status) || "proposed",
    description,
    first_slice_id: normalizeText(input?.first_slice_id ?? input?.firstSliceId),
    tags: normalizeTags(input?.tags),
    created_at: normalizeText(input?.created_at ?? input?.createdAt) || new Date().toISOString(),
  };
}

export async function listOpportunities() {
  const opportunities = await readRegistry();
  return opportunities.sort((a, b) => {
    return (b.expected_value_score || 0) - (a.expected_value_score || 0);
  });
}

export async function getOpportunityById(id) {
  const opportunities = await readRegistry();
  return opportunities.find((opportunity) => opportunity.id === id) || null;
}

export async function createOpportunity(input) {
  const opportunities = await readRegistry();
  const opportunity = validateOpportunityInput(input);

  if (opportunities.some((existing) => existing.id === opportunity.id)) {
    throw new Error("validation_error:opportunity_id_already_exists");
  }

  opportunities.push(opportunity);
  await writeRegistry(opportunities);
  return opportunity;
}
