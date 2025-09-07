import express from "express";
import { composeAbandonEmail } from "../lib/aiCompose.js";
import { tweakPreviewHtml } from "../lib/preview-tweaks.js";
import { tweakPreviewHtml } from "../lib/preview-tweaks.js";

export function registerPreviewRoutes(app) {
  const router = express.Router();

  // POST /api/preview/abandon
  // Body: { items: [{sku,qty,image}], tone?: "friendly"|"persuasive"|"playful"|"urgent", brand?: string, resumeUrl?: string }
  router.post("/abandon", async (req, res) => {
    try {
      const { items = [], tone = "friendly", brand = "Your Store", resumeUrl = "#", customerEmail = "" } = req.body || {};
      const { subject, html, text } = composeAbandonEmail({ items, tone, brand, resumeUrl });
      const previewHtml = tweakPreviewHtml(html, { tone, items, brand });
      return res.json({ ok: true, subject, html: previewHtml, text });
    } catch (err) {
      console.error("[preview] fail", err);
      return res.status(500).json({ ok: false, error: String(err?.message || err) });
    }
  });

  app.use("/api/preview", router);
}
