const TRI_STATE = ["unknown"];
const ENGINE = ["FIX", "RECOVER", "ACTIVATE", "NONE"];
const CONFIDENCE = ["high", "medium", "low"];
const PRICE_BAND = ["low", "mid", "high", "unknown"];
const STORE_MATURITY = ["early", "growing", "established", "unknown"];
const NEXT_ACTION = [
  "send_fix_outreach",
  "send_recover_outreach",
  "send_activate_outreach",
  "manual_review",
];

const REQUIRED_SHAPE = {
  store: {
    storeUrl: "string",
  },
  technical: {
    hasBrokenPages: "tri_state",
    hasAppEmbedIssue: "tri_state",
    hasThemeRenderIssue: "tri_state",
    checkoutAccessible: "tri_state",
  },
  traffic: {
    hasMeaningfulTraffic: "tri_state",
  },
  conversion: {
    checkoutFlowVisible: "tri_state",
  },
  cartRecovery: {
    cartRecoveryOpportunity: "tri_state",
  },
  inventory: {
    inventoryActivationOpportunity: "tri_state",
  },
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isTriState(value) {
  return value === true || value === false || value === "unknown";
}

function validateTriState(value, path) {
  assert(isTriState(value), `${path} must be true, false, or "unknown"`);
}

function validateNode(node, shape, path) {
  assert(isPlainObject(node), `${path} must be an object`);

  const allowedKeys = Object.keys(shape);
  const actualKeys = Object.keys(node);

  for (const key of actualKeys) {
    assert(allowedKeys.includes(key), `${path}.${key} is not allowed`);
  }

  for (const key of allowedKeys) {
    const nextPath = `${path}.${key}`;
    const expected = shape[key];
    const value = node[key];

    assert(value !== undefined, `${nextPath} is required`);

    if (expected === "string") {
      assert(typeof value === "string", `${nextPath} must be a string`);
      continue;
    }

    if (expected === "tri_state") {
      validateTriState(value, nextPath);
      continue;
    }

    validateNode(value, expected, nextPath);
  }
}

export function validateInput(input) {
  assert(isPlainObject(input), "input must be an object");

  const allowedTopLevelKeys = Object.keys(REQUIRED_SHAPE);
  for (const key of Object.keys(input)) {
    assert(allowedTopLevelKeys.includes(key), `input.${key} is not allowed`);
  }

  validateNode(input, REQUIRED_SHAPE, "input");
  return true;
}

function toSignalList(input) {
  return [
    ["hasBrokenPages", input.technical.hasBrokenPages],
    ["hasAppEmbedIssue", input.technical.hasAppEmbedIssue],
    ["hasThemeRenderIssue", input.technical.hasThemeRenderIssue],
    ["checkoutAccessible", input.technical.checkoutAccessible],
    ["hasMeaningfulTraffic", input.traffic.hasMeaningfulTraffic],
    ["checkoutFlowVisible", input.conversion.checkoutFlowVisible],
    ["cartRecoveryOpportunity", input.cartRecovery.cartRecoveryOpportunity],
    ["inventoryActivationOpportunity", input.inventory.inventoryActivationOpportunity],
  ];
}

function allSignalsUnknown(input) {
  return toSignalList(input).every(([, value]) => value === "unknown");
}

function supportingSignals(input) {
  return toSignalList(input)
    .filter(([, value]) => value === true || value === false)
    .map(([key, value]) => `${key}=${value}`);
}

function confidenceFromSignals(values) {
  const total = values.length;
  const known = values.filter((value) => value !== "unknown").length;
  const score = total === 0 ? 0 : known / total;

  let level = "low";
  if (score >= 0.8) {
    level = "high";
  } else if (score >= 0.5) {
    level = "medium";
  }

  assert(CONFIDENCE.includes(level), "invalid confidence level");

  return {
    confidenceScore: score,
    confidenceLevel: level,
  };
}

function buildNoneResult(storeUrl, input, reasoning) {
  const confidence = confidenceFromSignals(toSignalList(input).map(([, value]) => value));
  return {
    storeUrl,
    primaryEngine: "NONE",
    confidenceScore: confidence.confidenceScore,
    confidenceLevel: confidence.confidenceLevel,
    nextAction: "manual_review",
    reasoning,
    supportingSignals: supportingSignals(input),
  };
}

export function routeRevenueOpportunity(input) {
  validateInput(input);

  const storeUrl = input.store.storeUrl;

  if (allSignalsUnknown(input)) {
    return buildNoneResult(storeUrl, input, "All routing signals are unknown");
  }

  const criticalTechnicalBlocker =
    input.technical.hasBrokenPages === true ||
    input.technical.checkoutAccessible === false ||
    input.technical.hasAppEmbedIssue === true ||
    input.technical.hasThemeRenderIssue === true;

  const fixCandidate = criticalTechnicalBlocker === true;

  const recoverCandidate =
    input.traffic.hasMeaningfulTraffic === true &&
    input.conversion.checkoutFlowVisible === true &&
    input.cartRecovery.cartRecoveryOpportunity === true &&
    criticalTechnicalBlocker !== true;

  const activateCandidate =
    input.inventory.inventoryActivationOpportunity === true &&
    criticalTechnicalBlocker !== true;

  let primaryEngine = "NONE";
  let nextAction = "manual_review";
  let reasoning = "No qualifying routed opportunity detected";
  let confidenceInputs = [];

  if (fixCandidate === true) {
    primaryEngine = "FIX";
    nextAction = "send_fix_outreach";
    reasoning = "Technical blocker detected requiring fix-first routing";
    confidenceInputs = [
      input.technical.hasBrokenPages,
      input.technical.checkoutAccessible,
      input.technical.hasAppEmbedIssue,
      input.technical.hasThemeRenderIssue,
    ];
  } else if (recoverCandidate === true) {
    primaryEngine = "RECOVER";
    nextAction = "send_recover_outreach";
    reasoning = "Recovery opportunity detected on visible checkout flow";
    confidenceInputs = [
      input.traffic.hasMeaningfulTraffic,
      input.conversion.checkoutFlowVisible,
      input.cartRecovery.cartRecoveryOpportunity,
      input.technical.hasBrokenPages,
      input.technical.checkoutAccessible,
      input.technical.hasAppEmbedIssue,
      input.technical.hasThemeRenderIssue,
    ];
  } else if (activateCandidate === true) {
    primaryEngine = "ACTIVATE";
    nextAction = "send_activate_outreach";
    reasoning = "Inventory activation opportunity detected without technical blocker";
    confidenceInputs = [
      input.inventory.inventoryActivationOpportunity,
      input.technical.hasBrokenPages,
      input.technical.checkoutAccessible,
      input.technical.hasAppEmbedIssue,
      input.technical.hasThemeRenderIssue,
    ];
  } else {
    return buildNoneResult(storeUrl, input, reasoning);
  }

  assert(ENGINE.includes(primaryEngine), "invalid engine");
  assert(NEXT_ACTION.includes(nextAction), "invalid next action");

  const confidence = confidenceFromSignals(confidenceInputs);

  return {
    storeUrl,
    primaryEngine,
    confidenceScore: confidence.confidenceScore,
    confidenceLevel: confidence.confidenceLevel,
    nextAction,
    reasoning,
    supportingSignals: supportingSignals(input),
  };
}

function testRouter() {
  const fixInput = {
    store: { storeUrl: "https://fix-store.example" },
    technical: {
      hasBrokenPages: true,
      hasAppEmbedIssue: "unknown",
      hasThemeRenderIssue: false,
      checkoutAccessible: true,
    },
    traffic: { hasMeaningfulTraffic: "unknown" },
    conversion: { checkoutFlowVisible: "unknown" },
    cartRecovery: { cartRecoveryOpportunity: "unknown" },
    inventory: { inventoryActivationOpportunity: "unknown" },
  };

  const recoverInput = {
    store: { storeUrl: "https://recover-store.example" },
    technical: {
      hasBrokenPages: false,
      hasAppEmbedIssue: false,
      hasThemeRenderIssue: false,
      checkoutAccessible: true,
    },
    traffic: { hasMeaningfulTraffic: true },
    conversion: { checkoutFlowVisible: true },
    cartRecovery: { cartRecoveryOpportunity: true },
    inventory: { inventoryActivationOpportunity: false },
  };

  const activateInput = {
    store: { storeUrl: "https://activate-store.example" },
    technical: {
      hasBrokenPages: false,
      hasAppEmbedIssue: false,
      hasThemeRenderIssue: "unknown",
      checkoutAccessible: true,
    },
    traffic: { hasMeaningfulTraffic: false },
    conversion: { checkoutFlowVisible: false },
    cartRecovery: { cartRecoveryOpportunity: false },
    inventory: { inventoryActivationOpportunity: true },
  };

  console.log("FIX", routeRevenueOpportunity(fixInput));
  console.log("RECOVER", routeRevenueOpportunity(recoverInput));
  console.log("ACTIVATE", routeRevenueOpportunity(activateInput));
}

export function safeRouteRevenueOpportunity(input) {
  try {
    return routeRevenueOpportunity(input);
  } catch {
    return {
      storeUrl: typeof input?.store?.storeUrl === "string" ? input.store.storeUrl : "",
      primaryEngine: "NONE",
      confidenceScore: 0,
      confidenceLevel: "low",
      nextAction: "manual_review",
      reasoning: "Input validation failed",
      supportingSignals: [],
    };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testRouter();
}
