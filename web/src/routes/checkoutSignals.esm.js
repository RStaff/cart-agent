import express from "express";
import { appendCheckoutSignal } from "../lib/checkoutSignalStore.js";
import { sanitizeSignalPath, normalizeShopDomain } from "../lib/signalPath.js";
import { getStaffordosUrl } from "../lib/staffordosUrl.js";
import { createJob, getJobByIdempotencyKey } from "../jobs/repository.js";
import { prisma } from "../clients/prisma.js";
import { createDecisionLog, updateDecisionOutcome, deriveInterventionType, normalizeDecisionTrigger } from "../lib/decisionLogs.js";

function toSafeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function centsFromDecimalString(value) {
  if (typeof value !== "string" || !value.trim()) return 0;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? Math.round(normalized * 100) : 0;
}

function deriveCartMetrics(items) {
  if (!Array.isArray(items)) {
    return { cartValueCents: 0, itemCount: 0 };
  }

  let cartValueCents = 0;
  let itemCount = 0;

  for (const item of items) {
    if (!item || typeof item !== "object") continue;

    const quantity = Math.max(
      1,
      toSafeNumber(
        item.quantity
        ?? item.qty
        ?? item.count
        ?? 1
      ),
    );

    const unitPriceCents = Math.max(
      0,
      toSafeNumber(
        item.priceCents
        ?? item.amountCents
        ?? item.finalPriceCents
        ?? item.price_in_cents
      ),
    ) || Math.max(
      0,
      centsFromDecimalString(
        item.price
        ?? item.amount
        ?? item.finalPrice
        ?? item.price_amount
      ),
    );

    itemCount += quantity;
    cartValueCents += unitPriceCents * quantity;
  }

  return { cartValueCents, itemCount };
}

