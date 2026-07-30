import express from "express";
import { internalOnly } from "../middleware/internalOnly.js";
import {
  evaluateRepairScopeAuthority,
  getStoredRepairApproval,
  getStoredRepairScope,
  recordRepairScopeApproval,
  revokeRepairScopeApproval,
  storeRepairScope,
} from "../lib/shopifixerScopeAuthorityRepository.js";
import {
  createOrAssociateCanonicalPacketForApprovedScope,
  getCanonicalPacketAssociationForScope,
  getCanonicalShopifixerExecutionAuthority,
} from "../lib/shopifixerCanonicalPacketAuthority.js";

function cleanString(value = "") {
  return String(value || "").trim();
}

function booleanValue(value) {
  if (typeof value === "boolean") return value;
  const clean = cleanString(value).toLowerCase();
  if (clean === "true") return true;
  if (clean === "false") return false;
  return Boolean(value);
}

function actorInput(req, prefix = "") {
  const body = req.body || {};
  const headerPrefix = prefix ? `${prefix}-` : "";
  return {
    actorType:
      body[`${prefix}ActorType`] ||
      body.actorType ||
      req.get(`x-shopifixer-${headerPrefix}actor-type`) ||
      req.get("x-shopifixer-actor-type"),
    actorId:
      body[`${prefix}ActorId`] ||
      body.actorId ||
      req.get(`x-shopifixer-${headerPrefix}actor-id`) ||
      req.get("x-shopifixer-actor-id") ||
      req.get("x-operator-id"),
  };
}

function sanitizeError(result) {
  return {
    ok: false,
    error: result.error,
    ...(Array.isArray(result.missing) ? { missing: result.missing } : {}),
    ...(result.field ? { field: result.field } : {}),
  };
}

export function buildStoreRepairScopeHandler(options = {}) {
  return async function storeRepairScopeHandler(req, res) {
    const result = await storeRepairScope({
      auditId: req.params?.auditId,
      store: req.body?.store || req.body?.storeDomain || req.body?.store_domain || req.query?.store,
      scopeVersion: req.body?.scopeVersion || req.body?.scope_version,
      createdByActorType: actorInput(req, "scope").actorType,
      createdByActorId: actorInput(req, "scope").actorId,
      repairPlanGeneratedAt: options.repairPlanGeneratedAt,
      scopeGeneratedAt: options.scopeGeneratedAt,
      prisma: options.prisma,
      logger: options.logger,
    });

    if (!result.ok) return res.status(result.status).json(sanitizeError(result));
    return res.status(result.created ? 201 : 200).json({
      ok: true,
      created: result.created,
      repairScope: result.scope,
      authority: evaluateRepairScopeAuthority({ scope: result.scope, now: options.now }),
      note: "internal authorization identifies the operator/system caller; merchant approval is not implied",
    });
  };
}

export function buildRecordRepairScopeApprovalHandler(options = {}) {
  return async function recordRepairScopeApprovalHandler(req, res) {
    const actor = actorInput(req);
    const result = await recordRepairScopeApproval({
      scopeId: req.params?.scopeId,
      approvalIdempotencyKey: req.body?.approvalIdempotencyKey || req.body?.approval_idempotency_key,
      actorType: actor.actorType,
      actorId: actor.actorId,
      actorDisplayLabel: req.body?.actorDisplayLabel || req.body?.actor_display_label,
      approvalSource: req.body?.approvalSource || req.body?.approval_source,
      operatorMediated: booleanValue(req.body?.operatorMediated ?? req.body?.operator_mediated),
      merchantAuthenticated: booleanValue(req.body?.merchantAuthenticated ?? req.body?.merchant_authenticated),
      approvalEvidence: req.body?.approvalEvidence || req.body?.approval_evidence,
      approvedTermsBoundary: req.body?.approvedTermsBoundary || req.body?.approved_terms_boundary,
      approvedIncludedRepairIds: req.body?.approvedIncludedRepairIds || req.body?.approved_included_repair_ids,
      approvedAt: req.body?.approvedAt || req.body?.approved_at,
      expiresAt: req.body?.expiresAt || req.body?.expires_at,
      prisma: options.prisma,
      now: options.now,
    });

    if (!result.ok) return res.status(result.status).json(sanitizeError(result));
    return res.status(result.created ? 201 : 200).json({
      ok: true,
      created: result.created,
      approval: result.approval,
      authority: evaluateRepairScopeAuthority({
        scope: result.scope,
        approval: result.approval,
        now: options.now,
      }),
      note: "operator-mediated approval evidence is durable, but internal authorization is not merchant authentication",
    });
  };
}

export function buildRevokeRepairScopeApprovalHandler(options = {}) {
  return async function revokeRepairScopeApprovalHandler(req, res) {
    const actor = actorInput(req, "revocation");
    const result = await revokeRepairScopeApproval({
      approvalId: req.params?.approvalId,
      revokedByActorType: actor.actorType,
      revokedByActorId: actor.actorId,
      revocationReason: req.body?.revocationReason || req.body?.revocation_reason || req.body?.reason,
      revokedAt: req.body?.revokedAt || req.body?.revoked_at,
      prisma: options.prisma,
      now: options.now,
    });

    if (!result.ok) return res.status(result.status).json(sanitizeError(result));
    return res.status(200).json({
      ok: true,
      revoked: result.revoked,
      approval: result.approval,
    });
  };
}

