import { writeFileSync, mkdirSync } from "node:fs";

const branch = "staffordos/wire-real-recovery-send-20260502_125319";
const expectedCommit = "89e98047";
const productionBase = process.env.ABANDO_PRODUCTION_BASE || "https://pay.abando.ai";
const route = "/api/shopify/webhooks/orders-paid";
const url = `${productionBase}${route}`;

async function probe(url) {
  try {
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    return {
      reachable: true,
      status: res.status,
      content_type: res.headers.get("content-type"),
      sample: text.slice(0, 220)
    };
  } catch (err) {
    return {
      reachable: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

const routeProbe = await probe(url);

const report = {
  generated_at: new Date().toISOString(),
  check_name: "deploy_branch_to_production_and_verify_route_v1",
  branch,
  expected_latest_commit: expectedCommit,
  production_base: productionBase,
  expected_route: route,
  expected_url: url,
  route_probe: routeProbe,
  production_status:
    routeProbe.reachable && routeProbe.status !== 404
      ? "ROUTE_APPEARS_DEPLOYED"
      : "ROUTE_NOT_DEPLOYED_OR_NOT_REGISTERED",
  required_next_actions: [
    "Open GitHub PR from staffordos/wire-real-recovery-send-20260502_125319 into main",
    "Merge only after reviewing commits",
    "Confirm Render deploy starts from main or selected deploy branch",
    "Confirm production env has SHOPIFY_API_SECRET",
    "Re-run this check after deploy",
    "Then run real Shopify HMAC webhook test"
  ],
  truth_claim:
    "Production route is only proven after merged/deployed code responds on pay.abando.ai and HMAC test passes."
};

mkdirSync("staffordos/system_inventory/proof_summaries", { recursive: true });
writeFileSync(
  "staffordos/system_inventory/proof_summaries/deploy_branch_to_production_verify_latest.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));

if (report.production_status !== "ROUTE_APPEARS_DEPLOYED") process.exit(2);
