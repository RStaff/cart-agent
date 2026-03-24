// To test real stores:
// 1. Copy a real store signal object
// 2. Paste into TEST_CASES
// 3. Set expectedEngine based on judgment
// 4. Run and compare

import { routeRevenueOpportunity } from "./router_v1.js";

const TEST_CASES = [
  {
    name: "Fix Store — broken pages blocking flow",
    input: {
      store: {
        storeUrl: "https://fix-blocker.example",
      },
      technical: {
        hasBrokenPages: true,
        hasAppEmbedIssue: false,
        hasThemeRenderIssue: false,
        checkoutAccessible: true,
      },
      traffic: {
        hasMeaningfulTraffic: true,
      },
      conversion: {
        checkoutFlowVisible: true,
      },
      cartRecovery: {
        cartRecoveryOpportunity: true,
      },
      inventory: {
        inventoryActivationOpportunity: false,
      },
    },
    expectedEngine: "FIX",
    notes: "Broken storefront pages should force fix-first routing even if recovery signals exist.",
  },
  {
    name: "Fix Store — checkout inaccessible",
    input: {
      store: {
        storeUrl: "https://checkout-down.example",
      },
      technical: {
        hasBrokenPages: false,
        hasAppEmbedIssue: false,
        hasThemeRenderIssue: false,
        checkoutAccessible: false,
      },
      traffic: {
        hasMeaningfulTraffic: true,
      },
      conversion: {
        checkoutFlowVisible: true,
      },
      cartRecovery: {
        cartRecoveryOpportunity: false,
      },
      inventory: {
        inventoryActivationOpportunity: true,
      },
    },
    expectedEngine: "FIX",
    notes: "Checkout inaccessible is a hard technical blocker and should route to FIX.",
  },
  {
    name: "Recover Store — live traffic with cart recovery opportunity",
    input: {
      store: {
        storeUrl: "https://recover-cart.example",
      },
      technical: {
        hasBrokenPages: false,
        hasAppEmbedIssue: false,
        hasThemeRenderIssue: false,
        checkoutAccessible: true,
      },
      traffic: {
        hasMeaningfulTraffic: true,
      },
      conversion: {
        checkoutFlowVisible: true,
      },
      cartRecovery: {
        cartRecoveryOpportunity: true,
      },
      inventory: {
        inventoryActivationOpportunity: false,
      },
    },
    expectedEngine: "RECOVER",
    notes: "Traffic plus visible checkout plus cart opportunity should route to RECOVER when no blocker exists.",
  },
  {
    name: "Activate Store — inventory pressure without blocker",
    input: {
      store: {
        storeUrl: "https://activate-inventory.example",
      },
      technical: {
        hasBrokenPages: false,
        hasAppEmbedIssue: false,
        hasThemeRenderIssue: false,
        checkoutAccessible: true,
      },
      traffic: {
        hasMeaningfulTraffic: false,
      },
      conversion: {
        checkoutFlowVisible: false,
      },
      cartRecovery: {
        cartRecoveryOpportunity: false,
      },
      inventory: {
        inventoryActivationOpportunity: true,
      },
    },
    expectedEngine: "ACTIVATE",
    notes: "Inventory activation should route to ACTIVATE when no technical blocker is present.",
  },
  {
    name: "Unknown Store — insufficient signal",
    input: {
      store: {
        storeUrl: "https://unknown-signal.example",
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
    notes: "All unknown signals should force NONE and manual review.",
  },
];

export function runHarness() {
  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    try {
      const result = routeRevenueOpportunity(testCase.input);
      const actual = result.primaryEngine;
      const ok = actual === testCase.expectedEngine;

      if (ok) {
        passed += 1;
        console.log(`[PASS] ${testCase.name}`);
        console.log(`Expected: ${testCase.expectedEngine}`);
        console.log(`Actual: ${actual}`);
        console.log("");
      } else {
        failed += 1;
        console.log(`[FAIL] ${testCase.name}`);
        console.log(`Expected: ${testCase.expectedEngine}`);
        console.log(`Actual: ${actual}`);
        console.log(`Reasoning: ${result.reasoning}`);
        console.log(`Notes: ${testCase.notes}`);
        console.log("");
      }
    } catch (error) {
      failed += 1;
      console.log(`[FAIL] ${testCase.name}`);
      console.log(`Expected: ${testCase.expectedEngine}`);
      console.log("Actual: ERROR");
      console.log(`Reasoning: ${error instanceof Error ? error.message : String(error)}`);
      console.log(`Notes: ${testCase.notes}`);
      console.log("");
    }
  }

  const total = TEST_CASES.length;
  console.log("----------------------------------");
  console.log(`TOTAL: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log("----------------------------------");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHarness();
}