export function buildGetRepairScopeHandler(options = {}) {
  return async function getRepairScopeHandler(req, res) {
    const result = await getStoredRepairScope({
      scopeId: req.params?.scopeId,
      prisma: options.prisma,
    });

    if (!result.ok) return res.status(result.status).json(sanitizeError(result));
    return res.status(200).json({
      ok: true,
      repairScope: result.scope,
      authority: evaluateRepairScopeAuthority({ scope: result.scope, now: options.now }),
    });
  };
}

export function buildGetRepairApprovalHandler(options = {}) {
  return async function getRepairApprovalHandler(req, res) {
    const result = await getStoredRepairApproval({
      approvalId: req.params?.approvalId,
      prisma: options.prisma,
      now: options.now,
    });

    if (!result.ok) return res.status(result.status).json(sanitizeError(result));
    return res.status(200).json({
      ok: true,
      approval: result.approval,
    });
  };
}

export function buildCreateCanonicalPacketForScopeHandler(options = {}) {
  return async function createCanonicalPacketForScopeHandler(req, res) {
    const actor = actorInput(req);
    const result = await createOrAssociateCanonicalPacketForApprovedScope({
      scopeId: req.params?.scopeId,
      approvalId: req.body?.approvalId || req.body?.approval_id,
      transitionIdempotencyKey: req.body?.transitionIdempotencyKey || req.body?.transition_idempotency_key,
      actorType: actor.actorType,
      actorId: actor.actorId,
      prisma: options.prisma,
      packetRepository: options.packetRepository,
      now: options.now,
    });

    if (!result.ok) return res.status(result.status).json(sanitizeError(result));
    return res.status(result.createdAssociation ? 201 : 200).json({
      ok: true,
      createdPacket: result.createdPacket,
      createdAssociation: result.createdAssociation,
      packet: result.packet,
      packetLink: result.packetLink,
      authority: result.authority,
      executionManifest: result.executionManifest,
      note: "canonical Packet authority remains public.packets; internal authorization is not merchant approval",
    });
  };
}

export function buildGetCanonicalPacketForScopeHandler(options = {}) {
  return async function getCanonicalPacketForScopeHandler(req, res) {
    const result = await getCanonicalPacketAssociationForScope({
      scopeId: req.params?.scopeId,
      approvalId: req.query?.approvalId || req.query?.approval_id,
      prisma: options.prisma,
      now: options.now,
    });

    if (!result.ok) return res.status(result.status).json(sanitizeError(result));
    return res.status(200).json({
      ok: true,
      packet: result.packet,
      packetLink: result.packetLink,
      authority: result.authority,
      executionManifest: result.executionManifest,
    });
  };
}

export function buildGetCanonicalExecutionManifestHandler(options = {}) {
  return async function getCanonicalExecutionManifestHandler(req, res) {
    const result = await getCanonicalShopifixerExecutionAuthority({
      canonicalPacketId: req.params?.packetId,
      prisma: options.prisma,
      now: options.now,
    });

    if (!result.ok) {
      return res.status(result.status).json({
        ok: false,
        error: result.error,
        ...(Array.isArray(result.integrityFailures) ? { integrityFailures: result.integrityFailures } : {}),
      });
    }

    return res.status(200).json({
      ok: true,
      executionManifest: result.executionManifest,
      executionGate: result.executionGate,
      authority: {
        canonicalPacketId: result.authority.packet?.packetId || null,
        auditId: result.authority.audit?.id || null,
        scopeId: result.authority.scope?.scopeId || null,
        approvalId: result.authority.approval?.approvalId || null,
        normalizedStore: result.authority.normalizedStore || null,
        integrityFailures: result.authority.integrityFailures || [],
      },
      note: "canonical manifest retrieval is read-only and does not authorize Shopify execution",
    });
  };
}

export function installShopifixerScopeAuthority(app, options = {}) {
  const router = express.Router();

  router.use(internalOnly);
  router.post("/audits/:auditId/scopes", buildStoreRepairScopeHandler(options));
  router.post("/scopes/:scopeId/approvals", buildRecordRepairScopeApprovalHandler(options));
  router.post("/scopes/:scopeId/canonical-packet", buildCreateCanonicalPacketForScopeHandler(options));
  router.post("/approvals/:approvalId/revoke", buildRevokeRepairScopeApprovalHandler(options));
  router.get("/packets/:packetId/execution-manifest", buildGetCanonicalExecutionManifestHandler(options));
  router.get("/scopes/:scopeId/canonical-packet", buildGetCanonicalPacketForScopeHandler(options));
  router.get("/scopes/:scopeId", buildGetRepairScopeHandler(options));
  router.get("/approvals/:approvalId", buildGetRepairApprovalHandler(options));

  app.use("/internal/shopifixer", router);
}

export function assertNoMerchantAuthenticationFromInternalRoute(req) {
  return cleanString(req?.get?.("x-internal-api-key")) ? "operator_or_system_only" : "unauthorized";
}
