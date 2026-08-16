import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";

const root = path.resolve(process.cwd());
const outputRoot = path.join(root, "staffordos/job-search");
const frontendRoot = path.join(root, "staffordos/ui/operator-frontend");
const requireFromFrontend = createRequire(path.join(frontendRoot, "package.json"));
const ts = requireFromFrontend("typescript");
const original = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, filename) => mod._compile(ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const mapping = requireFromFrontend(path.join(frontendRoot, "lib/staffordos/requirementMapping.ts"));
Module._extensions[".ts"] = original;

function writeJson(name, value) { writeFileSync(path.join(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`); }
function writeMd(name, value) { writeFileSync(path.join(outputRoot, name), `${value.trimEnd()}\n`); }

export function run() {
  const queue = mapping.loadRequirementMappingQueue({ repositoryRoot: root, decisionRoot: mapping.privateRequirementMappingRoot(), limit: 10000 });
  const selected = queue.slice(0, 24);
  const specialist = queue.filter((item) => item.specialist).length;
  const byState = Object.fromEntries(mapping.REQUIREMENT_MAPPING_STATES.map((state) => [state, queue.filter((item) => item.decision?.state === state).length]));
  const inventory = {
    schemaVersion: "staffordos.careeros.v1_26j.unmapped_requirement_inventory.v1",
    lockedEvaluationUniverse: 80,
    unmappedRequirementCount: queue.length,
    highInformationCount: selected.length,
    specialistCount: specialist,
    currentMappingStates: { UNKNOWN: queue.filter((item) => item.currentMappingState === "UNKNOWN").length, MISSING: queue.filter((item) => item.currentMappingState === "MISSING").length },
    decisionStateDistribution: byState,
    privacy: "Requirement IDs, source IDs, CareerFact IDs, CareerEvidence IDs, private paths, and raw private authority are omitted.",
  };
  const plan = {
    schemaVersion: "staffordos.careeros.v1_26j.review_plan.v1",
    proposedDecisionCount: selected.length,
    queueCap: 24,
    compression: "One decision per exact requirement; no semantic-family propagation is performed.",
    priorityRules: ["recurrence", "Datadog control relevance", "capability-bearing responsibility family", "specialist firewall remains explicit"],
    states: mapping.REQUIREMENT_MAPPING_STATES,
    operatorReviewRequired: true,
    postReviewReplayAuthorized: false,
    selectedByFamily: Object.fromEntries([...new Set(selected.map((item) => item.capabilityFamily))].sort().map((family) => [family, selected.filter((item) => item.capabilityFamily === family).length])),
  };
  writeJson("CAREEROS_V1_26J_UNMAPPED_REQUIREMENT_INVENTORY.json", inventory);
  writeMd("CAREEROS_V1_26J_INFORMATION_VALUE_PRIORITY.md", `# V1.26J Information-Value Priority\n\nThe locked 80-role universe contains ${queue.length} capability-bearing requirements without a governed positive relationship. The initial operator queue is capped at ${selected.length}. Priority uses recurrence, Datadog control relevance, and capability-bearing responsibility families. Benefits, compensation, location, boilerplate, generic soft skills, and existing positive mappings are excluded. Human labels are not shown in the operator UI.\n`);
  writeMd("CAREEROS_V1_26J_REQUIREMENT_MAPPING_CONTRACT.md", `# V1.26J Requirement Mapping Contract\n\nRequirement mapping is append-only owner-private authority. Each decision references one exact existing requirement and existing CareerFact/CareerEvidence references, records one bounded relationship state, preserves supported and unresolved portions, and supersedes prior decisions without changing source truth. DIRECT, TRANSFERABLE, and PARTIAL require explicit operator authority. Specialist-positive decisions require explicit specialist compatibility.\n`);
  writeJson("CAREEROS_V1_26J_REVIEW_PLAN.json", plan);
  writeJson("CAREEROS_V1_26J_SPECIALIST_BOUNDARY_AUDIT.json", { specialistRequirements: specialist, positiveSpecialistRequiresExplicitCompatibility: true, genericAuthorityToSpecialistPropagation: false, protectedFamilies: ["accounting", "tax", "finance", "payroll", "legal", "AV_MEDIA", "software_engineering", "data_science", "specialist_AI_ML"] });
  writeMd("CAREEROS_V1_26J_DATADOG_MAPPING_TRACE.md", `# V1.26J Datadog Mapping Trace\n\nThe Datadog TPM control currently exposes five direct and eight transferable responsibility comparisons diagnostically, with two unresolved comparisons. Those diagnostic states are not requirement-level authority. The initial queue prioritizes Datadog-related capability-bearing requirements where present. No score, rank, label, or desired outcome is shown while Ross answers.\n`);
  writeMd("CAREEROS_V1_26J_POSITIVE_NEGATIVE_CONTROL_PLAN.md", `# V1.26J Positive/Negative Control Plan\n\nThe queue preserves ambitious program, product, transformation, MarTech, and AI-adjacent controls while including specialist boundaries. Negative controls may receive NO_SUPPORTED_EQUIVALENT for one exact requirement without creating a global CareerFact. No role-specific penalty or boost is permitted.\n`);
  writeJson("CAREEROS_V1_26J_MAPPING_PROJECTION.json", { schemaVersion: "staffordos.careeros.v1_26j.mapping_projection.v1", operatorReviewComplete: false, projectionAuthorized: false, direct: 0, transferable: 0, partial: 0, noSupportedEquivalent: 0, needsMoreEvidence: 0, keepUnresolved: 0, note: "No operator answers are fabricated before review." });
  writeJson("CAREEROS_V1_26J_RUNTIME_ACCEPTANCE.json", { route: "/os/professional/evidence?view=requirement-mapping", neutralDefault: true, exactRequirementIdentity: true, appendOnlySupersession: true, privatePersistence: true, postReviewReplay: "AWAITING_OPERATOR_REVIEW" });
  writeMd("CAREEROS_V1_26J_DECISION.md", `# V1.26J Decision\n\n**REQUIREMENT_MAPPING_RUNTIME_READY_FOR_OPERATOR_REVIEW**\n\nThe bounded requirement-level mapping runtime and private append-only authority are ready. Ross must answer the ${selected.length} neutral mapping questions before any V1.26I projection or frozen model replay.\n`);
  return { inventory, plan };
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(run(), null, 2));
