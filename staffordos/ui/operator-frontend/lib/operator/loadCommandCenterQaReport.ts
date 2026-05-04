import fs from "node:fs";
import path from "node:path";

export function loadCommandCenterQaReport() {
  const filePath = path.join(process.cwd(), "../../../qa/output/command_center_primary_action_qa_v1.json");

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {
      schema: "staffordos.command_center_qa_gate.v1",
      verdict: "missing",
      score: 0,
      findings: []
    };
  }
}
