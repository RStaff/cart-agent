export const BLUEPRINT_ONBOARDING_PERMISSION = "staffordos.revenue_operations.write";

const COMMANDS = new Set([
  "DECIDE_IDENTITY",
  "DEFINE_WORKFLOW",
  "SET_REQUIRED_INPUTS",
  "RECORD_INTERVIEW",
  "TRANSITION",
  "APPROVE_MATERIAL_WORKFLOW_CHANGE",
]);

function text(value) {
  return String(value ?? "").trim();
}

function authority({ baseUrl, serviceKey, operatorSubject, permission }) {
  const base = text(baseUrl).replace(/\/$/, "");
  const key = text(serviceKey);
  const subject = text(operatorSubject);
  if (!base || !key) throw Object.assign(new Error("BLUEPRINT_ONBOARDING_SOURCE_UNCONFIGURED"), { code: "BLUEPRINT_ONBOARDING_SOURCE_UNCONFIGURED" });
  if (!subject) throw Object.assign(new Error("OPERATOR_IDENTITY_MISSING"), { code: "OPERATOR_IDENTITY_MISSING" });
  if (permission !== BLUEPRINT_ONBOARDING_PERMISSION) throw Object.assign(new Error("OPERATOR_PERMISSION_MISSING"), { code: "OPERATOR_PERMISSION_MISSING" });
  return {
    base,
    headers: {
      "x-internal-api-key": key,
      "x-staffordos-operator-subject": subject,
      "x-staffordos-operator-permission": BLUEPRINT_ONBOARDING_PERMISSION,
      Accept: "application/json",
    },
  };
}

function engagementId(value) {
  const id = text(value);
  if (!id || id.length > 191 || /[\u0000-\u001f\u007f/]/.test(id)) {
    throw Object.assign(new Error("BLUEPRINT_ENGAGEMENT_ID_INVALID"), { code: "BLUEPRINT_ENGAGEMENT_ID_INVALID" });
  }
  return id;
}

export function createBlueprintReadRequest(input) {
  const { base, headers } = authority(input);
  const id = input.engagementId === undefined ? null : engagementId(input.engagementId);
  return {
    url: id
      ? `${base}/api/staffordos/blueprint-engagements/${encodeURIComponent(id)}/onboarding`
      : `${base}/api/staffordos/blueprint-engagements`,
    headers,
  };
}

export function createBlueprintCommandRequest(input) {
  const { base, headers } = authority(input);
  const id = engagementId(input.engagementId);
  if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0) {
    throw Object.assign(new Error("BLUEPRINT_ONBOARDING_VERSION_INVALID"), { code: "BLUEPRINT_ONBOARDING_VERSION_INVALID" });
  }
  const command = text(input.command);
  if (!COMMANDS.has(command) || !input.data || typeof input.data !== "object" || Array.isArray(input.data)) {
    throw Object.assign(new Error("BLUEPRINT_ONBOARDING_COMMAND_INVALID"), { code: "BLUEPRINT_ONBOARDING_COMMAND_INVALID" });
  }
  const data = { ...input.data };
  delete data.actor;
  delete data.actorSubject;
  delete data.operatorSubject;
  delete data.permission;
  return {
    url: `${base}/api/staffordos/blueprint-engagements/${encodeURIComponent(id)}/onboarding/commands`,
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ expectedVersion: input.expectedVersion, command, data }),
  };
}

export function blueprintOperatorErrorStatus(code) {
  if (code === "BLUEPRINT_ENGAGEMENT_ID_INVALID" || code === "BLUEPRINT_ONBOARDING_VERSION_INVALID" || code === "BLUEPRINT_ONBOARDING_COMMAND_INVALID") return 400;
  if (code === "OPERATOR_IDENTITY_MISSING" || code === "OPERATOR_PERMISSION_MISSING") return 403;
  return 503;
}
