import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getNextBuildQueueItem } from "../build_queue/index.js";
import { getSliceById } from "../slices/index.js";
import { getCandidateOpportunityById } from "../candidate_opportunities/index.js";
import { validateRevenueGate } from "../staffordos/revenue/revenue_gate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "registry.json");
const EXECUTION_PACKET_SCHEMA_VERSION = "v1";
const VALID_EXECUTION_MODES = new Set(["codex", "script", "manual", "ci_pipeline"]);

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeRegistry(packets) {
  await writeFile(REGISTRY_PATH, JSON.stringify(packets, null, 2) + "\n", "utf8");
}

function normalizeExecutionPacket(packet) {
  const executionMode = VALID_EXECUTION_MODES.has(packet?.execution_mode) ? packet.execution_mode : "codex";
  return {
    ...packet,
    schema_version: packet?.schema_version || EXECUTION_PACKET_SCHEMA_VERSION,
    execution_mode: executionMode,
    status: packet?.status || packetStatus(),
    created_at: packet?.created_at || new Date().toISOString(),
  };
}

function packetStatus() {
  return "generated";
}

function packetId(sliceId) {
  return `packet__${sliceId}`;
}

function basePacket(slice) {
  return {
    id: packetId(slice.id),
    schema_version: EXECUTION_PACKET_SCHEMA_VERSION,
    slice_id: slice.id,
    title: slice.title,
    objective: slice.objective,
    implementation_summary: `Implement the ${slice.title.toLowerCase()} as a narrow, independently shippable slice grounded in the existing checkout and recovery intelligence pipeline.`,
    target_files: [],
    proposed_endpoints: [],
    data_contracts: [],
    acceptance_criteria: slice.acceptance_criteria,
    verification_steps: [slice.verification_method],
    dependencies: slice.dependencies,
    risk_notes: [],
    paymentModel: slice.paymentModel || "",
    estimatedRevenueImpact: Number(slice.estimatedRevenueImpact) || 0,
    execution_mode: "codex",
    status: packetStatus(),
    reasoning_summary: `This packet was generated from the selected slice "${slice.title}" and keeps scope limited to one deterministic implementation step.`,
    recommended_next_action: `Implement ${slice.title} in the most direct way possible, then verify via ${slice.verification_method.toLowerCase()}.`,
    created_at: new Date().toISOString(),
  };
}

function packetForMobileAbandonmentDiagnostic(slice) {
  return {
    ...basePacket(slice),
    implementation_summary: "Create a merchant-scoped diagnostic API that returns mobile checkout abandonment metrics from existing merchant signals or checkout intelligence data.",
    target_files: [
      "web/src/index.js",
      "web/src/lib/mobile-checkout-diagnostics.js",
    ],
    proposed_endpoints: [
      "GET /api/mobile-checkout-diagnostics?merchant_id=",
    ],
    data_contracts: [
      {
        contract: "mobile_checkout_diagnostic_response",
        fields: ["merchant_id", "mobile_abandonment_rate", "sample_size", "comparison_window"],
      },
    ],
    verification_steps: [
      "POST /api/slices/run has already produced the selected slice",
      "GET /api/mobile-checkout-diagnostics?merchant_id= returns merchant-scoped diagnostic data",
      "Response is deterministic and does not recompute truth in the client",
    ],
    risk_notes: [
      "Keep the metric definition narrow and explainable.",
      "Do not expand into a broader mobile analytics framework in this slice.",
    ],
  };
}

function packetForMobileInsightCard(slice) {
  return {
    ...basePacket(slice),
    implementation_summary: "Render a merchant-facing mobile friction insight card on top of the diagnostic API without duplicating backend truth in the UI.",
    target_files: [
      "web/src/index.js",
      "web/src/lib/mobile-checkout-diagnostics.js",
      "web/frontend/src/components/MobileCheckoutFrictionInsightCard.jsx",
    ],
    proposed_endpoints: [
      "GET /api/mobile-checkout-diagnostics?merchant_id=",
    ],
    data_contracts: [
      {
        contract: "mobile_checkout_friction_card",
        fields: ["headline", "mobile_abandonment_rate", "sample_size", "recommended_fix"],
      },
    ],
    verification_steps: [
      "Insight card is visible to a merchant",
      "Card reads only from the diagnostic response",
      "Card copy and numbers match the backend diagnostic output",
    ],
    risk_notes: [
      "Do not introduce frontend-side analytics logic.",
    ],
  };
}

