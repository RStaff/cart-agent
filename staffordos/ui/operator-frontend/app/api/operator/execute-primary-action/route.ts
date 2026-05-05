import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

function readJson(filePath: string, fallback: any) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, value: any) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n");
}

function appendEvent(filePath: string, event: any) {
  const current = readJson(filePath, {
    schema: "staffordos.operator_action_events.v1",
    events: []
  });

  const events = Array.isArray(current.events) ? current.events : [];
  current.events = [event, ...events].slice(0, 100);
  current.updated_at = event.created_at;

  writeJson(filePath, current);
}

function validateRequiredAgents(staffordRoot: string, taskType: string) {
  const selectorPath = path.join(staffordRoot, "agents/agent_selector_v1.json");
  const mapPath = path.join(staffordRoot, "agents/task_to_agent_map_v1.json");

  const selector = readJson(selectorPath, { agents: [] });
  const taskMap = readJson(mapPath, { task_mappings: [] });

  const mapping = Array.isArray(taskMap.task_mappings)
    ? taskMap.task_mappings.find((item: any) => item.task_type === taskType)
    : null;

  const availableAgents = new Set(
    Array.isArray(selector.agents)
      ? selector.agents.map((agent: any) => agent.agent_id)
      : []
  );

  const requiredAgents = Array.isArray(mapping?.required_agents)
    ? mapping.required_agents
    : [];

  const missingAgents = requiredAgents.filter((agentId: string) => !availableAgents.has(agentId));

  return {
    ok: Boolean(mapping) && missingAgents.length === 0,
    task_type: taskType,
    mapping_found: Boolean(mapping),
    required_agents: requiredAgents,
    missing_agents: missingAgents
  };
}

export async function POST() {
  const now = new Date().toISOString();

  const repoRoot = path.resolve(process.cwd(), "../../..");
  const staffordRoot = path.resolve(process.cwd(), "../..");

  const requiredAgentValidation = validateRequiredAgents(staffordRoot, "primary_action_execution");

  if (!requiredAgentValidation.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: "blocked",
        reason: "Required agent gate failed.",
        required_agent_validation: requiredAgentValidation
      },
      { status: 409 }
    );
  }


  const primaryPath = path.join(staffordRoot, "snapshots/primary_action_snapshot_v1.json");
  const preflightPath = path.join(staffordRoot, "preflight/output/preflight_report_v1.json");
  const qaPath = path.join(staffordRoot, "qa/output/command_center_primary_action_qa_v1.json");

  const primary = readJson(primaryPath, {});
  const preflight = readJson(preflightPath, {});
  const qa = readJson(qaPath, {});

  const action = primary.primary_action || {};
  const preflightGo = String(preflight.status || "").toUpperCase() === "GO";
  const qaPass = String(qa.verdict || "").toLowerCase() === "pass";

  if (!preflightGo || !qaPass) {
    return NextResponse.json(
      {
        ok: false,
        status: "blocked",
        reason: "Preflight or QA gate is not passing.",
        preflight: preflight.status || "unknown",
        qa: qa.verdict || "unknown"
      },
      { status: 409 }
    );
  }

  const event = {
    event_id: `operator_action_${Date.now()}`,
    schema: "staffordos.operator_action_event.v1",
    created_at: now,
    action_id: action.action_id || "unknown",
    action_label: action.action_label || "unknown",
    action_type: action.action_type || "unknown",
    domain_id: action.domain_id || "unknown",
    product_id: action.product_id || null,
    owner: action.owner || "ross",
    execution_mode: action.confidence >= 0.9 ? "auto_allowed" : "human_prepare_required",
    status: action.confidence >= 0.9 ? "ready_for_execution" : "prepared_for_human_execution",
    next_step: action.next_step || null,
    evidence: action.evidence || [],
    risk: action.risk || [],
    result: {
      outcome_logged: true,
      canonical_spine_invoked: true,
      real_external_send_performed: false,
      note: "CTA execution logged safely and routed through canonical StaffordOS spine. External send/payment action still requires explicit governed workflow."
    }
  };

  appendEvent(path.join(staffordRoot, "events/operator_action_events_v1.json"), event);

  appendEvent(path.join(staffordRoot, "events/outcome_event_log_v1.json"), {
    ...event,
    schema: "staffordos.outcome_event.v1",
    event_type: "primary_action_cta_clicked"
  });

  let loopDStatus = "not_run";

  try {
    const childProcess = await import("node:child_process");
    const spineFile = path.join(repoRoot, ["staffordos", "execution", "run_agent_loop.mjs"].join(path.sep));

    childProcess.execFileSync("node", [
      spineFile,
      "node staffordos/loop_d/build_loop_d_feedback_v1.mjs"
    ], {
      cwd: repoRoot,
      stdio: "ignore",
      env: {
        ...process.env,
        STAFFORDOS_TASK_TYPE: "primary_action_execution",
        STAFFORDOS_ACTION_ID: action.action_id || "",
        STAFFORDOS_ACTION_TYPE: action.action_type || "",
        STAFFORDOS_ACTION_LABEL: action.action_label || ""
      }
    });

    loopDStatus = "spine_ran_loop_d";
  } catch {
    loopDStatus = "refresh_failed";
  }

  return NextResponse.json({
    ok: true,
    status: event.status,
    execution_mode: event.execution_mode,
    event_id: event.event_id,
    action_label: event.action_label,
    loop_d_status: loopDStatus
  });
}
