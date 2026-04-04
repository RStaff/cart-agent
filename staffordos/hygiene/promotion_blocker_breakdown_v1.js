import fs from "node:fs";
import path from "node:path";

const CANONICAL_ROOT = "/Users/rossstafford/projects/cart-agent";
const HYGIENE_DIR = path.join(CANONICAL_ROOT, "staffordos/hygiene");
const HYGIENE_REPORT_PATH = path.join(HYGIENE_DIR, "hygiene_report_v1.json");
const CLEANUP_GATE_REPORT_PATH = path.join(HYGIENE_DIR, "worktree_cleanup_gate_report.md");
const PROMOTION_READINESS_REPORT_PATH = path.join(HYGIENE_DIR, "promotion_readiness_report_v2.md");
const BRANCH_SCOPE_REPORT_PATH = path.join(HYGIENE_DIR, "branch_scope_report.md");
const OUTPUT_PATH = path.join(HYGIENE_DIR, "promotion_blocker_breakdown.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function extractSingle(markdown, pattern, fallback = "UNKNOWN") {
  return markdown.match(pattern)?.[1] || fallback;
}

function extractSectionBullets(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`### ${escaped}\\n\\n([\\s\\S]*?)(\\n### |$)`);
  const match = markdown.match(regex);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function makeBlocker({
  blockerName,
  category,
  why,
  evidence,
  nextAction,
  blocksLocalWork,
  blocksPromotion,
  blocksMerchantProof,
  blocksDeployment,
}) {
  return {
    blockerName,
    category,
    why,
    evidence,
    nextAction,
    blocksLocalWork,
    blocksPromotion,
    blocksMerchantProof,
    blocksDeployment,
  };
}

