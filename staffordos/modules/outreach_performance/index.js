import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(MODULE_DIR, "../../..");
export const PROOF_EVENTS_PATH = resolve(ROOT, "staffordos", "events", "abando_proof_events.json");
export const MESSAGE_VARIANTS_PATH = resolve(ROOT, "staffordos", "outreach", "message_variants.json");
export const MESSAGE_PERFORMANCE_SUMMARY_PATH = resolve(ROOT, "staffordos", "outreach", "message_performance_summary.json");

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

function normalizeLoop(loop) {
  return {
    variant_id: loop?.variant_id || "unknown",
    message_angle: loop?.message_angle || "unknown",
    outcome: loop?.outcome || "none",
    outcome_timestamp: loop?.outcome_timestamp || "",
    outcome_value: Number(loop?.outcome_value || 0),
    lead_domain: loop?.lead_domain || "",
    lead_segment_key: loop?.lead_segment_key || "",
    ...loop,
  };
}

export async function readProofLoops() {
  const parsed = await readJson(PROOF_EVENTS_PATH, { loops: [] });
  const loops = Array.isArray(parsed?.loops) ? parsed.loops.map(normalizeLoop) : [];
  return { loops };
}

export async function readMessageVariantRegistry() {
  const parsed = await readJson(MESSAGE_VARIANTS_PATH, { variants: [] });
  const variants = Array.isArray(parsed?.variants) ? parsed.variants : [];
  return { variants };
}

export async function writeProofLoops(loops) {
  await writeJson(PROOF_EVENTS_PATH, { loops });
}

export async function updateProofLoopById(loopId, updater) {
  if (!loopId) return null;
  const registry = await readProofLoops();
  const index = registry.loops.findIndex((loop) => String(loop.loop_id || "") === String(loopId));
  if (index === -1) return null;
  const next = updater(normalizeLoop(registry.loops[index]));
  registry.loops[index] = normalizeLoop(next);
  await writeProofLoops(registry.loops);
  return registry.loops[index];
}

export async function updateLatestProofLoopOutcomeForLead({ leadDomain, outcome, outcomeTimestamp, outcomeValue = 0 }) {
  if (!leadDomain || !["replied", "installed", "lost"].includes(outcome)) {
    return null;
  }
  const registry = await readProofLoops();
  const matching = registry.loops
    .filter((loop) => String(loop.lead_domain || "").toLowerCase() === String(leadDomain || "").toLowerCase())
    .sort((a, b) => String(b.send_timestamp || "").localeCompare(String(a.send_timestamp || "")));
  const target = matching[0];
  if (!target?.loop_id) return null;
  const updated = registry.loops.map((loop) => {
    if (loop.loop_id !== target.loop_id) return loop;
    return normalizeLoop({
      ...loop,
      outcome,
      outcome_timestamp: outcomeTimestamp || new Date().toISOString(),
      outcome_value: Number(outcomeValue || loop.outcome_value || 0),
    });
  });
  await writeProofLoops(updated);
  return updated.find((loop) => loop.loop_id === target.loop_id) || null;
}

function safeRate(numerator, denominator) {
  if (!denominator) return 0;
  return Number((numerator / denominator).toFixed(4));
}

export async function generateMessagePerformanceSummary() {
  const [{ loops }, { variants }] = await Promise.all([
    readProofLoops(),
    readMessageVariantRegistry(),
  ]);
  const variantMeta = new Map(variants.map((variant) => [variant.variant_id, variant]));
  const grouped = new Map();
  const segmentGrouped = new Map();

  for (const loop of loops) {
    const variantId = loop.variant_id || "unknown";
    const angle = loop.message_angle || variantMeta.get(variantId)?.angle || "unknown";
    const bucket = grouped.get(variantId) || {
      variant_id: variantId,
      angle,
      sends: 0,
      replies: 0,
      installs: 0,
      losses: 0,
      total_outcome_value: 0,
    };
    bucket.sends += loop.send_timestamp ? 1 : 0;
    bucket.replies += loop.outcome === "replied" ? 1 : 0;
    bucket.installs += loop.outcome === "installed" ? 1 : 0;
    bucket.losses += loop.outcome === "lost" ? 1 : 0;
    bucket.total_outcome_value += Number(loop.outcome_value || 0);
    grouped.set(variantId, bucket);

    const segmentKey = loop.lead_segment_key || "unknown";
    const segmentBucketKey = `${variantId}::${segmentKey}`;
    const segmentBucket = segmentGrouped.get(segmentBucketKey) || {
      variant_id: variantId,
      angle,
      segment_key: segmentKey,
      sends: 0,
      replies: 0,
      installs: 0,
      losses: 0,
    };
    segmentBucket.sends += loop.send_timestamp ? 1 : 0;
    segmentBucket.replies += loop.outcome === "replied" ? 1 : 0;
    segmentBucket.installs += loop.outcome === "installed" ? 1 : 0;
    segmentBucket.losses += loop.outcome === "lost" ? 1 : 0;
    segmentGrouped.set(segmentBucketKey, segmentBucket);
  }

  const summary = {
    generated_at: new Date().toISOString(),
    variants: [...grouped.values()]
      .map((variant) => ({
        ...variant,
        reply_rate: safeRate(variant.replies, variant.sends),
        install_rate: safeRate(variant.installs, variant.sends),
      }))
      .sort((a, b) =>
        b.install_rate - a.install_rate
        || b.reply_rate - a.reply_rate
        || b.sends - a.sends
        || a.variant_id.localeCompare(b.variant_id)
      ),
    segment_breakdown: [...segmentGrouped.values()]
      .map((segment) => ({
        ...segment,
        reply_rate: safeRate(segment.replies, segment.sends),
        install_rate: safeRate(segment.installs, segment.sends),
      }))
      .sort((a, b) =>
        a.segment_key.localeCompare(b.segment_key)
        || a.variant_id.localeCompare(b.variant_id)
      ),
  };

  await writeJson(MESSAGE_PERFORMANCE_SUMMARY_PATH, summary);
  return summary;
}

export async function getTopPerformingMessage() {
  const summary = await generateMessagePerformanceSummary();
  return summary.variants[0] || null;
}

export async function getLastVariantForLead(leadDomain) {
  if (!leadDomain) return null;
  const { loops } = await readProofLoops();
  const matching = loops
    .filter((loop) => String(loop.lead_domain || "").toLowerCase() === String(leadDomain).toLowerCase())
    .sort((a, b) => String(b.send_timestamp || "").localeCompare(String(a.send_timestamp || "")));
  return matching[0] || null;
}
