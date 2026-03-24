import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { routeRevenueOpportunity } from "./router_v1.js";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
const tmpDir = resolve(repoRoot, ".tmp");
const evaluationsPath = resolve(tmpDir, "router_real_store_evaluations.json");
const resultsPath = resolve(tmpDir, "router_real_store_results.json");
const ALLOWED_ENGINES = ["FIX", "RECOVER", "ACTIVATE", "NONE"];

function ensureTmpDir() {
  mkdirSync(tmpDir, { recursive: true });
}

function seedCases() {
  return [
    {
      name: "Example Store 1 — replace me",
      storeUrl: "https://store-1.example",
      input: {
        store: {
          storeUrl: "https://store-1.example",
        },
        technical: {
          hasBrokenPages: "unknown",
          hasAppEmbedIssue: "unknown",
          hasThemeRenderIssue: "unknown",
          checkoutAccessible: "unknown",
        },
        traffic: {
          hasMeaningfulTraffic: "unknown",
        },
        conversion: {
          checkoutFlowVisible: "unknown",
        },
        cartRecovery: {
          cartRecoveryOpportunity: "unknown",
        },
        inventory: {
          inventoryActivationOpportunity: "unknown",
        },
      },
      expectedEngine: "NONE",
      manualJudgmentReason: "Example placeholder. Replace with real store judgment.",
      notes: "Replace this example with a real store evaluation.",
    },
    {
      name: "Example Store 2 — replace me",
      storeUrl: "https://store-2.example",
      input: {
        store: {
          storeUrl: "https://store-2.example",
        },
        technical: {
          hasBrokenPages: "unknown",
          hasAppEmbedIssue: "unknown",
          hasThemeRenderIssue: "unknown",
          checkoutAccessible: "unknown",
        },
        traffic: {
          hasMeaningfulTraffic: "unknown",
        },
        conversion: {
          checkoutFlowVisible: "unknown",
        },
        cartRecovery: {
          cartRecoveryOpportunity: "unknown",
        },
        inventory: {
          inventoryActivationOpportunity: "unknown",
        },
      },
      expectedEngine: "NONE",
      manualJudgmentReason: "Example placeholder. Replace with real store judgment.",
      notes: "Replace this example with a real store evaluation.",
    },
    {
      name: "Example Store 3 — replace me",
      storeUrl: "https://store-3.example",
      input: {
        store: {
          storeUrl: "https://store-3.example",
        },
        technical: {
          hasBrokenPages: "unknown",
          hasAppEmbedIssue: "unknown",
          hasThemeRenderIssue: "unknown",
          checkoutAccessible: "unknown",
        },
        traffic: {
          hasMeaningfulTraffic: "unknown",
        },
        conversion: {
          checkoutFlowVisible: "unknown",
        },
        cartRecovery: {
          cartRecoveryOpportunity: "unknown",
        },
        inventory: {
          inventoryActivationOpportunity: "unknown",
        },
      },
      expectedEngine: "NONE",
      manualJudgmentReason: "Example placeholder. Replace with real store judgment.",
      notes: "Replace this example with a real store evaluation.",
    },
    {
      name: "Example Store 4 — replace me",
      storeUrl: "https://store-4.example",
      input: {
        store: {
          storeUrl: "https://store-4.example",
        },
        technical: {
          hasBrokenPages: "unknown",
          hasAppEmbedIssue: "unknown",
          hasThemeRenderIssue: "unknown",
          checkoutAccessible: "unknown",
        },
        traffic: {
          hasMeaningfulTraffic: "unknown",
        },
        conversion: {
          checkoutFlowVisible: "unknown",
        },
        cartRecovery: {
          cartRecoveryOpportunity: "unknown",
        },
        inventory: {
          inventoryActivationOpportunity: "unknown",
        },
      },
      expectedEngine: "NONE",
      manualJudgmentReason: "Example placeholder. Replace with real store judgment.",
      notes: "Replace this example with a real store evaluation.",
    },
    {
      name: "Example Store 5 — replace me",
      storeUrl: "https://store-5.example",
      input: {
        store: {
          storeUrl: "https://store-5.example",
        },
        technical: {
          hasBrokenPages: "unknown",
          hasAppEmbedIssue: "unknown",
          hasThemeRenderIssue: "unknown",
          checkoutAccessible: "unknown",
        },
        traffic: {
          hasMeaningfulTraffic: "unknown",
        },
        conversion: {
          checkoutFlowVisible: "unknown",
        },
        cartRecovery: {
          cartRecoveryOpportunity: "unknown",
        },
        inventory: {
          inventoryActivationOpportunity: "unknown",
        },
      },
      expectedEngine: "NONE",
      manualJudgmentReason: "Example placeholder. Replace with real store judgment.",
      notes: "Replace this example with a real store evaluation.",
    },
  ];
}