async function loadDecisionContext(shopDomain, cartToken) {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);
  const normalizedCartToken = typeof cartToken === "string" && cartToken.trim()
    ? cartToken.trim()
    : null;
  const recentWindowStart = new Date(Date.now() - (60 * 60 * 1000));

  const shop = normalizedShopDomain
    ? await prisma.shop.findUnique({
        where: { key: normalizedShopDomain },
        select: { id: true },
      })
    : null;

  const [cartRecord, priorEmailsSentCount, priorDecisionLogs] = await Promise.all([
    normalizedCartToken
      ? prisma.cart.findUnique({
          where: { cartId: normalizedCartToken },
          select: {
            createdAt: true,
            items: true,
          },
        })
      : Promise.resolve(null),
    shop?.id
      ? prisma.emailQueue.count({
          where: {
            shopId: shop.id,
            status: "sent",
              },
            })
      : Promise.resolve(0),
    normalizedShopDomain && normalizedCartToken
      ? prisma.decisionLog.findMany({
          where: {
            shopDomain: normalizedShopDomain,
            cartToken: normalizedCartToken,
            createdAt: { gte: recentWindowStart },
          },
          select: {
            trigger: true,
            outcome: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const metrics = deriveCartMetrics(cartRecord?.items);
  const sessionAgeSeconds = cartRecord?.createdAt
    ? Math.max(0, Math.floor((Date.now() - cartRecord.createdAt.getTime()) / 1000))
    : 0;
  const repeatedRiskCount = priorDecisionLogs.filter((record) => String(record.trigger || "") === "idle").length
    + priorDecisionLogs.filter((record) => {
      const trigger = String(record.trigger || "");
      return trigger !== "idle" && trigger !== "manual_override";
    }).length;
  const priorShownCount = priorDecisionLogs.filter((record) => record.outcome === "shown").length;
  const priorDismissedCount = priorDecisionLogs.filter((record) => record.outcome === "dismissed").length;
  const priorContinuedCount = priorDecisionLogs.filter((record) => record.outcome === "continued").length;

  return {
    cartValueCents: metrics.cartValueCents,
    itemCount: metrics.itemCount,
    sessionAgeSeconds,
    priorEmailsSentCount,
    repeatedRiskCount,
    priorDecisionCount: priorDecisionLogs.length,
    priorShownCount,
    priorDismissedCount,
    priorContinuedCount,
  };
}

async function requestDecision(input) {
  const staffordUrl = getStaffordosUrl();
  const fallback = {
    decision: "log_only",
    ruleId: "R000",
    reason: "staffordos_unavailable",
    score: 0,
    threshold: 20,
    scoringFactors: [],
    evaluationSummary: "log_only driven by staffordos-core being unavailable",
  };

  try {
    const response = await fetch(`${staffordUrl}/abando/decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(1500),
    });

    if (!response.ok) {
      return fallback;
    }

    const body = await response.json();
    return {
      decision: typeof body.decision === "string" ? body.decision : fallback.decision,
      ruleId: typeof body.ruleId === "string" ? body.ruleId : fallback.ruleId,
      reason: typeof body.reason === "string" ? body.reason : fallback.reason,
      score: Number.isFinite(Number(body.score)) ? Number(body.score) : fallback.score,
      threshold: Number.isFinite(Number(body.threshold)) ? Number(body.threshold) : fallback.threshold,
      scoringFactors: Array.isArray(body.scoringFactors) ? body.scoringFactors : fallback.scoringFactors,
      evaluationSummary: typeof body.evaluationSummary === "string"
        ? body.evaluationSummary
        : fallback.evaluationSummary,
    };
  } catch (error) {
    console.error("[signal] staffordos decision unavailable", {
      shopDomain: input.shopDomain,
      cartToken: input.cartToken,
      reason: input.reason,
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback;
  }
}

async function enqueueSignalAuditJob(event) {
  try {
    const idempotencyKey = [
      "checkout-risk",
      event.shopDomain || "unknown-shop",
      event.cartToken || "no-cart",
      event.reason || "no-reason",
      event.path || "no-path",
    ].join(":");

    const existingJob = await getJobByIdempotencyKey(idempotencyKey);
    if (!existingJob) {
      await createJob({
        type: "checkout-risk-signal",
        shopDomain: event.shopDomain || "unknown-shop",
        idempotencyKey,
        payload: {
          signalEventId: event.eventId,
          cartToken: event.cartToken,
          path: event.path,
          ts: event.ts,
          reason: event.reason,
        },
      });
    }
  } catch (error) {
    console.error("[signal] checkout-risk job enqueue failed", {
      shopDomain: event.shopDomain,
      cartToken: event.cartToken,
      reason: event.reason,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function enqueueRecoveryEmailJob(event, decisionResult) {
  if (decisionResult.decision !== "show_intercept") {
    return null;
  }

  const idempotencyKey = [
    "recovery-email",
    event.shopDomain || "unknown-shop",
    event.cartToken || "no-cart",
  ].join(":");

  const existingJob = await getJobByIdempotencyKey(idempotencyKey);
  if (existingJob) {
    return existingJob;
  }

  return createJob({
    type: "recovery_email",
    shopDomain: event.shopDomain || "unknown-shop",
    idempotencyKey,
    payload: {
      shopDomain: event.shopDomain || "unknown-shop",
      cartToken: event.cartToken,
      signalReason: event.reason,
      signalPath: sanitizeSignalPath(
        event.path,
        event.shopDomain || "unknown-shop",
      ),
      capturedAt: event.ts,
      decision: decisionResult.decision,
      ruleId: decisionResult.ruleId,
    },
  });
}

function parseSignalBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  const rawBody = typeof req.body === "string"
    ? req.body
    : Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : "";

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return {};
  }
}

function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "content-type");
  res.set("Access-Control-Allow-Methods", "POST,OPTIONS");
}

function validateBasePayload(payload, { requireReason }) {
  const shopDomain = normalizeShopDomain(payload.shopDomain);
  const path = typeof payload.path === "string" ? payload.path.trim() : "";
  const ts = typeof payload.ts === "string" && payload.ts.trim() ? payload.ts.trim() : new Date().toISOString();
  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";
  const sessionMarker = typeof payload.sessionMarker === "string" && payload.sessionMarker.trim()
    ? payload.sessionMarker.trim()
    : null;
  const validationMode = payload.validationMode === true || String(payload.validationMode || "").toLowerCase() === "true";
  const cartToken = typeof payload.cartToken === "string" && payload.cartToken.trim()
    ? payload.cartToken.trim()
    : null;

  const errors = [];
  if (!shopDomain) {
    errors.push("shopDomain is required");
  }
  if (!path) {
    errors.push("path is required");
  }
  if (requireReason && !reason) {
    errors.push("reason is required");
  }

  return {
    errors,
    normalized: {
      shopDomain: shopDomain || null,
      cartToken,
      path: path || null,
      ts,
      reason: reason || null,
      sessionMarker,
      validationMode,
    },
  };
}

function buildStorefrontCheckoutStartedPayload(normalized, reqMeta = {}) {
  const occurredAt = typeof normalized.ts === "string" && normalized.ts.trim()
    ? new Date(normalized.ts).toISOString()
    : new Date().toISOString();
  const checkoutPath = sanitizeSignalPath(normalized.path || "");
  const checkoutId = typeof normalized.cartToken === "string" && normalized.cartToken.trim()
    ? normalized.cartToken.trim()
    : typeof normalized.sessionMarker === "string" && normalized.sessionMarker.trim()
      ? normalized.sessionMarker.trim()
      : "";

  return {
    id: `signal_checkout_started_${Date.now().toString(36)}`,
    shop: normalized.shopDomain,
    session_id: normalized.sessionMarker || checkoutId || `session_${Date.now().toString(36)}`,
    checkout_id: checkoutId || null,
    checkout_session_id: checkoutId || normalized.sessionMarker || null,
    timestamp: occurredAt,
    occurredAt,
    event_type: "checkout_started",
    stage: "checkout",
    source: "live_storefront",
    device_type: "unknown",
    order_id: null,
    customerEmail: null,
    customerPhone: null,
    metadata: {
      path: checkoutPath || null,
      cartToken: checkoutId || null,
      storefrontHost: normalized.shopDomain || null,
      validationMode: normalized.validationMode === true,
      emittedBy: "signal/checkout-start",
      origin: reqMeta.origin || "",
      ip: reqMeta.ip || "",
      userAgent: reqMeta.userAgent || "",
    },
  };
}

function isQualifyingStorefrontCheckoutStartedPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (String(payload.event_type || "").trim().toLowerCase() !== "checkout_started") return false;
  if (String(payload.source || "").trim().toLowerCase() !== "live_storefront") return false;

  const checkoutId = String(
    payload.checkout_id
    || payload.checkoutId
    || payload.checkout_token
    || payload.metadata?.cartToken
    || "",
  ).trim();
  const checkoutPath = String(payload.metadata?.path || "").trim();
  const storefrontHost = String(payload.metadata?.storefrontHost || "").trim();

  if (!storefrontHost) return false;
  if (!checkoutId && !checkoutPath) return false;
  if (checkoutPath && !checkoutPath.includes("/checkouts/")) return false;
  return true;
}

async function persistCheckoutStartSystemEvent(normalized, reqMeta = {}) {
  const payload = buildStorefrontCheckoutStartedPayload(normalized, reqMeta);
  const shopKey = normalizeShopDomain(payload.shop);
  if (!shopKey) {
    return { ok: false, reason: "missing_shop" };
  }

  const shopRecord = await prisma.shop.findUnique({
    where: { key: shopKey },
    select: { key: true },
  });

  if (!shopRecord) {
    return { ok: false, reason: "unknown_shop" };
  }

  if (!isQualifyingStorefrontCheckoutStartedPayload(payload)) {
    return { ok: false, reason: "non_qualifying_checkout_start" };
  }

  const systemEvent = await prisma.systemEvent.create({
    data: {
      shopDomain: shopKey,
      eventType: "abando.checkout_event.v1",
      visibility: "merchant",
      payload,
    },
  });

  return {
    ok: true,
    systemEventId: systemEvent.id,
    payload,
  };
}

async function processCheckoutRiskPayload(payload, reqMeta = {}) {
  const { errors, normalized } = validateBasePayload(payload, { requireReason: true });
  if (errors.length > 0) {
    return {
      ok: false,
      status: 400,
      errors,
      payload,
    };
  }

  const event = appendCheckoutSignal({
    type: "checkout-risk",
    payload: normalized,
    metadata: {
      ip: reqMeta.ip || "",
      userAgent: reqMeta.userAgent || "",
      origin: reqMeta.origin || "",
    },
  });

  console.log("[signal] checkout-risk captured", {
    shopDomain: event.shopDomain,
    cartToken: event.cartToken,
    path: event.path,
    ts: event.ts,
    reason: event.reason,
  });

  await enqueueSignalAuditJob(event);

  const context = await loadDecisionContext(event.shopDomain, event.cartToken).catch((error) => {
    console.error("[signal] checkout-risk context lookup failed", {
      shopDomain: event.shopDomain,
      cartToken: event.cartToken,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      cartValueCents: 0,
      itemCount: 0,
      sessionAgeSeconds: 0,
      priorEmailsSentCount: 0,
    };
  });

  const decisionResult = await requestDecision({
    shopDomain: event.shopDomain || "unknown-shop",
    cartToken: event.cartToken,
    event: "checkout-risk",
    reason: event.reason,
    cartValueCents: context.cartValueCents,
    itemCount: context.itemCount,
    sessionAgeSeconds: context.sessionAgeSeconds,
    priorEmailsSentCount: context.priorEmailsSentCount,
    repeatedRiskCount: context.repeatedRiskCount,
    priorDecisionCount: context.priorDecisionCount,
    priorShownCount: context.priorShownCount,
    priorDismissedCount: context.priorDismissedCount,
    priorContinuedCount: context.priorContinuedCount,
    validationMode: normalized.validationMode,
  });

  const recoveryJob = await enqueueRecoveryEmailJob(event, decisionResult).catch((error) => {
    console.error("[signal] recovery email job enqueue failed", {
      shopDomain: event.shopDomain,
      cartToken: event.cartToken,
      ruleId: decisionResult.ruleId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  });

  const decisionLog = await createDecisionLog({
    shopDomain: event.shopDomain || "unknown-shop",
    cartToken: event.cartToken,
    trigger: event.reason,
    decision: decisionResult.decision,
    decisionReason: decisionResult.reason,
    interventionType: deriveInterventionType(decisionResult.decision),
    outcome: decisionResult.decision === "show_intercept" ? "unknown" : "not_shown",
    outcomeTimestamp: decisionResult.decision === "show_intercept" ? null : event.ts,
    decisionTimestamp: event.ts,
    cartValueCents: context.cartValueCents,
    sessionMarker: normalized.sessionMarker,
    validationMode: normalized.validationMode,
    relatedEventId: event.eventId,
  }).catch((error) => {
    console.error("[signal] decision log create failed", {
      shopDomain: event.shopDomain,
      cartToken: event.cartToken,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  });

  return {
    ok: true,
    status: 202,
    eventId: event.eventId,
    decisionId: decisionLog?.id || null,
    decision: decisionResult.decision,
    ruleId: decisionResult.ruleId,
    reason: decisionResult.reason,
    score: decisionResult.score,
    threshold: decisionResult.threshold,
    scoringFactors: decisionResult.scoringFactors,
    evaluationSummary: decisionResult.evaluationSummary,
    recoveryJobId: recoveryJob?.id || null,
  };
}

function installCheckoutSignals(app) {
  app.options("/signal/checkout-start", (_req, res) => {
    setCors(res);
    res.status(204).end();
  });

  app.options("/signal/checkout-risk", (_req, res) => {
    setCors(res);
    res.status(204).end();
  });

  app.options("/signal/decision-log", (_req, res) => {
    setCors(res);
    res.status(204).end();
  });

  app.options("/signal/decision-outcome", (_req, res) => {
    setCors(res);
    res.status(204).end();
  });

  app.post("/signal/checkout-start", express.text({ type: "*/*", limit: "32kb" }), async (req, res) => {
    setCors(res);
    const payload = parseSignalBody(req);
    const { errors, normalized } = validateBasePayload(payload, { requireReason: false });

    if (errors.length > 0) {
      console.warn("[signal] checkout-start invalid", { errors, payload });
      return res.status(400).json({ ok: false, errors });
    }

    const event = appendCheckoutSignal({
      type: "checkout-start",
      payload: normalized,
      metadata: {
        ip: (req.headers["x-forwarded-for"] || req.ip || "").toString(),
        userAgent: req.get("user-agent") || "",
        origin: req.get("origin") || "",
      },
    });

    const persisted = await persistCheckoutStartSystemEvent(normalized, {
      ip: (req.headers["x-forwarded-for"] || req.ip || "").toString(),
      userAgent: req.get("user-agent") || "",
      origin: req.get("origin") || "",
    }).catch((error) => {
      console.error("[signal] checkout-start system event persist failed", {
        shopDomain: normalized.shopDomain,
        cartToken: normalized.cartToken,
        path: normalized.path,
        error: error instanceof Error ? error.message : String(error),
      });
      return { ok: false, reason: "persist_failed" };
    });

    console.log("[signal] checkout-start captured", {
      shopDomain: event.shopDomain,
      cartToken: event.cartToken,
      path: event.path,
      ts: event.ts,
      persistedCheckoutEvent: persisted.ok,
      persistedReason: persisted.ok ? null : persisted.reason,
    });

    return res.status(202).json({
      ok: true,
      eventId: event.eventId,
      persistedCheckoutEvent: persisted.ok,
      persistedReason: persisted.ok ? null : persisted.reason,
      systemEventId: persisted.ok ? persisted.systemEventId : null,
    });
  });

  app.post("/signal/checkout-risk", express.text({ type: "*/*", limit: "32kb" }), async (req, res) => {
    setCors(res);
    const payload = parseSignalBody(req);
    const result = await processCheckoutRiskPayload(payload, {
      ip: (req.headers["x-forwarded-for"] || req.ip || "").toString(),
      userAgent: req.get("user-agent") || "",
      origin: req.get("origin") || "",
    });

    if (!result.ok) {
      console.warn("[signal] checkout-risk invalid", { errors: result.errors, payload });
      return res.status(result.status).json({ ok: false, errors: result.errors });
    }

    return res.status(result.status).json({
      ok: true,
      eventId: result.eventId,
      decisionId: result.decisionId,
      decision: result.decision,
      reason: result.reason,
      score: result.score,
      threshold: result.threshold,
      scoringFactors: result.scoringFactors,
      evaluationSummary: result.evaluationSummary,
    });
  });

  app.post("/signal/decision-log", express.text({ type: "*/*", limit: "32kb" }), async (req, res) => {
    setCors(res);
    const payload = parseSignalBody(req);
    const shopDomain = normalizeShopDomain(payload.shopDomain);
    const decision = typeof payload.decision === "string" ? payload.decision.trim() : "";

    if (!shopDomain || !decision) {
      return res.status(400).json({ ok: false, error: "shopDomain and decision are required" });
    }

    try {
      const record = await createDecisionLog({
        shopDomain,
        cartToken: typeof payload.cartToken === "string" ? payload.cartToken.trim() : null,
        trigger: normalizeDecisionTrigger(payload.trigger || "manual_override"),
        decision,
        decisionReason: typeof payload.decisionReason === "string" && payload.decisionReason.trim()
          ? payload.decisionReason.trim()
          : "manual_override",
        interventionType: typeof payload.interventionType === "string" && payload.interventionType.trim()
          ? payload.interventionType.trim()
          : deriveInterventionType(decision),
        outcome: typeof payload.outcome === "string" ? payload.outcome.trim() : "unknown",
        outcomeTimestamp: payload.outcomeTimestamp || null,
        decisionTimestamp: payload.decisionTimestamp || new Date().toISOString(),
        cartValueCents: Number(payload.cartValueCents ?? 0),
        sessionMarker: typeof payload.sessionMarker === "string" ? payload.sessionMarker.trim() : null,
        validationMode: payload.validationMode === true || String(payload.validationMode || "").toLowerCase() === "true",
      });

      return res.status(202).json({ ok: true, decisionId: record.id });
    } catch (error) {
      console.error("[signal] manual decision log failed", {
        shopDomain,
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({ ok: false, error: "decision_log_failed" });
    }
  });

  app.post("/signal/decision-outcome", express.text({ type: "*/*", limit: "32kb" }), async (req, res) => {
    setCors(res);
    const payload = parseSignalBody(req);
    const decisionId = typeof payload.decisionId === "string" ? payload.decisionId.trim() : "";
    const outcome = typeof payload.outcome === "string" ? payload.outcome.trim() : "";

    if (!decisionId || !outcome) {
      return res.status(400).json({ ok: false, error: "decisionId and outcome are required" });
    }

    try {
      const record = await updateDecisionOutcome({
        decisionId,
        outcome,
        outcomeTimestamp: payload.outcomeTimestamp || new Date().toISOString(),
        sessionMarker: typeof payload.sessionMarker === "string" ? payload.sessionMarker.trim() : null,
      });

      return res.status(200).json({
        ok: true,
        decisionId: record.id,
        outcome: record.outcome,
      });
    } catch (error) {
      console.error("[signal] decision outcome update failed", {
        decisionId,
        outcome,
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({ ok: false, error: "decision_outcome_failed" });
    }
  });
}

export { installCheckoutSignals, processCheckoutRiskPayload, normalizeShopDomain };
