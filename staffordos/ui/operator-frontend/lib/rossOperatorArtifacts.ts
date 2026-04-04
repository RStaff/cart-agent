import fs from "fs";
import path from "path";

export const STAFFORDOS_ROSS_OPERATOR_ARTIFACT_ROOT_ENV =
  "STAFFORDOS_ROSS_OPERATOR_ARTIFACT_ROOT";

const DEFAULT_ROSS_OPERATOR_ARTIFACT_ROOT =
  "/Users/rossstafford/projects/ross-operator/ross_operator/output";

type ActiveDecisionArtifact = {
  decision_id?: string;
  title?: string;
  recommended_option_label?: string;
  approval_state?: string;
};

type ActiveTruthArtifact = {
  active_decision_id?: string;
  title?: string;
  current_truth_summary?: string;
  timestamp?: string;
};

type ArtifactStatusValue = "loaded" | "missing" | "empty" | "malformed";
type ArtifactReadinessValue = "ready" | "stale" | "missing" | "invalid";

type RossOperatorArtifactStatus = {
  activeDecision: ArtifactStatusValue;
  currentTruth: ArtifactStatusValue;
  commandCenterPack: ArtifactStatusValue;
  executionSessionPack: ArtifactStatusValue;
};

type RossOperatorArtifactReadiness = {
  activeDecision: ArtifactReadinessValue;
  currentTruth: ArtifactReadinessValue;
  commandCenterPack: ArtifactReadinessValue;
  executionSessionPack: ArtifactReadinessValue;
};

type RossOperatorArtifactUpdatedAt = {
  activeDecision: string;
  currentTruth: string;
  commandCenterPack: string;
  executionSessionPack: string;
};

type RossOperatorCommandCenterData = {
  timestamp: string;
  artifactRoot: string;
  activeDecision: ActiveDecisionArtifact;
  currentTruth: ActiveTruthArtifact;
  commandCenterPack: string;
  executionSessionPack: string;
  exactNextCommand: string;
  status: RossOperatorArtifactStatus;
  readiness: RossOperatorArtifactReadiness;
  updatedAt: RossOperatorArtifactUpdatedAt;
};

const ARTIFACT_STALE_AFTER_MS = 6 * 60 * 60 * 1000;

function normalizeString(value: unknown) {
  return String(value ?? "").trim();
}

function readUtf8(filePath: string, label: string) {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`${label} not found: ${resolvedPath}`);
  }

  return fs.readFileSync(resolvedPath, "utf8").trim();
}

function readJsonObject<T>(filePath: string, label: string) {
  const raw = readUtf8(filePath, label);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Malformed JSON in ${filePath}: ${(error as Error).message}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Expected JSON object in ${filePath}`);
  }

  return parsed as T;
}

function readOptionalTextArtifact(filePath: string) {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    return {
      status: "missing" as const,
      value: "",
      updatedAt: "",
    };
  }

  const raw = fs.readFileSync(resolvedPath, "utf8");
  const trimmed = raw.trim();
  const updatedAt = fs.statSync(resolvedPath).mtime.toISOString();

  if (!trimmed) {
    return {
      status: "empty" as const,
      value: "",
      updatedAt,
    };
  }

  return {
    status: "loaded" as const,
    value: trimmed,
    updatedAt,
  };
}

function readOptionalJsonArtifact<T extends Record<string, unknown>>(filePath: string) {
  const textArtifact = readOptionalTextArtifact(filePath);
  if (textArtifact.status !== "loaded") {
    return {
      status: textArtifact.status,
      value: {} as T,
      updatedAt: textArtifact.updatedAt,
    };
  }

  try {
    const parsed = JSON.parse(textArtifact.value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        status: "malformed" as const,
        value: {} as T,
        updatedAt: textArtifact.updatedAt,
      };
    }

    return {
      status: "loaded" as const,
      value: parsed as T,
      updatedAt: normalizeString((parsed as { timestamp?: string }).timestamp) || textArtifact.updatedAt,
    };
  } catch {
    return {
      status: "malformed" as const,
      value: {} as T,
      updatedAt: textArtifact.updatedAt,
    };
  }
}

function extractMarkdownSection(text: string, heading: string) {
  const targetHeading = `## ${heading}`;
  const lines = String(text || "").split("\n");
  const startIndex = lines.findIndex((line) => line.trim() === targetHeading);

  if (startIndex === -1) {
    return "";
  }

  const body: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (lines[index].trim().startsWith("## ")) {
      break;
    }
    body.push(lines[index]);
  }

  return body.join("\n").trim();
}

