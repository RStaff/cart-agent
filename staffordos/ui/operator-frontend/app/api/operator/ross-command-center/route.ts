import { NextResponse } from "next/server";
import { loadRossOperatorArtifacts } from "../../../../lib/rossOperatorArtifacts";

export async function GET() {
  try {
    const payload = loadRossOperatorArtifacts();

    return NextResponse.json({
      ok: true,
      activeDecision: payload.activeDecision,
      currentTruth: payload.currentTruth,
      commandCenterPack: payload.commandCenterPack,
      executionSessionPack: payload.executionSessionPack,
      exactNextCommand: payload.exactNextCommand,
      status: payload.status,
      readiness: payload.readiness,
      updatedAt: payload.updatedAt,
      timestamp: payload.timestamp,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        activeDecision: {},
        currentTruth: {},
        commandCenterPack: "",
        executionSessionPack: "",
        exactNextCommand: "No exact next command recorded.",
        status: {
          activeDecision: "malformed",
          currentTruth: "malformed",
          commandCenterPack: "malformed",
          executionSessionPack: "malformed",
        },
        readiness: {
          activeDecision: "invalid",
          currentTruth: "invalid",
          commandCenterPack: "invalid",
          executionSessionPack: "invalid",
        },
        updatedAt: {
          activeDecision: "",
          currentTruth: "",
          commandCenterPack: "",
          executionSessionPack: "",
        },
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Could not load Ross command center artifacts.",
      },
      { status: 200 }
    );
  }
}
