import type {
  CheckoutEventSource,
  CheckoutEventType,
  CheckoutStage,
  DeviceType,
} from "@/lib/dashboard/confirmation/types";
import type { CheckoutEventRecord } from "@/lib/dashboard/storage/types";

const EVENT_STAGE_MAP: Record<CheckoutEventType, CheckoutStage> = {
  cart_view: "cart",
  checkout_started: "checkout",
  payment_started: "payment",
  purchase_completed: "purchase",
  checkout_abandon: "checkout",
  checkout_return: "checkout",
};

const ALLOWED_SOURCES = new Set<CheckoutEventSource>([
  "live_storefront",
  "live_extension",
  "seeded_dev",
  "manual_dev",
  "pixel",
  "webhook",
  "api",
]);

const ALLOWED_DEVICES = new Set<DeviceType>(["mobile", "desktop", "tablet", "unknown"]);

export function stageForEventType(eventType: CheckoutEventType) {
  return EVENT_STAGE_MAP[eventType];
}

export function validateCheckoutEventPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { ok: false as const, error: "payload_must_be_object" };
  }

  const input = payload as Record<string, unknown>;
  const shop = String(input.shop || "").trim().toLowerCase();
  const sessionId = String(input.session_id || "").trim();
  const timestamp = String(input.timestamp || "").trim();
  const eventType = String(input.event_type || "").trim() as CheckoutEventType;
  const stage = String(input.stage || "").trim() as CheckoutStage;
  const source = String(input.source || "").trim() as CheckoutEventSource;
  const deviceType = String(input.device_type || "unknown").trim() as DeviceType;

  if (!shop || !sessionId || !timestamp || !eventType || !stage || !source) {
    return { ok: false as const, error: "missing_required_fields" };
  }

  if (!(eventType in EVENT_STAGE_MAP)) {
    return { ok: false as const, error: "invalid_event_type" };
  }

  if (!ALLOWED_SOURCES.has(source)) {
    return { ok: false as const, error: "invalid_source" };
  }

  if (!ALLOWED_DEVICES.has(deviceType)) {
    return { ok: false as const, error: "invalid_device_type" };
  }

  const normalizedStage = stageForEventType(eventType);
  if (stage !== normalizedStage) {
    return { ok: false as const, error: "stage_event_type_mismatch" };
  }

  const parsedTimestamp = Date.parse(timestamp);
  if (!Number.isFinite(parsedTimestamp)) {
    return { ok: false as const, error: "invalid_timestamp" };
  }

  const amount = typeof input.amount === "number" ? input.amount : null;
  const orderId = input.order_id ? String(input.order_id) : null;
  const metadataJson =
    input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? (input.metadata as Record<string, unknown>)
      : null;

  const record: CheckoutEventRecord = {
    id: String(input.id || `event_${crypto.randomUUID()}`),
    shop,
    timestamp: new Date(parsedTimestamp).toISOString(),
    occurredAt: new Date(parsedTimestamp).toISOString(),
    event_type: eventType,
    stage,
    device_type: deviceType,
    session_id: sessionId,
    order_id: orderId,
    amount,
    source,
    metadataJson,
  };

  return { ok: true as const, record };
}
