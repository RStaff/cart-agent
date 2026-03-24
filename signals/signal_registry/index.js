import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "registry.json");

const VALID_SIGNAL_TYPES = new Set([
  "checkout_shipping_dropoff",
  "payment_failure_rate",
  "sms_recovery_success_rate",
  "discount_dependency_rate",
  "mobile_checkout_abandonment",
]);
const VALID_SIGNAL_CONFIDENCE = new Set(["low", "medium", "high"]);

function normalizeText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeInteger(value, fallback = 1) {
  const parsed = normalizeNumber(value);
  if (parsed === null) return fallback;
  return Math.max(1, Math.round(parsed));
}

function normalizeContext(context) {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return {};
  }
  return context;
}

function normalizeConfidence(value, fallback = "medium") {
  const normalized = normalizeText(value)?.toLowerCase();
  return VALID_SIGNAL_CONFIDENCE.has(normalized) ? normalized : fallback;
}

function normalizeSource(value) {
  return normalizeText(value) || "manual";
}

function normalizeSignal(signal) {
  return {
    ...signal,
    signal_type: normalizeText(signal?.signal_type),
    source: normalizeSource(signal?.source),
    confidence: normalizeConfidence(signal?.confidence),
  };
}

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeRegistry(signals) {
  await writeFile(REGISTRY_PATH, JSON.stringify(signals, null, 2) + "\n", "utf8");
}

function validateSignalInput(input) {
  const signalType = normalizeText(input?.signal_type ?? input?.signalType);
  if (!signalType) throw new Error("validation_error:signal_type_required");
  if (!VALID_SIGNAL_TYPES.has(signalType)) throw new Error("validation_error:invalid_signal_type");

  const merchantId = normalizeText(input?.merchant_id ?? input?.merchantId);
  if (!merchantId) throw new Error("validation_error:merchant_id_required");

  const value = normalizeNumber(input?.value);
  if (value === null) throw new Error("validation_error:value_required");

  return {
    id: normalizeText(input?.id) || crypto.randomUUID(),
    signal_type: signalType,
    merchant_id: merchantId,
    value,
    sample_size: normalizeInteger(input?.sample_size ?? input?.sampleSize, 1),
    context: normalizeContext(input?.context),
    source: normalizeSource(input?.source),
    confidence: normalizeConfidence(input?.confidence),
    timestamp: normalizeText(input?.timestamp) || new Date().toISOString(),
  };
}

export async function listSignals() {
  const signals = await readRegistry();
  return signals.map(normalizeSignal).sort((a, b) => {
    const timeA = Date.parse(a.timestamp || "") || 0;
    const timeB = Date.parse(b.timestamp || "") || 0;
    return timeB - timeA;
  });
}

export async function listSignalsByMerchant(merchantId) {
  const signals = await listSignals();
  return signals.filter((signal) => signal.merchant_id === merchantId);
}

export async function createSignal(input) {
  const signals = await readRegistry();
  const signal = validateSignalInput(input);

  if (signals.some((existing) => existing.id === signal.id)) {
    throw new Error("validation_error:signal_id_already_exists");
  }

  signals.push(signal);
  await writeRegistry(signals);
  return signal;
}