function writeJson(path, value) {
  ensureTmpDir();
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function loadEvaluationCases() {
  ensureTmpDir();

  if (!existsSync(evaluationsPath)) {
    const seeded = seedCases();
    writeJson(evaluationsPath, seeded);
    return seeded;
  }

  const raw = readFileSync(evaluationsPath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : seedCases();
}

export function saveEvaluationCases(cases) {
  writeJson(evaluationsPath, cases);
}

function validateCaseShape(testCase) {
  if (!testCase || typeof testCase !== "object" || Array.isArray(testCase)) {
    throw new Error("testCase must be an object");
  }
  if (typeof testCase.name !== "string" || !testCase.name.trim()) {
    throw new Error("name must be a non-empty string");
  }
  if (typeof testCase.storeUrl !== "string" || !testCase.storeUrl.trim()) {
    throw new Error("storeUrl must be a non-empty string");
  }
  if (!ALLOWED_ENGINES.includes(testCase.expectedEngine)) {
    throw new Error("expectedEngine must be FIX, RECOVER, ACTIVATE, or NONE");
  }
  if (typeof testCase.manualJudgmentReason !== "string") {
    throw new Error("manualJudgmentReason must exist");
  }
  if (typeof testCase.notes !== "string") {
    throw new Error("notes must exist");
  }
  if (!testCase.input || typeof testCase.input !== "object" || Array.isArray(testCase.input)) {
    throw new Error("input must be an object");
  }
}

export function evaluateCase(testCase) {
  validateCaseShape(testCase);

  const result = routeRevenueOpportunity(testCase.input);
  return {
    name: testCase.name,
    storeUrl: testCase.storeUrl,
    expectedEngine: testCase.expectedEngine,
    actualEngine: result.primaryEngine,
    agree: result.primaryEngine === testCase.expectedEngine,
    manualJudgmentReason: testCase.manualJudgmentReason,
    routerReasoning: result.reasoning,
    nextAction: result.nextAction,
    confidenceScore: result.confidenceScore,
    confidenceLevel: result.confidenceLevel,
    supportingSignals: result.supportingSignals,
    notes: testCase.notes,
  };
}

export function runWorksheet() {
  const cases = loadEvaluationCases();
  const results = [];
  let agreeCount = 0;
  let disagreeCount = 0;
  let errorCount = 0;

  for (const testCase of cases) {
    try {
      const evaluated = evaluateCase(testCase);
      results.push(evaluated);

      if (evaluated.agree) {
        agreeCount += 1;
      } else {
        disagreeCount += 1;
      }

      console.log(`[STORE] ${evaluated.name}`);
      console.log(`URL: ${evaluated.storeUrl}`);
      console.log(`Expected: ${evaluated.expectedEngine}`);
      console.log(`Actual: ${evaluated.actualEngine}`);
      console.log(`Agree: ${evaluated.agree ? "YES" : "NO"}`);
      console.log(`Manual: ${evaluated.manualJudgmentReason}`);
      console.log(`Router: ${evaluated.routerReasoning}`);
      console.log(`Next Action: ${evaluated.nextAction}`);
      console.log(`Confidence: ${evaluated.confidenceScore} (${evaluated.confidenceLevel})`);
      console.log(`Signals: ${evaluated.supportingSignals.join(", ")}`);
      console.log(`Notes: ${evaluated.notes}`);
      console.log("");
    } catch (error) {
      errorCount += 1;
      disagreeCount += 1;

      const message = error instanceof Error ? error.message : String(error);
      console.log(`[STORE] ${testCase?.name || "Unknown Store"}`);
      console.log(`URL: ${testCase?.storeUrl || ""}`);
      console.log(`Expected: ${testCase?.expectedEngine || ""}`);
      console.log("Actual: ERROR");
      console.log("Agree: NO");
      console.log(`Error: ${message}`);
      console.log(`Notes: ${typeof testCase?.notes === "string" ? testCase.notes : ""}`);
      console.log("");
    }
  }

  writeJson(resultsPath, results);

  console.log("----------------------------------");
  console.log(`TOTAL: ${cases.length}`);
  console.log(`AGREE: ${agreeCount}`);
  console.log(`DISAGREE: ${disagreeCount}`);
  console.log(`ERRORS: ${errorCount}`);
  console.log("----------------------------------");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWorksheet();
}