function packetForShippingDiagnostic(slice) {
  return {
    ...basePacket(slice),
    implementation_summary: "Ship a narrow API that exposes shipping-stage friction using existing checkout signal data.",
    target_files: [
      "web/src/index.js",
      "web/src/lib/shipping-friction-diagnostics.js",
    ],
    proposed_endpoints: [
      "GET /api/shipping-friction-diagnostics?merchant_id=",
    ],
    data_contracts: [
      {
        contract: "shipping_friction_diagnostic_response",
        fields: ["merchant_id", "shipping_dropoff_rate", "sample_size", "threshold_gap_signal"],
      },
    ],
    verification_steps: [
      "API endpoint returns shipping friction data",
      "Merchant-scoped values are deterministic",
    ],
    risk_notes: [
      "Keep shipping threshold guidance descriptive, not prescriptive automation.",
    ],
  };
}

function packetForShippingInsightCard(slice) {
  return {
    ...basePacket(slice),
    implementation_summary: "Render one merchant-visible shipping threshold insight card using the shipping friction diagnostic API as the source of truth.",
    target_files: [
      "web/src/index.js",
      "web/src/lib/shipping-friction-diagnostics.js",
      "web/frontend/src/components/ShippingThresholdInsightCard.jsx",
    ],
    proposed_endpoints: [
      "GET /api/shipping-friction-diagnostics?merchant_id=",
    ],
    data_contracts: [
      {
        contract: "shipping_threshold_insight_card",
        fields: ["headline", "shipping_dropoff_rate", "sample_size", "recommended_threshold_message"],
      },
    ],
    verification_steps: [
      "Insight card visible to merchant",
      "Card reflects diagnostic API values exactly",
    ],
    risk_notes: [
      "Do not widen into a generalized shipping optimization suite.",
    ],
  };
}

function packetForPaymentInsight(slice) {
  return {
    ...basePacket(slice),
    implementation_summary: "Expose a narrow API summarizing payment failure patterns and likely optimization direction for a merchant.",
    target_files: [
      "web/src/index.js",
      "web/src/lib/payment-failure-insights.js",
    ],
    proposed_endpoints: [
      "GET /api/payment-failure-insights?merchant_id=",
    ],
    data_contracts: [
      {
        contract: "payment_failure_insight_response",
        fields: ["merchant_id", "payment_failure_rate", "sample_size", "suggested_optimization"],
      },
    ],
    verification_steps: [
      "API endpoint returns data",
      "Output is merchant-specific and stable across repeated reads",
    ],
    risk_notes: [
      "Do not expand into payment orchestration or retry automation.",
    ],
  };
}

function packetForSmsRecommendation(slice) {
  return {
    ...basePacket(slice),
    implementation_summary: "Render an SMS-first recovery recommendation card from existing recovery success signals.",
    target_files: [
      "web/src/index.js",
      "web/src/lib/recovery-recommendations.js",
      "web/frontend/src/components/SmsRecoveryRecommendationCard.jsx",
    ],
    proposed_endpoints: [
      "GET /api/recovery-recommendations?merchant_id=",
    ],
    data_contracts: [
      {
        contract: "sms_recovery_recommendation",
        fields: ["merchant_id", "recommendation_title", "recovery_rate", "confidence"],
      },
    ],
    verification_steps: [
      "Recommendation card visible to merchant",
      "Card rationale matches backend recommendation response",
    ],
    risk_notes: [
      "Keep this as a recommendation, not an automated SMS workflow.",
    ],
  };
}

function packetForExperimentRecommendation(slice) {
  return {
    ...basePacket(slice),
    implementation_summary: "Produce a narrow recommendation output for a non-discount recovery experiment when discount dependency appears elevated.",
    target_files: [
      "web/src/index.js",
      "web/src/lib/recovery-experiment-recommendations.js",
    ],
    proposed_endpoints: [
      "GET /api/recovery-experiment-recommendations?merchant_id=",
    ],
    data_contracts: [
      {
        contract: "recovery_experiment_recommendation",
        fields: ["merchant_id", "experiment_name", "discount_dependency_rate", "suggested_test"],
      },
    ],
    verification_steps: [
      "Diagnostic output generated",
      "Recommendation is merchant-specific and understandable",
    ],
    risk_notes: [
      "Do not add multi-variant experiment management in this slice.",
    ],
  };
}

