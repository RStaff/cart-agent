export const RECOVERY_ATTRIBUTION_EVENT = "abando.recovery_attribution.v1";

function clean(value) {
  return String(value || "").trim();
}

function normalizeExperienceId(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 80);
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

function isoOrNull(value) {
  const text = clean(value);
  return text || null;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function centsOrNull(...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return Math.round(numeric);
    }
  }
  return null;
}

function buildSnapshot(input) {
  const recoveryId = clean(input.recovery_id);
  const experienceId = normalizeExperienceId(input.experienceId);
  const channel = clean(input.channel).toLowerCase() || null;
  const target = clean(input.target) || null;
  const checkoutId = firstNonEmpty(input.checkout_id, input.cart_token) || null;
  const checkoutSessionId = firstNonEmpty(input.checkout_session_id, input.checkout_token) || null;
  const orderId = clean(input.order_id) || null;
  const orderName = clean(input.order_name) || null;
  const sourceOfProof = clean(input.source_of_proof) || null;
  const orderTotalPriceCents = centsOrNull(
    input.order_total_price_cents,
    input.recoveredRevenueCents,
    input.attributedOrderValueCents,
  );

  return {
    recovery_id: recoveryId || null,
    experienceId: experienceId || null,
    shop: clean(input.shop) || null,
    checkout_id: checkoutId,
    checkout_session_id: checkoutSessionId,
    recovery_action_id: clean(input.recovery_action_id) || null,
    proof_loop_id: clean(input.proof_loop_id) || null,
    channel,
    target,
    sent_at: isoOrNull(input.sent_at),
    return_clicked_at: isoOrNull(input.return_clicked_at),
    order_id: orderId,
    order_name: orderName,
    order_created_at: isoOrNull(input.order_created_at),
    order_total_price_cents: orderTotalPriceCents,
    recoveredRevenueCents: orderTotalPriceCents,
    attributedOrderValueCents: orderTotalPriceCents,
    currency: clean(input.currency) || null,
    attribution_status: clean(input.attribution_status) || "recovery_created",
    proof_status: clean(input.proof_status) || "pending",
    source_of_proof: sourceOfProof,
    source_event_id: clean(input.source_event_id) || null,
    provider_message_id: clean(input.provider_message_id) || null,
    provider_sms_sid: clean(input.provider_sms_sid) || null,
    synthetic: Boolean(input.synthetic),
    created_at: new Date().toISOString(),
  };
}

async function appendSnapshot(prisma, shopDomain, snapshot) {
  if (!shopDomain) return null;
  return prisma.systemEvent.create({
    data: {
      shopDomain,
      eventType: RECOVERY_ATTRIBUTION_EVENT,
      visibility: "merchant",
      relatedJobId: snapshot.recovery_action_id || null,
      payload: snapshot,
    },
  });
}

function payloadMatchesExperienceId(payload, experienceId) {
  if (!payload || typeof payload !== "object") return false;
  return normalizeExperienceId(payload.experienceId) === normalizeExperienceId(experienceId);
}

function extractCandidate(event) {
  const payload = event?.payload;
  if (!payload || typeof payload !== "object") return null;

  return {
    id: event.id,
    eventType: String(event.eventType || ""),
    createdAt: event.createdAt,
    recoveryId: clean(payload.recovery_id),
    experienceId: normalizeExperienceId(payload.experienceId),
    checkoutId: firstNonEmpty(payload.checkout_id, payload.cart_token),
    checkoutSessionId: firstNonEmpty(payload.checkout_session_id, payload.checkout_token),
    target: clean(payload.target),
    channel: clean(payload.channel).toLowerCase(),
    sentAt: isoOrNull(payload.sentAt || payload.sent_at),
    returnedAt: isoOrNull(payload.returnedAt || payload.return_clicked_at),
    payload,
  };
}