function buildBreakdown(hygiene, cleanupGateReport, readinessReport, branchScopeReport) {
  const blockers = [];

  const hygieneStatus = hygiene.status || "UNKNOWN";
  const cleanupGateStatus = extractSingle(cleanupGateReport, /- Status:\s+`([^`]+)`/, "UNKNOWN");
  const promotionStatus = extractSingle(readinessReport, /- Final Status:\s+`([^`]+)`/, "UNKNOWN");
  const branchScopeStatus = extractSingle(branchScopeReport, /- Status:\s+`([^`]+)`/, "UNKNOWN");

  if ((hygiene.generated_noise || []).length > 0) {
    blockers.push(makeBlocker({
      blockerName: "generated_noise_remaining",
      category: "HYGIENE_BLOCKERS",
      why: "Generated build output still pollutes the repo signal.",
      evidence: `${hygiene.generated_noise.length} generated noise path(s): ${hygiene.generated_noise.join(", ")}`,
      nextAction: "Remove the remaining .next generated path, then rerun hygiene.",
      blocksLocalWork: false,
      blocksPromotion: true,
      blocksMerchantProof: false,
      blocksDeployment: false,
    }));
  }

  if (cleanupGateStatus === "BLOCKED_FOR_PROMOTION") {
    blockers.push(makeBlocker({
      blockerName: "cleanup_gate_blocked",
      category: "GOVERNANCE_BLOCKERS",
      why: "Governance still says the worktree is not trustworthy enough for promotion.",
      evidence: `worktree_cleanup_gate_report.md status is ${cleanupGateStatus}`,
      nextAction: "Clear the remaining hygiene and deploy blockers, then rerun the cleanup gate.",
      blocksLocalWork: false,
      blocksPromotion: true,
      blocksMerchantProof: false,
      blocksDeployment: false,
    }));
  }

  if (branchScopeStatus === "MIXED_SCOPE") {
    blockers.push(makeBlocker({
      blockerName: "mixed_branch_scope",
      category: "GOVERNANCE_BLOCKERS",
      why: "Too many concerns are active on one branch for trustworthy promotion.",
      evidence: `branch_scope_report.md status is ${branchScopeStatus}`,
      nextAction: "Split remaining non-primary concerns into follow-up branches before promotion.",
      blocksLocalWork: false,
      blocksPromotion: true,
      blocksMerchantProof: false,
      blocksDeployment: false,
    }));
  }

  for (const deployBlocker of hygiene.deploy_blockers || []) {
    blockers.push(makeBlocker({
      blockerName: deployBlocker.includes("VERCEL") ? "missing_vercel_token" : "missing_render_token",
      category: "DEPLOY_BLOCKERS",
      why: "Deploy credentials are missing in the local environment used for promotion actions.",
      evidence: deployBlocker,
      nextAction: deployBlocker.includes("VERCEL")
        ? "Set VERCEL_TOKEN before treating frontend deployment from this environment as available."
        : "Set RENDER_API_KEY or RENDER_TOKEN before treating Render promotion from this environment as available.",
      blocksLocalWork: false,
      blocksPromotion: true,
      blocksMerchantProof: false,
      blocksDeployment: true,
    }));
  }

  const deployBlockers = extractSectionBullets(readinessReport, "Deploy Blockers")
    .filter((item) => !item.includes("VERCEL_TOKEN missing") && !item.includes("RENDER_API_KEY/RENDER_TOKEN missing"));
  for (const item of deployBlockers) {
    blockers.push(makeBlocker({
      blockerName: item.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
      category: item.includes("base URL") || item.includes("OAuth") || item.includes("Render API")
        ? "ENVIRONMENT_BLOCKERS"
        : "DEPLOY_BLOCKERS",
      why: "Historical environment drift still affects promotion confidence.",
      evidence: item,
      nextAction: item.includes("OAuth")
        ? "Keep merchant-facing OAuth locked to app.abando.ai and verify no regressions before promotion."
        : item.includes("base URL")
          ? "Verify merchant-facing URLs resolve from the canonical production frontend and API only."
          : "Keep Render out of merchant redirect paths and re-verify live flows before promotion.",
      blocksLocalWork: false,
      blocksPromotion: true,
      blocksMerchantProof: item.includes("OAuth") || item.includes("base URL") || item.includes("Render API"),
      blocksDeployment: false,
    }));
  }

  const productBlockers = extractSectionBullets(readinessReport, "Product Blockers");
  for (const item of productBlockers) {
    blockers.push(makeBlocker({
      blockerName: item.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
      category: "PRODUCT_BLOCKERS",
      why: "Merchant proof is not yet complete end to end.",
      evidence: item,
      nextAction: item.includes("storefront checkout")
        ? "Capture a real live storefront checkout, then rerun send-live-test and the return flow."
        : "Finish the real proof loop: send, receive, click, return, attribution.",
      blocksLocalWork: false,
      blocksPromotion: true,
      blocksMerchantProof: true,
      blocksDeployment: false,
    }));
  }

  const noLongerBlocks = [];
  if ((hygiene.unstaged || []).length === 0 && (hygiene.untracked || []).length === 0) {
    noLongerBlocks.push("Unstaged and untracked source changes are cleared from the active worktree.");
  }
  if (branchScopeStatus === "CLEAN_SCOPE") {
    noLongerBlocks.push("Branch scope is now clean and mostly isolated to governance/hygiene.");
  }

  return {
    promotionStatus,
    blockers: unique(blockers.map((item) => JSON.stringify(item))).map((item) => JSON.parse(item)),
    noLongerBlocks,
  };
}

function groupByCategory(blockers) {
  return {
    HYGIENE_BLOCKERS: blockers.filter((item) => item.category === "HYGIENE_BLOCKERS"),
    DEPLOY_BLOCKERS: blockers.filter((item) => item.category === "DEPLOY_BLOCKERS"),
    PRODUCT_BLOCKERS: blockers.filter((item) => item.category === "PRODUCT_BLOCKERS"),
    ENVIRONMENT_BLOCKERS: blockers.filter((item) => item.category === "ENVIRONMENT_BLOCKERS"),
    GOVERNANCE_BLOCKERS: blockers.filter((item) => item.category === "GOVERNANCE_BLOCKERS"),
  };
}

function renderBlocker(blocker) {
  return [
    `- Blocker: \`${blocker.blockerName}\``,
    `  Category: ${blocker.category}`,
    `  Why: ${blocker.why}`,
    `  Evidence: ${blocker.evidence}`,
    `  Next Action: ${blocker.nextAction}`,
    `  Blocks Continued Local Work: ${blocker.blocksLocalWork ? "yes" : "no"}`,
    `  Blocks Promotion: ${blocker.blocksPromotion ? "yes" : "no"}`,
    `  Blocks Merchant Proof: ${blocker.blocksMerchantProof ? "yes" : "no"}`,
    `  Blocks Deployment: ${blocker.blocksDeployment ? "yes" : "no"}`,
  ].join("\n");
}

