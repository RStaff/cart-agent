import type { ConfirmationStatus } from "@/lib/dashboard/confirmation/types";

export type DashboardIssue = {
  title: string;
  summary: string;
  stage: string;
  device: string;
  confidence: string;
};

export type DashboardRecommendation = {
  title: string;
  why: string;
};

export type PredictedVsConfirmed = {
  predictedIssueLabel: string;
  predictedIssuePlainEnglish: string;
  predictedStepLabel: string;
  predictedRevenueAtRisk: number | null;
  predictedBenchmarkPosition: number | null;
  observedStepLabel: string | null;
  observedSummary: string;
  confirmationStatus: ConfirmationStatus;
  confirmationStatusLabel: string;
  confirmationSummary: string;
  confirmedSignalLabel: string | null;
  confirmedSignalDetail: string | null;
  confirmedRevenueImpact: number | null;
  sampleSize: number;
  measurementWindowLabel: string;
  stillMeasuring: string[];
  recommendedNextAction: string;
  supportingNotes: string[];
  confidenceLabel: string;
  lastUpdatedLabel: string;
};

export type DashboardData = {
  shop: string;
  connectionStatus: "connected" | "incomplete";
  trackingStatus: "active" | "activation_pending";
  lastUpdatedAt: string;
  primaryIssue: DashboardIssue;
  revenue: {
    estimatedAtRisk: number | null;
  };
  recommendation: DashboardRecommendation;
  activity: string[];
  scorecardPath?: string;
  evidence: PredictedVsConfirmed;
  proof?: {
    latestEventSource: string | null;
    latestEventTimestamp: string | null;
    latestEventType: string | null;
    sampleSize: number;
    persistedEventCount: number;
  };
};
