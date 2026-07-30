import crypto from "node:crypto";
import pkg from "@prisma/client";
import { prisma as defaultPrisma } from "../clients/prisma.js";
import {
  createPacket as defaultCreatePacket,
  getPacket as defaultGetPacket,
  normalizeStoreDomain,
} from "./packetRepository.js";
import { buildShopifixerExecutionPacket } from "./shopifixerExecutionPacketAdapter.js";
import {
  calculateRepairScopeFingerprint,
  buildExecutionManifestScopeInput,
  evaluateApprovalLifecycle,
  evaluateRepairScopeAuthority,
} from "./shopifixerScopeAuthorityRepository.js";

const { Prisma } = pkg;

export const SHOPIFIXER_CANONICAL_PACKET_AUTHORITY_VERSION = "shopifixer.canonical_packet_authority.v1";
export const SHOPIFIXER_EXECUTION_GATE_VERSION = "shopifixer.execution_gate.v1";
export const SHOPIFIXER_CANONICAL_PACKET_PURPOSE = "shopifixer_repair_execution";
export const SHOPIFIXER_CANONICAL_PACKET_INITIAL_STATUS = "prepared";
export const SHOPIFIXER_CANONICAL_PACKET_INITIAL_EXECUTION_STATUS = "not_started";

const KNOWN_PACKET_STATUSES = Object.freeze([
  "prepared",
  "payment_pending",
  "payment_received",
  "completed",
  "failed",
  "cancelled",
  "expired",
]);
const KNOWN_PACKET_EXECUTION_STATUSES = Object.freeze([
  "not_started",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

function cleanString(value = "") {
  return String(value || "").trim();
}

function cleanLower(value = "") {
  return cleanString(value).toLowerCase();
}

function serializeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
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

function stableHash(value) {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableId(prefix, value, size = 20) {
  return `${prefix}_${stableHash(value).slice(0, size)}`;
}

function normalizeJsonValue(value) {
  if (Array.isArray(value)) return value.map(normalizeJsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, normalizeJsonValue(value[key])]),
    );
  }
  return value ?? null;
}

function serviceError(error, status = 400, details = {}) {
  const err = new Error(error);
  err.status = status;
  err.details = details;
  return err;
}

function errorResult(error) {
  return {
    ok: false,
    status: error?.status || 500,
    error: error?.message || "shopifixer_canonical_packet_authority_failed",
    ...(error?.details ? error.details : {}),
  };
}

