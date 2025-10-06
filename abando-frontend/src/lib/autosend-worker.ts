import {
  getAutoSendMode,
  getAutoSendThresholdMin,
} from "@/lib/autosend-config";

/** Replace with your real cart type */
export type Cart = {
  id: string;
  itemCount: number;
  minutesSinceLastActivity: number;
  customerEmail?: string | null;
};

/** Replace with your real repository */
export interface CartRepository {
  findAbandonedSince(_minMinutes: number): Promise<Cart[]>;
}

/** Replace with your real messenger */
export interface Messenger {
  sendCartMessage(cart: Cart): Promise<void>;
}

export type ScanResult = {
  mode: "auto" | "manual";
  thresholdMin: number;
  scanned: number;
  eligible: number;
  sent: number;
  details: { id: string; eligible: boolean; sent: boolean; reason?: string }[];
};

/**
 * Main scan function:
 * - reads mode/threshold
 * - fetches potentially abandoned carts
 * - in "auto" mode, sends immediately
 * - in "manual" mode, no sends (dry scan)
 */
export async function scanAndMaybeSend(
  repo: CartRepository,
  messenger: Messenger,
): Promise<ScanResult> {
  const mode = getAutoSendMode();
  const thresholdMin = getAutoSendThresholdMin();

  const candidates = await repo.findAbandonedSince(thresholdMin);
  let sent = 0;
  const details: ScanResult["details"] = [];

  for (const cart of candidates) {
    const eligible =
      cart.itemCount > 0 && cart.minutesSinceLastActivity >= thresholdMin;
    if (!eligible) {
      details.push({
        id: cart.id,
        eligible: false,
        sent: false,
        reason: "below threshold or empty",
      });
      continue;
    }
    if (mode === "auto") {
      await messenger.sendCartMessage(cart);
      sent++;
      details.push({ id: cart.id, eligible: true, sent: true });
    } else {
      details.push({
        id: cart.id,
        eligible: true,
        sent: false,
        reason: "mode=manual",
      });
    }
  }

  return {
    mode,
    thresholdMin,
    scanned: candidates.length,
    eligible: details.filter((d) => d.eligible).length,
    sent,
    details,
  };
}

/**
 * TEMP: demo implementations so the endpoint works without your DB.
 * Replace these with real implementations when ready.
 */
export class DemoRepo implements CartRepository {
  async findAbandonedSince(_minMinutes: number): Promise<Cart[]> {
    // In dev, optionally simulate a cart via env toggles
    if (process.env.DEMO_AUTOSEND !== "1") return [];
    const age = Number(process.env.DEMO_CART_AGE_MIN ?? 45);
    const items = Number(process.env.DEMO_CART_ITEMS ?? 2);
    return [
      {
        id: "demo-cart-1",
        itemCount: items,
        minutesSinceLastActivity: age,
        customerEmail: "demo@example.com",
      },
    ];
  }
}
export class DemoMessenger implements Messenger {
  async sendCartMessage(cart: Cart): Promise<void> {
    // Replace with your actual send logic; this just logs.
    console.log("[autosend] would send message for cart:", cart.id);
  }
}
