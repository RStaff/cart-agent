import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const surface = process.argv[2] || "shopifixer";

const PATHS = {
  systemMap: "staffordos/system_map/system_map_truth_v1.json",
  systemMapMd: "staffordos/system_map/system_map_truth_v1.md",
  surfaceRegistry: "staffordos/surfaces/conversion_surface_registry_v1.json",
  shopifixerBridge: "staffordos/system_inventory/shopifixer_http_bridge_design_v1.md",
  outputDir: "staffordos/surfaces",
};

function exists(p) {
  return fs.existsSync(path.join(ROOT, p));
}

function readText(p, fallback = "") {
  const full = path.join(ROOT, p);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : fallback;
}

function readJson(p, fallback = null) {
  try {
    return JSON.parse(readText(p, ""));
  } catch {
    return fallback;
  }
}

function writeJson(p, data) {
  const full = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2) + "\n");
}

function detectOwner(surfaceName) {
  const candidates = {
    shopifixer: [
      "abando-frontend/app/shopifixer/page.tsx",
      "apps/website/src/app/shopifixer/page.tsx",
      "src/app/shopifixer/page.tsx",
    ],
    abando: [
      "abando-frontend/app/abando/page.tsx",
      "apps/website/src/app/abando/page.tsx",
      "src/app/abando/page.tsx",
    ],
    staffordmedia: [
      "apps/website/src/app/page.tsx",
      "src/app/page.tsx",
    ],
  };

  const list = candidates[surfaceName] || [];
  return list.find(exists) || null;
}

function inspectShopifixer(source) {
  const issues = [];

  const runAuditButtonStart = source.indexOf("<button onClick={runAudit}");
  const loadingStart = source.indexOf("{loading &&");
  const resultStart = source.indexOf("{result &&");
  const runAuditButtonEnd = runAuditButtonStart >= 0 ? source.indexOf("</button>", runAuditButtonStart) : -1;

  if (
    runAuditButtonStart >= 0 &&
    runAuditButtonEnd >= 0 &&
    (
      (loadingStart > runAuditButtonStart && loadingStart < runAuditButtonEnd) ||
      (resultStart > runAuditButtonStart && resultStart < runAuditButtonEnd)
    )
  ) {
    issues.push({
      id: "audit_result_inside_button",
      severity: "high",
      reason: "Loading/result UI is nested inside CTA button.",
      recommended_patch: "Move loading/result block outside the button only.",
    });
  }

  if (source.includes("Find My Biggest Revenue Leak") && !source.includes("<button onClick={runAudit}") && !source.includes("onClick={runAudit}")) {
    issues.push({
      id: "hero_cta_not_wired",
      severity: "medium",
      reason: "Hero CTA appears present but may not trigger the audit flow.",
      recommended_patch: "Wire hero CTA to existing runAudit function only.",
    });
  }

  if (source.includes("setTimeout(")) {
    issues.push({
      id: "demo_audit_result_present",
      severity: "medium",
      reason: "Current audit flow is front-end demo state. Useful for UX proof, not final production truth.",
      recommended_patch: "Keep temporarily for UX validation; later replace with existing /api/fix-audit bridge.",
    });
  }

  return issues;
}

const owner = detectOwner(surface);
const source = owner ? readText(owner) : "";

const systemMapExists = exists(PATHS.systemMap);
const surfaceRegistryExists = exists(PATHS.surfaceRegistry);
const bridgeDocExists = exists(PATHS.shopifixerBridge);

const systemMap = readJson(PATHS.systemMap, {});
const surfaceRegistry = readJson(PATHS.surfaceRegistry, {});
const bridgeDoc = readText(PATHS.shopifixerBridge, "");

const reuseRules = [];
if (bridgeDoc.includes("Do not rebuild another Shopifixer audit API")) {
  reuseRules.push("Do not rebuild another Shopifixer audit API.");
}
if (bridgeDoc.includes("Do not rebuild another Shopifixer audit email renderer")) {
  reuseRules.push("Do not rebuild another Shopifixer audit email renderer.");
}
if (bridgeDoc.includes("/api/fix-audit")) {
  reuseRules.push("Reuse existing /api/fix-audit bridge for real audit flow.");
}

const issues = owner && surface === "shopifixer" ? inspectShopifixer(source) : [];

