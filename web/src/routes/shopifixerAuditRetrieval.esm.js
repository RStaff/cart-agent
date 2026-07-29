import express from "express";
import { internalOnly } from "../middleware/internalOnly.js";
import { retrieveShopifixerAudit } from "../lib/shopifixerDurableAuditRetrievalAdapter.js";
import { buildShopifixerRepairPlan } from "../lib/shopifixerRepairPlanAdapter.js";

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

export function installShopifixerAuditRetrieval(app, options = {}) {
  const router = express.Router();
  const auditHandler = buildShopifixerAuditRetrievalHandler(options);
  const repairPlanHandler = buildShopifixerRepairPlanHandler(options);

  router.use(internalOnly);
  router.get("/audits/re-entry", auditHandler);
  router.get("/audits/:auditId/repair-plan", repairPlanHandler);
  router.get("/audits/:auditId", auditHandler);

  app.use("/internal/shopifixer", router);
}
