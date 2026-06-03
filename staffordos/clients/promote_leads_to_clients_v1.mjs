import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { readClientRegistry, upsertClient } from "./client_registry_v1.mjs";

const LEAD_REGISTRY_PATH = "staffordos/leads/lead_registry_v1.json";
const CLIENT_REGISTRY_PATH = "staffordos/clients/client_registry_v1.json";
const REPORT_PATH = "staffordos/clients/output/client_promotion_report_v1.md";
const ROUTING_POLICY_PATH = "staffordos/leads/lead_routing_policy_v1.json";
const OFFER_ROUTING_RULES_PATH = "staffordos/commercial/offer_routing_rules_v1.json";

function now() {
  return new Date().toISOString();
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeDomain(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(email));
}

function formatList(values) {
  return values.length ? values.join(", ") : "none";
}

function loadRoutingSignals() {
  const routingPolicy = readJson(ROUTING_POLICY_PATH, {
    default_product_intent: "shopifixer",
    intent_rules: []
  });
  const offerRoutingRules = readJson(OFFER_ROUTING_RULES_PATH, {
    routing_rules: []
  });

  return { routingPolicy, offerRoutingRules };
}

function gatherHaystack(lead) {
  const fields = [
    lead.lead_id,
    lead.id,
    lead.name,
    lead.domain,
    lead.product,
    lead.product_surface,
    lead.source,
    lead.lifecycle_stage,
    lead.status?.current_stage,
    lead.status?.current_bottleneck,
    lead.status?.next_action,
    lead.status?.temperature,
    lead.problem_summary,
    lead.routing?.primary_offer,
    lead.contact?.confidence
  ];

  return fields.map(normalizeText).join(" ").toLowerCase();
}

function determineProductRoute(lead, routingPolicy, offerRoutingRules) {
  const haystack = gatherHaystack(lead);

  const hasAny = (keywords) =>
    Array.isArray(keywords) && keywords.some((keyword) => haystack.includes(String(keyword).toLowerCase()));

  if (
    hasAny(["consulting", "automation", "transformation", "strategy", "consulting engagement", "strategy planning"]) ||
    hasAny(["automation consulting", "staffordmedia_services", "consulting_services"]) ||
    normalizeText(lead.product).toLowerCase() === "staffordmedia" ||
    normalizeText(lead.routing?.primary_offer).toLowerCase() === "automation_consulting"
  ) {
    return {
      selected_product: "staffordmedia",
      routing_reason: "consulting, automation, transformation, or strategy signal"
    };
  }

  if (
    hasAny(["recovery interest", "abandoned cart", "recovery signals"]) ||
    hasAny(["recovery demo requested", "email sms recovery interest", "checkout recovery", "recovery gap"]) ||
    normalizeText(lead.product).toLowerCase() === "abando" ||
    normalizeText(lead.product_surface).toLowerCase() === "abando_marketing" ||
    normalizeText(lead.routing?.primary_offer).toLowerCase() === "abando_recovery"
  ) {
    return {
      selected_product: "abando",
      routing_reason: "recovery or abandoned-cart signal"
    };
  }

  if (
    hasAny(["shopify merchant", "audit needed", "conversion issue", "checkout issue", "dev issue"]) ||
    hasAny(["shopifixer", "shopify fix", "checkout leak", "cart friction", "conversion", "ux friction"]) ||
    hasAny(["route_general_conversion_or_dev_issue_to_shopifixer", "shopifixer_audit"])
  ) {
    return {
      selected_product: "shopifixer",
      routing_reason: "Shopify conversion, checkout, audit, or dev issue"
    };
  }

  const policyDefault = normalizeText(routingPolicy?.default_product_intent) || "shopifixer";
  return {
    selected_product: policyDefault === "abando" || policyDefault === "staffordmedia" ? policyDefault : "shopifixer",
    routing_reason: "default route"
  };
}

function evaluateQualification(lead) {
  const score = Number(lead.score ?? lead.status?.conversion_score ?? lead.status?.score ?? 0);
  const stage = normalizeText(lead.status?.current_stage || lead.lifecycle_stage).toLowerCase();
  const email = normalizeText(lead.contact?.email);
  const confidence = normalizeText(lead.contact?.confidence).toLowerCase();
  const domain = lead.domain == null ? null : normalizeText(lead.domain);

  const disqualified = (domain === null || domain === "") && !email && confidence === "low";

  const reasons = [];
  if (score >= 80) reasons.push("score>=80");
  if (stage === "followup_sent") reasons.push("status.current_stage=followup_sent");
  if (stage === "engaged") reasons.push("status.current_stage=engaged");
  if (isValidEmail(email)) reasons.push("valid_contact_email");

  return {
    qualified: !disqualified && reasons.length > 0,
    disqualified,
    reasons
  };
}

