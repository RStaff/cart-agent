import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const SNAPSHOT_FILE = "staffordos/cockpit/ceo_truth_snapshot_v1.json";

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, SNAPSHOT_FILE))) return cwd;

  const fromOperatorFrontend = path.resolve(cwd, "../../..");
  if (existsSync(path.join(fromOperatorFrontend, SNAPSHOT_FILE))) {
    return fromOperatorFrontend;
  }

  return fromOperatorFrontend;
}

export async function GET() {
  const repoRoot = resolveRepoRoot();
  const filePath = path.join(repoRoot, SNAPSHOT_FILE);

  if (!existsSync(filePath)) {
    return NextResponse.json(
      {
        ok: false,
        error: "ceo_truth_snapshot_missing",
        detail: `${SNAPSHOT_FILE} missing`,
      },
      { status: 404 }
    );
  }

  try {
    const snapshot = JSON.parse(readFileSync(filePath, "utf8"));
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "ceo_truth_snapshot_load_failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
