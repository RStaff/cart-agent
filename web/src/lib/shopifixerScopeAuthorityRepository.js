import crypto from "node:crypto";
import pkg from "@prisma/client";
import { prisma as defaultPrisma } from "../clients/prisma.js";
import { retrieveShopifixerAudit } from "./shopifixerDurableAuditRetrievalAdapter.js";
import { buildShopifixerRepairPlan } from "./shopifixerRepairPlanAdapter.js";
import { buildShopifixerRepairScope } from "./shopifixerRepairScopeAdapter.js";

const { Prisma } = pkg;

const SHOPIFIXER_SOURCE = "staffordmedia_shopifixer";
export const SHOPIFIXER_REPAIR_SCOPE_FINGERPRINT_VERSION = "shopifixer.repair_scope.fingerprint.v1";
export const SHOPIFIXER_SCOPE_AUTHORITY_VERSION = "shopifixer.scope_authority.v1";
export const REPAIR_APPROVAL_STATUSES = Object.freeze(["APPROVED", "REVOKED", "EXPIRED"]);

function cleanString(value = "") {
  return String(value || "").trim();
}

function cleanLower(value = "") {
  return cleanString(value).toLowerCase();
}

function serviceError(error, status = 400, details = {}) {
  const err = new Error(error);
  err.status = status;
  err.details = details;
  return err;
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

function stableId(prefix, value, size = 16) {
  return `${prefix}_${stableHash(value).slice(0, size)}`;
}

function serializeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function parseOptionalDate(value, fieldName) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw serviceError("invalid_date", 400, { field: fieldName });
  }
  return date;
}

function normalizeScopeVersion(value = 1) {
  const version = Number(value || 1);
  return Number.isInteger(version) && version > 0 ? version : null;
}

function sortedStrings(values = []) {
  return Array.from(new Set(values.map(cleanString).filter(Boolean))).sort();
}

