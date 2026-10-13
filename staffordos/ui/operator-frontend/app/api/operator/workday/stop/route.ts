import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import {
  OPERATOR_WRITE_DENIED_STATUS,
  evaluateOperatorWriteIsolation,
  operatorWriteDeniedResponseBody,
} from "../../../../../lib/operator/operatorWriteIsolation";

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  const writeGate = evaluateOperatorWriteIsolation({ request, env: process.env });
  if (!writeGate.allowed) {
    return NextResponse.json(operatorWriteDeniedResponseBody(writeGate), { status: OPERATOR_WRITE_DENIED_STATUS });
  }

  const repoRoot = path.resolve(process.cwd(), "../../..");
  const script = path.join(repoRoot, "staffordos/operating_loop/stop_workday_v1.sh");

  try {
    const result = await execFileAsync(script, [], {
      cwd: repoRoot,
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 5
    });

    return NextResponse.json({
      ok: true,
      action: "stop_workday",
      stdout: result.stdout,
      stderr: result.stderr
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      action: "stop_workday",
      error: error.message,
      stdout: error.stdout || "",
      stderr: error.stderr || ""
    }, { status: 500 });
  }
}
