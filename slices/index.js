import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { listCandidateOpportunities } from "../candidate_opportunities/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "registry.json");
const SLICE_SCHEMA_VERSION = "v1";
const VALID_SLICE_TYPES = new Set(["diagnostic", "feature", "infrastructure", "growth", "experiment"]);

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeRegistry(slices) {
  await writeFile(REGISTRY_PATH, JSON.stringify(slices, null, 2) + "\n", "utf8");
}

function normalizeSlice(slice) {
  let sliceType = VALID_SLICE_TYPES.has(slice?.slice_type) ? slice.slice_type : null;
  if (!sliceType) {
    if (String(slice?.id || "").includes("diagnostic") || String(slice?.verification_method || "").includes("API endpoint")) {
      sliceType = "diagnostic";
    } else if (String(slice?.id || "").includes("experiment")) {
      sliceType = "experiment";
    } else if (String(slice?.id || "").includes("recommendation")) {
      sliceType = "growth";
    } else {
      sliceType = "feature";
    }
  }
  return {
    ...slice,
    schema_version: slice?.schema_version || SLICE_SCHEMA_VERSION,
    slice_type: sliceType,
    status: slice?.status || "discovered",
    created_at: slice?.created_at || new Date().toISOString(),
  };
}

function strategicValueForCandidate(candidate) {
  const baseScore = Number(candidate?.impact_score) || 0;
  const normalized = Math.max(20, Math.min(100, Math.round(baseScore / 60)));

  if (candidate?.opportunity_class === "checkout_failure_intelligence") return Math.min(100, normalized + 10);
  if (candidate?.opportunity_class === "checkout_optimization") return Math.min(100, normalized + 8);
  if (candidate?.opportunity_class === "merchant_playbook_engine") return Math.min(100, normalized + 6);
  return normalized;
}

function reasoningSummary(candidate, input) {
  return [
    `Generated from candidate opportunity "${candidate.title}".`,
    `This slice is intentionally ${input.effort_size} and insight-first so it can ship independently.`,
    `Primary verification is: ${input.verification_method}.`,
  ].join(" ");
}

function buildSlice(idSuffix, candidate, input) {
  return {
    id: `${candidate.id}__${idSuffix}`,
    schema_version: SLICE_SCHEMA_VERSION,
    candidate_opportunity_id: candidate.id,
    title: input.title,
    objective: input.objective,
    scope: input.scope,
    acceptance_criteria: input.acceptance_criteria,
    dependencies: input.dependencies ?? [],
    effort_size: input.effort_size,
    shippable: input.shippable ?? true,
    verification_method: input.verification_method,
    strategic_value: strategicValueForCandidate(candidate),
    slice_type: input.slice_type || "feature",
    recommended_next_action: input.recommended_next_action,
    reasoning_summary: reasoningSummary(candidate, input),
    status: "discovered",
    created_at: new Date().toISOString(),
  };
}

function shippingTransparencySlices(candidate) {
  return [
    buildSlice("shipping_friction_diagnostic_endpoint", candidate, {
      title: "Shipping Friction Diagnostic Endpoint",
      objective: "Expose where shipping-step dropoff is happening for merchants with elevated shipping abandonment.",
      scope: "Add a narrow diagnostic API response that summarizes shipping-stage dropoff from existing checkout signals.",
      acceptance_criteria: [
        "API endpoint returns shipping-stage dropoff data",
        "Merchant-facing consumer can read the diagnostic without recomputing truth",
      ],
      dependencies: ["checkout signal availability"],
      effort_size: "small",
      verification_method: "API endpoint returns data",
      slice_type: "diagnostic",
      recommended_next_action: "Implement the shipping diagnostic API before any recommendation or automation layer.",
    }),
    buildSlice("shipping_threshold_insight_card", candidate, {
      title: "Shipping Threshold Insight Card",
      objective: "Turn shipping transparency findings into one merchant-visible insight card.",
      scope: "Render one shipping-threshold insight card from the diagnostic output.",
      acceptance_criteria: [
        "Insight card visible to merchant",
        "Card explains shipping friction with a clear recommendation",
      ],
      dependencies: ["shipping_friction_diagnostic_endpoint"],
      effort_size: "small",
      verification_method: "insight card visible to merchant",
      slice_type: "feature",
      recommended_next_action: "Ship the diagnostic first, then render the threshold insight card on top of it.",
    }),
  ];
}

function mobileCheckoutSlices(candidate) {
  return [
    buildSlice("mobile_abandonment_diagnostic_api", candidate, {
      title: "Mobile Abandonment Diagnostic API",
      objective: "Quantify mobile checkout abandonment as a standalone diagnostic.",
      scope: "Create a narrow endpoint that returns mobile checkout abandonment breakdown for a merchant.",
      acceptance_criteria: [
        "Endpoint returns mobile abandonment data",
        "Response is merchant-specific and readable",
      ],
      dependencies: ["mobile checkout signals"],
      effort_size: "small",
      verification_method: "API endpoint returns data",
      slice_type: "diagnostic",
      recommended_next_action: "Expose the mobile abandonment diagnostic before any deeper mobile workflow changes.",
    }),
    buildSlice("mobile_checkout_friction_insight_card", candidate, {
      title: "Mobile Checkout Friction Insight Card",
      objective: "Present mobile checkout friction as a merchant-visible insight.",
      scope: "Render one insight card based on mobile abandonment diagnostics.",
      acceptance_criteria: [
        "Insight output generated for merchant",
        "Merchant can see mobile friction trend without manual interpretation",
      ],
      dependencies: ["mobile_abandonment_diagnostic_api"],
      effort_size: "small",
      verification_method: "insight card visible to merchant",
      slice_type: "feature",
      recommended_next_action: "Use the diagnostic API as the source of truth for the merchant-facing mobile friction card.",
    }),
  ];
}