function sortedJsonValues(values = []) {
  return [...values].sort((left, right) => stableStringify(left).localeCompare(stableStringify(right)));
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

function normalizeScopeItem(item = {}) {
  return normalizeJsonValue({
    scopeItemId: cleanString(item.scopeItemId),
    sourceRepairItemId: cleanString(item.sourceRepairItemId) || null,
    sourceFindingId: cleanString(item.sourceFindingId) || null,
    priorityRank: item.priorityRank ?? null,
    title: cleanString(item.title),
    reason: cleanString(item.reason),
    evidence: sortedStrings(Array.isArray(item.evidence) ? item.evidence : []),
    recommendedImplementation: cleanString(item.recommendedImplementation),
    estimatedComplexity: cleanString(item.estimatedComplexity) || "unknown",
    implementationDependency: sortedStrings(Array.isArray(item.implementationDependency) ? item.implementationDependency : []),
    verificationCriteria: sortedStrings(Array.isArray(item.verificationCriteria) ? item.verificationCriteria : []),
    rollbackExpectation: cleanString(item.rollbackExpectation),
    actionableStatus: cleanString(item.actionableStatus),
    scopeDisposition: cleanString(item.scopeDisposition),
    inclusionReason: cleanString(item.inclusionReason),
  });
}

function normalizeScopeItems(items = []) {
  return sortedJsonValues(items.map(normalizeScopeItem));
}

function normalizeScopeJsonList(values = []) {
  if (!Array.isArray(values)) return [];
  return sortedJsonValues(values.map(normalizeJsonValue));
}

function normalizeSnapshotFromScope(scope = {}, options = {}) {
  const scopeVersion = normalizeScopeVersion(options.scopeVersion || scope.scopeVersion);
  if (!scopeVersion) throw serviceError("invalid_repair_scope_version", 400);

  const auditId = cleanString(scope.auditId);
  const store = cleanLower(scope.store || scope.storeDomain);
  if (!auditId || !store) {
    throw serviceError("insufficient_repair_scope_evidence", 422, {
      missing: ["repairScope.auditId", "repairScope.store"],
    });
  }

  const includedRepairs = normalizeScopeItems(scope.includedRepairs || []);
  const excludedRepairs = normalizeScopeItems(scope.excludedRepairs || []);
  const deferredRepairs = normalizeScopeItems(scope.deferredRepairs || []);
  const verificationCriteria = sortedJsonValues(
    [...includedRepairs, ...excludedRepairs, ...deferredRepairs].map((item) => ({
      scopeItemId: item.scopeItemId,
      criteria: item.verificationCriteria || [],
    })),
  );
  const rollbackExpectations = sortedJsonValues(
    [...includedRepairs, ...excludedRepairs, ...deferredRepairs].map((item) => ({
      scopeItemId: item.scopeItemId,
      rollbackExpectation: item.rollbackExpectation || "",
    })),
  );

  return normalizeJsonValue({
    contractVersion: SHOPIFIXER_SCOPE_AUTHORITY_VERSION,
    auditId,
    store,
    scopeVersion,
    sourceEvidenceVersion: cleanString(scope.sourceEvidenceVersion) || null,
    sourceRepairPlanVersion: cleanString(scope.sourceRepairPlanVersion) || null,
    sourceAuditCompletedAt: cleanString(scope.sourceAuditCompletedAt) || null,
    totalFindings: Number(scope.totalFindings || 0),
    totalRepairItems: Number(scope.totalRepairItems || includedRepairs.length + excludedRepairs.length + deferredRepairs.length),
    includedRepairCount: includedRepairs.length,
    excludedRepairCount: excludedRepairs.length,
    deferredRepairCount: deferredRepairs.length,
    includedRepairs,
    excludedRepairs,
    deferredRepairs,
    estimatedImplementationSize: cleanString(scope.estimatedImplementationSize) || "unknown",
    implementationAssumptions: sortedStrings(scope.implementationAssumptions || scope.assumptions || []),
    implementationDependencies: sortedStrings(scope.implementationDependencies || scope.dependencies || []),
    notInScope: sortedStrings(scope.notInScope || []),
    verificationCriteria,
    rollbackExpectations,
  });
}

export function calculateRepairScopeFingerprint(scope = {}, options = {}) {
  const normalizedSnapshot = normalizeSnapshotFromScope(scope, options);
  const fingerprintInput = {
    fingerprintVersion: SHOPIFIXER_REPAIR_SCOPE_FINGERPRINT_VERSION,
    auditId: normalizedSnapshot.auditId,
    store: normalizedSnapshot.store,
    scopeVersion: normalizedSnapshot.scopeVersion,
    sourceEvidenceVersion: normalizedSnapshot.sourceEvidenceVersion,
    sourceRepairPlanVersion: normalizedSnapshot.sourceRepairPlanVersion,
    includedRepairs: normalizedSnapshot.includedRepairs,
    excludedRepairs: normalizedSnapshot.excludedRepairs,
    deferredRepairs: normalizedSnapshot.deferredRepairs,
    implementationAssumptions: normalizedSnapshot.implementationAssumptions,
    implementationDependencies: normalizedSnapshot.implementationDependencies,
    notInScope: normalizedSnapshot.notInScope,
    verificationCriteria: normalizedSnapshot.verificationCriteria,
    rollbackExpectations: normalizedSnapshot.rollbackExpectations,
    estimatedImplementationSize: normalizedSnapshot.estimatedImplementationSize,
  };

  return {
    fingerprintVersion: SHOPIFIXER_REPAIR_SCOPE_FINGERPRINT_VERSION,
    normalizedSnapshot,
    scopeFingerprint: stableHash(fingerprintInput),
  };
}

function scopeIdForSnapshot(normalizedSnapshot) {
  return stableId("scope", {
    auditId: normalizedSnapshot.auditId,
    store: normalizedSnapshot.store,
    scopeVersion: normalizedSnapshot.scopeVersion,
    sourceEvidenceVersion: normalizedSnapshot.sourceEvidenceVersion,
    includedRepairIds: normalizedSnapshot.includedRepairs.map((item) => item.scopeItemId),
    excludedRepairIds: normalizedSnapshot.excludedRepairs.map((item) => item.scopeItemId),
    deferredRepairIds: normalizedSnapshot.deferredRepairs.map((item) => item.scopeItemId),
  }, 12);
}

function scopeProjection(row) {
  if (!row) return null;
  const normalizedSnapshot = row.normalizedSnapshot || {};
  return {
    id: row.id,
    scopeId: row.scopeId,
    scopeVersion: row.scopeVersion,
    scopeFingerprint: row.scopeFingerprint,
    merchantId: row.merchantId,
    auditId: row.auditId,
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
    createdByActorType: row.createdByActorType,
    createdByActorId: row.createdByActorId || null,
    supersededAt: serializeDate(row.supersededAt),
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
    actorDisplayLabel: row.actorDisplayLabel || null,
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
    revokedByActorType: row.revokedByActorType || null,
    revokedByActorId: row.revokedByActorId || null,
    revocationReason: row.revocationReason || null,
    createdAt: serializeDate(row.createdAt),
    updatedAt: serializeDate(row.updatedAt),
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

async function recordAuthorityEvent(tx, { merchantId, auditId, eventType, idempotencyKey, payload }) {
  return tx.shopifixerLeadEvent.upsert({
    where: { idempotencyKey },
    create: {
      merchantId,
      leadId: null,
      auditId,
      packetId: null,
      eventType,
      visibility: "system",
      source: SHOPIFIXER_SOURCE,
      idempotencyKey,
      payload,
    },
    update: {
      payload,
    },
  });
}

function errorResult(error) {
  return {
    ok: false,
    status: error?.status || 500,
    error: error?.message || "shopifixer_scope_authority_failed",
    ...(error?.details ? error.details : {}),
  };
}

function validateActor({ actorType, actorId, fieldPrefix = "actor" }) {
  const cleanActorType = cleanLower(actorType);
  const cleanActorId = cleanString(actorId);
  if (!["operator", "merchant", "system"].includes(cleanActorType)) {
    throw serviceError(`missing_${fieldPrefix}_type`, 400);
  }
  if (!cleanActorId) {
    throw serviceError(`missing_${fieldPrefix}_id`, 400);
  }
  return { actorType: cleanActorType, actorId: cleanActorId };
}

function hasMeaningfulEvidence(value) {
  if (!value) return false;
  if (typeof value === "string") return Boolean(cleanString(value));
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function repairIdsFromScope(scope) {
  return sortedStrings((scope.normalizedSnapshot?.includedRepairs || scope.includedRepairs || [])
    .map((item) => item.scopeItemId));
}

function assertMatchingRepairIds(expected, provided) {
  if (!provided) return;
  const normalizedProvided = sortedStrings(provided);
  if (stableStringify(expected) !== stableStringify(normalizedProvided)) {
    throw serviceError("approval_included_repairs_mismatch", 409);
  }
}

function approvalFingerprintFor({ scope, input, approvedIncludedRepairIds, expiresAt }) {
  return stableHash({
    approvalContractVersion: "shopifixer.repair_approval.v1",
    scopeId: scope.scopeId,
    repairScopeId: scope.id,
    auditId: scope.auditId,
    merchantId: scope.merchantId,
    scopeFingerprint: scope.scopeFingerprint,
    scopeVersion: scope.scopeVersion,
    approvalIdempotencyKey: cleanString(input.approvalIdempotencyKey),
    actorType: cleanLower(input.actorType),
    actorId: cleanString(input.actorId),
    approvalSource: cleanString(input.approvalSource),
    operatorMediated: Boolean(input.operatorMediated),
    merchantAuthenticated: Boolean(input.merchantAuthenticated),
    approvalEvidence: normalizeJsonValue(input.approvalEvidence),
    approvedTermsBoundary: normalizeJsonValue(input.approvedTermsBoundary),
    approvedIncludedRepairIds,
    expiresAt: serializeDate(expiresAt),
  });
}

export async function storeRepairScope(input = {}) {
  try {
    const prisma = input.prisma || defaultPrisma;
    const scopeVersion = normalizeScopeVersion(input.scopeVersion || 1);
    if (!scopeVersion) throw serviceError("invalid_repair_scope_version", 400);
    const actor = validateActor({
      actorType: input.createdByActorType || input.actorType,
      actorId: input.createdByActorId || input.actorId,
      fieldPrefix: "scope_actor",
    });

    const result = await runTransaction(prisma, async (tx) => {
      const retrieved = await retrieveShopifixerAudit({
        auditId: input.auditId,
        store: input.store,
        prisma: tx,
      });

      if (!retrieved.ok) {
        throw serviceError(retrieved.error, retrieved.status, { missing: retrieved.missing || [] });
      }

      const repairPlan = buildShopifixerRepairPlan(retrieved.result, {
        generatedAt: input.repairPlanGeneratedAt,
      });
      if (!repairPlan.ok) {
        throw serviceError(repairPlan.error, repairPlan.status, { missing: repairPlan.missing || [] });
      }

      const repairScope = buildShopifixerRepairScope(repairPlan.plan, {
        approvalStatus: "READY_FOR_REVIEW",
        generatedAt: input.scopeGeneratedAt,
        scopeVersion,
      });
      if (!repairScope.ok) {
        throw serviceError(repairScope.error, repairScope.status, { missing: repairScope.missing || [] });
      }

      const fingerprint = calculateRepairScopeFingerprint(repairScope.scope, { scopeVersion });
      const scopeId = repairScope.scope.scopeId || scopeIdForSnapshot(fingerprint.normalizedSnapshot);
      const existingByScopeId = await tx.shopifixerRepairScope.findUnique({
        where: { scopeId },
      });

      if (existingByScopeId) {
        if (existingByScopeId.scopeFingerprint !== fingerprint.scopeFingerprint) {
          throw serviceError("repair_scope_identity_conflict", 409);
        }
        await recordAuthorityEvent(tx, {
          merchantId: existingByScopeId.merchantId,
          auditId: existingByScopeId.auditId,
          eventType: "repair_scope_stored",
          idempotencyKey: `shopifixer:event:repair_scope:${existingByScopeId.scopeId}:stored`,
          payload: {
            scopeId: existingByScopeId.scopeId,
            scopeVersion: existingByScopeId.scopeVersion,
            scopeFingerprint: existingByScopeId.scopeFingerprint,
            idempotentReplay: true,
          },
        });
        return { scope: existingByScopeId, created: false };
      }

      const existingByFingerprint = await tx.shopifixerRepairScope.findFirst({
        where: {
          auditId: retrieved.result.audit.id,
          scopeFingerprint: fingerprint.scopeFingerprint,
        },
      });
      if (existingByFingerprint) {
        await recordAuthorityEvent(tx, {
          merchantId: existingByFingerprint.merchantId,
          auditId: existingByFingerprint.auditId,
          eventType: "repair_scope_stored",
          idempotencyKey: `shopifixer:event:repair_scope:${existingByFingerprint.scopeId}:stored`,
          payload: {
            scopeId: existingByFingerprint.scopeId,
            scopeVersion: existingByFingerprint.scopeVersion,
            scopeFingerprint: existingByFingerprint.scopeFingerprint,
            idempotentReplay: true,
          },
        });
        return { scope: existingByFingerprint, created: false };
      }

      const created = await tx.shopifixerRepairScope.create({
        data: {
          merchantId: retrieved.result.merchant.id,
          auditId: retrieved.result.audit.id,
          scopeId,
          scopeVersion,
          scopeFingerprint: fingerprint.scopeFingerprint,
          sourceEvidenceVersion: fingerprint.normalizedSnapshot.sourceEvidenceVersion,
          sourceRepairPlanVersion: fingerprint.normalizedSnapshot.sourceRepairPlanVersion,
          status: "stored",
          includedRepairs: fingerprint.normalizedSnapshot.includedRepairs,
          excludedRepairs: fingerprint.normalizedSnapshot.excludedRepairs,
          deferredRepairs: fingerprint.normalizedSnapshot.deferredRepairs,
          assumptions: fingerprint.normalizedSnapshot.implementationAssumptions,
          dependencies: fingerprint.normalizedSnapshot.implementationDependencies,
          notInScope: fingerprint.normalizedSnapshot.notInScope,
          implementationSize: fingerprint.normalizedSnapshot.estimatedImplementationSize,
          verificationCriteria: fingerprint.normalizedSnapshot.verificationCriteria,
          rollbackExpectations: fingerprint.normalizedSnapshot.rollbackExpectations,
          normalizedSnapshot: fingerprint.normalizedSnapshot,
          createdByActorType: actor.actorType,
          createdByActorId: actor.actorId,
        },
      });

      await recordAuthorityEvent(tx, {
        merchantId: created.merchantId,
        auditId: created.auditId,
        eventType: "repair_scope_stored",
        idempotencyKey: `shopifixer:event:repair_scope:${created.scopeId}:stored`,
        payload: {
          scopeId: created.scopeId,
          scopeVersion: created.scopeVersion,
          scopeFingerprint: created.scopeFingerprint,
          createdByActorType: actor.actorType,
          eventAuthority: SHOPIFIXER_SCOPE_AUTHORITY_VERSION,
        },
      });

      return { scope: created, created: true };
    });

    return {
      ok: true,
      status: 200,
      created: result.created,
      scope: scopeProjection(result.scope),
    };
  } catch (error) {
    return errorResult(error);
  }
}

export async function getStoredRepairScope(input = {}) {
  try {
    const prisma = input.prisma || defaultPrisma;
    const scopeId = cleanString(input.scopeId);
    if (!scopeId) throw serviceError("missing_scope_id", 400);
    const scope = await prisma.shopifixerRepairScope.findUnique({
      where: { scopeId },
    });
    if (!scope) throw serviceError("repair_scope_not_found", 404);
    return {
      ok: true,
      status: 200,
      scope: scopeProjection(scope),
    };
  } catch (error) {
    return errorResult(error);
  }
}

export async function recordRepairScopeApproval(input = {}) {
  try {
    const prisma = input.prisma || defaultPrisma;
    const scopeId = cleanString(input.scopeId);
    const approvalIdempotencyKey = cleanString(input.approvalIdempotencyKey);
    if (!scopeId) throw serviceError("missing_scope_id", 400);
    if (!approvalIdempotencyKey) throw serviceError("missing_approval_idempotency_key", 400);
    const actor = validateActor({ actorType: input.actorType, actorId: input.actorId });
    const approvalSource = cleanString(input.approvalSource);
    if (!approvalSource) throw serviceError("missing_approval_source", 400);
    if (!hasMeaningfulEvidence(input.approvalEvidence)) throw serviceError("missing_approval_evidence", 400);
    if (!hasMeaningfulEvidence(input.approvedTermsBoundary)) throw serviceError("missing_approved_terms_boundary", 400);
    const operatorMediated = Boolean(input.operatorMediated);
    const merchantAuthenticated = Boolean(input.merchantAuthenticated);
    if (operatorMediated && merchantAuthenticated) {
      throw serviceError("operator_mediated_approval_is_not_merchant_authenticated", 400);
    }
    if (actor.actorType === "merchant" && !merchantAuthenticated) {
      throw serviceError("merchant_actor_requires_merchant_authentication", 400);
    }
    const expiresAt = parseOptionalDate(input.expiresAt, "expiresAt");

    const result = await runTransaction(prisma, async (tx) => {
      const storedScope = await tx.shopifixerRepairScope.findUnique({
        where: { scopeId },
      });
      if (!storedScope) throw serviceError("repair_scope_not_found", 404);
      if (storedScope.supersededAt || storedScope.status !== "stored") {
        throw serviceError("repair_scope_not_active", 409);
      }

      const scope = scopeProjection(storedScope);
      const expectedFingerprint = calculateRepairScopeFingerprint(scope.normalizedSnapshot, {
        scopeVersion: scope.scopeVersion,
      });
      if (expectedFingerprint.scopeFingerprint !== storedScope.scopeFingerprint) {
        throw serviceError("repair_scope_fingerprint_mismatch", 409);
      }

      const approvedIncludedRepairIds = repairIdsFromScope(scope);
      assertMatchingRepairIds(approvedIncludedRepairIds, input.approvedIncludedRepairIds);
      const approvalFingerprint = approvalFingerprintFor({
        scope,
        input: {
          ...input,
          actorType: actor.actorType,
          actorId: actor.actorId,
          approvalSource,
          operatorMediated,
          merchantAuthenticated,
        },
        approvedIncludedRepairIds,
        expiresAt,
      });
      const approvalId = stableId("approval", {
        scopeId: scope.scopeId,
        approvalIdempotencyKey,
      }, 16);
      const activeKey = `shopifixer:repair_approval:${scope.scopeId}:active`;

      const existingByIdempotency = await tx.shopifixerRepairApproval.findUnique({
        where: { approvalIdempotencyKey },
      });
      if (existingByIdempotency) {
        if (existingByIdempotency.approvalFingerprint !== approvalFingerprint) {
          throw serviceError("approval_idempotency_conflict", 409);
        }
        await recordAuthorityEvent(tx, {
          merchantId: existingByIdempotency.merchantId,
          auditId: existingByIdempotency.auditId,
          eventType: "repair_scope_approved",
          idempotencyKey: `shopifixer:event:repair_approval:${existingByIdempotency.approvalId}:approved`,
          payload: {
            approvalId: existingByIdempotency.approvalId,
            scopeId: scope.scopeId,
            idempotentReplay: true,
          },
        });
        return { approval: existingByIdempotency, scope: storedScope, created: false };
      }

      const existingActive = await tx.shopifixerRepairApproval.findFirst({
        where: {
          activeKey,
          status: "APPROVED",
        },
      });
      if (existingActive) {
        throw serviceError("repair_scope_active_approval_exists", 409);
      }

      const created = await tx.shopifixerRepairApproval.create({
        data: {
          approvalId,
          repairScopeId: storedScope.id,
          merchantId: storedScope.merchantId,
          auditId: storedScope.auditId,
          approvalIdempotencyKey,
          approvalFingerprint,
          activeKey,
          actorType: actor.actorType,
          actorId: actor.actorId,
          actorDisplayLabel: cleanString(input.actorDisplayLabel) || null,
          approvalSource,
          operatorMediated,
          merchantAuthenticated,
          approvalEvidence: normalizeJsonValue(input.approvalEvidence),
          approvedTermsBoundary: normalizeJsonValue(input.approvedTermsBoundary),
          approvedIncludedRepairIds,
          approvedScopeFingerprint: storedScope.scopeFingerprint,
          approvedScopeVersion: storedScope.scopeVersion,
          status: "APPROVED",
          approvedAt: parseOptionalDate(input.approvedAt, "approvedAt") || new Date(),
          expiresAt,
        },
      });

      await recordAuthorityEvent(tx, {
        merchantId: created.merchantId,
        auditId: created.auditId,
        eventType: "repair_scope_approved",
        idempotencyKey: `shopifixer:event:repair_approval:${created.approvalId}:approved`,
        payload: {
          approvalId: created.approvalId,
          scopeId: scope.scopeId,
          scopeFingerprint: storedScope.scopeFingerprint,
          approvalSource,
          actorType: actor.actorType,
          operatorMediated,
          merchantAuthenticated,
          eventAuthority: SHOPIFIXER_SCOPE_AUTHORITY_VERSION,
        },
      });

      return { approval: created, scope: storedScope, created: true };
    });

    return {
      ok: true,
      status: 200,
      created: result.created,
      scope: scopeProjection(result.scope),
      approval: approvalProjection(result.approval, input.now || new Date()),
    };
  } catch (error) {
    return errorResult(error);
  }
}

export function evaluateApprovalLifecycle(approval = {}, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const revoked = approval.status === "REVOKED" || Boolean(approval.revokedAt);
  const expired = !revoked && approval.expiresAt && new Date(approval.expiresAt).getTime() <= now.getTime();
  const lifecycleStatus = revoked ? "REVOKED" : expired ? "EXPIRED" : approval.status || "APPROVED";
  const inactiveReasons = [
    revoked ? "approval_revoked" : "",
    expired ? "approval_expired" : "",
    lifecycleStatus !== "APPROVED" && !revoked && !expired ? "approval_not_approved" : "",
  ].filter(Boolean);

  return {
    lifecycleStatus,
    active: lifecycleStatus === "APPROVED",
    inactiveReasons,
  };
}

export async function getStoredRepairApproval(input = {}) {
  try {
    const prisma = input.prisma || defaultPrisma;
    const approvalId = cleanString(input.approvalId);
    if (!approvalId) throw serviceError("missing_approval_id", 400);
    const approval = await prisma.shopifixerRepairApproval.findUnique({
      where: { approvalId },
      include: { repairScope: true },
    });
    if (!approval) throw serviceError("repair_approval_not_found", 404);
    return {
      ok: true,
      status: 200,
      approval: approvalProjection(approval, input.now || new Date()),
    };
  } catch (error) {
    return errorResult(error);
  }
}

export async function revokeRepairScopeApproval(input = {}) {
  try {
    const prisma = input.prisma || defaultPrisma;
    const approvalId = cleanString(input.approvalId);
    if (!approvalId) throw serviceError("missing_approval_id", 400);
    const actor = validateActor({
      actorType: input.revokedByActorType || input.actorType,
      actorId: input.revokedByActorId || input.actorId,
      fieldPrefix: "revocation_actor",
    });
    const reason = cleanString(input.revocationReason || input.reason);
    if (!reason) throw serviceError("missing_revocation_reason", 400);
    const revokedAt = parseOptionalDate(input.revokedAt, "revokedAt") || new Date();

    const result = await runTransaction(prisma, async (tx) => {
      const approval = await tx.shopifixerRepairApproval.findUnique({
        where: { approvalId },
        include: { repairScope: true },
      });
      if (!approval) throw serviceError("repair_approval_not_found", 404);

      if (approval.status === "REVOKED" || approval.revokedAt) {
        const sameRevocation =
          approval.revokedByActorType === actor.actorType &&
          approval.revokedByActorId === actor.actorId &&
          approval.revocationReason === reason;
        if (!sameRevocation) throw serviceError("repair_approval_revocation_conflict", 409);
        return { approval, revoked: false };
      }

      const lifecycle = evaluateApprovalLifecycle(approval, { now: input.now || revokedAt });
      if (lifecycle.lifecycleStatus === "EXPIRED") {
        throw serviceError("repair_approval_already_expired", 409);
      }

      const updated = await tx.shopifixerRepairApproval.update({
        where: { approvalId },
        data: {
          status: "REVOKED",
          activeKey: null,
          revokedAt,
          revokedByActorType: actor.actorType,
          revokedByActorId: actor.actorId,
          revocationReason: reason,
        },
        include: { repairScope: true },
      });

      await recordAuthorityEvent(tx, {
        merchantId: updated.merchantId,
        auditId: updated.auditId,
        eventType: "repair_scope_revoked",
        idempotencyKey: `shopifixer:event:repair_approval:${updated.approvalId}:revoked`,
        payload: {
          approvalId: updated.approvalId,
          scopeId: updated.repairScope?.scopeId || null,
          revokedByActorType: actor.actorType,
          revocationReason: reason,
          eventAuthority: SHOPIFIXER_SCOPE_AUTHORITY_VERSION,
        },
      });

      return { approval: updated, revoked: true };
    });

    return {
      ok: true,
      status: 200,
      revoked: result.revoked,
      approval: approvalProjection(result.approval, input.now || new Date()),
    };
  } catch (error) {
    return errorResult(error);
  }
}

function packetProjection(packet = {}) {
  if (!packet) return null;
  return {
    packetId: packet.packetId || packet.packet_id || null,
    storeDomain: packet.storeDomain || packet.store_domain || null,
    status: packet.status || null,
    executionStatus: packet.executionStatus || packet.execution_status || null,
    proofStatus: packet.proofStatus || packet.proof_status || null,
    completionStatus: packet.completionStatus || packet.completion_status || null,
  };
}

export function buildExecutionManifestScopeInput(scope, approval, options = {}) {
  const lifecycle = evaluateApprovalLifecycle(approval, options);
  const snapshot = scope?.normalizedSnapshot || {};
  const packetLink = options.packetLink || null;
  const packet = packetProjection(options.packet || packetLink?.packet);
  const canonicalPacketId = packetLink?.packetId || packet?.packetId || null;
  const authority = options.authority || null;

  return {
    ...snapshot,
    scopeId: scope?.scopeId || snapshot.scopeId,
    scopeFingerprint: scope?.scopeFingerprint || null,
    generatedAt: scope?.createdAt || snapshot.sourceAuditCompletedAt || null,
    canonicalPacketId,
    packetAssociationId: packetLink?.id || null,
    approvalStatus: lifecycle.lifecycleStatus,
    approvalModel: {
      status: lifecycle.lifecycleStatus,
      allowedStates: [...REPAIR_APPROVAL_STATUSES],
      durableApprovalId: approval?.approvalId || null,
    },
    executionReadiness: lifecycle.active ? "READY" : "BLOCKED",
    executionReadinessReasons: lifecycle.inactiveReasons,
    packetState: {
      linked: Boolean(canonicalPacketId && packetLink),
      canonicalPacketId,
      associationId: packetLink?.id || null,
      purpose: packetLink?.purpose || null,
      packetStatus: packet?.status || null,
      executionStatus: packet?.executionStatus || null,
      proofStatus: packet?.proofStatus || null,
      completionStatus: packet?.completionStatus || null,
    },
    authorityConditions: authority?.conditions || null,
    authorityFailedConditions: authority?.failedConditions || [],
  };
}

export function evaluateRepairScopeAuthority(input = {}) {
  const scope = input.scope || null;
  const approval = input.approval || null;
  const packetLink = input.packetLink || null;
  const packet = packetProjection(input.packet || packetLink?.packet);
  const lifecycle = approval ? evaluateApprovalLifecycle(approval, input) : null;
  const recalculatedFingerprint = scope
    ? calculateRepairScopeFingerprint(scope.normalizedSnapshot || scope, {
        scopeVersion: scope.scopeVersion,
      }).scopeFingerprint
    : null;
  const canonicalPacketId = packetLink?.packetId || packet?.packetId || null;
  const packetStatus = cleanLower(packet?.status);
  const packetExecutionStatus = cleanLower(packet?.executionStatus);
  const packetStore = cleanLower(packet?.storeDomain);
  const scopeStore = cleanLower(scope?.store || scope?.normalizedSnapshot?.store);
  const packetLinkScopeMatches = Boolean(
    scope && packetLink && (
      packetLink.repairScopeId === scope.id ||
      packetLink.scopeId === scope.scopeId ||
      packetLink.sourceMetadata?.scopeId === scope.scopeId
    ),
  );
  const packetLinkApprovalMatches = Boolean(
    approval && packetLink && (
      packetLink.repairApprovalId === approval.id ||
      packetLink.approvalId === approval.approvalId ||
      packetLink.sourceMetadata?.approvalId === approval.approvalId
    ),
  );
  const packetStatusPermitsPlanning = Boolean(
    canonicalPacketId &&
    ["prepared", "payment_pending", "payment_received"].includes(packetStatus) &&
    ["not_started", "planned", "ready", ""].includes(packetExecutionStatus),
  );
  const packetStatusPermitsExecution = Boolean(
    canonicalPacketId &&
    packetStatus === "execution_authorized" &&
    packetExecutionStatus === "authorized",
  );
  const rollbackRequirements = scope?.rollbackExpectations?.length
    ? scope.rollbackExpectations
    : scope?.normalizedSnapshot?.rollbackExpectations || [];
  const proofRequirements = scope?.verificationCriteria?.length
    ? scope.verificationCriteria
    : scope?.normalizedSnapshot?.verificationCriteria || [];
  const rollbackRequirementsExist = Boolean(rollbackRequirements.length);
  const proofRequirementsExist = Boolean(proofRequirements.length);

  const conditions = {
    durableScopeExists: Boolean(scope),
    scopeFingerprintValid: Boolean(scope && recalculatedFingerprint === scope.scopeFingerprint),
    durableApprovalExists: Boolean(approval),
    approvalReferencesScope: Boolean(
      scope && approval && (
        approval.repairScopeId === scope.id ||
        approval.scopeId === scope.scopeId
      ),
    ),
    approvalVersionMatches: Boolean(scope && approval && approval.approvedScopeVersion === scope.scopeVersion),
    approvalFingerprintMatches: Boolean(scope && approval && approval.approvedScopeFingerprint === scope.scopeFingerprint),
    approvalStatusActive: Boolean(lifecycle?.active),
    approvalNotRevoked: Boolean(approval && approval.status !== "REVOKED" && !approval.revokedAt),
    approvalNotExpired: Boolean(approval && lifecycle?.lifecycleStatus !== "EXPIRED"),
    canonicalPacketExists: Boolean(canonicalPacketId && packet),
    packetAssociationExists: Boolean(packetLink),
    packetAssociationMatchesScopeApproval: Boolean(packetLinkScopeMatches && packetLinkApprovalMatches),
    packetBelongsToMerchantStore: Boolean(canonicalPacketId && scopeStore && packetStore === scopeStore),
    packetStatusPermitsPlanning,
    rollbackRequirementsExist,
    proofRequirementsExist,
    packetPermitsExecution: packetStatusPermitsExecution,
  };
  const failedConditions = Object.entries(conditions)
    .filter(([, passed]) => !passed)
    .map(([condition]) => {
      switch (condition) {
        case "durableScopeExists":
          return "durable_scope_missing";
        case "scopeFingerprintValid":
          return "scope_fingerprint_invalid";
        case "durableApprovalExists":
          return "durable_approval_missing";
        case "approvalReferencesScope":
          return "approval_scope_mismatch";
        case "approvalVersionMatches":
          return "approval_version_mismatch";
        case "approvalFingerprintMatches":
          return "approval_fingerprint_mismatch";
        case "approvalStatusActive":
          return "approval_not_active";
        case "approvalNotRevoked":
          return "approval_revoked";
        case "approvalNotExpired":
          return "approval_expired";
        case "canonicalPacketExists":
          return "canonical_packet_missing";
        case "packetAssociationExists":
          return "packet_association_missing";
        case "packetAssociationMatchesScopeApproval":
          return "packet_association_scope_approval_mismatch";
        case "packetBelongsToMerchantStore":
          return "packet_store_mismatch";
        case "packetStatusPermitsPlanning":
          return "packet_planning_not_permitted";
        case "rollbackRequirementsExist":
          return "rollback_requirements_missing";
        case "proofRequirementsExist":
          return "proof_requirements_missing";
        case "packetPermitsExecution":
          return "packet_execution_not_permitted";
        default:
          return condition;
      }
    });

  return {
    EXECUTION_AUTHORIZED: failedConditions.length === 0,
    conditions,
    failedConditions,
  };
}
