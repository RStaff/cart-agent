import { STARTER_QUESTIONS } from "./askAbandoEngine.js";
import { buildAdvisorBehavior } from "./advisorRailBehavior.js";
import { buildGuidedAudit } from "./guidedAuditEngine.js";

export function buildAdvisorRail(scorecard) {
  const guidedAudit = buildGuidedAudit(scorecard);

  return {
    slug: guidedAudit.slug,
    title: "Abando Advisor",
    estimatedCompletionLabel: "~30 seconds",
    steps: guidedAudit.steps,
    defaultMode: "guided",
    defaultBehavioralState: "INITIAL_INSIGHT",
    behavior: buildAdvisorBehavior(scorecard),
    cta: {
      installLabel: guidedAudit.cta.installLabel,
      installPath: guidedAudit.cta.installPath,
      secondaryLabel: "Ask Abando a question",
    },
    starterQuestions: STARTER_QUESTIONS,
    truthNote: "This is a benchmark-based estimate, not tracked revenue yet. Tracked results begin after install.",
  };
}
