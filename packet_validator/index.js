import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getExecutionPacketById, getNextExecutionPacket } from "../execution_packets/index.js";
import { getSliceById } from "../slices/index.js";
import { getLatestSystemSnapshot } from "../system_state/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "registry.json");
const PACKET_VALIDATION_SCHEMA_VERSION = "v1";

async function readRegistry() {
  const raw = await readFile(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeRegistry(validations) {
  await writeFile(REGISTRY_PATH, JSON.stringify(validations, null, 2) + "\n", "utf8");
}

function validationStatus(validation) {
  if (validation?.status) return validation.status;
  if (validation?.valid === true) return "passed";
  if (validation?.valid === false) return "failed";
  return "generated";
}

function normalizePacketValidation(validation) {
  return {
    ...validation,
    schema_version: validation?.schema_version || PACKET_VALIDATION_SCHEMA_VERSION,
    status: validationStatus(validation),
    created_at: validation?.created_at || new Date().toISOString(),
  };
}

function validationId(packetId) {
  return `packet_validation__${packetId}`;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function hasPositiveNumber(value) {
  return Number(value) > 0;
}

function likelyOversized(packet) {
  const targetFiles = Array.isArray(packet?.target_files) ? packet.target_files.length : 0;
  const endpoints = Array.isArray(packet?.proposed_endpoints) ? packet.proposed_endpoints.length : 0;
  const contracts = Array.isArray(packet?.data_contracts) ? packet.data_contracts.length : 0;
  const implementationSummary = String(packet?.implementation_summary || "").toLowerCase();

  if (targetFiles > 5 || endpoints > 3 || contracts > 3) return true;
  return [
    "framework",
    "platform",
    "suite",
    "orchestration",
    "generalized",
    "full system",
  ].some((term) => implementationSummary.includes(term));
}

function scoreValidation(checks) {
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

function buildReasoningSummary(packet, issues, warnings, validationScore) {
  const label = packet?.title || packet?.id || "unknown packet";
  if (issues.length === 0 && warnings.length === 0) {
    return `Packet "${label}" passed all v1 validation checks with a score of ${validationScore}.`;
  }
  if (issues.length === 0) {
    return `Packet "${label}" passed required checks with warnings and scored ${validationScore}.`;
  }
  return `Packet "${label}" failed validation with ${issues.length} hard issues and scored ${validationScore}.`;
}

export function validateExecutionPacket(packet, systemState = null, slice = null) {
  const issues = [];
  const warnings = [];
  const requiredFixes = [];

  const checks = {
    title: hasText(packet?.title),
    objective: hasText(packet?.objective),
    implementationSummary: hasText(packet?.implementation_summary),
    acceptanceCriteria: hasNonEmptyArray(packet?.acceptance_criteria),
    verificationSteps: hasNonEmptyArray(packet?.verification_steps),
    dependenciesExists: Array.isArray(packet?.dependencies),
    riskNotesExists: Array.isArray(packet?.risk_notes),
    executionModePresent: hasText(packet?.execution_mode),
    sliceExists: Boolean(slice),
    scopeReasonable: !likelyOversized(packet),
    paymentModelPresent: hasText(packet?.paymentModel),
    estimatedRevenueImpactPresent: hasPositiveNumber(packet?.estimatedRevenueImpact),
  };

  if (!checks.title) {
    issues.push("title_missing");
    requiredFixes.push("Add a non-empty title.");
  }
  if (!checks.objective) {
    issues.push("objective_missing");
    requiredFixes.push("Add a non-empty objective.");
  }
  if (!checks.implementationSummary) {
    issues.push("implementation_summary_missing");
    requiredFixes.push("Add a non-empty implementation_summary.");
  }
  if (!checks.acceptanceCriteria) {
    issues.push("acceptance_criteria_missing");
    requiredFixes.push("Add at least one acceptance criterion.");
  }
  if (!checks.verificationSteps) {
    issues.push("verification_steps_missing");
    requiredFixes.push("Add at least one verification step.");
  }
  if (!checks.dependenciesExists) {
    issues.push("dependencies_missing");
    requiredFixes.push("Add the dependencies field, even if it is an empty array.");
  }
  if (!checks.riskNotesExists) {
    issues.push("risk_notes_missing");
    requiredFixes.push("Add the risk_notes field, even if it is an empty array.");
  }
  if (!checks.executionModePresent) {
    issues.push("execution_mode_missing");
    requiredFixes.push("Add an execution_mode value.");
  }
  if (!checks.sliceExists) {
    issues.push("slice_reference_invalid");
    requiredFixes.push("Ensure slice_id refers to a real slice.");
  }
  if (!checks.scopeReasonable) {
    issues.push("scope_too_large");
    requiredFixes.push("Reduce packet scope to a smaller, more deterministic implementation step.");
  }
  if (!checks.paymentModelPresent) {
    issues.push("payment_model_missing");
    requiredFixes.push("Add a valid paymentModel before allowing execution.");
  }
  if (!checks.estimatedRevenueImpactPresent) {
    issues.push("estimated_revenue_impact_missing");
    requiredFixes.push("Add a positive estimatedRevenueImpact before allowing execution.");
  }

  if (packet?.status === "completed") {
    warnings.push("packet_already_completed");
  }
  if (Array.isArray(packet?.target_files) && packet.target_files.length === 0) {
    warnings.push("target_files_empty");
  }
  if (Array.isArray(packet?.proposed_endpoints) && packet.proposed_endpoints.length === 0) {
    warnings.push("proposed_endpoints_empty");
  }
  if (systemState?.system_health === "blocked") {
    issues.push("system_state_blocked");
    requiredFixes.push("Resolve the blocked system state before moving this packet toward execution.");
  } else if (systemState?.system_health === "partial") {
    warnings.push("system_state_partial");
  }

  const validationScore = scoreValidation(Object.values(checks));
  const valid = issues.length === 0;

  return {
    id: validationId(packet?.id || "unknown"),
    execution_packet_id: packet?.id || null,
    valid,
    validation_score: validationScore,
    issues,
    warnings,
    required_fixes: requiredFixes,
    reasoning_summary: buildReasoningSummary(packet, issues, warnings, validationScore),
    schema_version: PACKET_VALIDATION_SCHEMA_VERSION,
    status: valid ? "passed" : "failed",
    created_at: new Date().toISOString(),
  };
}

export async function listPacketValidations() {
  const validations = await readRegistry();
  return validations.map(normalizePacketValidation).sort((a, b) => {
    const timeA = Date.parse(a.created_at || "") || 0;
    const timeB = Date.parse(b.created_at || "") || 0;
    return timeB - timeA;
  });
}

export async function getLatestPacketValidation() {
  const validations = await listPacketValidations();
  return validations[0] || null;
}

export async function getPacketValidationByPacketId(executionPacketId) {
  const validations = await listPacketValidations();
  return validations.find((validation) => validation.execution_packet_id === executionPacketId) || null;
}

export async function runPacketValidator(executionPacketId = null) {
  const packet = executionPacketId
    ? await getExecutionPacketById(executionPacketId)
    : await getNextExecutionPacket();

  if (!packet) {
    return {
      packet_validation: null,
      recommended_next_action: "Generate or select an execution packet before running the packet validator.",
      reasoning_summary: "No execution packet was available for validation.",
    };
  }

  const [slice, systemState] = await Promise.all([
    getSliceById(packet.slice_id),
    getLatestSystemSnapshot(),
  ]);

  const validation = normalizePacketValidation(validateExecutionPacket(packet, systemState, slice));
  const validations = await readRegistry();
  const filtered = validations.filter((entry) => entry.execution_packet_id !== validation.execution_packet_id);
  filtered.push(validation);
  await writeRegistry(filtered);

  return {
    packet_validation: validation,
    recommended_next_action: validation.valid
      ? "Use this validation result as supporting evidence before execution gating."
      : "Fix the required packet issues before moving the packet toward execution.",
    reasoning_summary: validation.reasoning_summary,
  };
}
