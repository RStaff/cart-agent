import type { ConfirmationStatus, NormalizedCheckoutEvent } from "@/lib/dashboard/confirmation/types";

export type ShopInstallStatus = "installed" | "disconnected" | "pending";
export type ShopAccessMode = "offline" | "online";
export type ShopConnectionSource = "scorecard_install" | "direct_install" | "dashboard_callback";

export type ShopConnectionRecord = {
  id: string;
  shopDomain: string;
  installStatus: ShopInstallStatus;
  isEmbeddedCapable: boolean | null;
  accessMode: ShopAccessMode;
  installedAt: string | null;
  lastSeenAt: string | null;
  uninstalledAt: string | null;
  source: ShopConnectionSource;
  linkedScorecardSlug: string | null;
  linkedScorecardDomain: string | null;
};

export type ScorecardPredictionRecord = {
  id: string;
  shopDomain: string;
  scorecardSlug: string;
  predictedIssueLabel: string;
  predictedIssuePlainEnglish: string;
  predictedStepLabel: string;
  predictedRevenueAtRisk: number | null;
  predictedBenchmarkPosition: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CheckoutEventRecord = NormalizedCheckoutEvent & {
  id: string;
  occurredAt: string;
  metadataJson?: Record<string, unknown> | null;
};

export type ConfirmationStateSnapshotRecord = {
  id: string;
  shopDomain: string;
  confirmationStatus: ConfirmationStatus;
  confirmationStatusLabel: string;
  confirmationSummary: string;
  strongestObservedSlowdownStep: string | null;
  sampleSize: number;
  measurementWindowLabel: string;
  confidenceLabel: string;
  confirmedRevenueImpact: number | null;
  recommendedNextAction: string;
  lastCalculatedAt: string;
};

export type PersistentDashboardState = {
  shopConnections: ShopConnectionRecord[];
  scorecardPredictions: ScorecardPredictionRecord[];
  checkoutEvents: CheckoutEventRecord[];
  confirmationSnapshots: ConfirmationStateSnapshotRecord[];
};
