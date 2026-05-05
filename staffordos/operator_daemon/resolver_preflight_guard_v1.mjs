import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const taskType = process.argv[2];

const result = {
  schema: "staffordos.resolver_preflight_guard.v1",
  generated_at: new Date().toISOString(),
  task_type: taskType || null,
  status: "failed",
  checks: {
    task_type_present: Boolean(taskType),
    resolver_syntax_valid: false,
    resolver_returns_command: false,
    command_present: false,
    command_target_exists: false,
    command_target_syntax_valid: false
  },
  command: null,
  failures: [],
  proof: {
    resolver_preflight_only: true,
    command_executed: false,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

function fail(msg) {
  result.failures.push(msg);
}

try {
  execSync("node --check staffordos/operator_daemon/task_command_resolver_v1.mjs", { stdio: "pipe" });
  result.checks.resolver_syntax_valid = true;
} catch (err) {
  fail("resolver_syntax_invalid");
}

if (!taskType) {
  fail("missing_task_type");
}

if (result.checks.resolver_syntax_valid && taskType) {
  try {
    const command = execSync(
      `node staffordos/operator_daemon/task_command_resolver_v1.mjs ${JSON.stringify(taskType)}`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    ).trim();

    result.command = command;
    result.checks.resolver_returns_command = Boolean(command);
    result.checks.command_present = Boolean(command);

    if (!command) {
      fail("resolver_returned_empty_command");
    }

    if (command.startsWith("node ")) {
      const target = command.split(/\s+/)[1];
      if (existsSync(target)) {
        result.checks.command_target_exists = true;

        try {
          execSync(`node --check ${target}`, { stdio: "pipe" });
          result.checks.command_target_syntax_valid = true;
        } catch {
          fail(`command_target_syntax_invalid:${target}`);
        }
      } else {
        fail(`command_target_missing:${target}`);
      }
    } else if (command.startsWith("bash ")) {
      const target = command.split(/\s+/)[1];
      if (existsSync(target)) {
        result.checks.command_target_exists = true;
        result.checks.command_target_syntax_valid = true;
      } else {
        fail(`command_target_missing:${target}`);
      }
    } else {
      result.checks.command_target_exists = true;
      result.checks.command_target_syntax_valid = true;
    }
  } catch (err) {
    fail(`resolver_failed_for_task:${taskType}`);
  }
}

if (
  result.checks.task_type_present &&
  result.checks.resolver_syntax_valid &&
  result.checks.resolver_returns_command &&
  result.checks.command_present &&
  result.checks.command_target_exists &&
  result.checks.command_target_syntax_valid
) {
  result.status = "passed";
}

writeFileSync(
  `${outDir}/resolver_preflight_guard_v1.json`,
  JSON.stringify(result, null, 2)
);

console.log(JSON.stringify(result, null, 2));

if (result.status !== "passed") {
  process.exit(1);
}