function extractFirstBullet(text: string, heading: string) {
  const section = extractMarkdownSection(text, heading);
  if (!section) {
    return "";
  }

  return section
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("- "))
    ?.slice(2)
    .trim() || "";
}

export function resolveRossOperatorArtifactRoot() {
  return normalizeString(process.env[STAFFORDOS_ROSS_OPERATOR_ARTIFACT_ROOT_ENV])
    || DEFAULT_ROSS_OPERATOR_ARTIFACT_ROOT;
}

function assertValidArtifactRoot(artifactRoot: string) {
  const resolvedRoot = path.resolve(artifactRoot);

  if (!fs.existsSync(resolvedRoot)) {
    throw new Error(
      `Invalid ${STAFFORDOS_ROSS_OPERATOR_ARTIFACT_ROOT_ENV}: directory not found at ${resolvedRoot}`
    );
  }

  const stats = fs.statSync(resolvedRoot);
  if (!stats.isDirectory()) {
    throw new Error(
      `Invalid ${STAFFORDOS_ROSS_OPERATOR_ARTIFACT_ROOT_ENV}: expected a directory at ${resolvedRoot}`
    );
  }
}

function deriveExactNextCommand(commandCenterPack: string, executionSessionPack: string) {
  return extractFirstBullet(executionSessionPack, "Exact Next Command")
    || extractFirstBullet(commandCenterPack, "Exact Commands To Run Now")
    || "No exact next command recorded.";
}

function deriveReadiness(status: ArtifactStatusValue, updatedAt: string) {
  if (status === "missing") {
    return "missing" as const;
  }

  if (status === "empty" || status === "malformed") {
    return "invalid" as const;
  }

  const timestampValue = Date.parse(normalizeString(updatedAt));
  if (!Number.isFinite(timestampValue)) {
    return "invalid" as const;
  }

  return Date.now() - timestampValue > ARTIFACT_STALE_AFTER_MS
    ? "stale"
    : "ready";
}

export function loadRossOperatorArtifacts(): RossOperatorCommandCenterData {
  const artifactRoot = resolveRossOperatorArtifactRoot();
  assertValidArtifactRoot(artifactRoot);
  const activeDecisionArtifact = readOptionalJsonArtifact<ActiveDecisionArtifact>(
    path.join(artifactRoot, "active_abando_decision.json")
  );
  const activeTruthArtifact = readOptionalJsonArtifact<ActiveTruthArtifact>(
    path.join(artifactRoot, "active_truth_context.json")
  );
  const commandCenterPackArtifact = readOptionalTextArtifact(
    path.join(artifactRoot, "command_center_pack.md")
  );
  const executionSessionPackArtifact = readOptionalTextArtifact(
    path.join(artifactRoot, "implementation_session_pack.md")
  );

  return {
    timestamp: new Date().toISOString(),
    artifactRoot,
    activeDecision: activeDecisionArtifact.value,
    currentTruth: activeTruthArtifact.value,
    commandCenterPack: commandCenterPackArtifact.value,
    executionSessionPack: executionSessionPackArtifact.value,
    exactNextCommand: deriveExactNextCommand(
      commandCenterPackArtifact.value,
      executionSessionPackArtifact.value
    ),
    status: {
      activeDecision: activeDecisionArtifact.status,
      currentTruth: activeTruthArtifact.status,
      commandCenterPack: commandCenterPackArtifact.status,
      executionSessionPack: executionSessionPackArtifact.status,
    },
    readiness: {
      activeDecision: deriveReadiness(activeDecisionArtifact.status, activeDecisionArtifact.updatedAt),
      currentTruth: deriveReadiness(activeTruthArtifact.status, activeTruthArtifact.updatedAt),
      commandCenterPack: deriveReadiness(commandCenterPackArtifact.status, commandCenterPackArtifact.updatedAt),
      executionSessionPack: deriveReadiness(executionSessionPackArtifact.status, executionSessionPackArtifact.updatedAt),
    },
    updatedAt: {
      activeDecision: activeDecisionArtifact.updatedAt,
      currentTruth: activeTruthArtifact.updatedAt,
      commandCenterPack: commandCenterPackArtifact.updatedAt,
      executionSessionPack: executionSessionPackArtifact.updatedAt,
    },
  };
}

export function loadRossOperatorCommandCenterData() {
  return loadRossOperatorArtifacts();
}
