import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const ROOT = path.resolve(process.cwd(), "../../..");
const REGISTRY_PATH = path.join(ROOT, "staffordos/leads/lead_registry_v1.json");

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  const registry = readJson(REGISTRY_PATH, {
    version: "lead_registry_v1",
    items: []
  });

  return NextResponse.json({
    ok: true,
    source: "staffordos/leads/lead_registry_v1.json",
    registry
  });
}