function renderCategory(category, blockers) {
  if (!blockers.length) {
    return `### ${category}\n\n- None\n`;
  }
  return `### ${category}\n\n${blockers.map(renderBlocker).join("\n\n")}\n`;
}

function resolutionOrder(grouped) {
  const order = [];
  if (grouped.HYGIENE_BLOCKERS.length) {
    order.push("Remove remaining generated noise and rerun hygiene.");
  }
  if (grouped.GOVERNANCE_BLOCKERS.length) {
    order.push("Clear governance gate blockers so promotion trust is no longer blocked by process state.");
  }
  if (grouped.DEPLOY_BLOCKERS.length || grouped.ENVIRONMENT_BLOCKERS.length) {
    order.push("Restore deploy credentials and re-verify canonical production environment ownership.");
  }
  if (grouped.PRODUCT_BLOCKERS.length) {
    order.push("Complete the real merchant proof loop with a real storefront checkout and verified return.");
  }
  return order.length ? order : ["No remaining blockers."];
}

function writeReport(markdown) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, markdown, "utf8");
  if (!fs.existsSync(OUTPUT_PATH)) {
    throw new Error(`promotion_blocker_breakdown.md was not created at ${OUTPUT_PATH}`);
  }
  const stats = fs.statSync(OUTPUT_PATH);
  if (!stats.isFile()) {
    throw new Error(`promotion_blocker_breakdown.md path is not a file: ${OUTPUT_PATH}`);
  }
  return OUTPUT_PATH;
}

export function runPromotionBlockerBreakdown() {
  const hygiene = readJson(HYGIENE_REPORT_PATH);
  const cleanupGateReport = readText(CLEANUP_GATE_REPORT_PATH);
  const readinessReport = readText(PROMOTION_READINESS_REPORT_PATH);
  const branchScopeReport = readText(BRANCH_SCOPE_REPORT_PATH);

  const breakdown = buildBreakdown(hygiene, cleanupGateReport, readinessReport, branchScopeReport);
  const grouped = groupByCategory(breakdown.blockers);
  const nextOrder = resolutionOrder(grouped);
  const allowedNextStep = "targeted blocker resolution in priority order";
  const blockedNextStep = "promotion";

  const markdown = `# Promotion Blocker Breakdown

## Current Promotion Status

- Status: \`${breakdown.promotionStatus}\`

## Blocker Categories

- HYGIENE_BLOCKERS: ${grouped.HYGIENE_BLOCKERS.length}
- DEPLOY_BLOCKERS: ${grouped.DEPLOY_BLOCKERS.length}
- PRODUCT_BLOCKERS: ${grouped.PRODUCT_BLOCKERS.length}
- ENVIRONMENT_BLOCKERS: ${grouped.ENVIRONMENT_BLOCKERS.length}
- GOVERNANCE_BLOCKERS: ${grouped.GOVERNANCE_BLOCKERS.length}

## Exact Remaining Blockers

${renderCategory("HYGIENE_BLOCKERS", grouped.HYGIENE_BLOCKERS)}
${renderCategory("DEPLOY_BLOCKERS", grouped.DEPLOY_BLOCKERS)}
${renderCategory("PRODUCT_BLOCKERS", grouped.PRODUCT_BLOCKERS)}
${renderCategory("ENVIRONMENT_BLOCKERS", grouped.ENVIRONMENT_BLOCKERS)}
${renderCategory("GOVERNANCE_BLOCKERS", grouped.GOVERNANCE_BLOCKERS)}

## What No Longer Blocks

${breakdown.noLongerBlocks.length ? breakdown.noLongerBlocks.map((item) => `- ${item}`).join("\n") : "- None"}

## Allowed Next Step

- ${allowedNextStep}

## Blocked Next Step

- ${blockedNextStep}

## Exact Resolution Order

${nextOrder.map((item) => `- ${item}`).join("\n")}
`;

  return {
    status: breakdown.promotionStatus,
    grouped,
    nextOrder,
    markdown,
  };
}

export function writePromotionBlockerBreakdown(markdown) {
  return writeReport(markdown);
}

export { OUTPUT_PATH };