function buildPatchProposal(surfaceName, ownerPath, currentIssues) {
  const proposals = [];

  for (const issue of currentIssues) {
    if (issue.id === "demo_audit_result_present") {
      proposals.push({
        id: "replace_demo_audit_with_existing_fix_audit_bridge",
        surface: surfaceName,
        owner: ownerPath,
        risk_level: "medium",
        requires_approval: true,
        intent: "Replace temporary front-end demo result with the existing /api/fix-audit bridge later, without rebuilding the audit API.",
        reuse_rule: "Reuse existing /api/fix-audit bridge. Do not rebuild audit API or email renderer.",
        status: "proposed",
        apply_mode: "not_implemented_yet",
        verification: [
          "Confirm /shopifixer still renders.",
          "Click CTA.",
          "Confirm audit request uses existing bridge when apply mode is implemented.",
          "Confirm no duplicate audit API was created."
        ]
      });
    }
  }

  const heroCtaLooksUnwired =
    ownerPath &&
    source.includes("Find My Biggest Revenue Leak") &&
    source.includes("<button className=\"bg-yellow-400 text-black px-8 py-4") &&
    !source.includes("<button onClick={runAudit} className=\"bg-yellow-400 text-black px-8 py-4");

  if (heroCtaLooksUnwired) {
    proposals.push({
      id: "wire_hero_cta_to_existing_runAudit",
      surface: surfaceName,
      owner: ownerPath,
      risk_level: "low",
      requires_approval: true,
      intent: "Wire the existing hero CTA to the existing runAudit function.",
      reuse_rule: "Patch detected owner only. Do not rebuild page.",
      status: "proposed",
      apply_mode: "not_implemented_yet",
      expected_change: "Add onClick={runAudit} to the existing hero button only.",
      verification: [
        "Click Find My Biggest Revenue Leak.",
        "Confirm scanning state appears.",
        "Confirm result card appears.",
        "Confirm event tracking logs audit_started and audit_result_viewed."
      ]
    });
  }

  return proposals;
}

const patchProposals = buildPatchProposal(surface, owner, issues);

function buildPreflightPacket(surfaceName, ownerPath, proposals) {
  const packets = [];

  for (const p of proposals) {
    if (p.id === "wire_hero_cta_to_existing_runAudit") {
      packets.push({
        id: p.id,
        surface: surfaceName,
        owner: ownerPath,
        change_type: "minimal_patch",
        target: '<button className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90">',
        replacement: '<button onClick={runAudit} className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90">',
        backup_required: true,
        forbidden: [
          "no_layout_change",
          "no_copy_change",
          "no_new_components",
          "no_new_api_calls"
        ],
        verification: [
          "Click hero CTA",
          "Confirm loading state appears",
          "Confirm result card renders",
          "Confirm console logs shopifixer_event audit_started"
        ],
        rollback: "Restore from .bak file created during patch"
      });
    }
  }

  return packets;
}

const preflightPackets = buildPreflightPacket(surface, owner, patchProposals);

writeJson(`staffordos/surfaces/${surface}_preflight_v1.json`, {
  ok: true,
  agent: "surface_patch_agent_v1",
  mode: "preflight",
  surface,
  generated_at: new Date().toISOString(),
  owner,
  preflight_packets: preflightPackets,
  next_step: preflightPackets.length
    ? "Approve packet id and execute apply mode."
    : "No executable packets."
});

writeJson(`staffordos/surfaces/${surface}_patch_proposals_v1.json`, {
  ok: true,
  agent: "surface_patch_agent_v1",
  mode: "propose_patch_only",
  surface,
  generated_at: new Date().toISOString(),
  owner,
  proposals: patchProposals,
  next_step: patchProposals.length
    ? "Review proposal, then run apply mode only after approval."
    : "No patch proposals generated."
});


const report = {
  ok: !!owner,
  agent: "surface_patch_agent_v1",
  mode: "map_aware_inspect_only",
  surface,
  generated_at: new Date().toISOString(),
  truth_inputs: {
    system_map_exists: systemMapExists,
    surface_registry_exists: surfaceRegistryExists,
    shopifixer_bridge_doc_exists: bridgeDocExists,
  },
  detected_owner: owner,
  source_length: source.length,
  reuse_rules: reuseRules,
  issues,
  patch_proposals: patchProposals,
  recommended_next_action: issues.length
    ? "Do not rebuild. Apply one minimal patch to the detected owner file after approval."
    : "No patch required from current inspection.",
  verification_commands: owner
    ? [
        "cd ~/projects/cart-agent/abando-frontend && npm run dev",
        `open http://localhost:3000/${surface}`,
        "Confirm CTA behavior and render state manually.",
      ]
    : [
        "Run owner discovery before patching.",
      ],
  hard_rules: [
    "No full rewrites unless explicitly approved.",
    "Use system map and surface registry before patching.",
    "Patch the detected owner file only.",
    "Backup before write.",
    "Verify after write.",
    "Log every patch report.",
  ],
};

writeJson(`staffordos/surfaces/${surface}_surface_patch_report_v1.json`, report);
console.log(JSON.stringify(report, null, 2));
