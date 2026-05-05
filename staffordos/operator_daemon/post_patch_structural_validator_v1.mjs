import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const taskType = process.argv[2] || "";
const expectedArtifact = process.argv[3] || "";

const files = {
  resolver: "staffordos/operator_daemon/task_command_resolver_v1.mjs",
  runner: "staffordos/operator_daemon/run_task_with_commit_gate_v1.sh",
  commitGate: "staffordos/operator_daemon/commit_gate_v1.sh"
};

function read(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function safeJson(path) {
  try {
    return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
  } catch {
    return null;
  }
}

const resolver = read(files.resolver);
const runner = read(files.runner);
const commitGate = read(files.commitGate);
const artifact = expectedArtifact ? safeJson(expectedArtifact) : null;

const forbiddenBlockMatches = [
  ...commitGate.matchAll(/FORBIDDEN ACTION CHECK/g)
].length;

const canonicalAllowlistMatches = [
  ...commitGate.matchAll(/ALLOWLISTED_REAL_SEND_RUNNER_CHECK|NARROW REAL SEND ALLOWLIST|real-send allowlist/gi)
].length;

const hiddenCharacterTargets = [
  files.resolver,
  files.runner,
  files.commitGate,
  "staffordos/guards/character_integrity_guard_v1.mjs"
];

const hiddenCharacterHits = hiddenCharacterTargets
  .filter(Boolean)
  .filter((p) => existsSync(p))
  .filter((p) => /[\u00a0\u200b\u200c\u200d\ufeff]/.test(read(p)));

const checks = {
  hidden_character_check: hiddenCharacterHits.length === 0,
  task_type_present: Boolean(taskType),
  expected_artifact_present: Boolean(expectedArtifact),
  resolver_file_exists: existsSync(files.resolver),
  runner_file_exists: existsSync(files.runner),
  commit_gate_file_exists: existsSync(files.commitGate),

  resolver_maps_task: taskType ? resolver.includes(taskType) : false,
  resolver_has_commands_map: resolver.includes("const COMMANDS") || resolver.includes("taskCommandMap") || resolver.includes("resolved"),
  resolver_outputs_command: resolver.includes("command"),

  runner_calls_resolver_preflight: runner.includes("resolver_preflight_guard_v1.mjs"),
  runner_calls_task_resolver: runner.includes("task_command_resolver_v1.mjs"),
  runner_calls_agent_loop:
    runner.includes("run_agent_loop.mjs") ||
    runner.includes("RUN OPERATOR") ||
    runner.includes("STAFFORDOS PERSISTENT OPERATOR"),

  commit_gate_has_forbidden_action_check:
    commitGate.includes("FORBIDDEN ACTION CHECK") ||
    commitGate.includes("FORBIDDEN ACTION") ||
    commitGate.includes("forbidden action") ||
    commitGate.includes("COMMIT BLOCKED"),
  commit_gate_forbidden_check_count: forbiddenBlockMatches,
  commit_gate_has_no_excess_duplicate_forbidden_blocks: forbiddenBlockMatches <= 2,

  commit_gate_has_real_send_allowlist_logic: canonicalAllowlistMatches >= 1,

  expected_artifact_exists: expectedArtifact ? existsSync(expectedArtifact) : false,
  expected_artifact_valid_json: Boolean(artifact),
  expected_artifact_schema_present: Boolean(artifact?.schema),
  expected_artifact_task_or_status_present: Boolean(artifact?.status || artifact?.task_type || artifact?.execution)
};

const failures = [];

for (const [key, value] of Object.entries(checks)) {
  if (key === "commit_gate_forbidden_check_count") continue;
  if (value !== true) failures.push(key);
}

if (hiddenCharacterHits.length) {
  failures.push(`hidden_characters_detected:${hiddenCharacterHits.join(",")}`);
}

const result = {
  schema: "staffordos.post_patch_structural_validator.v1",
  generated_at: new Date().toISOString(),
  task_type: taskType,
  expected_artifact: expectedArtifact,
  status: failures.length ? "failed" : "passed",
  checks,
  failures,
  recommendation: failures.length
    ? "Do not trust or extend this task until structural failures are repaired."
    : "Task structure is valid enough for gated commit consideration.",
  proof: {
    structural_validation_only: true,
    command_executed: false,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(
  `${outDir}/post_patch_structural_validator_v1.json`,
  JSON.stringify(result, null, 2)
);

console.log(JSON.stringify(result, null, 2));

if (failures.length) process.exit(1);
