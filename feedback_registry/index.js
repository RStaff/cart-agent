import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "registry.json");
const VALID_OUTCOMES = new Set(["success", "partial", "failed"]);

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeRegistry(records) {
  await writeFile(REGISTRY_PATH, JSON.stringify(records, null, 2) + "\n", "utf8");
}

function normalizeText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function normalizeScore(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeLessons(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  const single = normalizeText(value);
  return single ? [single] : [];
}

function validateFeedbackInput(input) {
  const executionPacketId = normalizeText(input?.execution_packet_id ?? input?.executionPacketId);
  if (!executionPacketId) throw new Error("validation_error:execution_packet_id_required");

  const sliceId = normalizeText(input?.slice_id ?? input?.sliceId);
  if (!sliceId) throw new Error("validation_error:slice_id_required");

  const outcome = normalizeText(input?.outcome);
  if (!outcome || !VALID_OUTCOMES.has(outcome)) throw new Error("validation_error:invalid_outcome");

  const resultSummary = normalizeText(input?.result_summary ?? input?.resultSummary);
  if (!resultSummary) throw new Error("validation_error:result_summary_required");

  return {
    id: normalizeText(input?.id) || `feedback__${crypto.randomUUID()}`,
    execution_packet_id: executionPacketId,
    slice_id: sliceId,
    outcome,
    result_summary: resultSummary,
    success_score: normalizeScore(input?.success_score ?? input?.successScore),
    observed_value: input?.observed_value ?? input?.observedValue ?? null,
    lessons: normalizeLessons(input?.lessons),
    recorded_at: normalizeText(input?.recorded_at ?? input?.recordedAt) || new Date().toISOString(),
  };
}

export async function listFeedback() {
  const records = await readRegistry();
  return records.sort((a, b) => {
    const timeA = Date.parse(a.recorded_at || "") || 0;
    const timeB = Date.parse(b.recorded_at || "") || 0;
    return timeB - timeA;
  });
}

export async function recordFeedback(input) {
  const records = await readRegistry();
  const record = validateFeedbackInput(input);
  records.push(record);
  await writeRegistry(records);
  return record;
}

export async function getFeedbackByPacket(executionPacketId) {
  const records = await listFeedback();
  return records.filter((record) => record.execution_packet_id === executionPacketId);
}

export async function getFeedbackBySlice(sliceId) {
  const records = await listFeedback();
  return records.filter((record) => record.slice_id === sliceId);
}
