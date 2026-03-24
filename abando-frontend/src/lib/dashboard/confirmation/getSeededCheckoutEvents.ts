import type {
  CheckoutStage,
  DeviceType,
  NormalizedCheckoutEvent,
} from "@/lib/dashboard/confirmation/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_TIME = new Date("2026-03-19T15:00:00.000Z").getTime();

function pushEvent(
  events: NormalizedCheckoutEvent[],
  shop: string,
  sessionId: string,
  index: number,
  stage: CheckoutStage,
  deviceType: DeviceType,
  orderId: string | null,
  amount: number | null,
) {
  const eventType =
    stage === "cart"
      ? "cart_view"
      : stage === "checkout"
        ? "checkout_started"
        : stage === "payment"
          ? "payment_started"
          : "purchase_completed";

  events.push({
    shop,
    timestamp: new Date(BASE_TIME - index * DAY_MS).toISOString(),
    event_type: eventType,
    stage,
    device_type: deviceType,
    session_id: sessionId,
    order_id: orderId,
    amount,
    source: "seeded_dev",
  });
}

function createSeededSessions({
  shop,
  cartSessions,
  checkoutSessions,
  paymentSessions,
  purchaseSessions,
  mobileShare = 0.65,
}: {
  shop: string;
  cartSessions: number;
  checkoutSessions: number;
  paymentSessions: number;
  purchaseSessions: number;
  mobileShare?: number;
}) {
  const events: NormalizedCheckoutEvent[] = [];

  for (let i = 0; i < cartSessions; i += 1) {
    const sessionId = `${shop}-session-${i + 1}`;
    const deviceType: DeviceType = i / cartSessions < mobileShare ? "mobile" : "desktop";
    pushEvent(events, shop, sessionId, i, "cart", deviceType, null, null);

    if (i < checkoutSessions) {
      pushEvent(events, shop, sessionId, i, "checkout", deviceType, null, null);
    }

    if (i < checkoutSessions && i >= paymentSessions) {
      events.push({
        shop,
        timestamp: new Date(BASE_TIME - i * DAY_MS + 15 * 60 * 1000).toISOString(),
        event_type: "checkout_abandon",
        stage: "checkout",
        device_type: deviceType,
        session_id: sessionId,
        order_id: null,
        amount: null,
        source: "seeded_dev",
      });
    }

    if (i < paymentSessions) {
      pushEvent(events, shop, sessionId, i, "payment", deviceType, null, null);
    }

    if (i < purchaseSessions) {
      pushEvent(events, shop, sessionId, i, "purchase", deviceType, `order-${i + 1}`, 72 + i * 3);
    }
  }

  return events;
}

const SEEDED_EVENT_MAP: Record<string, NormalizedCheckoutEvent[]> = {
  "northstar-outdoors.myshopify.com": createSeededSessions({
    shop: "northstar-outdoors.myshopify.com",
    cartSessions: 7,
    checkoutSessions: 4,
    paymentSessions: 2,
    purchaseSessions: 1,
  }),
  "partial-proof.myshopify.com": createSeededSessions({
    shop: "partial-proof.myshopify.com",
    cartSessions: 16,
    checkoutSessions: 8,
    paymentSessions: 6,
    purchaseSessions: 5,
  }),
  "confirmed-proof.myshopify.com": createSeededSessions({
    shop: "confirmed-proof.myshopify.com",
    cartSessions: 30,
    checkoutSessions: 11,
    paymentSessions: 9,
    purchaseSessions: 8,
  }),
  "disproven-proof.myshopify.com": createSeededSessions({
    shop: "disproven-proof.myshopify.com",
    cartSessions: 28,
    checkoutSessions: 22,
    paymentSessions: 20,
    purchaseSessions: 8,
  }),
};

export function getSeededCheckoutEvents(shop: string) {
  return SEEDED_EVENT_MAP[shop] || [];
}

export function listSeededConfirmationShops() {
  return Object.keys(SEEDED_EVENT_MAP);
}
