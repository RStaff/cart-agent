export const BLUEPRINT_OFFER = Object.freeze({
  offerId: "STAFFORDMEDIA_AUTOMATION_OPPORTUNITY_ASSESSMENT_V1",
  paymentLinkId: "plink_1UJacwJyylmUTExqQDaNV1dB",
  productId: "prod_VKF6B7HLG2L0tQ",
  priceId: "price_1UJacYJyylmUTExqBGErXBxb",
  amountTotal: 75000,
  currency: "usd",
  quantity: 1,
});

export const BLUEPRINT_PAID_EVENT_TYPES = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

export class BlueprintPaymentRejection extends Error {
  constructor(code) {
    super(code);
    this.name = "BlueprintPaymentRejection";
    this.code = code;
  }
}

function idOf(value) {
  return typeof value === "string" ? value : String(value?.id || "");
}

function optionalText(value, max = 320) {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, max) : null;
}

function eventSession(event) {
  const session = event?.data?.object;
  if (!session || session.object !== "checkout.session" || !session.id) {
    throw new BlueprintPaymentRejection("BLUEPRINT_CHECKOUT_SESSION_REQUIRED");
  }
  return session;
}

export function isBlueprintPaymentCandidate(event) {
  if (!BLUEPRINT_PAID_EVENT_TYPES.has(event?.type)) return false;
  const session = event?.data?.object;
  return session?.object === "checkout.session" && idOf(session.payment_link) === BLUEPRINT_OFFER.paymentLinkId;
}

function validateEvent(event) {
  if (!event?.id || !BLUEPRINT_PAID_EVENT_TYPES.has(event?.type)) {
    throw new BlueprintPaymentRejection("BLUEPRINT_PAID_EVENT_REQUIRED");
  }
  if (event.livemode !== true) throw new BlueprintPaymentRejection("BLUEPRINT_EVENT_NOT_LIVE");
  if (!Number.isSafeInteger(event.created) || event.created <= 0) {
    throw new BlueprintPaymentRejection("BLUEPRINT_EVENT_CREATED_INVALID");
  }
  return eventSession(event);
}

function verifiedEvidence(event, session) {
  const lineItems = session?.line_items?.data;
  if (session?.object !== "checkout.session") throw new BlueprintPaymentRejection("BLUEPRINT_SESSION_INVALID");
  if (session.livemode !== true) throw new BlueprintPaymentRejection("BLUEPRINT_SESSION_NOT_LIVE");
  if (session.payment_status !== "paid") throw new BlueprintPaymentRejection("BLUEPRINT_SESSION_NOT_PAID");
  if (session.mode !== "payment") throw new BlueprintPaymentRejection("BLUEPRINT_SESSION_MODE_INVALID");
  if (idOf(session.payment_link) !== BLUEPRINT_OFFER.paymentLinkId) throw new BlueprintPaymentRejection("BLUEPRINT_PAYMENT_LINK_MISMATCH");
  if (session.amount_total !== BLUEPRINT_OFFER.amountTotal) throw new BlueprintPaymentRejection("BLUEPRINT_AMOUNT_MISMATCH");
  if (String(session.currency || "").toLowerCase() !== BLUEPRINT_OFFER.currency) throw new BlueprintPaymentRejection("BLUEPRINT_CURRENCY_MISMATCH");
  if (!Array.isArray(lineItems) || lineItems.length !== 1 || session.line_items?.has_more === true) {
    throw new BlueprintPaymentRejection("BLUEPRINT_LINE_ITEM_COUNT_MISMATCH");
  }

  const item = lineItems[0];
  const price = item?.price;
  if (item?.quantity !== BLUEPRINT_OFFER.quantity) throw new BlueprintPaymentRejection("BLUEPRINT_QUANTITY_MISMATCH");
  if (item?.amount_total !== BLUEPRINT_OFFER.amountTotal) throw new BlueprintPaymentRejection("BLUEPRINT_LINE_ITEM_AMOUNT_MISMATCH");
  if (price?.id !== BLUEPRINT_OFFER.priceId) throw new BlueprintPaymentRejection("BLUEPRINT_PRICE_MISMATCH");
  if (price?.type !== "one_time") throw new BlueprintPaymentRejection("BLUEPRINT_PRICE_TYPE_MISMATCH");
  if (price?.unit_amount !== BLUEPRINT_OFFER.amountTotal) throw new BlueprintPaymentRejection("BLUEPRINT_UNIT_AMOUNT_MISMATCH");
  if (String(price?.currency || "").toLowerCase() !== BLUEPRINT_OFFER.currency) throw new BlueprintPaymentRejection("BLUEPRINT_PRICE_CURRENCY_MISMATCH");
  if (idOf(price?.product) !== BLUEPRINT_OFFER.productId) throw new BlueprintPaymentRejection("BLUEPRINT_PRODUCT_MISMATCH");

  return {
    stripeEventId: event.id,
    stripeEventType: event.type,
    stripeSessionId: session.id,
    stripeCustomerId: optionalText(idOf(session.customer)),
    stripePaymentIntentId: optionalText(idOf(session.payment_intent)),
    buyerEmail: optionalText(session.customer_details?.email, 254),
    buyerName: optionalText(session.customer_details?.name),
    buyerPhone: optionalText(session.customer_details?.phone, 80),
    claimedInquiryReference: optionalText(
      session.metadata?.inquiry_id || session.metadata?.inquiryId || session.client_reference_id,
      191,
    ),
    paidAt: new Date(event.created * 1000),
  };
}

