import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCORECARD_PATH = path.resolve(__dirname, "scorecards_output.json");

const STARTER_QUESTIONS = [
  "How did you calculate this?",
  "What is the biggest issue?",
  "What should I fix first?",
  "Is this real revenue?",
  "What happens if I install Abando?",
];

function readScorecards() {
  try {
    const parsed = JSON.parse(fs.readFileSync(SCORECARD_PATH, "utf8"));
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (Array.isArray(parsed?.scorecards)) {
      return parsed.scorecards;
    }
    if (parsed && typeof parsed === "object" && typeof parsed.store === "string") {
      return [parsed];
    }
  } catch {}

  return [];
}

function normalizeDomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function slugifyDomain(value) {
  return normalizeDomain(value)
    .replace(/\.myshopify\.com$/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getScorecardBySlugOrDomain(matchValue) {
  const requested = normalizeDomain(matchValue);
  const requestedSlug = slugifyDomain(matchValue);

  for (const scorecard of readScorecards()) {
    const domain = normalizeDomain(scorecard.domain || scorecard.store);
    const slug = String(scorecard.slug || slugifyDomain(domain));
    if (requested === domain || requested === slug || requestedSlug === slug) {
      return scorecard;
    }
  }

  return null;
}

export function classifyAskAbandoIntent(question) {
  const normalized = String(question || "").trim().toLowerCase();

  if (
    normalized.includes("how did you calculate") ||
    normalized.includes("how was this calculated") ||
    normalized.includes("how do you know") ||
    normalized.includes("calculate this")
  ) {
    return "HOW_CALCULATED";
  }

  if (
    normalized.includes("biggest issue") ||
    normalized.includes("main problem") ||
    normalized.includes("largest issue") ||
    normalized.includes("top issue")
  ) {
    return "BIGGEST_ISSUE";
  }

  if (
    normalized.includes("what should i fix") ||
    normalized.includes("what should i do") ||
    normalized.includes("fix first") ||
    normalized.includes("where should i start")
  ) {
    return "WHAT_TO_FIX_FIRST";
  }

  if (
    normalized.includes("is this real") ||
    normalized.includes("is this exact") ||
    normalized.includes("tracked revenue") ||
    normalized.includes("real revenue")
  ) {
    return "IS_THIS_REAL";
  }

  if (
    normalized.includes("what can abando do") ||
    normalized.includes("how do you help") ||
    normalized.includes("what does abando do")
  ) {
    return "WHAT_DOES_ABANDO_DO";
  }

  if (
    normalized.includes("what happens if i install") ||
    normalized.includes("what's next") ||
    normalized.includes("what happens after install") ||
    normalized.includes("install abando")
  ) {
    return "INSTALL_NEXT_STEP";
  }

  return "DEFAULT_FALLBACK";
}

function topIssue(scorecard) {
  return (
    scorecard?.topFindings?.[0] ||
    scorecard?.top_leak ||
    "checkout friction"
  );
}

function largestBreakdownCategory(scorecard) {
  const entries = Object.entries(scorecard?.opportunityBreakdown || {});
  if (!entries.length) {
    return "checkout friction";
  }

  const [key] = entries.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))[0];
  if (key === "checkoutFrictionCents") return "checkout friction";
  if (key === "trustSignalsCents") return "trust signals";
  if (key === "faqGapCents") return "pricing and FAQ clarity";
  if (key === "urgencyGapCents") return "urgency and incentive framing";
  return "checkout friction";
}

function buildAnswer(scorecard, intent) {
  const strongestIssue = topIssue(scorecard);
  const primaryCategory = largestBreakdownCategory(scorecard);
  const revenueOpportunity =
    scorecard?.revenueOpportunityDisplay ||
    "this estimated revenue opportunity";

  switch (intent) {
    case "HOW_CALCULATED":
      return `This scorecard uses generated audit findings and benchmark-based Shopify checkout patterns for ${scorecard.domain}. The strongest signal here is ${strongestIssue}. The ${revenueOpportunity} figure is an estimate, not tracked recovered revenue.`;
    case "BIGGEST_ISSUE":
      return `The strongest issue on this scorecard is ${strongestIssue}. That is why the largest opportunity is currently attributed to ${primaryCategory}.`;
    case "WHAT_TO_FIX_FIRST":
      return `Start with ${strongestIssue}. Based on this scorecard, that is the most likely place to reduce checkout leakage first.`;
    case "IS_THIS_REAL":
      return "No. This page shows estimated revenue opportunity from a generated public scorecard, not confirmed recovered revenue. Real tracked results begin after Shopify is connected and Abando can observe checkout decision activity.";
    case "WHAT_DOES_ABANDO_DO":
      return "Abando helps merchants move from benchmarked scorecards into real Shopify tracking. After install, it can track checkout decision activity, recovery signals, and merchant workspace reporting.";
    case "INSTALL_NEXT_STEP":
      return "Install connects Shopify so Abando can begin storefront decision tracking, recovery activity measurement, and merchant workspace reporting. This public page stays benchmark-based until that install step happens.";
    default:
      return "I can explain how this scorecard was estimated, what the main issue is, what to fix first, whether this is real tracked revenue yet, and what happens after install.";
  }
}

export function answerAskAbando({ slug, domain, question }) {
  const matchValue = slug || domain;
  const scorecard = getScorecardBySlugOrDomain(matchValue);
  if (!scorecard) {
    return {
      ok: false,
      error: "scorecard_not_found",
    };
  }

  const intent = classifyAskAbandoIntent(question);
  return {
    ok: true,
    slug: String(scorecard.slug || slugifyDomain(scorecard.domain || scorecard.store)),
    intent,
    answer: buildAnswer(scorecard, intent),
    followUpSuggestion:
      intent === "IS_THIS_REAL" || intent === "HOW_CALCULATED"
        ? "What should I fix first?"
        : intent === "WHAT_TO_FIX_FIRST"
          ? "What happens if I install Abando?"
          : "How did you calculate this?",
    installPrompt:
      intent === "IS_THIS_REAL" || intent === "INSTALL_NEXT_STEP" || intent === "WHAT_TO_FIX_FIRST"
        ? "Connect Shopify to move from benchmark estimate to tracked checkout behavior."
        : null,
    starterQuestions: STARTER_QUESTIONS,
  };
}

export { STARTER_QUESTIONS };
