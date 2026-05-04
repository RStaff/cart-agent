import fs from "node:fs";
import path from "node:path";

export function loadPreflightReport() {
  const filePath = path.join(process.cwd(), "../../../preflight/output/preflight_report_v1.json");

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {
      schema: "staffordos.preflight_report.v1",
      status: "missing",
      findings: []
    };
  }
}
