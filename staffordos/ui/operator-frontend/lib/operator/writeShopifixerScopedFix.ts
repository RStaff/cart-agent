import fs from "node:fs";
import path from "node:path";

export type ShopifixerScopedFixInput = {
  store: string;
  scoped_fix: string;
  in_scope: string;
  out_of_scope: string;
  merchant_approval_needed: string;
  change_made: string;
  location_changed: string;
  implementation_notes: string;
  success_criteria: string;
};

function listBlock(title: string, value: string) {
  const items = String(value || "")
    .split(/\r?\n|\|/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `- ${item}`);

  return [title, ...items, ""];
}

export function writeShopifixerScopedFix(input: ShopifixerScopedFixInput) {
  const outputPath = path.resolve(
    process.cwd(),
    "../../proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md"
  );

  const content = [
    "# FIX SCOPE",
    "",
    "Store:",
    input.store,
    "",
    "Scoped Fix:",
    input.scoped_fix,
    "",
    ...listBlock("In Scope:", input.in_scope),
    ...listBlock("Out of Scope:", input.out_of_scope),
    "Merchant Approval Needed:",
    input.merchant_approval_needed,
    "",
    "Change Made:",
    input.change_made,
    "",
    "Location Changed:",
    input.location_changed,
    "",
    "Implementation Notes:",
    input.implementation_notes,
    "",
    "Success Criteria:",
    input.success_criteria,
    ""
  ].join("\n");

  fs.writeFileSync(outputPath, content, "utf8");

  return {
    outputPath,
    stdout: "",
    stderr: ""
  };
}