function paymentOptimizationSlices(candidate) {
  return [
    buildSlice("payment_failure_insight_api", candidate, {
      title: "Payment Failure Insight API",
      objective: "Surface payment failure patterns in a shippable insight-oriented API.",
      scope: "Add one API response that summarizes payment failures and likely optimization direction.",
      acceptance_criteria: [
        "API returns payment failure insight",
        "Output is narrow and merchant-specific",
      ],
      dependencies: ["payment failure signals"],
      effort_size: "small",
      verification_method: "API endpoint returns data",
      slice_type: "diagnostic",
      recommended_next_action: "Ship the payment failure insight API before any payment workflow experimentation.",
    }),
  ];
}

function smsRecoverySlices(candidate) {
  return [
    buildSlice("sms_recovery_recommendation_card", candidate, {
      title: "SMS Recovery Recommendation Card",
      objective: "Show merchants when SMS-first recovery appears to outperform alternatives.",
      scope: "Render one recommendation card driven by SMS recovery success patterns.",
      acceptance_criteria: [
        "Recommendation card visible to merchant",
        "Card includes recommendation rationale and confidence",
      ],
      dependencies: ["sms recovery success signal"],
      effort_size: "small",
      verification_method: "insight card visible to merchant",
      slice_type: "growth",
      recommended_next_action: "Use this recommendation card to validate SMS-first guidance before workflow automation.",
    }),
  ];
}

function nonDiscountSlices(candidate) {
  return [
    buildSlice("recovery_strategy_experiment_recommendation", candidate, {
      title: "Recovery Strategy Experiment Recommendation",
      objective: "Suggest a non-discount recovery experiment when merchants appear overly discount-dependent.",
      scope: "Produce a merchant-readable experiment recommendation from discount dependency signals.",
      acceptance_criteria: [
        "Recommendation output generated",
        "Experiment suggestion avoids broad automation scope",
      ],
      dependencies: ["discount dependency signal"],
      effort_size: "small",
      verification_method: "diagnostic output generated",
      slice_type: "experiment",
      recommended_next_action: "Generate the experiment recommendation before adding any automated strategy layer.",
    }),
  ];
}

function slicesForCandidate(candidate) {
  switch (candidate.title) {
    case "Shipping Transparency Improvement":
      return shippingTransparencySlices(candidate);
    case "Mobile Checkout Simplification":
      return mobileCheckoutSlices(candidate);
    case "Payment Option Optimization":
      return paymentOptimizationSlices(candidate);
    case "SMS-First Recovery Workflow":
      return smsRecoverySlices(candidate);
    case "Non-Discount Recovery Messaging Test":
      return nonDiscountSlices(candidate);
    default:
      return [
        buildSlice("insight_slice", candidate, {
          title: `${candidate.title} Insight`,
          objective: `Create the smallest merchant-visible insight for ${candidate.title.toLowerCase()}.`,
          scope: "Ship one diagnostic or insight API before broader workflow expansion.",
          acceptance_criteria: [
            "Merchant-visible or API-visible insight exists",
            "Slice is independently deployable",
          ],
          dependencies: candidate.source_signals ?? [],
          effort_size: "small",
          verification_method: "diagnostic output generated",
          slice_type: "feature",
          recommended_next_action: "Ship the smallest diagnostic or insight surface before expanding scope.",
        }),
      ];
  }
}

export async function listSlices() {
  const slices = await readRegistry();
  return slices.map(normalizeSlice).sort((a, b) => {
    const timeA = Date.parse(a.created_at || "") || 0;
    const timeB = Date.parse(b.created_at || "") || 0;
    return timeB - timeA;
  });
}

export async function getSliceById(id) {
  const slices = await readRegistry();
  const slice = slices.find((entry) => entry.id === id);
  return slice ? normalizeSlice(slice) : null;
}

export async function persistSlices(slices) {
  const normalized = slices.map(normalizeSlice);
  await writeRegistry(normalized);
  return normalized;
}

export async function runSliceGenerator() {
  const candidates = await listCandidateOpportunities();
  const generated = candidates.flatMap((candidate) => slicesForCandidate(candidate));
  const normalized = generated.map(normalizeSlice);

  await writeRegistry(normalized);

  return {
    generated_count: normalized.length,
    slices: normalized,
    processed_candidate_opportunity_count: candidates.length,
    recommended_next_action: normalized.length > 0
      ? "Run the build queue to select the best next slice."
      : "Generate candidate opportunities before running the slice generator again.",
    reasoning_summary: "Slices were generated deterministically from candidate opportunities using insight-first rules.",
  };
}
