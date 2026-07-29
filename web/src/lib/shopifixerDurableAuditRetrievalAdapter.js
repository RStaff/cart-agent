import { prisma as defaultPrisma } from "../clients/prisma.js";
import { normalizeShopifyDomain } from "./shopifixerDurableAuditAdapter.js";

function cleanIdentifier(value = "") {
  return String(value || "").trim();
}

function isSafeIdentifier(value = "") {
  const clean = cleanIdentifier(value);
  return clean.length >= 3 && clean.length <= 220 && /^[A-Za-z0-9:_.-]+$/.test(clean);
}

function cleanDomain(value = "") {
  const normalized = normalizeShopifyDomain(value);
  return normalized || "";
}

export function normalizeDurableAuditLookup(input = {}) {
  const auditId = cleanIdentifier(input.auditId || input.audit_id);
  const leadIdempotencyKey = cleanIdentifier(input.leadIdempotencyKey || input.lead_idempotency_key);
  const storeDomain = cleanDomain(input.store || input.storeDomain || input.store_domain);

  if (auditId) {
    if (!isSafeIdentifier(auditId)) {
      return { ok: false, status: 400, error: "invalid_audit_id" };
    }
    return {
      ok: true,
      lookup: {
        mode: "audit_id",
        auditId,
        storeDomain: storeDomain || null,
      },
    };
  }

  if (leadIdempotencyKey || storeDomain) {
    if (!leadIdempotencyKey || !storeDomain) {
      return {
        ok: false,
        status: 400,
        error: "missing_reentry_lookup_context",
      };
    }

    if (!isSafeIdentifier(leadIdempotencyKey)) {
      return { ok: false, status: 400, error: "invalid_lead_idempotency_key" };
    }

    return {
      ok: true,
      lookup: {
        mode: "latest_for_lead",
        leadIdempotencyKey,
        storeDomain,
      },
    };
  }

  return { ok: false, status: 400, error: "missing_audit_lookup" };
}