function sameAuthority(receipt, eventId, sessionId) {
  if (!receipt) return false;
  if (receipt.stripeEventId === eventId && receipt.stripeSessionId !== sessionId) {
    throw new BlueprintPaymentRejection("BLUEPRINT_EVENT_SESSION_CONFLICT");
  }
  return receipt.stripeEventId === eventId || receipt.stripeSessionId === sessionId;
}

async function findExisting(prisma, eventId, sessionId) {
  const receipt = await prisma.staffordosBlueprintPaymentEvent.findFirst({
    where: { OR: [{ stripeEventId: eventId }, { stripeSessionId: sessionId }] },
    include: { engagement: true },
  });
  return sameAuthority(receipt, eventId, sessionId) ? receipt : null;
}

function resultFrom(receipt, duplicate) {
  return {
    handled: true,
    accepted: true,
    duplicate,
    engagementId: receipt.engagementId,
    state: receipt.engagement.state,
    associationStatus: receipt.engagement.associationStatus,
  };
}

export function createBlueprintPaymentAuthority({ prisma, stripeClient }) {
  if (!prisma || !stripeClient?.checkout?.sessions?.retrieve) {
    throw new Error("blueprint_payment_authority_dependencies_required");
  }

  return {
    async accept(event) {
      if (!BLUEPRINT_PAID_EVENT_TYPES.has(event?.type)) return { handled: false };
      const signedSession = eventSession(event);
      const eventId = String(event.id || "");
      const sessionId = String(signedSession.id || "");

      if (!isBlueprintPaymentCandidate(event)) return { handled: false };
      const existing = eventId && sessionId ? await findExisting(prisma, eventId, sessionId) : null;
      if (existing) return resultFrom(existing, true);

      validateEvent(event);
      const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items.data.price.product"],
      });
      if (session.id !== sessionId) throw new BlueprintPaymentRejection("BLUEPRINT_SESSION_ID_MISMATCH");
      const evidence = verifiedEvidence(event, session);

      try {
        const engagement = await prisma.$transaction(async (tx) => tx.staffordosBlueprintEngagement.create({
          data: {
            offerId: BLUEPRINT_OFFER.offerId,
            state: "PAID_IDENTITY_REVIEW",
            associationStatus: "PENDING_REVIEW",
            stripeSessionId: evidence.stripeSessionId,
            stripePaymentLinkId: BLUEPRINT_OFFER.paymentLinkId,
            stripeProductId: BLUEPRINT_OFFER.productId,
            stripePriceId: BLUEPRINT_OFFER.priceId,
            stripeCustomerId: evidence.stripeCustomerId,
            stripePaymentIntentId: evidence.stripePaymentIntentId,
            amountTotal: BLUEPRINT_OFFER.amountTotal,
            currency: BLUEPRINT_OFFER.currency,
            quantity: BLUEPRINT_OFFER.quantity,
            buyerEmail: evidence.buyerEmail,
            buyerName: evidence.buyerName,
            buyerPhone: evidence.buyerPhone,
            claimedInquiryReference: evidence.claimedInquiryReference,
            clientId: null,
            inquiryId: null,
            paidAt: evidence.paidAt,
            paymentEvent: {
              create: {
                stripeEventId: evidence.stripeEventId,
                stripeSessionId: evidence.stripeSessionId,
                stripeEventType: evidence.stripeEventType,
                livemode: true,
                receivedAt: evidence.paidAt,
              },
            },
          },
          include: { paymentEvent: true },
        }));
        return resultFrom({ engagementId: engagement.id, engagement }, false);
      } catch (error) {
        if (error?.code !== "P2002") throw error;
        const concurrent = await findExisting(prisma, eventId, sessionId);
        if (!concurrent) throw error;
        return resultFrom(concurrent, true);
      }
    },
  };
}
