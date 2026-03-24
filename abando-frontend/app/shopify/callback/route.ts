import { NextRequest, NextResponse } from "next/server";
import { findPublicScorecard } from "@/lib/scorecards";
import { merchantIssueFraming, topScorecardIssue, extractBenchmarkPositionPercent } from "@/lib/scorecardPresentation";
import {
  upsertScorecardPrediction,
  upsertShopConnection,
} from "@/lib/dashboard/storage/repository";
import { refreshConfirmationStateForShop } from "@/lib/dashboard/storage/refreshConfirmationStateForShop";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop") || "";
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const installed = url.searchParams.get("installed") || "";
  const success = Boolean(shop && (code || state || installed === "1" || installed === "true"));

  if (!success) {
    const destination = new URL("/install/shopify", url.origin);
    if (shop) {
      destination.searchParams.set("shop", shop);
    }
    destination.searchParams.set("error", "connection_not_completed");
    destination.searchParams.set("source", "shopify_callback");
    return NextResponse.redirect(destination, 302);
  }

  const scorecardMatch = findPublicScorecard(shop);
  const now = new Date().toISOString();

  await upsertShopConnection({
    shopDomain: shop,
    installStatus: "installed",
    isEmbeddedCapable: true,
    accessMode: "offline",
    installedAt: now,
    lastSeenAt: now,
    uninstalledAt: null,
    source: scorecardMatch ? "scorecard_install" : "dashboard_callback",
    linkedScorecardSlug: scorecardMatch?.slug || null,
    linkedScorecardDomain: scorecardMatch?.domain || null,
  });

  if (scorecardMatch?.slug) {
    await upsertScorecardPrediction({
      shopDomain: shop,
      scorecardSlug: scorecardMatch.slug,
      predictedIssueLabel: topScorecardIssue(scorecardMatch),
      predictedIssuePlainEnglish: merchantIssueFraming(scorecardMatch),
      predictedStepLabel: "Cart → Checkout",
      predictedRevenueAtRisk: scorecardMatch.revenueOpportunityCents / 100,
      predictedBenchmarkPosition: extractBenchmarkPositionPercent(scorecardMatch).percent || null,
    });
  }

  await refreshConfirmationStateForShop(shop);

  const destination = new URL("/dashboard", url.origin);
  destination.searchParams.set("shop", shop);
  destination.searchParams.set("connected", "1");
  destination.searchParams.set("tracking", "awaiting_live_activity");
  destination.searchParams.set("source", "shopify_callback");
  if (scorecardMatch?.slug) {
    destination.searchParams.set("scorecard", scorecardMatch.slug);
  }
  return NextResponse.redirect(destination, 302);
}
