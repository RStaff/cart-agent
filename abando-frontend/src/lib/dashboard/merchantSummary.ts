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
  };
}
