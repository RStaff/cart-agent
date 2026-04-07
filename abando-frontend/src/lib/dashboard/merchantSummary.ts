import {
  getCheckoutEventsForShop,
  getLatestConfirmationSnapshotForShop,
  getShopConnection,
} from "@/lib/dashboard/storage/repository";
import type { ConfirmationStatus } from "@/lib/dashboard/confirmation/types";

export type MerchantSummaryStatus = "listening" | "not_connected";
export type MerchantRecoveryStatus = "ready" | "listening" | "not_connected";
export type MerchantRecoveryActionStatus = "none" | "created" | "sent" | "failed";

export type MerchantSummary = {
  status: MerchantSummaryStatus;
  recoveryStatus: MerchantRecoveryStatus;
  eventCount: number;
  lastEventAt: string | null;
  recoveryActionStatus: MerchantRecoveryActionStatus;
  lastRecoveryActionAt?: string | null;
  lastCustomerReturnAt?: string | null;
  value?: {
    recoveredRevenueCents?: number;
    recoveredRevenueLabel?: string | null;
  };
};

type BackendDashboardSummaryPayload = {
  ok?: boolean;
  summary?: {
    connectionStatus?: string | null;
    recoveryStatus?: string | null;
    recoveryActionStatus?: string | null;
    checkoutEventsCount?: number | null;
    latestEventTimestamp?: string | null;
    lastRecoveryActionAt?: string | null;
    lastCustomerReturnAt?: string | null;
    realAttributedRevenueCents?: number | null;
  };
};

function toStatus(isConnected: boolean): MerchantSummaryStatus {
  return isConnected ? "listening" : "not_connected";
}

function toRecoveryStatus(isConnected: boolean, confirmationStatus: ConfirmationStatus | null): MerchantRecoveryStatus {
  if (!isConnected) return "not_connected";
  if (
    confirmationStatus === "confirmed" ||
    confirmationStatus === "partially_confirmed" ||
    confirmationStatus === "disproven"
  ) {
    return "ready";
  }
  return "listening";
}

function getLastEventAt(events: Array<{ occurredAt?: string | null }>) {
  const timestamps = events
    .map((event) => String(event?.occurredAt || ""))
    .filter(Boolean)
    .sort((left, right) => right.localeCompare(left));

  return timestamps[0] || null;
}

function formatUsdFromCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function normalizeRecoveryActionStatus(value: string | null | undefined): MerchantRecoveryActionStatus {
  return value === "created" || value === "sent" || value === "failed" ? value : "none";
}

function normalizeRecoveryStatus(value: string | null | undefined, isConnected: boolean): MerchantRecoveryStatus {
  if (!isConnected) return "not_connected";
  return value === "ready" ? "ready" : "listening";
}

async function getBackendMerchantSummary(shop: string): Promise<MerchantSummary | null> {
  const backendOrigin =
    process.env.ABANDO_BACKEND_ORIGIN ||
    process.env.CART_AGENT_API_BASE ||
    "https://cart-agent-api.onrender.com";

  const response = await fetch(
    `${backendOrigin.replace(/\/+$/, "")}/api/dashboard/summary?shop=${encodeURIComponent(shop)}`,
    { cache: "no-store" },
  ).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as BackendDashboardSummaryPayload | null;
  const summary = payload?.summary;
  if (!summary) {
    return null;
  }

  const isConnected = summary.connectionStatus === "connected";
  const recoveredRevenueCents = Number(summary.realAttributedRevenueCents || 0);

  return {
    status: toStatus(isConnected),
    recoveryStatus: normalizeRecoveryStatus(summary.recoveryStatus, isConnected),
    eventCount: Number(summary.checkoutEventsCount || 0),
    lastEventAt: summary.latestEventTimestamp || null,
    recoveryActionStatus: normalizeRecoveryActionStatus(summary.recoveryActionStatus),
    lastRecoveryActionAt: summary.lastRecoveryActionAt || null,
    lastCustomerReturnAt: summary.lastCustomerReturnAt || null,
    value: {
      recoveredRevenueCents,
      recoveredRevenueLabel: recoveredRevenueCents > 0 ? formatUsdFromCents(recoveredRevenueCents) : null,
    },
  };
}

export async function getMerchantSummary(shopDomain: string): Promise<MerchantSummary> {
  const shop = String(shopDomain || "").trim().toLowerCase();

  if (!shop) {
    return {
      status: "not_connected",
      recoveryStatus: "not_connected",
      eventCount: 0,
      lastEventAt: null,
      recoveryActionStatus: "none",
    };
  }

  const backendSummary = await getBackendMerchantSummary(shop);
  if (backendSummary) {
    return backendSummary;
  }

  const [connection, events, snapshot] = await Promise.all([
    getShopConnection(shop),
    getCheckoutEventsForShop(shop, "all"),
    getLatestConfirmationSnapshotForShop(shop),
  ]);

  const isConnected = connection?.installStatus === "installed";

  return {
    status: toStatus(isConnected),
    recoveryStatus: toRecoveryStatus(isConnected, snapshot?.confirmationStatus || null),
    eventCount: events.length,
    lastEventAt: getLastEventAt(events),
    // Recovery action state intentionally stays conservative until a durable action ledger is wired in.
    recoveryActionStatus: "none",
    lastRecoveryActionAt: null,
    lastCustomerReturnAt: null,
    value: {
      recoveredRevenueCents: 0,
      recoveredRevenueLabel: null,
    },
  };
}