function packetForSlice(slice) {
  if (slice.id.includes("mobile_abandonment_diagnostic_api")) return packetForMobileAbandonmentDiagnostic(slice);
  if (slice.id.includes("mobile_checkout_friction_insight_card")) return packetForMobileInsightCard(slice);
  if (slice.id.includes("shipping_friction_diagnostic_endpoint")) return packetForShippingDiagnostic(slice);
  if (slice.id.includes("shipping_threshold_insight_card")) return packetForShippingInsightCard(slice);
  if (slice.id.includes("payment_failure_insight_api")) return packetForPaymentInsight(slice);
  if (slice.id.includes("sms_recovery_recommendation_card")) return packetForSmsRecommendation(slice);
  if (slice.id.includes("recovery_strategy_experiment_recommendation")) return packetForExperimentRecommendation(slice);
  return basePacket(slice);
}

export async function listExecutionPackets() {
  const packets = await readRegistry();
  return packets.map(normalizeExecutionPacket).sort((a, b) => {
    const timeA = Date.parse(a.created_at || "") || 0;
    const timeB = Date.parse(b.created_at || "") || 0;
    return timeB - timeA;
  });
}

export async function getExecutionPacketById(id) {
  const packets = await readRegistry();
  const packet = packets.find((entry) => entry.id === id);
  return packet ? normalizeExecutionPacket(packet) : null;
}

export async function persistExecutionPackets(packets) {
  const normalized = packets.map(normalizeExecutionPacket);
  await writeRegistry(normalized);
  return normalized;
}

export async function getNextExecutionPacket() {
  const packets = await listExecutionPackets();
  return packets[0] || null;
}

export async function getNextGeneratedExecutionPacket() {
  const packets = await listExecutionPackets();
  return packets.find((packet) => packet.status === "generated") || null;
}

export async function runExecutionPacketGenerator() {
  const queueItem = await getNextBuildQueueItem();
  if (!queueItem) {
    return {
      packet: null,
      recommended_next_action: "Run the build queue before generating an execution packet.",
      reasoning_summary: "No selected slice is available in the build queue.",
    };
  }

  const slice = await getSliceById(queueItem.slice_id);
  if (!slice) {
    throw new Error(`selected_slice_not_found:${queueItem.slice_id}`);
  }

  const candidateOpportunity = slice?.candidate_opportunity_id
    ? await getCandidateOpportunityById(slice.candidate_opportunity_id)
    : null;
  const revenueOpportunity = {
    id: candidateOpportunity?.id || slice.id,
    estimatedRevenueImpact:
      candidateOpportunity?.estimatedRevenueImpact
      ?? candidateOpportunity?.estimatedClientValue
      ?? candidateOpportunity?.estimatedRevenueUpside
      ?? candidateOpportunity?.revenuePotential
      ?? slice?.estimatedRevenueImpact
      ?? 0,
    paymentModel: candidateOpportunity?.paymentModel ?? slice?.paymentModel ?? null,
    agreed: candidateOpportunity?.agreed ?? candidateOpportunity?.paymentAgreed ?? slice?.agreed ?? false,
  };
  const revenueCheck = validateRevenueGate(revenueOpportunity);
  if (!revenueCheck.approved) {
    return {
      packet: null,
      revenue_gate: revenueCheck,
      recommended_next_action: "Define a payment model and confirmed agreement before generating an execution packet.",
      reasoning_summary: `Execution packet generation is blocked by the revenue gate: ${revenueCheck.reason}.`,
    };
  }

  const packet = normalizeExecutionPacket({
    ...packetForSlice(slice),
    paymentModel: revenueCheck.paymentModel,
    estimatedRevenueImpact: revenueCheck.estimatedRevenueImpact,
  });
  const packets = await readRegistry();
  const filtered = packets.filter((entry) => entry.id !== packet.id);
  filtered.push(packet);
  await writeRegistry(filtered);

  return {
    packet,
    recommended_next_action: `Use ${packet.id} as the deterministic implementation contract for the selected slice.`,
    reasoning_summary: `Generated one execution packet from the selected slice "${slice.title}".`,
  };
}