export async function getLatestRecoveryAttributionForExperience(prisma, { shopDomain, experienceId }) {
  const normalizedExperienceId = normalizeExperienceId(experienceId);
  if (!shopDomain || !normalizedExperienceId) return null;

  const events = await prisma.systemEvent.findMany({
    where: {
      shopDomain,
      eventType: RECOVERY_ATTRIBUTION_EVENT,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const match = events.find((event) => payloadMatchesExperienceId(event.payload, normalizedExperienceId));
  return match?.payload && typeof match.payload === "object" ? match.payload : null;
}

export async function persistRecoveryAttributionFromSend(prisma, input) {
  const snapshot = buildSnapshot({
    ...input,
    attribution_status: "recovery_sent",
    proof_status: "pending_shopify_order",
  });
  return appendSnapshot(prisma, snapshot.shop, snapshot);
}

export async function persistRecoveryAttributionFromReturn(prisma, input) {
  const snapshot = buildSnapshot({
    ...input,
    attribution_status: "return_detected",
    proof_status: "pending_shopify_order",
  });
  return appendSnapshot(prisma, snapshot.shop, snapshot);
}

async function findBestRecoveryContext(prisma, {
  shopDomain,
  checkoutId = "",
  checkoutSessionId = "",
  customerEmail = "",
}) {
  if (!shopDomain) return null;

  const [sendEvents, actionEvents] = await Promise.all([
    prisma.systemEvent.findMany({
      where: {
        shopDomain,
        eventType: "abando.experience_send.v1",
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.systemEvent.findMany({
      where: {
        shopDomain,
        eventType: "abando.recovery_action.v1",
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const normalizedEmail = normalizeEmail(customerEmail);
  const candidates = [...sendEvents, ...actionEvents]
    .map(extractCandidate)
    .filter(Boolean)
    .map((candidate) => {
      let score = 0;
      if (checkoutId && candidate.checkoutId === checkoutId) score += 100;
      if (checkoutSessionId && candidate.checkoutSessionId === checkoutSessionId) score += 100;
      if (normalizedEmail && candidate.channel === "email" && normalizeEmail(candidate.target) === normalizedEmail) score += 30;
      if (candidate.returnedAt) score += 20;
      if (candidate.eventType === "abando.experience_send.v1") score += 10;
      return { ...candidate, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

  return candidates[0] || null;
}

export async function persistRecoveryAttributionFromOrder(prisma, input) {
  const context = await findBestRecoveryContext(prisma, {
    shopDomain: input.shop,
    checkoutId: input.checkout_id,
    checkoutSessionId: input.checkout_session_id,
    customerEmail: input.customer_email,
  });

  const snapshot = buildSnapshot({
    recovery_id: context?.recoveryId || "",
    experienceId: context?.experienceId || "",
    shop: input.shop,
    checkout_id: input.checkout_id || context?.checkoutId || "",
    checkout_session_id: input.checkout_session_id || context?.checkoutSessionId || "",
    recovery_action_id: input.recovery_action_id || context?.payload?.recovery_action_id || "",
    proof_loop_id: input.proof_loop_id || context?.payload?.proof_loop_id || "",
    channel: input.channel || context?.channel || "",
    target: input.target || context?.target || "",
    sent_at: input.sent_at || context?.sentAt || "",
    return_clicked_at: input.return_clicked_at || context?.returnedAt || "",
    order_id: input.order_id,
    order_name: input.order_name,
    order_created_at: input.order_created_at,
    order_total_price_cents: input.order_total_price_cents,
    currency: input.currency,
    attribution_status: "verified_order_matched",
    proof_status: input.synthetic ? "synthetic_validation_order" : "verified_shopify_order",
    source_of_proof: input.source_of_proof,
    source_event_id: input.source_event_id || context?.payload?.source_event_id || "",
    provider_message_id: context?.payload?.providerId || "",
    provider_sms_sid: context?.payload?.smsSid || "",
    synthetic: Boolean(input.synthetic),
  });

  if (context?.eventType === "abando.experience_send.v1") {
    await prisma.systemEvent.update({
      where: { id: context.id },
      data: {
        payload: {
          ...context.payload,
          recovery_id: snapshot.recovery_id,
          attributedOrderId: snapshot.order_id,
          attributedOrderValueCents: snapshot.order_total_price_cents,
          attributedCurrency: snapshot.currency,
          attributionMatchedAt: snapshot.order_created_at || new Date().toISOString(),
          attributionStatus: snapshot.attribution_status,
          proofStatus: snapshot.proof_status,
          source_of_proof: snapshot.source_of_proof,
          order_name: snapshot.order_name,
        },
      },
    }).catch(() => {});
  }

  await appendSnapshot(prisma, snapshot.shop, snapshot);
  return snapshot;
}