function getSerializableIsolation() {
  return Prisma?.TransactionIsolationLevel?.Serializable
    ? { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    : undefined;
}

async function runTransaction(prisma, operation) {
  if (typeof prisma.$transaction !== "function") return operation(prisma);
  return prisma.$transaction(operation, getSerializableIsolation());
}

function normalizePacketProjection(packet) {
  if (!packet) return null;
  return {
    packetId: packet.packetId || packet.packet_id,
    storeDomain: packet.storeDomain || packet.store_domain,
    reservationId: packet.reservationId || packet.reservation_id || null,
    paymentReference: packet.paymentReference || packet.payment_reference || null,
    status: packet.status,
    executionStatus: packet.executionStatus || packet.execution_status || SHOPIFIXER_CANONICAL_PACKET_INITIAL_EXECUTION_STATUS,
    proofStatus: packet.proofStatus || packet.proof_status || "not_started",
    completionStatus: packet.completionStatus || packet.completion_status || "not_started",
    createdAt: serializeDate(packet.createdAt || packet.created_at),
    updatedAt: serializeDate(packet.updatedAt || packet.updated_at),
  };
}

function scopeProjection(row) {
  if (!row) return null;
  const normalizedSnapshot = row.normalizedSnapshot || {};
  return {
    id: row.id,
    merchantId: row.merchantId,
    auditId: row.auditId,
    scopeId: row.scopeId,
    scopeVersion: row.scopeVersion,
    scopeFingerprint: row.scopeFingerprint,
    store: normalizedSnapshot.store || null,
    sourceEvidenceVersion: row.sourceEvidenceVersion || null,
    sourceRepairPlanVersion: row.sourceRepairPlanVersion || null,
    status: row.status,
    includedRepairs: row.includedRepairs || [],
    excludedRepairs: row.excludedRepairs || [],
    deferredRepairs: row.deferredRepairs || [],
    assumptions: row.assumptions || [],
    dependencies: row.dependencies || [],
    notInScope: row.notInScope || [],
    implementationSize: row.implementationSize || null,
    verificationCriteria: row.verificationCriteria || [],
    rollbackExpectations: row.rollbackExpectations || [],
    normalizedSnapshot,
    createdAt: serializeDate(row.createdAt),
  };
}

function approvalProjection(row, now = new Date()) {
  if (!row) return null;
  const lifecycle = evaluateApprovalLifecycle(row, { now });
  return {
    id: row.id,
    approvalId: row.approvalId,
    repairScopeId: row.repairScopeId,
    scopeId: row.repairScope?.scopeId || null,
    merchantId: row.merchantId,
    auditId: row.auditId,
    approvalIdempotencyKey: row.approvalIdempotencyKey,
    approvalFingerprint: row.approvalFingerprint,
    actorType: row.actorType,
    actorId: row.actorId,
    approvalSource: row.approvalSource,
    operatorMediated: Boolean(row.operatorMediated),
    merchantAuthenticated: Boolean(row.merchantAuthenticated),
    approvalEvidence: row.approvalEvidence,
    approvedTermsBoundary: row.approvedTermsBoundary,
    approvedIncludedRepairIds: row.approvedIncludedRepairIds || [],
    approvedScopeFingerprint: row.approvedScopeFingerprint,
    approvedScopeVersion: row.approvedScopeVersion,
    status: row.status,
    lifecycleStatus: lifecycle.lifecycleStatus,
    active: lifecycle.active,
    inactiveReasons: lifecycle.inactiveReasons,
    approvedAt: serializeDate(row.approvedAt),
    expiresAt: serializeDate(row.expiresAt),
    revokedAt: serializeDate(row.revokedAt),
    createdAt: serializeDate(row.createdAt),
    updatedAt: serializeDate(row.updatedAt),
  };
}

function packetLinkProjection(row) {
  if (!row) return null;
  return {
    id: row.id,
    merchantId: row.merchantId,
    auditId: row.auditId,
    packetId: row.packetId,
    repairScopeId: row.repairScopeId || null,
    repairApprovalId: row.repairApprovalId || null,
    scopeId: row.repairScope?.scopeId || row.sourceMetadata?.scopeId || null,
    approvalId: row.repairApproval?.approvalId || row.sourceMetadata?.approvalId || null,
    purpose: row.purpose,
    status: row.status,
    activeKey: row.activeKey || null,
    idempotencyKey: row.idempotencyKey,
    authorityFingerprint: row.authorityFingerprint || null,
    authorityVersion: row.authorityVersion || null,
    authorizedBy: row.authorizedBy || null,
    authorizationSource: row.authorizationSource || null,
    sourceMetadata: row.sourceMetadata || null,
    canceledAt: serializeDate(row.canceledAt),
    supersededAt: serializeDate(row.supersededAt),
    createdAt: serializeDate(row.createdAt),
    updatedAt: serializeDate(row.updatedAt),
    packet: normalizePacketProjection(row.packet),
  };
}

function auditProjection(row) {
  if (!row) return null;
  return {
    id: row.id,
    merchantId: row.merchantId,
    leadId: row.leadId || null,
    normalizedShopifyDomain: row.normalizedShopifyDomain,
    status: row.status,
    completedAt: serializeDate(row.completedAt),
    createdAt: serializeDate(row.createdAt),
    updatedAt: serializeDate(row.updatedAt),
  };
}

function merchantProjection(row) {
  if (!row) return null;
  return {
    id: row.id,
    normalizedShopifyDomain: row.normalizedShopifyDomain,
    displayName: row.displayName || null,
    status: row.status,
    controlledTest: Boolean(row.controlledTest),
    createdAt: serializeDate(row.createdAt),
    updatedAt: serializeDate(row.updatedAt),
  };
}

function sanitizedApprovalProjection(row, now = new Date()) {
  const approval = approvalProjection(row, now);
  if (!approval) return null;
  return {
    id: approval.id,
    approvalId: approval.approvalId,
    repairScopeId: approval.repairScopeId,
    scopeId: approval.scopeId,
    merchantId: approval.merchantId,
    auditId: approval.auditId,
    approvalFingerprint: approval.approvalFingerprint,
    actorType: approval.actorType,
    actorIdPresent: Boolean(approval.actorId),
    approvalSource: approval.approvalSource,
    operatorMediated: approval.operatorMediated,
    merchantAuthenticated: approval.merchantAuthenticated,
    approvalEvidencePresent: hasMeaningfulEvidence(approval.approvalEvidence),
    approvedTermsBoundaryPresent: hasMeaningfulEvidence(approval.approvedTermsBoundary),
    approvedIncludedRepairIds: approval.approvedIncludedRepairIds,
    approvedScopeFingerprint: approval.approvedScopeFingerprint,
    approvedScopeVersion: approval.approvedScopeVersion,
    status: approval.status,
    lifecycleStatus: approval.lifecycleStatus,
    active: approval.active,
    inactiveReasons: approval.inactiveReasons,
    approvedAt: approval.approvedAt,
    expiresAt: approval.expiresAt,
    revokedAt: approval.revokedAt,
    createdAt: approval.createdAt,
    updatedAt: approval.updatedAt,
  };
}

function associationInclude() {
  return {
    packet: true,
    repairScope: true,
    repairApproval: {
      include: { repairScope: true },
    },
  };
}

function hasMeaningfulEvidence(value) {
  if (!value) return false;
  if (typeof value === "string") return Boolean(cleanString(value));
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function validateScopeAndApproval({ scopeRow, approvalRow, now = new Date() }) {
  if (!scopeRow) throw serviceError("repair_scope_not_found", 404);
  if (!approvalRow) throw serviceError("repair_approval_not_found", 404);

  const scope = scopeProjection(scopeRow);
  const approval = approvalProjection(approvalRow, now);
  const recalculated = calculateRepairScopeFingerprint(scope.normalizedSnapshot, {
    scopeVersion: scope.scopeVersion,
  });

  if (recalculated.scopeFingerprint !== scope.scopeFingerprint) {
    throw serviceError("repair_scope_fingerprint_mismatch", 409);
  }
  if (approval.repairScopeId !== scope.id) {
    throw serviceError("approval_scope_mismatch", 409);
  }
  if (approval.merchantId !== scope.merchantId || approval.auditId !== scope.auditId) {
    throw serviceError("approval_authority_context_mismatch", 409);
  }
  if (approval.approvedScopeFingerprint !== scope.scopeFingerprint) {
    throw serviceError("approval_fingerprint_mismatch", 409);
  }
  if (approval.approvedScopeVersion !== scope.scopeVersion) {
    throw serviceError("approval_version_mismatch", 409);
  }
  if (!approval.active) {
    const reason = approval.inactiveReasons?.[0] || "repair_approval_not_active";
    throw serviceError(reason, 409);
  }
  if (!hasMeaningfulEvidence(approval.approvalEvidence)) {
    throw serviceError("missing_approval_evidence", 409);
  }
  if (!cleanString(approval.actorType) || !cleanString(approval.actorId) || !cleanString(approval.approvalSource)) {
    throw serviceError("approval_actor_or_source_missing", 409);
  }

  const store = normalizeStoreDomain(scope.store || scope.normalizedSnapshot?.store);
  if (!store) throw serviceError("missing_scope_store", 409);

  return { scope, approval, store };
}

export function deriveCanonicalPacketTransitionIdentity({ scope, approval, transitionIdempotencyKey } = {}) {
  if (!scope?.scopeId || !approval?.approvalId) {
    throw serviceError("missing_scope_or_approval_identity", 400);
  }

  const store = normalizeStoreDomain(scope.store || scope.normalizedSnapshot?.store);
  const transitionFingerprint = stableHash({
    authorityVersion: SHOPIFIXER_CANONICAL_PACKET_AUTHORITY_VERSION,
    purpose: SHOPIFIXER_CANONICAL_PACKET_PURPOSE,
    auditId: scope.auditId,
    merchantId: scope.merchantId,
    store,
    scopeId: scope.scopeId,
    scopeVersion: scope.scopeVersion,
    scopeFingerprint: scope.scopeFingerprint,
    approvalId: approval.approvalId,
    approvalFingerprint: approval.approvalFingerprint,
    approvedScopeFingerprint: approval.approvedScopeFingerprint,
    approvedScopeVersion: approval.approvedScopeVersion,
  });

  const callerKey = cleanString(transitionIdempotencyKey);
  return {
    authorityVersion: SHOPIFIXER_CANONICAL_PACKET_AUTHORITY_VERSION,
    purpose: SHOPIFIXER_CANONICAL_PACKET_PURPOSE,
    transitionFingerprint,
    transitionIdempotencyKey: callerKey
      ? `shopifixer:canonical_packet:${callerKey}`
      : `shopifixer:canonical_packet:${transitionFingerprint}`,
    canonicalPacketId: stableId("packet_shopifixer", {
      transitionFingerprint,
      store,
    }, 20),
    activeKey: `shopifixer:packet_link:${scope.scopeId}:${approval.approvalId}:active`,
  };
}

async function findExistingAssociation(tx, identity) {
  const existingByIdempotency = await tx.shopifixerPacketLink.findUnique({
    where: { idempotencyKey: identity.transitionIdempotencyKey },
    include: associationInclude(),
  });

  if (existingByIdempotency) {
    if (existingByIdempotency.authorityFingerprint !== identity.transitionFingerprint) {
      throw serviceError("canonical_packet_idempotency_conflict", 409);
    }
    return existingByIdempotency;
  }

  const existingByFingerprint = await tx.shopifixerPacketLink.findUnique({
    where: { authorityFingerprint: identity.transitionFingerprint },
    include: associationInclude(),
  });
  if (existingByFingerprint) return existingByFingerprint;

  return tx.shopifixerPacketLink.findFirst({
    where: {
      repairScopeId: identity.scope.id,
      repairApprovalId: identity.approval.id,
      purpose: SHOPIFIXER_CANONICAL_PACKET_PURPOSE,
    },
    include: associationInclude(),
  });
}

async function recordPacketAuthorityEvent(tx, { scope, approval, packetId, eventType, eventSuffix, payload }) {
  return tx.shopifixerLeadEvent.upsert({
    where: {
      idempotencyKey: `shopifixer:event:canonical_packet:${scope.scopeId}:${approval.approvalId}:${eventSuffix}`,
    },
    create: {
      merchantId: scope.merchantId,
      leadId: null,
      auditId: scope.auditId,
      packetId,
      eventType,
      visibility: "system",
      source: "staffordmedia_shopifixer",
      idempotencyKey: `shopifixer:event:canonical_packet:${scope.scopeId}:${approval.approvalId}:${eventSuffix}`,
      payload,
    },
    update: {
      packetId,
      payload,
    },
  });
}

function packetStoreMatches(packet, store) {
  return normalizeStoreDomain(packet?.storeDomain || packet?.store_domain) === store;
}

function buildPacketAuthorityResponse({ createdPacket, createdAssociation, scope, approval, packetLink, packet }) {
  const normalizedPacket = normalizePacketProjection(packet || packetLink?.packet);
  const projectedLink = packetLinkProjection({
    ...packetLink,
    packet: normalizedPacket,
  });
  const authority = evaluateRepairScopeAuthority({
    scope,
    approval,
    packetLink: projectedLink,
    packet: normalizedPacket,
  });
  const manifestInput = buildExecutionManifestScopeInput(scope, approval, {
    packetLink: projectedLink,
    packet: normalizedPacket,
    authority,
  });
  const manifest = buildShopifixerExecutionPacket(manifestInput, {
    authority,
  });

  return {
    ok: true,
    status: 200,
    createdPacket,
    createdAssociation,
    packet: normalizedPacket,
    packetLink: projectedLink,
    authority,
    executionManifest: manifest.ok ? manifest.packet : null,
    executionManifestError: manifest.ok ? null : manifest.error,
  };
}

function repairIdsFromScope(scope = {}) {
  const items = scope.normalizedSnapshot?.includedRepairs || scope.includedRepairs || [];
  return Array.from(new Set(items.map((item) => cleanString(item.scopeItemId)).filter(Boolean))).sort();
}

function condition(code, passed, source, required = true) {
  return {
    code,
    passed: Boolean(passed),
    source,
    required: Boolean(required),
  };
}

function packetStatusValid(packet) {
  return KNOWN_PACKET_STATUSES.includes(cleanLower(packet?.status));
}

function packetExecutionStatusValid(packet) {
  return KNOWN_PACKET_EXECUTION_STATUSES.includes(cleanLower(packet?.executionStatus));
}

function packetExecutionPermitted() {
  // The current repository has no explicit Shopify-execution-authorized Packet state.
  return false;
}

export function evaluateShopifixerExecutionGate(authority = {}, options = {}) {
  const now = options.evaluatedAt || new Date().toISOString();
  const approvalLifecycle = authority.approval?.lifecycle || {};
  const manifest = authority.executionManifest || {};
  const packet = authority.packet || null;
  const conditions = [
    condition("durable_audit_exists", Boolean(authority.audit?.id), "ShopifixerAudit"),
    condition("merchant_identity_valid", Boolean(authority.merchant?.id), "ShopifixerMerchant"),
    condition("normalized_store_consistent", Boolean(authority.integrity?.storeConsistent), "durable_authority_graph"),
    condition("immutable_scope_exists", Boolean(authority.scope?.id), "ShopifixerRepairScope"),
    condition("scope_fingerprint_valid", Boolean(authority.integrity?.scopeFingerprintValid), "ShopifixerRepairScope.scopeFingerprint"),
    condition("approval_exists", Boolean(authority.approval?.id), "ShopifixerRepairApproval"),
    condition("approval_matches_scope", Boolean(authority.integrity?.approvalMatchesScope), "ShopifixerRepairApproval.repairScopeId"),
    condition("approval_fingerprint_matches", Boolean(authority.integrity?.approvalFingerprintMatches), "ShopifixerRepairApproval.approvedScopeFingerprint"),
    condition("approval_version_matches", Boolean(authority.integrity?.approvalVersionMatches), "ShopifixerRepairApproval.approvedScopeVersion"),
    condition("approval_evidence_exists", Boolean(authority.approval?.approvalEvidencePresent), "ShopifixerRepairApproval.approvalEvidence"),
    condition("approval_actor_source_valid", Boolean(authority.integrity?.approvalActorSourceValid), "ShopifixerRepairApproval.actor"),
    condition("approval_active", approvalLifecycle.lifecycleStatus === "APPROVED", "approval_lifecycle"),
    condition("approval_not_revoked", approvalLifecycle.lifecycleStatus !== "REVOKED", "approval_lifecycle"),
    condition("approval_not_expired", approvalLifecycle.lifecycleStatus !== "EXPIRED", "approval_lifecycle"),
    condition("canonical_packet_exists", Boolean(packet?.packetId), "public.packets"),
    condition("packet_link_exists", Boolean(authority.packetLink?.id), "ShopifixerPacketLink"),
    condition("packet_link_matches_audit", Boolean(authority.integrity?.packetLinkMatchesAudit), "ShopifixerPacketLink.auditId"),
    condition("packet_link_matches_merchant", Boolean(authority.integrity?.packetLinkMatchesMerchant), "ShopifixerPacketLink.merchantId"),
    condition("packet_link_matches_scope", Boolean(authority.integrity?.packetLinkMatchesScope), "ShopifixerPacketLink.repairScopeId"),
    condition("packet_link_matches_approval", Boolean(authority.integrity?.packetLinkMatchesApproval), "ShopifixerPacketLink.repairApprovalId"),
    condition("packet_store_matches_merchant", Boolean(authority.integrity?.packetStoreMatchesMerchant), "Packet.storeDomain"),
    condition("packet_lifecycle_state_recognized", packetStatusValid(packet), "Packet.status"),
    condition("packet_execution_status_recognized", packetExecutionStatusValid(packet), "Packet.executionStatus"),
    condition("implementation_sequence_exists", Array.isArray(manifest.implementationSequence) && manifest.implementationSequence.length > 0, "execution_manifest"),
    condition("rollback_sequence_exists", Array.isArray(manifest.rollbackSequence) && manifest.rollbackSequence.length > 0, "execution_manifest"),
    condition("verification_criteria_exist", Array.isArray(manifest.verification?.repairVerificationCriteria) && manifest.verification.repairVerificationCriteria.length > 0, "execution_manifest"),
    condition("required_evidence_exists", Array.isArray(manifest.verification?.requiredEvidence) && manifest.verification.requiredEvidence.length > 0, "execution_manifest"),
    condition("no_unresolved_authority_conflict", !authority.integrityFailures?.length, "canonical_authority_lookup"),
    condition("packet_execution_status_permits_execution", packetExecutionPermitted(packet), "Packet.executionStatus"),
  ];
  const failedConditions = conditions
    .filter((item) => item.required && !item.passed)
    .map((item) => {
      switch (item.code) {
        case "durable_audit_exists":
          return "audit_missing";
        case "merchant_identity_valid":
          return "merchant_missing";
        case "normalized_store_consistent":
          return "packet_store_mismatch";
        case "immutable_scope_exists":
          return "scope_missing";
        case "scope_fingerprint_valid":
          return "scope_fingerprint_invalid";
        case "approval_exists":
          return "approval_missing";
        case "approval_matches_scope":
          return "approval_scope_mismatch";
        case "approval_fingerprint_matches":
          return "approval_fingerprint_mismatch";
        case "approval_version_matches":
          return "approval_version_mismatch";
        case "approval_evidence_exists":
          return "approval_evidence_missing";
        case "approval_actor_source_valid":
          return "approval_actor_source_missing";
        case "approval_active":
          return "approval_not_active";
        case "approval_not_revoked":
          return "approval_revoked";
        case "approval_not_expired":
          return "approval_expired";
        case "canonical_packet_exists":
          return "canonical_packet_missing";
        case "packet_link_exists":
          return "packet_link_missing";
        case "packet_link_matches_audit":
          return "packet_audit_mismatch";
        case "packet_link_matches_merchant":
          return "packet_merchant_mismatch";
        case "packet_link_matches_scope":
          return "packet_scope_mismatch";
        case "packet_link_matches_approval":
          return "packet_approval_mismatch";
        case "packet_store_matches_merchant":
          return "packet_store_mismatch";
        case "packet_lifecycle_state_recognized":
          return "packet_status_invalid";
        case "packet_execution_status_recognized":
          return "packet_execution_status_invalid";
        case "implementation_sequence_exists":
          return "implementation_sequence_missing";
        case "rollback_sequence_exists":
          return "rollback_requirements_missing";
        case "verification_criteria_exist":
          return "proof_requirements_missing";
        case "required_evidence_exists":
          return "required_evidence_missing";
        case "no_unresolved_authority_conflict":
          return "authority_integrity_conflict";
        case "packet_execution_status_permits_execution":
          return "packet_execution_not_permitted";
        default:
          return item.code;
      }
    });

  return {
    executionAuthorized: failedConditions.length === 0,
    evaluatedAt: now,
    authorityVersion: SHOPIFIXER_EXECUTION_GATE_VERSION,
    canonicalPacketId: authority.packet?.packetId || null,
    auditId: authority.audit?.id || null,
    scopeId: authority.scope?.scopeId || null,
    approvalId: authority.approval?.approvalId || null,
    normalizedStore: authority.normalizedStore || null,
    conditions,
    failedConditions,
  };
}

function buildManifestFromAuthority({ scope, approval, packetLink, packet, gate }) {
  const manifestInput = buildExecutionManifestScopeInput(scope, approval, {
    packetLink,
    packet,
    authority: {
      conditions: Object.fromEntries((gate?.conditions || []).map((item) => [item.code, item.passed])),
      failedConditions: gate?.failedConditions || [],
    },
  });
  const manifest = buildShopifixerExecutionPacket(manifestInput, {
    authority: {
      conditions: Object.fromEntries((gate?.conditions || []).map((item) => [item.code, item.passed])),
      failedConditions: gate?.failedConditions || [],
    },
  });
  return manifest.ok ? manifest.packet : null;
}

function authorityFailure(error, status = 409, integrityFailures = []) {
  return {
    ok: false,
    status,
    error,
    integrityFailures: integrityFailures.length ? integrityFailures : [error],
  };
}

function compareRepairIds(scope, approval) {
  const expected = repairIdsFromScope(scope);
  const actual = Array.from(new Set((approval?.approvedIncludedRepairIds || []).map(cleanString).filter(Boolean))).sort();
  return stableStringify(expected) === stableStringify(actual);
}

function buildAuthorityProjection({ packet, packetLink, events = [], duplicateAssociationCount = 0, now = new Date() }) {
  const projectedPacket = normalizePacketProjection(packet || packetLink?.packet);
  const projectedLink = packetLinkProjection(packetLink);
  const scope = scopeProjection(packetLink?.repairScope);
  const approval = sanitizedApprovalProjection(packetLink?.repairApproval, now);
  const rawApproval = packetLink?.repairApproval || null;
  const audit = auditProjection(packetLink?.audit);
  const merchant = merchantProjection(packetLink?.merchant);
  const scopeFingerprint = scope
    ? calculateRepairScopeFingerprint(scope.normalizedSnapshot || scope, {
        scopeVersion: scope.scopeVersion,
      }).scopeFingerprint
    : null;
  const identity = scope && rawApproval
    ? deriveCanonicalPacketTransitionIdentity({
        scope,
        approval: approvalProjection(rawApproval, now),
      })
    : null;
  const normalizedStore = normalizeStoreDomain(
    merchant?.normalizedShopifyDomain ||
    audit?.normalizedShopifyDomain ||
    scope?.store ||
    projectedPacket?.storeDomain,
  );
  const storeValues = [
    merchant?.normalizedShopifyDomain,
    audit?.normalizedShopifyDomain,
    scope?.store,
    projectedPacket?.storeDomain,
  ].map(normalizeStoreDomain).filter(Boolean);
  const lifecycle = rawApproval ? evaluateApprovalLifecycle(rawApproval, { now }) : {};
  const integrity = {
    scopeFingerprintValid: Boolean(scope && scopeFingerprint === scope.scopeFingerprint),
    approvalMatchesScope: Boolean(approval && scope && approval.repairScopeId === scope.id),
    approvalFingerprintMatches: Boolean(approval && scope && approval.approvedScopeFingerprint === scope.scopeFingerprint),
    approvalVersionMatches: Boolean(approval && scope && approval.approvedScopeVersion === scope.scopeVersion),
    approvalRepairIdsMatchScope: Boolean(scope && rawApproval && compareRepairIds(scope, rawApproval)),
    approvalActorSourceValid: Boolean(approval?.actorType && approval?.actorIdPresent && approval?.approvalSource),
    packetLinkMatchesAudit: Boolean(projectedLink && audit && projectedLink.auditId === audit.id),
    packetLinkMatchesMerchant: Boolean(projectedLink && merchant && projectedLink.merchantId === merchant.id),
    packetLinkMatchesScope: Boolean(projectedLink && scope && projectedLink.repairScopeId === scope.id),
    packetLinkMatchesApproval: Boolean(projectedLink && approval && projectedLink.repairApprovalId === approval.id),
    packetLinkMatchesPacket: Boolean(projectedLink && projectedPacket && projectedLink.packetId === projectedPacket.packetId),
    packetStoreMatchesMerchant: Boolean(projectedPacket && merchant && normalizeStoreDomain(projectedPacket.storeDomain) === normalizeStoreDomain(merchant.normalizedShopifyDomain)),
    scopeAuditMatchesLinkedAudit: Boolean(scope && audit && scope.auditId === audit.id),
    approvalScopeMatchesLinkedScope: Boolean(approval && scope && approval.repairScopeId === scope.id),
    authorityFingerprintMatches: Boolean(projectedLink?.authorityFingerprint && identity && projectedLink.authorityFingerprint === identity.transitionFingerprint),
    storeConsistent: storeValues.length > 0 && new Set(storeValues).size === 1,
    duplicateActiveAssociationAbsent: duplicateAssociationCount <= 1,
  };
  const integrityFailures = [
    !audit ? "audit_missing" : "",
    !merchant ? "merchant_missing" : "",
    !scope ? "scope_missing" : "",
    !approval ? "approval_missing" : "",
    !integrity.packetLinkMatchesPacket ? "packet_link_conflict" : "",
    !integrity.scopeFingerprintValid ? "scope_fingerprint_invalid" : "",
    !integrity.approvalMatchesScope ? "approval_scope_mismatch" : "",
    !integrity.approvalFingerprintMatches ? "approval_fingerprint_mismatch" : "",
    !integrity.approvalVersionMatches ? "approval_version_mismatch" : "",
    !integrity.approvalRepairIdsMatchScope ? "approval_included_repairs_mismatch" : "",
    !integrity.packetLinkMatchesAudit ? "packet_audit_mismatch" : "",
    !integrity.packetLinkMatchesMerchant ? "packet_merchant_mismatch" : "",
    !integrity.packetLinkMatchesScope ? "packet_scope_mismatch" : "",
    !integrity.packetLinkMatchesApproval ? "packet_approval_mismatch" : "",
    !integrity.packetStoreMatchesMerchant ? "packet_store_mismatch" : "",
    !integrity.scopeAuditMatchesLinkedAudit ? "scope_audit_mismatch" : "",
    !integrity.approvalScopeMatchesLinkedScope ? "approval_scope_mismatch" : "",
    !integrity.authorityFingerprintMatches ? "packet_authority_fingerprint_mismatch" : "",
    !integrity.storeConsistent ? "packet_store_mismatch" : "",
    !integrity.duplicateActiveAssociationAbsent ? "packet_link_conflict" : "",
  ].filter(Boolean);

  const authority = {
    authorityVersion: SHOPIFIXER_CANONICAL_PACKET_AUTHORITY_VERSION,
    lookup: {
      mode: "canonical_packet_id",
      canonicalPacketId: projectedPacket?.packetId || null,
    },
    normalizedStore,
    packet: projectedPacket,
    packetLink: projectedLink,
    audit,
    merchant,
    scope,
    approval: approval
      ? {
          ...approval,
          lifecycle,
        }
      : null,
    events: events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      packetId: event.packetId || null,
      auditId: event.auditId || null,
      createdAt: serializeDate(event.createdAt),
    })),
    integrity,
    integrityFailures,
    paymentCondition: "not_applicable",
  };
  const canBuildManifest = Boolean(scope && approval && projectedLink && projectedPacket);
  const preliminaryManifest = canBuildManifest
    ? buildManifestFromAuthority({
        scope,
        approval,
        packetLink: projectedLink,
        packet: projectedPacket,
        gate: { conditions: [], failedConditions: [] },
      })
    : null;
  let gate = evaluateShopifixerExecutionGate({
    ...authority,
    executionManifest: preliminaryManifest,
  });
  const executionManifest = canBuildManifest
    ? buildManifestFromAuthority({
        scope,
        approval,
        packetLink: projectedLink,
        packet: projectedPacket,
        gate,
      })
    : null;
  gate = evaluateShopifixerExecutionGate({
    ...authority,
    executionManifest,
  });

  return {
    ...authority,
    executionManifest: executionManifest
      ? {
          ...executionManifest,
          executionGate: gate,
          authority: {
            ...executionManifest.authority,
            currentMissionExecutionAuthorized: gate.executionAuthorized,
            authorityFailedConditions: gate.failedConditions,
          },
        }
      : null,
    executionGate: gate,
  };
}

