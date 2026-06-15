import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROOF_STORE_PATH = path.join(__dirname, "proof_authority_v1.jsonl");
const PROOF_SCHEMA = "staffordos.proof_authority_v1";

function normalizeEvent(input = {}) {
  const event = {
    schema: PROOF_SCHEMA,
    reservation_id: String(input.reservation_id || input.reservationId || "").trim(),
    event_type: String(input.event_type || input.eventType || "").trim(),
    authority: String(input.authority || "").trim(),
    packet_id: String(input.packet_id || input.packetId || "").trim() || null,
    relationship_id: String(input.relationship_id || input.relationshipId || "").trim() || null,
    action_id: String(input.action_id || input.actionId || "").trim() || null,
    campaign_id: String(input.campaign_id || input.campaignId || "").trim() || null,
    offer_artifact_hash: String(input.offer_artifact_hash || input.offerArtifactHash || "").trim() || null,
    decision_engine_hash: String(input.decision_engine_hash || input.decisionEngineHash || "").trim() || null,
    stripe_event_id: String(input.stripe_event_id || input.stripeEventId || "").trim() || null,
    payment_reference: String(input.payment_reference || input.paymentReference || "").trim() || null,
    status: String(input.status || "").trim() || "verified",
    timestamp: String(input.timestamp || new Date().toISOString()).trim(),
    proof: input.proof && typeof input.proof === "object" ? input.proof : {},
  };

  return event;
}

function getIdempotencyKey(event) {
  return [
    event.reservation_id,
    event.event_type,
    event.stripe_event_id,
  ].join("::");
}

export function getProofEvent(criteria = {}) {
  const reservationId = String(criteria.reservation_id || criteria.reservationId || "").trim();
  const eventType = String(criteria.event_type || criteria.eventType || "").trim();
  const stripeEventId = String(criteria.stripe_event_id || criteria.stripeEventId || "").trim();

  if (!reservationId || !eventType || !stripeEventId) {
    return {
      found: false,
      event: null,
      criteria: {
        reservation_id: reservationId,
        event_type: eventType,
        stripe_event_id: stripeEventId,
      },
      path: PROOF_STORE_PATH,
    };
  }

  if (!existsSync(PROOF_STORE_PATH)) {
    return {
      found: false,
      event: null,
      criteria: {
        reservation_id: reservationId,
        event_type: eventType,
        stripe_event_id: stripeEventId,
      },
      path: PROOF_STORE_PATH,
    };
  }

  const needle = [reservationId, eventType, stripeEventId].join("::");
  const raw = readFileSync(PROOF_STORE_PATH, "utf8");

  let latest = null;
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      const parsedKey = [
        parsed?.reservation_id,
        parsed?.event_type,
        parsed?.stripe_event_id,
      ].join("::");
      if (parsedKey === needle) {
        latest = parsed;
      }
    } catch {
      continue;
    }
  }

  return {
    found: Boolean(latest),
    event: latest,
    criteria: {
      reservation_id: reservationId,
      event_type: eventType,
      stripe_event_id: stripeEventId,
    },
    path: PROOF_STORE_PATH,
  };
}

export async function appendProofEvent(input = {}) {
  const event = normalizeEvent(input);

  if (!event.reservation_id) throw new Error("missing_reservation_id");
  if (!event.event_type) throw new Error("missing_event_type");
  if (!event.stripe_event_id) throw new Error("missing_stripe_event_id");

  const idempotency_key = getIdempotencyKey(event);
  const record = { ...event, idempotency_key };

  await fs.mkdir(path.dirname(PROOF_STORE_PATH), { recursive: true });

  let existing = "";
  try {
    existing = await fs.readFile(PROOF_STORE_PATH, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  if (existing) {
    for (const line of existing.split("\n")) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        const parsedKey = [
          parsed?.reservation_id,
          parsed?.event_type,
          parsed?.stripe_event_id,
        ].join("::");
        if (parsedKey === idempotency_key) {
          return { appended: false, duplicate: true, event: parsed };
        }
      } catch {
        continue;
      }
    }
  }

  await fs.appendFile(PROOF_STORE_PATH, `${JSON.stringify(record)}\n`);
  return { appended: true, duplicate: false, event: record };
}

export { PROOF_STORE_PATH, PROOF_SCHEMA };
