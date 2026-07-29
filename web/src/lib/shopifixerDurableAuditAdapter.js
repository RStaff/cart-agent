import crypto from "node:crypto";
import pkg from "@prisma/client";
import { prisma as defaultPrisma } from "../clients/prisma.js";

const { Prisma } = pkg;

const SHOPIFIXER_SOURCE = "staffordmedia_shopifixer";

export function normalizeShopifyDomain(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .replace(/\/+$/, "");
}

export function legacyLeadAliasFromDomain(domain = "") {
  const normalized = normalizeShopifyDomain(domain)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized ? `lead_${normalized}` : null;
}

function normalizeEmail(value = "") {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .filter((key) => value[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function hashJson(value) {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

function cleanOptionalString(value) {
  const clean = String(value || "").trim();
  return clean || null;
}

function dateFromIso(value) {
  const candidate = new Date(value);
  return Number.isNaN(candidate.getTime()) ? new Date() : candidate;
}

function summarizeIssues(analysis) {
  if (!Array.isArray(analysis?.issues)) return [];
  return analysis.issues
    .filter((issue) => issue && typeof issue === "object")
    .map((issue, index) => ({
      index,
      title: String(issue.title || "").trim(),
      detail: String(issue.detail || "").trim(),
      severity: String(issue.severity || "").trim(),
    }))
    .filter((issue) => issue.title);
}

function buildAuditSnapshots({ normalizedDomain, email, analysis, payload, packetId, source }) {
  const issues = summarizeIssues(analysis);
  const inputSnapshot = {
    normalizedShopifyDomain: normalizedDomain,
    submittedEmailPresent: Boolean(email),
    source,
    packetId: packetId || null,
  };
  const findingsSnapshot = {
    issues,
    canonicalPayload: payload,
  };
  const findingSummary = {
    issueCount: issues.length,
    topIssue: cleanOptionalString(payload?.top_issue),
    recommendedAction: cleanOptionalString(payload?.recommended_action),
    auditScore: typeof payload?.audit_score === "number" ? payload.audit_score : null,
    estimatedRevenueLoss: cleanOptionalString(payload?.estimated_revenue_loss),
  };

  return {
    inputSnapshot,
    analysisSnapshot: analysis || null,
    findingsSnapshot,
    findingSummary,
  };
}

function buildAuditKeys({ normalizedDomain, email, payload, requestId, packetId, source }) {
  const inputFingerprint = hashJson({
    normalizedShopifyDomain: normalizedDomain,
    submittedEmail: email || null,
    source,
    packetId: packetId || null,
  });
  const operationFingerprint = requestId
    ? String(requestId).trim()
    : hashJson({
        normalizedShopifyDomain: normalizedDomain,
        submittedEmail: email || null,
        payload,
        source,
        packetId: packetId || null,
      });

  return {
    requestFingerprint: inputFingerprint,
    idempotencyKey: `shopifixer:audit:${operationFingerprint}`,
    analysisHash: hashJson(payload || {}),
  };
}

function getSerializableIsolation() {
  return Prisma?.TransactionIsolationLevel?.Serializable
    ? { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    : undefined;
}

async function retrySerializableTransaction(prisma, operation) {
  const options = getSerializableIsolation();
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(operation, options);
    } catch (error) {
      const retryable =
        error?.code === "P2034" ||
        String(error?.message || "").toLowerCase().includes("could not serialize access");
      if (!retryable || attempt === maxAttempts) throw error;
    }
  }

  throw new Error("shopifixer_durable_transaction_retry_exhausted");
}

async function findExistingPacket(tx, packetId, normalizedDomain, logger) {
  if (!packetId) return null;

  const packet = await tx.packet.findUnique({ where: { packetId } });
  if (!packet) {
    logger?.warn?.("[shopifixer:durable-audit] packet_link_skipped", {
      reason: "packet_not_found",
      packetId,
      storeDomain: normalizedDomain,
    });
    return null;
  }

  const packetStore = normalizeShopifyDomain(packet.storeDomain || packet.store_domain);
  if (packetStore !== normalizedDomain) {
    logger?.warn?.("[shopifixer:durable-audit] packet_link_skipped", {
      reason: "packet_store_mismatch",
      packetId,
      packetStore,
      storeDomain: normalizedDomain,
    });
    return null;
  }

  return packet;
}

export async function persistShopifixerAudit(input = {}) {
  const {
    storeUrl,
    email: rawEmail,
    analysis,
    payload,
    packetId: rawPacketId,
    requestId,
    source = "fix_page",
    logger = console,
    prisma = defaultPrisma,
  } = input;

  const normalizedDomain = normalizeShopifyDomain(storeUrl || payload?.store_domain);
  const email = normalizeEmail(rawEmail);
  const packetId = cleanOptionalString(rawPacketId);

  if (!normalizedDomain) {
    throw new Error("shopifixer_durable_audit_missing_store");
  }

  const leadAlias = legacyLeadAliasFromDomain(normalizedDomain);
  const leadIdempotencyKey = `shopifixer:lead:${normalizedDomain}:${SHOPIFIXER_SOURCE}`;
  const { inputSnapshot, analysisSnapshot, findingsSnapshot, findingSummary } = buildAuditSnapshots({
    normalizedDomain,
    email,
    analysis,
    payload,
    packetId,
    source,
  });
  const { requestFingerprint, idempotencyKey, analysisHash } = buildAuditKeys({
    normalizedDomain,
    email,
    payload,
    requestId,
    packetId,
    source,
  });
  const completedAt = dateFromIso(payload?.generated_at);

  const result = await retrySerializableTransaction(prisma, async (tx) => {
    const merchant = await tx.shopifixerMerchant.upsert({
      where: { normalizedShopifyDomain: normalizedDomain },
      create: {
        normalizedShopifyDomain: normalizedDomain,
        displayName: normalizedDomain,
        status: "identified",
        source: SHOPIFIXER_SOURCE,
        sourceMetadata: {
          route: "/api/fix-audit",
          source,
        },
      },
      update: {
        status: "identified",
      },
    });

    const lead = await tx.shopifixerLead.upsert({
      where: { idempotencyKey: leadIdempotencyKey },
      create: {
        merchantId: merchant.id,
        legacyLeadAlias: leadAlias,
        idempotencyKey: leadIdempotencyKey,
        productSurface: SHOPIFIXER_SOURCE,
        source: "staffordmedia",
        status: "audit_completed",
        currentStage: "operator_review_required",
        submittedEmail: email || null,
        contactConfidence: email ? "submitted_by_visitor" : "missing",
        nextAction: "Review ShopiFixer audit findings",
        sourceMetadata: {
          route: "/api/fix-audit",
          source,
          emailPresent: Boolean(email),
        },
      },
      update: {
        status: "audit_completed",
        currentStage: "operator_review_required",
        submittedEmail: email || undefined,
        contactConfidence: email ? "submitted_by_visitor" : undefined,
        nextAction: "Review ShopiFixer audit findings",
      },
    });

    const existingAudit = await tx.shopifixerAudit.findUnique({
      where: { idempotencyKey },
    });

    if (existingAudit && existingAudit.requestFingerprint !== requestFingerprint) {
      throw new Error("shopifixer_audit_idempotency_conflict");
    }

    let audit = existingAudit;
    let auditCreated = false;

    if (!audit) {
      const previousAudit = await tx.shopifixerAudit.findFirst({
        where: { merchantId: merchant.id },
        orderBy: { auditSequence: "desc" },
        select: { auditSequence: true },
      });
      const auditSequence = Number(previousAudit?.auditSequence || 0) + 1;

      audit = await tx.shopifixerAudit.create({
        data: {
          merchantId: merchant.id,
          leadId: lead.id,
          normalizedShopifyDomain: normalizedDomain,
          auditSequence,
          idempotencyKey,
          requestFingerprint,
          status: "completed",
          source: SHOPIFIXER_SOURCE,
          inputSnapshot,
          analysisSnapshot,
          findingsSnapshot,
          findingSummary,
          topIssue: cleanOptionalString(payload?.top_issue),
          recommendedAction: cleanOptionalString(payload?.recommended_action),
          auditScore: typeof payload?.audit_score === "number" ? payload.audit_score : null,
          estimatedRevenueLoss: cleanOptionalString(payload?.estimated_revenue_loss),
          analyzerVersion: cleanOptionalString(analysis?.analyzerVersion) || "storeAnalyzer.v1",
          sourceCommit: cleanOptionalString(process.env.RENDER_GIT_COMMIT || process.env.COMMIT_SHA),
          sourceBuildId: cleanOptionalString(process.env.RENDER_SERVICE_ID || process.env.RENDER_SERVICE_NAME),
          requestedAt: completedAt,
          completedAt,
        },
      });
      auditCreated = true;
    }

    const eventKey = `shopifixer:event:audit:${audit.id}:audit_completed:${analysisHash}`;
    const event = await tx.shopifixerLeadEvent.upsert({
      where: { idempotencyKey: eventKey },
      create: {
        merchantId: merchant.id,
        leadId: lead.id,
        auditId: audit.id,
        packetId: null,
        eventType: "audit_completed",
        visibility: "system",
        source: SHOPIFIXER_SOURCE,
        idempotencyKey: eventKey,
        payload: {
          storeDomain: normalizedDomain,
          auditScore: typeof payload?.audit_score === "number" ? payload.audit_score : null,
          issueCount: Array.isArray(payload?.issues) ? payload.issues.length : 0,
          topIssue: cleanOptionalString(payload?.top_issue),
          packetLinkAttempted: Boolean(packetId),
        },
      },
      update: {
        payload: {
          storeDomain: normalizedDomain,
          auditScore: typeof payload?.audit_score === "number" ? payload.audit_score : null,
          issueCount: Array.isArray(payload?.issues) ? payload.issues.length : 0,
          topIssue: cleanOptionalString(payload?.top_issue),
          packetLinkAttempted: Boolean(packetId),
        },
      },
    });

    let packetLink = null;
    const packet = await findExistingPacket(tx, packetId, normalizedDomain, logger);

    if (packet) {
      const linkIdempotencyKey = `shopifixer:packet_link:${audit.id}:execution:${packet.packetId}`;
      packetLink = await tx.shopifixerPacketLink.upsert({
        where: { idempotencyKey: linkIdempotencyKey },
        create: {
          merchantId: merchant.id,
          auditId: audit.id,
          packetId: packet.packetId,
          purpose: "execution",
          status: "active",
          activeKey: `shopifixer:packet_link:${audit.id}:execution:active`,
          idempotencyKey: linkIdempotencyKey,
          authorizationSource: "existing_packet_context",
          sourceMetadata: {
            route: "/api/fix-audit",
            source,
          },
        },
        update: {
          status: "active",
        },
      });
    }

    return {
      merchant,
      lead,
      audit,
      event,
      packetLink,
      auditCreated,
    };
  });

  logger?.info?.("[shopifixer:durable-audit] persisted", {
    storeDomain: normalizedDomain,
    merchantId: result.merchant.id,
    leadId: result.lead.id,
    auditId: result.audit.id,
    auditCreated: result.auditCreated,
    packetLinkId: result.packetLink?.id || null,
    packetLinkCreated: Boolean(result.packetLink),
  });

  return {
    merchantId: result.merchant.id,
    leadId: result.lead.id,
    auditId: result.audit.id,
    eventId: result.event.id,
    packetLinkId: result.packetLink?.id || null,
    auditCreated: result.auditCreated,
  };
}