export async function getCanonicalShopifixerExecutionAuthority(input = {}) {
  try {
    const prisma = input.prisma || defaultPrisma;
    const canonicalPacketId = cleanString(input.canonicalPacketId || input.packetId || input.packet_id);
    if (!canonicalPacketId) throw serviceError("missing_canonical_packet_id", 400);

    const packet = await prisma.packet.findUnique({
      where: { packetId: canonicalPacketId },
    });
    if (!packet) return authorityFailure("canonical_packet_missing", 404);

    const links = await prisma.shopifixerPacketLink.findMany({
      where: {
        packetId: canonicalPacketId,
        purpose: SHOPIFIXER_CANONICAL_PACKET_PURPOSE,
        status: "active",
      },
      include: {
        packet: true,
        merchant: true,
        audit: true,
        repairScope: true,
        repairApproval: {
          include: { repairScope: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    if (links.length === 0) return authorityFailure("packet_link_missing", 404);
    if (links.length > 1) return authorityFailure("packet_link_conflict", 409, ["packet_link_conflict"]);

    const link = links[0];
    const events = await prisma.shopifixerLeadEvent.findMany({
      where: {
        auditId: link.auditId,
        OR: [
          { packetId: canonicalPacketId },
          { eventType: { in: ["repair_scope_stored", "repair_scope_approved", "canonical_packet_created", "canonical_packet_associated", "repair_scope_revoked"] } },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        auditId: true,
        packetId: true,
        eventType: true,
        createdAt: true,
      },
    });
    const authority = buildAuthorityProjection({
      packet,
      packetLink: link,
      events,
      duplicateAssociationCount: links.length,
      now: input.now || new Date(),
    });

    const fatalIntegrityFailures = authority.integrityFailures.filter((failure) => (
      !["approval_revoked", "approval_expired"].includes(failure)
    ));
    if (fatalIntegrityFailures.length > 0) {
      return authorityFailure(fatalIntegrityFailures[0], 409, fatalIntegrityFailures);
    }

    return {
      ok: true,
      status: 200,
      authority,
      executionManifest: authority.executionManifest,
      executionGate: authority.executionGate,
    };
  } catch (error) {
    return errorResult(error);
  }
}

export async function createOrAssociateCanonicalPacketForApprovedScope(input = {}) {
  try {
    const prisma = input.prisma || defaultPrisma;
    const packetRepository = input.packetRepository || {
      createPacket: defaultCreatePacket,
      getPacket: defaultGetPacket,
    };
    const scopeId = cleanString(input.scopeId);
    const approvalId = cleanString(input.approvalId);
    if (!scopeId) throw serviceError("missing_scope_id", 400);
    if (!approvalId) throw serviceError("missing_approval_id", 400);

    const preflight = await runTransaction(prisma, async (tx) => {
      const scopeRow = await tx.shopifixerRepairScope.findUnique({ where: { scopeId } });
      const approvalRow = await tx.shopifixerRepairApproval.findUnique({
        where: { approvalId },
        include: { repairScope: true },
      });
      const validated = validateScopeAndApproval({
        scopeRow,
        approvalRow,
        now: input.now || new Date(),
      });
      const identity = {
        ...deriveCanonicalPacketTransitionIdentity({
          scope: validated.scope,
          approval: validated.approval,
          transitionIdempotencyKey: input.transitionIdempotencyKey,
        }),
        scope: validated.scope,
        approval: validated.approval,
      };
      const existingAssociation = await findExistingAssociation(tx, identity);
      if (existingAssociation) {
        return {
          existingAssociation,
          identity,
          ...validated,
        };
      }
      return {
        existingAssociation: null,
        identity,
        ...validated,
      };
    });

    if (preflight.existingAssociation) {
      return buildPacketAuthorityResponse({
        createdPacket: false,
        createdAssociation: false,
        scope: preflight.scope,
        approval: preflight.approval,
        packetLink: packetLinkProjection(preflight.existingAssociation),
        packet: preflight.existingAssociation.packet,
      });
    }

    const existingPacket = await packetRepository.getPacket(preflight.identity.canonicalPacketId);
    const packet = await packetRepository.createPacket({
      packet_id: preflight.identity.canonicalPacketId,
      store_domain: preflight.store,
      status: SHOPIFIXER_CANONICAL_PACKET_INITIAL_STATUS,
    });
    const normalizedPacket = normalizePacketProjection(packet);

    if (!normalizedPacket?.packetId) {
      throw serviceError("canonical_packet_creation_failed", 500);
    }
    if (normalizedPacket.packetId !== preflight.identity.canonicalPacketId) {
      throw serviceError("canonical_packet_identity_mismatch", 409);
    }
    if (!packetStoreMatches(normalizedPacket, preflight.store)) {
      throw serviceError("canonical_packet_store_mismatch", 409);
    }

    const linked = await runTransaction(prisma, async (tx) => {
      const scopeRow = await tx.shopifixerRepairScope.findUnique({ where: { scopeId } });
      const approvalRow = await tx.shopifixerRepairApproval.findUnique({
        where: { approvalId },
        include: { repairScope: true },
      });
      const validated = validateScopeAndApproval({
        scopeRow,
        approvalRow,
        now: input.now || new Date(),
      });
      const identity = {
        ...deriveCanonicalPacketTransitionIdentity({
          scope: validated.scope,
          approval: validated.approval,
          transitionIdempotencyKey: input.transitionIdempotencyKey,
        }),
        scope: validated.scope,
        approval: validated.approval,
      };
      const existingAssociation = await findExistingAssociation(tx, identity);
      if (existingAssociation) {
        return {
          packetLink: existingAssociation,
          scope: validated.scope,
          approval: validated.approval,
          createdAssociation: false,
        };
      }

      const createdLink = await tx.shopifixerPacketLink.create({
        data: {
          merchantId: validated.scope.merchantId,
          auditId: validated.scope.auditId,
          packetId: normalizedPacket.packetId,
          repairScopeId: validated.scope.id,
          repairApprovalId: validated.approval.id,
          purpose: SHOPIFIXER_CANONICAL_PACKET_PURPOSE,
          status: "active",
          activeKey: identity.activeKey,
          idempotencyKey: identity.transitionIdempotencyKey,
          authorityFingerprint: identity.transitionFingerprint,
          authorityVersion: SHOPIFIXER_CANONICAL_PACKET_AUTHORITY_VERSION,
          authorizedBy: cleanString(input.actorId) || validated.approval.actorId,
          authorizationSource: "durable_repair_scope_approval",
          sourceMetadata: normalizeJsonValue({
            scopeId: validated.scope.scopeId,
            approvalId: validated.approval.approvalId,
            scopeFingerprint: validated.scope.scopeFingerprint,
            authorityFingerprint: identity.transitionFingerprint,
            canonicalPacketId: normalizedPacket.packetId,
            packetPurpose: SHOPIFIXER_CANONICAL_PACKET_PURPOSE,
            packetInitialStatus: SHOPIFIXER_CANONICAL_PACKET_INITIAL_STATUS,
          }),
        },
        include: associationInclude(),
      });

      if (!existingPacket) {
        await recordPacketAuthorityEvent(tx, {
          scope: validated.scope,
          approval: validated.approval,
          packetId: normalizedPacket.packetId,
          eventType: "canonical_packet_created",
          eventSuffix: "created",
          payload: {
            scopeId: validated.scope.scopeId,
            approvalId: validated.approval.approvalId,
            packetId: normalizedPacket.packetId,
            scopeFingerprint: validated.scope.scopeFingerprint,
            authorityFingerprint: identity.transitionFingerprint,
            authorityVersion: SHOPIFIXER_CANONICAL_PACKET_AUTHORITY_VERSION,
          },
        });
      }

      await recordPacketAuthorityEvent(tx, {
        scope: validated.scope,
        approval: validated.approval,
        packetId: normalizedPacket.packetId,
        eventType: "canonical_packet_associated",
        eventSuffix: "associated",
        payload: {
          scopeId: validated.scope.scopeId,
          approvalId: validated.approval.approvalId,
          packetId: normalizedPacket.packetId,
          scopeFingerprint: validated.scope.scopeFingerprint,
          authorityFingerprint: identity.transitionFingerprint,
          authorityVersion: SHOPIFIXER_CANONICAL_PACKET_AUTHORITY_VERSION,
        },
      });

      return {
        packetLink: createdLink,
        scope: validated.scope,
        approval: validated.approval,
        createdAssociation: true,
      };
    });

    return buildPacketAuthorityResponse({
      createdPacket: !existingPacket,
      createdAssociation: linked.createdAssociation,
      scope: linked.scope,
      approval: linked.approval,
      packetLink: packetLinkProjection(linked.packetLink),
      packet: normalizedPacket,
    });
  } catch (error) {
    return errorResult(error);
  }
}

export async function getCanonicalPacketAssociationForScope(input = {}) {
  try {
    const prisma = input.prisma || defaultPrisma;
    const scopeId = cleanString(input.scopeId);
    const approvalId = cleanString(input.approvalId);
    if (!scopeId) throw serviceError("missing_scope_id", 400);

    const result = await runTransaction(prisma, async (tx) => {
      const scopeRow = await tx.shopifixerRepairScope.findUnique({ where: { scopeId } });
      if (!scopeRow) throw serviceError("repair_scope_not_found", 404);

      let approvalRow = null;
      if (approvalId) {
        approvalRow = await tx.shopifixerRepairApproval.findUnique({
          where: { approvalId },
          include: { repairScope: true },
        });
        if (!approvalRow) throw serviceError("repair_approval_not_found", 404);
      }

      const link = await tx.shopifixerPacketLink.findFirst({
        where: {
          repairScopeId: scopeRow.id,
          ...(approvalRow ? { repairApprovalId: approvalRow.id } : {}),
          purpose: SHOPIFIXER_CANONICAL_PACKET_PURPOSE,
          status: "active",
        },
        orderBy: { createdAt: "desc" },
        include: associationInclude(),
      });
      if (!link) throw serviceError("canonical_packet_association_not_found", 404);

      const effectiveApproval = approvalRow || link.repairApproval;
      if (!effectiveApproval) throw serviceError("repair_approval_not_found", 404);
      const validated = validateScopeAndApproval({
        scopeRow,
        approvalRow: effectiveApproval,
        now: input.now || new Date(),
      });

      return {
        scope: validated.scope,
        approval: validated.approval,
        packetLink: link,
        packet: link.packet,
      };
    });

    return buildPacketAuthorityResponse({
      createdPacket: false,
      createdAssociation: false,
      scope: result.scope,
      approval: result.approval,
      packetLink: packetLinkProjection(result.packetLink),
      packet: result.packet,
    });
  } catch (error) {
    return errorResult(error);
  }
}
