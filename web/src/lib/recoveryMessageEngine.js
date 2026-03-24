import crypto from "crypto";

const RECOVERY_TOKEN_SECRET = process.env.ABANDO_RECOVERY_TOKEN_SECRET || "abando-recovery-dev-secret";

function toBase64Url(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signPayload(payload) {
  return crypto
    .createHmac("sha256", RECOVERY_TOKEN_SECRET)
    .update(payload)
    .digest("base64url");
}

export function createRecoveryToken({ shop, eventData, timestamp }) {
  const payload = JSON.stringify({
    shop: String(shop || "").trim().toLowerCase(),
    timestamp: new Date(timestamp || Date.now()).toISOString(),
    eventType: String(eventData?.event_type || "checkout_started"),
  });
  const encodedPayload = toBase64Url(payload);
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function parseRecoveryToken(token) {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) {
    throw new Error("invalid_recovery_token");
  }

  const expected = signPayload(encodedPayload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("invalid_recovery_signature");
  }

  const parsed = JSON.parse(fromBase64Url(encodedPayload));
  if (!parsed?.shop || !parsed?.timestamp) {
    throw new Error("invalid_recovery_payload");
  }

  return parsed;
}

export function generateRecoveryMessage({ shop, eventData, timestamp, baseUrl = "" }) {
  const normalizedShop = String(shop || "").trim().toLowerCase();
  const occurredAt = new Date(timestamp || Date.now()).toISOString();
  const eventType = String(eventData?.event_type || "checkout_started");
  const token = createRecoveryToken({ shop: normalizedShop, eventData, timestamp: occurredAt });
  const path = `/recover/${token}`;
  const returnLink = String(baseUrl || "").replace(/\/+$/, "") ? `${String(baseUrl).replace(/\/+$/, "")}${path}` : path;

  return {
    channel: ["Email", "SMS"],
    emailSubject: "You left something behind — complete your order",
    emailBody: [
      "You were one step away from completing your order.",
      "",
      "This recovery message was triggered automatically when checkout was abandoned.",
      "",
      "Complete your order here:",
      returnLink,
      "",
      "This is the exact recovery message your customers would receive.",
    ].join("\n"),
    smsText: `You can return to checkout here: ${returnLink}`,
    returnLink,
    token,
  };
}
