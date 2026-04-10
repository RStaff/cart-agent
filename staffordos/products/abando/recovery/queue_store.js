import fs from "node:fs";
import path from "node:path";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
export const QUEUE_PATH = path.join(
  CANONICAL_ROOT,
  "staffordos/products/abando/recovery/abando_recovery_queue.json"
);

const DEFAULT_QUEUE = [
  {
    id: "rec_001",
    shop: "veloura-style.com",
    customer_email: "jane@example.com",
    customer_phone: "",
    channel: "email",
    cart_value: 120,
    currency: "USD",
    event_type: "checkout_abandoned",
    experience_id: "exp_001",
    recovery_url: "https://pay.abando.ai/recover?token=sample",
    message_angle: "complete_purchase",
    subject: "",
    body: "",
    status: "queued",
    notes: "",
  }
];

function cleanText(value) {
  return String(value || "").trim();
}

function cleanStatus(value) {
  const normalized = cleanText(value);
  return ["queued", "draft_generated", "sent", "returned", "lost"].includes(normalized)
    ? normalized
    : "queued";
}

function cleanAngle(value) {
  const normalized = cleanText(value);
  return ["complete_purchase", "return_to_cart", "simple_reminder"].includes(normalized)
    ? normalized
    : "complete_purchase";
}

function normalizeRow(row) {
  return {
    id: cleanText(row?.id),
    shop: cleanText(row?.shop),
    customer_email: cleanText(row?.customer_email),
    customer_phone: cleanText(row?.customer_phone),
    channel: cleanText(row?.channel).toLowerCase() === "sms" ? "sms" : "email",
    cart_value: Number(row?.cart_value || 0) || 0,
    currency: cleanText(row?.currency) || "USD",
    event_type: cleanText(row?.event_type) || "checkout_abandoned",
    experience_id: cleanText(row?.experience_id),
    recovery_url: cleanText(row?.recovery_url),
    message_angle: cleanAngle(row?.message_angle),
    subject: cleanText(row?.subject),
    body: cleanText(row?.body),
    status: cleanStatus(row?.status),
    notes: cleanText(row?.notes),
  };
}

function ensureQueueFile() {
  fs.mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
  if (!fs.existsSync(QUEUE_PATH)) {
    fs.writeFileSync(QUEUE_PATH, `${JSON.stringify(DEFAULT_QUEUE, null, 2)}\n`, "utf8");
  }
}

export function readQueue() {
  ensureQueueFile();
  const parsed = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
  return Array.isArray(parsed) ? parsed.map(normalizeRow) : DEFAULT_QUEUE.map(normalizeRow);
}

export function getQueueRow(rowId) {
  return readQueue().find((row) => row.id === cleanText(rowId)) || null;
}

export function writeQueue(rows) {
  const normalized = Array.isArray(rows) ? rows.map(normalizeRow) : [];
  ensureQueueFile();
  fs.writeFileSync(QUEUE_PATH, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

export function updateQueueRow(rowId, updates = {}) {
  const normalizedId = cleanText(rowId);
  const rows = readQueue();
  const index = rows.findIndex((row) => row.id === normalizedId);
  if (index === -1) {
    throw new Error(`unknown_queue_row:${normalizedId}`);
  }

  rows[index] = normalizeRow({
    ...rows[index],
    ...updates,
    id: rows[index].id,
  });
  writeQueue(rows);
  return rows[index];
}
