import express from "express";
import { internalOnly } from "../middleware/internalOnly.js";
import { retrieveShopifixerAudit } from "../lib/shopifixerDurableAuditRetrievalAdapter.js";
import { buildShopifixerRepairPlan } from "../lib/shopifixerRepairPlanAdapter.js";
import { buildShopifixerRepairScope } from "../lib/shopifixerRepairScopeAdapter.js";
import { buildShopifixerExecutionPacket } from "../lib/shopifixerExecutionPacketAdapter.js";
import {
  buildExecutionManifestScopeInput,
  evaluateRepairScopeAuthority,
  getStoredRepairApproval,
  getStoredRepairScope,
} from "../lib/shopifixerScopeAuthorityRepository.js";
import { getCanonicalPacketAssociationForScope } from "../lib/shopifixerCanonicalPacketAuthority.js";

export function buildShopifixerAuditRetrievalHandler(options = {}) {
  return async function shopifixerAuditRetrievalHandler(req, res) {
    try {
      const result = await retrieveShopifixerAudit({
        auditId: req.params?.auditId || req.query?.auditId || req.query?.audit_id,
        leadIdempotencyKey: req.query?.leadIdempotencyKey || req.query?.lead_idempotency_key,
        store: req.query?.store || req.query?.storeDomain || req.query?.store_domain,
        prisma: options.prisma,
      });

      if (!result.ok) {
        return res.status(result.status).json({ ok: false, error: result.error });
      }

      return res.status(200).json({ ok: true, audit: result.result });
    } catch (error) {
      options.logger?.error?.("[shopifixer:audit-retrieval] failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({ ok: false, error: "shopifixer_audit_retrieval_failed" });
    }
  };
}

export function buildShopifixerRepairPlanHandler(options = {}) {
  return async function shopifixerRepairPlanHandler(req, res) {
    try {
      const retrieved = await retrieveShopifixerAudit({
        auditId: req.params?.auditId || req.query?.auditId || req.query?.audit_id,
        store: req.query?.store || req.query?.storeDomain || req.query?.store_domain,
        prisma: options.prisma,
      });

      if (!retrieved.ok) {
        return res.status(retrieved.status).json({ ok: false, error: retrieved.error });
      }

      const plan = buildShopifixerRepairPlan(retrieved.result, {
        generatedAt: options.generatedAt,
      });

      if (!plan.ok) {
        return res.status(plan.status).json({
          ok: false,
          error: plan.error,
          missing: plan.missing || [],
        });
      }

      return res.status(200).json({ ok: true, repairPlan: plan.plan });
    } catch (error) {
      options.logger?.error?.("[shopifixer:repair-plan] failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({ ok: false, error: "shopifixer_repair_plan_failed" });
    }
  };
}

export function buildShopifixerRepairScopeHandler(options = {}) {
  return async function shopifixerRepairScopeHandler(req, res) {
    try {
      const requestedApprovalStatus = String(req.query?.approvalStatus || req.query?.approval_status || "").trim();
      if (requestedApprovalStatus.toUpperCase() === "APPROVED") {
        return res.status(409).json({
          ok: false,
          error: "durable_approval_required",
        });
      }

      const retrieved = await retrieveShopifixerAudit({
        auditId: req.params?.auditId || req.query?.auditId || req.query?.audit_id,
        store: req.query?.store || req.query?.storeDomain || req.query?.store_domain,
        prisma: options.prisma,
      });

      if (!retrieved.ok) {
        return res.status(retrieved.status).json({ ok: false, error: retrieved.error });
      }

      const plan = buildShopifixerRepairPlan(retrieved.result, {
        generatedAt: options.repairPlanGeneratedAt,
      });

      if (!plan.ok) {
        return res.status(plan.status).json({
          ok: false,
          error: plan.error,
          missing: plan.missing || [],
        });
      }

      const scope = buildShopifixerRepairScope(plan.plan, {
        approvalStatus: requestedApprovalStatus || "READY_FOR_REVIEW",
        generatedAt: options.scopeGeneratedAt,
        scopeVersion: req.query?.scopeVersion || req.query?.scope_version,
      });

      if (!scope.ok) {
        return res.status(scope.status).json({
          ok: false,
          error: scope.error,
          missing: scope.missing || [],
        });
      }

      return res.status(200).json({
        ok: true,
        repairScope: scope.scope,
        authority: "planning_only",
      });
    } catch (error) {
      options.logger?.error?.("[shopifixer:repair-scope] failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({ ok: false, error: "shopifixer_repair_scope_failed" });
    }
  };
}

export function buildShopifixerExecutionPacketHandler(options = {}) {
  return async function shopifixerExecutionPacketHandler(req, res) {
    try {
      const requestedApprovalStatus = String(req.query?.approvalStatus || req.query?.approval_status || "").trim();
      if (requestedApprovalStatus) {
        return res.status(409).json({
          ok: false,
          error: "durable_scope_approval_required",
        });
      }

      const scopeId = req.query?.scopeId || req.query?.scope_id;
      const approvalId = req.query?.approvalId || req.query?.approval_id;
      if (!scopeId || !approvalId) {
        return res.status(400).json({
          ok: false,
          error: "missing_durable_scope_approval",
          missing: ["scopeId", "approvalId"],
        });
      }

      const storedScope = await getStoredRepairScope({
        scopeId,
        prisma: options.prisma,
      });
      if (!storedScope.ok) {
        return res.status(storedScope.status).json({ ok: false, error: storedScope.error });
      }
      if (storedScope.scope.auditId !== req.params?.auditId) {
        return res.status(404).json({ ok: false, error: "repair_scope_not_found" });
      }

      const storedApproval = await getStoredRepairApproval({
        approvalId,
        prisma: options.prisma,
        now: options.now,
      });
      if (!storedApproval.ok) {
        return res.status(storedApproval.status).json({ ok: false, error: storedApproval.error });
      }

      const authority = evaluateRepairScopeAuthority({
        scope: storedScope.scope,
        approval: storedApproval.approval,
        now: options.now,
      });
      const approvalReady =
        authority.conditions.durableScopeExists &&
        authority.conditions.scopeFingerprintValid &&
        authority.conditions.durableApprovalExists &&
        authority.conditions.approvalReferencesScope &&
        authority.conditions.approvalVersionMatches &&
        authority.conditions.approvalFingerprintMatches &&
        authority.conditions.approvalStatusActive &&
        authority.conditions.approvalNotRevoked &&
        authority.conditions.approvalNotExpired;

      if (!approvalReady) {
        return res.status(409).json({
          ok: false,
          error: "durable_scope_approval_not_active",
          authority,
        });
      }

      const association = await getCanonicalPacketAssociationForScope({
        scopeId,
        approvalId,
        prisma: options.prisma,
        now: options.now,
      });
      if (!association.ok) {
        return res.status(association.status === 404 ? 409 : association.status).json({
          ok: false,
          error: association.status === 404 ? "canonical_packet_required" : association.error,
          authority,
        });
      }

      const manifestScope = buildExecutionManifestScopeInput(storedScope.scope, storedApproval.approval, {
        now: options.now,
        packetLink: association.packetLink,
        packet: association.packet,
        authority: association.authority,
      });
      const packet = buildShopifixerExecutionPacket(manifestScope, {
        generatedAt: options.executionPacketGeneratedAt,
        operatorAuthorized: options.operatorAuthorized,
        operatorAuthorizationSource: options.operatorAuthorizationSource,
        authority: association.authority,
      });

      if (!packet.ok) {
        return res.status(packet.status).json({
          ok: false,
          error: packet.error,
          missing: packet.missing || [],
        });
      }

      return res.status(200).json({
        ok: true,
        executionManifest: packet.packet,
        authority: association.authority,
      });
    } catch (error) {
      options.logger?.error?.("[shopifixer:execution-packet] failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({ ok: false, error: "shopifixer_execution_packet_failed" });
    }
  };
}

export function installShopifixerAuditRetrieval(app, options = {}) {
  const router = express.Router();
  const auditHandler = buildShopifixerAuditRetrievalHandler(options);
  const repairPlanHandler = buildShopifixerRepairPlanHandler(options);
  const repairScopeHandler = buildShopifixerRepairScopeHandler(options);
  const executionPacketHandler = buildShopifixerExecutionPacketHandler(options);

  router.use(internalOnly);
  router.get("/audits/re-entry", auditHandler);
  router.get("/audits/:auditId/repair-plan", repairPlanHandler);
  router.get("/audits/:auditId/scope", repairScopeHandler);
  router.get("/audits/:auditId/execution-packet", executionPacketHandler);
  router.get("/audits/:auditId", auditHandler);

  app.use("/internal/shopifixer", router);
}
