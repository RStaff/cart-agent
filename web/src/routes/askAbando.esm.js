import { answerAskAbando } from "../../../staffordos/scorecards/askAbandoEngine.js";

export function installAskAbandoRoute(app) {
  app.get("/api/ask-abando", (req, res) => {
    const slug = typeof req.query?.slug === "string" ? req.query.slug.trim() : "";
    const domain = typeof req.query?.domain === "string" ? req.query.domain.trim() : "";
    const question = typeof req.query?.q === "string" ? req.query.q.trim() : "";

    const response = answerAskAbando({ slug, domain, question });
    if (!response.ok) {
      return res.status(404).json(response);
    }

    return res.status(200).json(response);
  });
}