function nextActionForRoute(route) {
  switch (route) {
    case "abando":
      return {
        type: "followup",
        owner: "ross",
        instructions: "Review recovery signals and move the merchant into the Abando recovery path.",
        auto_executable: false
      };
    case "staffordmedia":
      return {
        type: "followup",
        owner: "ross",
        instructions: "Run consulting discovery and scope the strategy or automation engagement.",
        auto_executable: false
      };
    case "shopifixer":
    default:
      return {
        type: "audit",
        owner: "system",
        instructions: "Prepare the ShopiFixer audit path and next merchant follow-up.",
        auto_executable: true
      };
  }
}

function buildPromotionNote({
  lead,
  route,
  qualificationReasons,
  routingReason,
  promotedAt
}) {
  return {
    at: promotedAt,
    type: "lead_promotion",
    text: `Promoted from lead registry with selected_product=${route}.`,
    lead_id: lead.lead_id || lead.id || null,
    selected_product: route,
    routing_reason: routingReason,
    qualification_reasons: qualificationReasons
  };
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

async function main() {
  const generatedAt = now();
  const { routingPolicy, offerRoutingRules } = loadRoutingSignals();
  const leadRegistry = readJson(LEAD_REGISTRY_PATH, { version: "lead_registry_v1", items: [] });
  const leads = Array.isArray(leadRegistry.items) ? leadRegistry.items : [];
  const existingRegistry = readClientRegistry();
  const existingClients = Array.isArray(existingRegistry.clients) ? existingRegistry.clients : [];
  const existingKeys = new Set(
    existingClients.flatMap((client) => [
      normalizeText(client.client_id),
      normalizeText(client.merchant_shop)
    ]).filter(Boolean)
  );

  const routeDecisions = [];
  const promoted = [];
  const skipped = [];
  let createdClients = 0;
  let updatedClients = 0;

  for (const lead of leads) {
    const qualification = evaluateQualification(lead);
    const route = determineProductRoute(lead, routingPolicy, offerRoutingRules);
    const leadId = normalizeText(lead.lead_id || lead.id || lead.domain || `lead_${routeDecisions.length + 1}`);
    const merchantShop = lead.domain == null ? null : normalizeDomain(lead.domain);

    routeDecisions.push({
      lead_id: leadId,
      merchant_shop: merchantShop,
      selected_product: route.selected_product,
      qualified: qualification.qualified,
      disqualified: qualification.disqualified
    });

    if (!qualification.qualified) {
      skipped.push({
        lead_id: leadId,
        merchant_shop: merchantShop,
        selected_product: route.selected_product,
        reason: qualification.disqualified ? "disqualified" : "not_qualified"
      });
      continue;
    }

    const clientId = merchantShop || leadId;
    const isUpdate = existingKeys.has(clientId) || (merchantShop && existingKeys.has(merchantShop));
    const promotedAt = now();
    const nextAction = nextActionForRoute(route.selected_product);
    const promotionNote = buildPromotionNote({
      lead,
      route: route.selected_product,
      qualificationReasons: qualification.reasons,
      routingReason: route.routing_reason,
      promotedAt
    });

    upsertClient({
      client_id: clientId,
      merchant_shop: merchantShop,
      source: lead.source || "lead_registry_v1",
      status: "qualified",
      contact: {
        email: normalizeText(lead.contact?.email),
        name: normalizeText(lead.contact?.name),
        role: normalizeText(lead.contact?.role),
        confidence: normalizeText(lead.contact?.confidence)
      },
      business: {
        next_action: nextAction.instructions
      },
      selected_product: route.selected_product,
      routing_reason: route.routing_reason,
      qualification_status: "qualified",
      lifecycle: {
        stage: "lead",
        stage_updated_at: promotedAt,
        blocked: false,
        block_reason: null
      },
      next_action: {
        ...nextAction,
        due_at: null,
        created_at: promotedAt,
        updated_at: promotedAt
      },
      notes: [promotionNote]
    });

    promoted.push({
      lead_id: leadId,
      client_id: clientId,
      merchant_shop: merchantShop,
      selected_product: route.selected_product,
      qualification_reasons: qualification.reasons,
      routing_reason: route.routing_reason,
      action: isUpdate ? "updated" : "created"
    });

    if (isUpdate) updatedClients += 1;
    else createdClients += 1;
    existingKeys.add(clientId);
    if (merchantShop) existingKeys.add(merchantShop);
  }

  await import("./build_operator_dashboard_snapshot_v1.mjs");

  const clientRegistry = readClientRegistry();
  const dashboardSnapshot = readJson("staffordos/clients/operator_dashboard_snapshot_v1.json", {});
  const registryClients = Array.isArray(clientRegistry.clients) ? clientRegistry.clients : [];
  const snapshotClientCount = Number(dashboardSnapshot?.top_metrics?.total_clients ?? 0);
  const registryClientCount = registryClients.length;
  const duplicateClientIds = registryClients
    .map((client) => normalizeText(client.client_id))
    .filter(Boolean)
    .reduce((acc, clientId) => {
      acc[clientId] = (acc[clientId] || 0) + 1;
      return acc;
    }, {});
  const duplicateMerchantShops = registryClients
    .map((client) => normalizeText(client.merchant_shop))
    .filter(Boolean)
    .reduce((acc, merchantShop) => {
      acc[merchantShop] = (acc[merchantShop] || 0) + 1;
      return acc;
    }, {});

  const duplicateClientIdList = Object.entries(duplicateClientIds)
    .filter(([, count]) => count > 1)
    .map(([clientId, count]) => `${clientId} (${count})`);
  const duplicateMerchantShopList = Object.entries(duplicateMerchantShops)
    .filter(([, count]) => count > 1)
    .map(([merchantShop, count]) => `${merchantShop} (${count})`);

  if (snapshotClientCount !== registryClientCount) {
    throw new Error(
      `dashboard_snapshot_count_mismatch: snapshot=${snapshotClientCount} registry=${registryClientCount}`
    );
  }

  if (duplicateClientIdList.length || duplicateMerchantShopList.length) {
    throw new Error(
      `duplicate_client_records_detected: client_ids=[${duplicateClientIdList.join("; ")}] merchant_shops=[${duplicateMerchantShopList.join("; ")}]`
    );
  }

  const routeCounts = countBy(routeDecisions, "selected_product");
  const promotedRouteCounts = countBy(promoted, "selected_product");
  const summary = {
    total_leads: leads.length,
    qualified_leads: promoted.length,
    promoted_leads: promoted.length,
    skipped_leads: skipped.length,
    route_counts: {
      shopifixer: routeCounts.shopifixer || 0,
      abando: routeCounts.abando || 0,
      staffordmedia: routeCounts.staffordmedia || 0
    },
    promoted_route_counts: {
      shopifixer: promotedRouteCounts.shopifixer || 0,
      abando: promotedRouteCounts.abando || 0,
      staffordmedia: promotedRouteCounts.staffordmedia || 0
    },
    created_clients: createdClients,
    updated_clients: updatedClients,
    resulting_client_registry_count: registryClientCount,
    dashboard_snapshot_client_count: snapshotClientCount
  };

  const report = [
    "# Client Promotion Report",
    "",
    `Generated at: ${generatedAt}`,
    "",
    "## Summary",
    "",
    `- Total leads: ${summary.total_leads}`,
    `- Qualified leads: ${summary.qualified_leads}`,
    `- Promoted leads: ${summary.promoted_leads}`,
    `- Skipped leads: ${summary.skipped_leads}`,
    `- Resulting client registry count: ${summary.resulting_client_registry_count}`,
    `- Dashboard snapshot client count: ${summary.dashboard_snapshot_client_count}`,
    `- Created clients: ${summary.created_clients}`,
    `- Updated clients: ${summary.updated_clients}`,
    "",
    "## Route Counts",
    "",
    `- ShopiFixer: ${summary.route_counts.shopifixer}`,
    `- Abando: ${summary.route_counts.abando}`,
    `- StaffordMedia: ${summary.route_counts.staffordmedia}`,
    "",
    "## Promoted Route Counts",
    "",
    `- ShopiFixer: ${summary.promoted_route_counts.shopifixer}`,
    `- Abando: ${summary.promoted_route_counts.abando}`,
    `- StaffordMedia: ${summary.promoted_route_counts.staffordmedia}`,
    "",
    "## Verification",
    "",
    `- Duplicate client IDs: ${duplicateClientIdList.length ? duplicateClientIdList.join("; ") : "none"}`,
    `- Duplicate merchant shops: ${duplicateMerchantShopList.length ? duplicateMerchantShopList.join("; ") : "none"}`,
    `- Dashboard snapshot aligned with client registry: yes`,
    "",
    "## Qualified Promotions",
    "",
    promoted.map((item) =>
      `- ${item.lead_id} -> ${item.client_id} (${item.selected_product})`
    ).join("\n") || "- none",
    "",
    "## Skipped Leads",
    "",
    skipped.map((item) =>
      `- ${item.lead_id} (${item.reason}) -> ${item.selected_product}`
    ).join("\n") || "- none"
  ].join("\n");

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, report + "\n");

  console.log(report);
  console.log(
    JSON.stringify(
      {
        ok: true,
        generated_at: generatedAt,
        report_path: REPORT_PATH,
        summary
      },
      null,
      2
    )
  );
}

await main();
