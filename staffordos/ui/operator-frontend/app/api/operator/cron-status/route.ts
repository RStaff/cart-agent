import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execFileAsync = promisify(execFile);

export async function GET() {
  const repoRoot = path.resolve(process.cwd(), "../../..");
  const script = path.join(repoRoot, "staffordos/operating_loop/cron_status_v1.sh");
  const output = path.join(repoRoot, "staffordos/operating_loop/output/cron_status_latest.txt");

  try {
    const result = await execFileAsync(script, [], {
      cwd: repoRoot,
      timeout: 60000,
      maxBuffer: 1024 * 1024 * 5
    });

    return NextResponse.json({
      ok: true,
      action: "cron_status",
      stdout: result.stdout,
      stderr: result.stderr,
      latest: fs.existsSync(output) ? fs.readFileSync(output, "utf8") : ""
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      action: "cron_status",
      error: error.message,
      stdout: error.stdout || "",
      stderr: error.stderr || ""
    }, { status: 500 });
  }
}
