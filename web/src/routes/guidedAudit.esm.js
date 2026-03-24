import { buildGuidedAuditBySlugOrDomain } from "../../../staffordos/scorecards/guidedAuditEngine.js";

export function installGuidedAuditRoute(app) {
  app.get("/api/guided-audit", (req, res) => {
    const slug = typeof req.query?.slug === "string" ? req.query.slug.trim() : "";
    const domain = typeof req.query?.domain === "string" ? req.query.domain.trim() : "";

    const response = buildGuidedAuditBySlugOrDomain(slug || domain);
    if (!response.ok) {
      return res.status(404).json(response);
    }

    return res.status(200).json(response);
  });
}
