import type { DashboardData, PredictedVsConfirmed } from "@/components/dashboard/types";
import { buildObservedCheckoutMetrics } from "@/lib/dashboard/confirmation/buildObservedCheckoutMetrics";
import { getSeededCheckoutEvents } from "@/lib/dashboard/confirmation/getSeededCheckoutEvents";
import { resolveConfirmationState } from "@/lib/dashboard/confirmation/resolveConfirmationState";
import type { PredictedCheckoutContext, SlowdownStep } from "@/lib/dashboard/confirmation/types";
import { refreshConfirmationStateForShop } from "@/lib/dashboard/storage/refreshConfirmationStateForShop";
import { getPersistentDashboardState } from "@/lib/dashboard/storage/repository";
import type {
  ConfirmationStateSnapshotRecord,
  ScorecardPredictionRecord,
  ShopConnectionRecord,
} from "@/lib/dashboard/storage/types";
import { findPublicScorecard } from "@/lib/scorecards";
import {
  extractBenchmarkPositionPercent,
  merchantIssueFraming,
  topScorecardIssue,
} from "@/lib/scorecardPresentation";

function valueFromParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function moneyOrNull(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function derivePredictedStep(issueLabel: string): SlowdownStep | null {
  const normalized = issueLabel.toLowerCase();
  if (normalized.includes("payment")) return "payment_to_purchase";
  if (normalized.includes("checkout")) return "cart_to_checkout";
  return "cart_to_checkout";
}

function labelForStep(step: SlowdownStep | string | null) {
  if (step === "cart_to_checkout" || step === "Cart → Checkout") return "Cart → Checkout";
  if (step === "checkout_to_payment" || step === "Checkout → Payment") return "Checkout → Payment";
  if (step === "payment_to_purchase" || step === "Payment → Purchase") return "Payment → Purchase";
  return "Waiting for linked scorecard";
}

function trackingLabelFromStatus(status: PredictedVsConfirmed["confirmationStatus"]) {
  if (status === "not_started") return "Waiting for live checkout activity";
  if (status === "collecting") return "Collecting live checkout signals";
  if (status === "partially_confirmed") return "Early confirmation building";
  if (status === "confirmed") return "Prediction confirmed";
  return "Different pattern detected";
}

function predictedContextFromScorecard(scorecardMatch: ReturnType<typeof findPublicScorecard>): PredictedCheckoutContext | null {
  if (!scorecardMatch) return null;

  return {
    predicted_step: derivePredictedStep(topScorecardIssue(scorecardMatch)),
    predicted_summary: `Before install, Abando predicted that ${merchantIssueFraming(scorecardMatch).toLowerCase()}`,
    predicted_issue_label: topScorecardIssue(scorecardMatch),
    predicted_issue_plain_english: merchantIssueFraming(scorecardMatch),
    predicted_revenue_at_risk: moneyOrNull(scorecardMatch.revenueOpportunityCents / 100),
    predicted_benchmark_position: extractBenchmarkPositionPercent(scorecardMatch).percent || null,
  };
}

function predictedContextFromRecord(record: ScorecardPredictionRecord | null): PredictedCheckoutContext | null {
  if (!record) return null;

  return {
    predicted_step: derivePredictedStep(record.predictedIssueLabel),
    predicted_summary: `Before install, Abando predicted that ${record.predictedIssuePlainEnglish.toLowerCase()}`,
    predicted_issue_label: record.predictedIssueLabel,
    predicted_issue_plain_english: record.predictedIssuePlainEnglish,
    predicted_revenue_at_risk: record.predictedRevenueAtRisk,
    predicted_benchmark_position: record.predictedBenchmarkPosition,
  };
}

function buildEvidenceFromResolved({
  predicted,
  resolved,
  snapshot,
}: {
  predicted: PredictedCheckoutContext | null;
  resolved: ReturnType<typeof resolveConfirmationState>;
  snapshot: ConfirmationStateSnapshotRecord | null;
}): PredictedVsConfirmed {
  return {
    predictedIssueLabel: predicted?.predicted_issue_label || "Original scorecard prediction not attached",
    predictedIssuePlainEnglish:
      predicted?.predicted_issue_plain_english ||
      "Abando is ready to compare a scorecard prediction once this dashboard is linked back to a pre-install scorecard.",
    predictedStepLabel: labelForStep(predicted?.predicted_step || null),
    predictedRevenueAtRisk: predicted?.predicted_revenue_at_risk || null,
    predictedBenchmarkPosition: predicted?.predicted_benchmark_position || null,
    observedStepLabel: resolved.observed_step,
    observedSummary: resolved.observed_summary,
    confirmationStatus: resolved.confirmation_status,
    confirmationStatusLabel: snapshot?.confirmationStatusLabel || resolved.confirmation_status_label,
    confirmationSummary: snapshot?.confirmationSummary || resolved.confirmation_summary,
    confirmedSignalLabel:
      resolved.confirmation_status === "partially_confirmed"
        ? "Early evidence at the predicted checkout step"
        : resolved.confirmation_status === "confirmed"
          ? "The same slowdown is showing up in live checkout behavior"
          : resolved.confirmation_status === "disproven"
            ? "Live checkout behavior is pointing to a different step"
            : null,
    confirmedSignalDetail:
      resolved.confirmation_status === "partially_confirmed" ||
      resolved.confirmation_status === "confirmed" ||
      resolved.confirmation_status === "disproven"
        ? resolved.observed_summary
        : null,
    confirmedRevenueImpact: snapshot?.confirmedRevenueImpact ?? resolved.confirmed_revenue_impact,
    sampleSize: snapshot?.sampleSize ?? resolved.sample_size,
    measurementWindowLabel: snapshot?.measurementWindowLabel || resolved.measurement_window_label,
    stillMeasuring: resolved.supporting_notes.slice(0, 3),
    recommendedNextAction: snapshot?.recommendedNextAction || resolved.recommended_next_action,
    supportingNotes: resolved.supporting_notes,
    confidenceLabel: snapshot?.confidenceLabel || resolved.evidence_confidence,
    lastUpdatedLabel: snapshot?.lastCalculatedAt || resolved.measurement_window_label,
  };
}

function disconnectedEvidence(connection: ShopConnectionRecord): PredictedVsConfirmed {
  return {
    predictedIssueLabel: "Store disconnected",
    predictedIssuePlainEnglish: "This store is no longer actively connected to Abando.",
    predictedStepLabel: "Connection inactive",
    predictedRevenueAtRisk: null,
    predictedBenchmarkPosition: null,
    observedStepLabel: null,
    observedSummary: "Abando is not reading live checkout behavior because the store is disconnected.",
    confirmationStatus: "not_started",
    confirmationStatusLabel: "Disconnected",
    confirmationSummary: "This store was disconnected, so Abando is no longer confirming the previous scorecard prediction.",
    confirmedSignalLabel: null,
    confirmedSignalDetail: null,
    confirmedRevenueImpact: null,
    sampleSize: 0,
    measurementWindowLabel: connection.uninstalledAt || "Store disconnected",
    stillMeasuring: ["Reconnect Shopify before Abando can resume measuring live checkout behavior."],
    recommendedNextAction: "Reconnect Shopify to resume confirmation tracking for this store.",
    supportingNotes: ["The shop connection is marked as disconnected."],
    confidenceLabel: "Connection inactive",
    lastUpdatedLabel: connection.uninstalledAt || "Disconnected",
  };
}

export async function buildDashboardData(searchParams?: Record<string, string | string[] | undefined>) {
  const shopParam = valueFromParam(searchParams?.shop);
  const connected = valueFromParam(searchParams?.connected) === "1";
  const trackingParam = valueFromParam(searchParams?.tracking);
  const host = valueFromParam(searchParams?.host);
  const embedded = valueFromParam(searchParams?.embedded) === "1";
  const source = valueFromParam(searchParams?.source);
  const scorecardParam = valueFromParam(searchParams?.scorecard);

  const scorecardMatch =
    (shopParam ? findPublicScorecard(shopParam) : null) ||
    (scorecardParam ? findPublicScorecard(scorecardParam) : null);

  const shop = shopParam || scorecardMatch?.domain || "";
  const scorecardSlug = scorecardParam || scorecardMatch?.slug || "";
  const scorecardPath = scorecardSlug ? `/scorecard/${scorecardSlug}` : undefined;

  const persisted = shop ? await getPersistentDashboardState(shop) : null;
  const hasRealStoredState = persisted?.hasRealStoredState ?? false;
  const latestPersistedEvent = persisted?.checkoutEvents?.length
    ? [...persisted.checkoutEvents].sort(
        (left, right) => Date.parse(right.occurredAt || right.timestamp) - Date.parse(left.occurredAt || left.timestamp),
      )[0]
    : null;

  let evidence: PredictedVsConfirmed;
  let effectiveConnected = connected;

  if (persisted?.shopConnection?.installStatus === "disconnected") {
    effectiveConnected = false;
    evidence = disconnectedEvidence(persisted.shopConnection);
  } else if (hasRealStoredState && shop) {
    const refreshedSnapshot =
      persisted?.shopConnection?.installStatus === "installed"
        ? await refreshConfirmationStateForShop(shop)
        : persisted?.confirmationSnapshot || null;

    const predicted = predictedContextFromRecord(persisted?.scorecardPrediction || null);
    const observed = buildObservedCheckoutMetrics(shop, persisted?.checkoutEvents || []);
    const resolved = resolveConfirmationState({
      predicted,
      observed,
      shop,
    });
    evidence = buildEvidenceFromResolved({
      predicted,
      resolved,
      snapshot: refreshedSnapshot,
    });
  } else {
    const predicted = predictedContextFromScorecard(scorecardMatch);
    const seededEvents = connected && shop ? getSeededCheckoutEvents(shop) : [];
    const observed = buildObservedCheckoutMetrics(shop, seededEvents.map((event) => ({
      ...event,
      occurredAt: event.timestamp,
      id: `seeded_${event.session_id}_${event.event_type}_${event.stage}`,
    })));
    const resolved = resolveConfirmationState({
      predicted,
      observed,
      shop,
    });
    evidence = buildEvidenceFromResolved({
      predicted,
      resolved,
      snapshot: null,
    });
  }

  const trackingStatus =
    effectiveConnected && trackingParam === "active" ? "active" : "activation_pending";
  const connectionStatus =
    persisted?.shopConnection?.installStatus === "installed"
      ? "connected"
      : effectiveConnected
        ? "connected"
        : "incomplete";
  const issueTitle = evidence.predictedIssueLabel;
  const issueSummary = evidence.predictedIssuePlainEnglish;
  const trackingLabel = trackingLabelFromStatus(evidence.confirmationStatus);

  const data: DashboardData = {
    shop,
    connectionStatus,
    trackingStatus,
    lastUpdatedAt: evidence.lastUpdatedLabel,
    primaryIssue: {
      title: issueTitle,
      summary: issueSummary,
      stage: "cart_checkout",
      device: "mixed",
      confidence: evidence.confidenceLabel.toLowerCase(),
    },
    revenue: {
      estimatedAtRisk: evidence.predictedRevenueAtRisk,
    },
    recommendation: {
      title:
        evidence.confirmationStatus === "disproven"
          ? "Review the newly observed checkout step first"
          : evidence.confirmationStatus === "not_started"
            ? "Let live checkout activity start building"
            : "Review the predicted checkout step first",
      why: evidence.recommendedNextAction,
    },
    activity:
      connectionStatus === "connected"
        ? [
            "Store connection verified",
            hasRealStoredState
              ? "Persistent shop state loaded from durable storage"
              : "Using local seeded fallback because no persisted store state exists yet",
            `Current confirmation status: ${evidence.confirmationStatusLabel}`,
            `Sample window: ${evidence.measurementWindowLabel}`,
          ]
        : [
            "Waiting for Shopify approval to complete",
            "Live checkout measurement begins after connection is confirmed",
            "The original scorecard prediction is ready to compare once live behavior arrives",
            "Confirmation remains pending until real checkout activity is observed",
          ],
    scorecardPath,
    evidence,
    proof: effectiveConnected
      ? {
          latestEventSource: latestPersistedEvent?.source || null,
          latestEventTimestamp: latestPersistedEvent?.occurredAt || latestPersistedEvent?.timestamp || null,
          latestEventType: latestPersistedEvent?.event_type || null,
          sampleSize: evidence.sampleSize,
          persistedEventCount: persisted?.checkoutEvents?.length || 0,
        }
      : undefined,
  };

  return {
    data,
    host,
    embedded,
    connected: effectiveConnected,
    source,
    connectionLabel: connectionStatus === "connected" ? "Connected" : "Connection pending",
    trackingLabel,
    kpiTrackingLabel: trackingLabel,
    openShopifyHref: shop.endsWith(".myshopify.com") ? `https://${shop}/admin` : "https://admin.shopify.com",
  };
}
