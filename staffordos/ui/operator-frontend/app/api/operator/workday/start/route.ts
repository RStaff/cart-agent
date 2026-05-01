import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export async function POST() {
  const repoRoot = path.resolve(process.cwd(), "../../..");
  const script = path.join(repoRoot, "staffordos/operating_loop/start_workday_v1.sh");

  try {
    const result = await execFileAsync(script, [], {
      cwd: repoRoot,
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 5
    });

    return NextResponse.json({
      ok: true,
      action: "start_workday",
      stdout: result.stdout,
      stderr: result.stderr
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      action: "start_workday",
      error: error.message,
      stdout: error.stdout || "",
      stderr: error.stderr || ""
    }, { status: 500 });
  }
}
