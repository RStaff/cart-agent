import { classifyAskAbandoIntent } from "./askAbandoEngine.js";

function topIssue(scorecard) {
  return scorecard?.topFindings?.[0] || scorecard?.top_leak || "the top issue on this scorecard";
}

function fixGuidance(scorecard) {
  const issue = String(topIssue(scorecard)).toLowerCase();
  if (issue.includes("mobile")) {
    return [
      "Review the highlighted issue on mobile first.",
      "Check for friction between cart and checkout handoff.",
      "Confirm whether the same step causes hesitation repeatedly.",
    ];
  }
  if (issue.includes("shipping")) {
    return [
      "Review the shipping step first.",
      "Check for extra friction between cart review and shipping selection.",
      "Confirm whether shipping choices or timing are causing hesitation.",
    ];
  }
  return [
    "Review the highlighted issue on the live flow first.",
    "Check for friction between cart and checkout.",
    "Confirm whether the same step causes hesitation repeatedly.",
  ];
}

export function classifyBehaviorQuestion(question) {
  const normalized = String(question || "").trim().toLowerCase();
  const askIntent = classifyAskAbandoIntent(question);

  if (
    askIntent === "IS_THIS_REAL" ||
    askIntent === "HOW_CALCULATED" ||
    normalized.includes("how accurate") ||
    normalized.includes("is this a guess")
  ) {
    return "DOUBT_RESPONSE";
  }

  if (askIntent === "WHAT_TO_FIX_FIRST" || normalized.includes("how do i fix")) {
    return "VALUE_REFRAME";
  }

  if (askIntent === "INSTALL_NEXT_STEP" || normalized.includes("what happens if i connect")) {
    return "CLOSE_READY";
  }

  return "QA_MODE";
}

export function buildAdvisorBehavior(scorecard) {
  const issue = topIssue(scorecard);
  const fixes = fixGuidance(scorecard);

  return {
    INITIAL_INSIGHT: {
      state: "INITIAL_INSIGHT",
      label: "Initial insight",
      message: `I analyzed this store against Shopify checkout benchmarks.\n\nThere’s a strong signal this store may be losing revenue during checkout, especially around ${issue}.`,
      ctas: [
        { id: "show_me_why", label: "Show me why", nextState: "VALUE_REFRAME" },
      ],
    },
    SKEPTICAL_PAUSE: {
      state: "SKEPTICAL_PAUSE",
      label: "Quick note",
      message: "Quick note — this is not tracked store data yet.\n\nThis is a benchmark-based estimate built from checkout patterns seen across similar Shopify stores. It’s meant to show you where to look before connecting your store.",
      ctas: [
        { id: "how_accurate", label: "How accurate is this?", nextState: "DOUBT_RESPONSE" },
        { id: "continue_guided", label: "Continue guided audit", nextState: "VALUE_REFRAME" },
      ],
    },
    DOUBT_RESPONSE: {
      state: "DOUBT_RESPONSE",
      label: "Accuracy and trust",
      message: "It’s directionally accurate based on Shopify benchmark patterns and the issue signals shown in this scorecard.\n\nExact numbers only come from tracking your real checkout behavior after install.",
      supportingPoints: [
        "Benchmark-based preview before install.",
        "Real tracking after install.",
        "Meant to identify what is worth checking first.",
      ],
      ctas: [
        { id: "fix_first", label: "What should I fix first?", nextState: "VALUE_REFRAME" },
        { id: "connect_shopify", label: "Connect Shopify", nextState: "CLOSE_READY" },
      ],
    },
    VALUE_REFRAME: {
      state: "VALUE_REFRAME",
      label: "Why the issue matters",
      message: `The most important thing here is not the estimate itself — it’s the issue it points to.\n\nIf ${issue.toLowerCase()} is real, even at a smaller scale, it can still be costing conversions.`,
      supportingPoints: fixes,
      ctas: [
        { id: "after_install", label: "What happens after install?", nextState: "CLOSE_READY" },
      ],
    },
    CLOSE_READY: {
      state: "CLOSE_READY",
      label: "Ready for certainty",
      message: "The estimate gives you direction.\n\nConnecting your store gives you certainty.\n\nAfter install, Abando can show where customers actually drop off, which step causes hesitation, and what revenue is tied to those drop-offs.",
      supportingPoints: [
        "No changes are made without your approval.",
        "This step starts tracking — it does not charge you on this page.",
      ],
      ctas: [
        { id: "connect_shopify", label: "Connect Shopify", nextState: "CLOSE_READY" },
        { id: "ask_question", label: "Ask Abando a question", nextState: "QA_MODE" },
      ],
    },
    QA_MODE: {
      state: "QA_MODE",
      label: "Question mode",
      message: "Ask a bounded question about how this scorecard was estimated, what issue matters most, what to fix first, or what happens after install.",
      ctas: [
        { id: "back_to_guided", label: "Back to guided audit", nextState: "INITIAL_INSIGHT" },
      ],
    },
  };
}
