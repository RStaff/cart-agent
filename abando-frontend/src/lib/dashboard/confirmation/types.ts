export type ConfirmationStatus =
  | "not_started"
  | "collecting"
  | "partially_confirmed"
  | "confirmed"
  | "disproven";

export type CheckoutStage = "cart" | "checkout" | "payment" | "purchase";

export type CheckoutEventType =
  | "cart_view"
  | "checkout_started"
  | "payment_started"
  | "purchase_completed"
  | "checkout_abandon"
  | "checkout_return";

export type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";
export type CheckoutEventSource =
  | "live_storefront"
  | "live_extension"
  | "seeded_dev"
  | "manual_dev"
  | "pixel"
  | "webhook"
  | "api";

export type NormalizedCheckoutEvent = {
  shop: string;
  timestamp: string;
  event_type: CheckoutEventType;
  stage: CheckoutStage;
  device_type: DeviceType;
  session_id: string;
  order_id: string | null;
  amount: number | null;
  source: CheckoutEventSource;
};

export type SlowdownStep = "cart_to_checkout" | "checkout_to_payment" | "payment_to_purchase";

export type ObservedCheckoutMetrics = {
  shop: string;
  measurement_window_label: string;
  sample_size: number;
  event_count: number;
  counts_by_stage: Record<CheckoutStage, number>;
  cart_to_checkout_rate: number | null;
  checkout_to_payment_rate: number | null;
  payment_to_purchase_rate: number | null;
  mobile_share: number | null;
  non_mobile_share: number | null;
  strongest_observed_slowdown_step: SlowdownStep | null;
  enough_data_to_evaluate: boolean;
  observed_step: string | null;
  observed_summary: string;
  supporting_notes: string[];
  seeded: boolean;
};

export type PredictedCheckoutContext = {
  predicted_step: SlowdownStep | null;
  predicted_summary: string;
  predicted_issue_label: string;
  predicted_issue_plain_english: string;
  predicted_revenue_at_risk: number | null;
  predicted_benchmark_position: number | null;
};

export type ResolvedConfirmationState = {
  predicted_step: SlowdownStep | null;
  observed_step: string | null;
  predicted_summary: string;
  observed_summary: string;
  confirmation_status: ConfirmationStatus;
  evidence_confidence: string;
  measurement_window_label: string;
  sample_size: number;
  confirmed_revenue_impact: number | null;
  recommended_next_action: string;
  supporting_notes: string[];
  confirmation_status_label: string;
  confirmation_summary: string;
};
