import fs from "fs";
import path from "path";

const root = "/Users/rossstafford/projects/StaffordMediaConsulting/apps/website";

const files = {
  page: "src/app/shopifixer/page.tsx",
  hero: "src/components/shopifixer/AuditHero.tsx",
  form: "src/components/shopifixer/AuditFormCard.tsx",
  preview: "src/components/shopifixer/AuditReadPreview.tsx",
  nextStep: "src/components/shopifixer/AuditNextStep.tsx",
  benefits: "src/components/shopifixer/AuditBenefitsRow.tsx",
  result: "src/app/shopifixer/result/page.tsx"
};

function read(rel) {
  const full = path.join(root, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
}

const sources = Object.fromEntries(
  Object.entries(files).map(([k, rel]) => [k, { rel, exists: !!read(rel), size: read(rel).length }])
);

const packet = {
  ok: true,
  agent: "prod_surface_change_packet_v1",
  mode: "proposal_only",
  generated_at: new Date().toISOString(),
  source_root: root,
  surface: "staffordmedia_shopifixer",
  route: "/shopifixer",
  owner: files.page,
  component_owners: files,
  current_truth: {
    real_page_exists: sources.page.exists,
    real_form_flow_exists: read(files.page).includes("submitAudit"),
    real_fix_audit_bridge_exists: read(files.page).includes("/api/fix-audit") || read(files.page).includes("getFixAuditUrl"),
    real_lead_save_exists: read(files.page).includes("saveShopifixerLead"),
    real_outreach_trigger_exists: read(files.page).includes("triggerShopifixerOutreach"),
    result_page_exists: sources.result.exists
  },
  reuse_rules: [
    "Do not rebuild /shopifixer page.",
    "Do not create a duplicate audit API.",
    "Do not create fake scan flow on production source.",
    "Keep existing server action submitAudit.",
    "Patch component owners only."
  ],
  proposed_component_level_changes: [
    {
      id: "hero_copy_sharpening",
      owner: files.hero,
      risk: "low",
      intent: "Improve above-the-fold urgency without changing layout or flow.",
      status: "proposal_only"
    },
    {
      id: "preview_proof_strengthening",
      owner: files.preview,
      risk: "low",
      intent: "Make the read preview feel more concrete while preserving existing component.",
      status: "proposal_only"
    },
    {
      id: "logo_asset_review",
      owner: "public/brand/shopifixer-logo-final.png",
      risk: "medium",
      intent: "Confirm dirty logo asset is intentional before committing.",
      status: "review_required"
    }
  ],
  next_step: "Review packet, then create branch in StaffordMedia repo before applying any component patch."
};

fs.mkdirSync("staffordos/surfaces", { recursive: true });
fs.writeFileSync(
  "staffordos/surfaces/staffordmedia_shopifixer_prod_surface_change_packet_v1.json",
  JSON.stringify(packet, null, 2) + "\n"
);

console.log(JSON.stringify(packet, null, 2));