const auditSelect = {
  id: true,
  status: true,
  normalizedShopifyDomain: true,
  auditSequence: true,
  requestFingerprint: true,
  source: true,
  inputSnapshot: true,
  analysisSnapshot: true,
  findingsSnapshot: true,
  findingSummary: true,
  topIssue: true,
  recommendedAction: true,
  auditScore: true,
  estimatedRevenueLoss: true,
  analyzerVersion: true,
  sourceCommit: true,
  sourceBuildId: true,
  requestedAt: true,
  completedAt: true,
  failedAt: true,
  failureKind: true,
  failureMessage: true,
  createdAt: true,
  updatedAt: true,
  merchant: {
    select: {
      id: true,
      normalizedShopifyDomain: true,
      displayName: true,
      classification: true,
      status: true,
      controlledTest: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  lead: {
    select: {
      id: true,
      legacyLeadAlias: true,
      idempotencyKey: true,
      productSurface: true,
      source: true,
      status: true,
      currentStage: true,
      contactConfidence: true,
      nextAction: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  events: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      eventType: true,
      visibility: true,
      source: true,
      payload: true,
      createdAt: true,
      packetId: true,
      proofReferenceId: true,
    },
  },
  packetLinks: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      packetId: true,
      purpose: true,
      status: true,
      authorizationSource: true,
      createdAt: true,
      updatedAt: true,
      canceledAt: true,
      supersededAt: true,
      packet: {
        select: {
          packetId: true,
          storeDomain: true,
          status: true,
          executionStatus: true,
          proofStatus: true,
          completionStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  },
  proofReferences: {
    orderBy: [{ proofVersion: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      packetId: true,
      packetLinkId: true,
      proofVersion: true,
      proofType: true,
      status: true,
      artifactUri: true,
      artifactHash: true,
      beforeEvidence: true,
      afterEvidence: true,
      rollbackEvidence: true,
      verificationSummary: true,
      immutableMetadata: true,
      capturedAt: true,
      verifiedAt: true,
      verifier: true,
      createdAt: true,
      updatedAt: true,
    },
  },
};

function serializeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function serializeEvent(event) {
  return {
    id: event.id,
    eventType: event.eventType,
    visibility: event.visibility,
    source: event.source,
    payload: event.payload || null,
    packetId: event.packetId || null,
    proofReferenceId: event.proofReferenceId || null,
    createdAt: serializeDate(event.createdAt),
  };
}

function serializePacketLink(link) {
  return {
    id: link.id,
    packetId: link.packetId,
    purpose: link.purpose,
    status: link.status,
    authorizationSource: link.authorizationSource || null,
    createdAt: serializeDate(link.createdAt),
    updatedAt: serializeDate(link.updatedAt),
    canceledAt: serializeDate(link.canceledAt),
    supersededAt: serializeDate(link.supersededAt),
    packet: link.packet
      ? {
          packetId: link.packet.packetId,
          storeDomain: link.packet.storeDomain,
          status: link.packet.status,
          executionStatus: link.packet.executionStatus,
          proofStatus: link.packet.proofStatus,
          completionStatus: link.packet.completionStatus,
          createdAt: serializeDate(link.packet.createdAt),
          updatedAt: serializeDate(link.packet.updatedAt),
        }
      : null,
  };
}

function serializeProofReference(proof) {
  return {
    id: proof.id,
    packetId: proof.packetId,
    packetLinkId: proof.packetLinkId || null,
    proofVersion: proof.proofVersion,
    proofType: proof.proofType,
    status: proof.status,
    artifactUri: proof.artifactUri || null,
    artifactHash: proof.artifactHash || null,
    beforeEvidence: proof.beforeEvidence || null,
    afterEvidence: proof.afterEvidence || null,
    rollbackEvidence: proof.rollbackEvidence || null,
    verificationSummary: proof.verificationSummary || null,
    immutableMetadata: proof.immutableMetadata || null,
    capturedAt: serializeDate(proof.capturedAt),
    verifiedAt: serializeDate(proof.verifiedAt),
    verifier: proof.verifier || null,
    createdAt: serializeDate(proof.createdAt),
    updatedAt: serializeDate(proof.updatedAt),
  };
}

function serializeAudit(audit, lookup) {
  return {
    lookup,
    audit: {
      id: audit.id,
      status: audit.status,
      normalizedShopifyDomain: audit.normalizedShopifyDomain,
      auditSequence: audit.auditSequence,
      source: audit.source,
      requestFingerprint: audit.requestFingerprint,
      requestedAt: serializeDate(audit.requestedAt),
      completedAt: serializeDate(audit.completedAt),
      failedAt: serializeDate(audit.failedAt),
      createdAt: serializeDate(audit.createdAt),
      updatedAt: serializeDate(audit.updatedAt),
      failureKind: audit.failureKind || null,
      failureMessage: audit.failureMessage || null,
      analyzerVersion: audit.analyzerVersion || null,
      sourceCommit: audit.sourceCommit || null,
      sourceBuildId: audit.sourceBuildId || null,
      evidence: {
        inputSnapshot: audit.inputSnapshot || null,
        analysisSnapshot: audit.analysisSnapshot || null,
        findingsSnapshot: audit.findingsSnapshot || null,
        findingSummary: audit.findingSummary || null,
        topIssue: audit.topIssue || null,
        recommendedAction: audit.recommendedAction || null,
        auditScore: audit.auditScore ?? null,
        estimatedRevenueLoss: audit.estimatedRevenueLoss || null,
      },
    },
    merchant: {
      id: audit.merchant.id,
      normalizedShopifyDomain: audit.merchant.normalizedShopifyDomain,
      displayName: audit.merchant.displayName || null,
      classification: audit.merchant.classification,
      status: audit.merchant.status,
      controlledTest: audit.merchant.controlledTest,
      createdAt: serializeDate(audit.merchant.createdAt),
      updatedAt: serializeDate(audit.merchant.updatedAt),
    },
    lead: {
      id: audit.lead.id,
      legacyLeadAlias: audit.lead.legacyLeadAlias || null,
      idempotencyKey: audit.lead.idempotencyKey,
      productSurface: audit.lead.productSurface,
      source: audit.lead.source,
      status: audit.lead.status,
      currentStage: audit.lead.currentStage,
      contactConfidence: audit.lead.contactConfidence || null,
      nextAction: audit.lead.nextAction || null,
      createdAt: serializeDate(audit.lead.createdAt),
      updatedAt: serializeDate(audit.lead.updatedAt),
    },
    events: (audit.events || []).map(serializeEvent),
    packetLinks: (audit.packetLinks || []).map(serializePacketLink),
    proofReferences: (audit.proofReferences || []).map(serializeProofReference),
  };
}

async function findAudit(prisma, lookup) {
  if (lookup.mode === "audit_id") {
    return prisma.shopifixerAudit.findFirst({
      where: {
        id: lookup.auditId,
        ...(lookup.storeDomain ? { normalizedShopifyDomain: lookup.storeDomain } : {}),
      },
      select: auditSelect,
    });
  }

  if (lookup.mode === "latest_for_lead") {
    return prisma.shopifixerAudit.findFirst({
      where: {
        normalizedShopifyDomain: lookup.storeDomain,
        lead: {
          idempotencyKey: lookup.leadIdempotencyKey,
        },
      },
      orderBy: { createdAt: "desc" },
      select: auditSelect,
    });
  }

  return null;
}

export async function retrieveShopifixerAudit(input = {}) {
  const lookupResult = normalizeDurableAuditLookup(input);

  if (!lookupResult.ok) {
    return {
      ok: false,
      status: lookupResult.status,
      error: lookupResult.error,
    };
  }

  const prisma = input.prisma || defaultPrisma;
  const audit = await findAudit(prisma, lookupResult.lookup);

  if (!audit) {
    return {
      ok: false,
      status: 404,
      error: "shopifixer_audit_not_found",
    };
  }

  return {
    ok: true,
    status: 200,
    result: serializeAudit(audit, lookupResult.lookup),
  };
}
