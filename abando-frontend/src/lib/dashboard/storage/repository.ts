import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { getSeededCheckoutEvents } from "@/lib/dashboard/confirmation/getSeededCheckoutEvents";
import type { ConfirmationStatus } from "@/lib/dashboard/confirmation/types";
import type {
  CheckoutEventRecord,
  ConfirmationStateSnapshotRecord,
  PersistentDashboardState,
  ScorecardPredictionRecord,
  ShopConnectionRecord,
  ShopConnectionSource,
} from "@/lib/dashboard/storage/types";

const STORE_PATH = join(process.cwd(), ".data", "abando-dashboard-state.json");
const SHOP_CONNECTION_EVENT = "abando.shop_connection.v1";
const SCORECARD_PREDICTION_EVENT = "abando.scorecard_prediction.v1";
const CHECKOUT_EVENT = "abando.checkout_event.v1";
const CONFIRMATION_SNAPSHOT_EVENT = "abando.confirmation_snapshot.v1";

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

async function getPrisma() {
  try {
    const moduleUrl = pathToFileURL("/Users/rossstafford/projects/cart-agent/web/src/clients/prisma.js").href;
    const mod = await import(moduleUrl);
    return mod.prisma ?? null;
  } catch {
    return null;
  }
}

function buildInitialSeedState(): PersistentDashboardState {
  const now = new Date("2026-03-19T16:00:00.000Z").toISOString();
  const shopDomain = "persisted-collecting.myshopify.com";
  const predictionId = makeId("prediction");
  const connectionId = makeId("connection");
  const snapshotId = makeId("snapshot");
  const checkoutEvents = getSeededCheckoutEvents("northstar-outdoors.myshopify.com").map((event) => ({
    ...event,
    id: makeId("event"),
    shop: shopDomain,
    occurredAt: event.timestamp,
  }));

  return {
    shopConnections: [
      {
        id: connectionId,
        shopDomain,
        installStatus: "installed",
        isEmbeddedCapable: true,
        accessMode: "offline",
        installedAt: now,
        lastSeenAt: now,
        uninstalledAt: null,
        source: "scorecard_install",
        linkedScorecardSlug: "northstar-outdoors",
        linkedScorecardDomain: "northstar-outdoors.myshopify.com",
      },
    ],
    scorecardPredictions: [
      {
        id: predictionId,
        shopDomain,
        scorecardSlug: "northstar-outdoors",
        predictedIssueLabel: "Slow mobile checkout handoff",
        predictedIssuePlainEnglish: "Mobile shoppers may be slowing down between cart and checkout.",
        predictedStepLabel: "Cart → Checkout",
        predictedRevenueAtRisk: 22280,
        predictedBenchmarkPosition: 56,
        createdAt: now,
        updatedAt: now,
      },
    ],
    checkoutEvents,
    confirmationSnapshots: [
      {
        id: snapshotId,
        shopDomain,
        confirmationStatus: "collecting",
        confirmationStatusLabel: "Collecting live checkout signals",
        confirmationSummary:
          "Abando is collecting live checkout behavior. There is not enough checkout activity yet to confirm the original prediction.",
        strongestObservedSlowdownStep: "Cart → Checkout",
        sampleSize: 7,
        measurementWindowLabel: "Last 7 days",
        confidenceLabel: "Early read",
        confirmedRevenueImpact: null,
        recommendedNextAction:
          "Allow more checkout activity so Abando can confirm whether the predicted slowdown keeps repeating.",
        lastCalculatedAt: now,
      },
    ],
  };
}

async function ensureFileStore() {
  await mkdir(join(process.cwd(), ".data"), { recursive: true });

  if (!existsSync(STORE_PATH)) {
    await writeFile(STORE_PATH, JSON.stringify(buildInitialSeedState(), null, 2), "utf8");
  }
}

async function readFileStore(): Promise<PersistentDashboardState> {
  await ensureFileStore();
  const raw = await readFile(STORE_PATH, "utf8");
  return JSON.parse(raw) as PersistentDashboardState;
}

async function writeFileStore(nextState: PersistentDashboardState) {
  await ensureFileStore();
  await writeFile(STORE_PATH, JSON.stringify(nextState, null, 2), "utf8");
}

async function createSystemEvent(prisma: any, shopDomain: string, eventType: string, payload: unknown) {
  return prisma.systemEvent.create({
    data: {
      shopDomain,
      eventType,
      visibility: "system",
      payload,
    },
  });
}

export async function upsertShopConnection(record: Omit<ShopConnectionRecord, "id"> & { id?: string }) {
  const prisma = await getPrisma();
  const nextRecord: ShopConnectionRecord = {
    ...record,
    id: record.id || makeId("connection"),
  };

  if (prisma) {
    try {
      await prisma.shop.upsert({
        where: { key: nextRecord.shopDomain },
        update: {
          updatedAt: new Date(),
          name: nextRecord.shopDomain,
          provider: "shopify",
        },
        create: {
          key: nextRecord.shopDomain,
          name: nextRecord.shopDomain,
          provider: "shopify",
        },
      });

      await createSystemEvent(prisma, nextRecord.shopDomain, SHOP_CONNECTION_EVENT, nextRecord);
      return nextRecord;
    } catch {}
  }

  const state = await readFileStore();
  state.shopConnections = state.shopConnections.filter((entry) => entry.shopDomain !== nextRecord.shopDomain);
  state.shopConnections.push(nextRecord);
  await writeFileStore(state);
  return nextRecord;
}

export async function upsertScorecardPrediction(record: Omit<ScorecardPredictionRecord, "id" | "createdAt" | "updatedAt">) {
  const prisma = await getPrisma();
  const now = new Date().toISOString();
  const nextRecord: ScorecardPredictionRecord = {
    ...record,
    id: makeId("prediction"),
    createdAt: now,
    updatedAt: now,
  };

  if (prisma) {
    try {
      await createSystemEvent(prisma, nextRecord.shopDomain, SCORECARD_PREDICTION_EVENT, nextRecord);
      return nextRecord;
    } catch {}
  }

  const state = await readFileStore();
  state.scorecardPredictions = state.scorecardPredictions.filter((entry) => entry.shopDomain !== nextRecord.shopDomain);
  state.scorecardPredictions.push(nextRecord);
  await writeFileStore(state);
  return nextRecord;
}

export async function saveCheckoutEvents(records: CheckoutEventRecord[]) {
  if (!records.length) return records;
  const prisma = await getPrisma();

  if (prisma) {
    try {
      for (const record of records) {
        await createSystemEvent(prisma, record.shop, CHECKOUT_EVENT, record);
      }
      return records;
    } catch {}
  }

  const state = await readFileStore();
  const existingIds = new Set(state.checkoutEvents.map((entry) => entry.id));
  for (const record of records) {
    if (!existingIds.has(record.id)) {
      state.checkoutEvents.push(record);
    }
  }
  await writeFileStore(state);
  return records;
}

export async function saveConfirmationSnapshot(record: Omit<ConfirmationStateSnapshotRecord, "id"> & { id?: string }) {
  const prisma = await getPrisma();
  const nextRecord: ConfirmationStateSnapshotRecord = {
    ...record,
    id: record.id || makeId("snapshot"),
  };

  if (prisma) {
    try {
      await createSystemEvent(prisma, nextRecord.shopDomain, CONFIRMATION_SNAPSHOT_EVENT, nextRecord);
      return nextRecord;
    } catch {}
  }

  const state = await readFileStore();
  state.confirmationSnapshots = state.confirmationSnapshots.filter((entry) => entry.shopDomain !== nextRecord.shopDomain);
  state.confirmationSnapshots.push(nextRecord);
  await writeFileStore(state);
  return nextRecord;
}

export async function getShopConnection(shopDomain: string) {
  if (!shopDomain) return null;
  const prisma = await getPrisma();

  if (prisma) {
    try {
      const event = await prisma.systemEvent.findFirst({
        where: { shopDomain, eventType: SHOP_CONNECTION_EVENT },
        orderBy: { createdAt: "desc" },
      });
      return (event?.payload as ShopConnectionRecord | null) || null;
    } catch {}
  }

  const state = await readFileStore();
  return state.shopConnections.find((entry) => entry.shopDomain === shopDomain) || null;
}

export async function getScorecardPrediction(shopDomain: string) {
  if (!shopDomain) return null;
  const prisma = await getPrisma();

  if (prisma) {
    try {
      const event = await prisma.systemEvent.findFirst({
        where: { shopDomain, eventType: SCORECARD_PREDICTION_EVENT },
        orderBy: { createdAt: "desc" },
      });
      return (event?.payload as ScorecardPredictionRecord | null) || null;
    } catch {}
  }

  const state = await readFileStore();
  return state.scorecardPredictions.find((entry) => entry.shopDomain === shopDomain) || null;
}

export async function getCheckoutEventsForShop(
  shopDomain: string,
  measurementWindow: "24h" | "7d" | "all" = "all",
) {
  if (!shopDomain) return [];
  const prisma = await getPrisma();
  const windowStart =
    measurementWindow === "24h"
      ? Date.now() - 24 * 60 * 60 * 1000
      : measurementWindow === "7d"
        ? Date.now() - 7 * 24 * 60 * 60 * 1000
        : null;

  const filterByWindow = (records: CheckoutEventRecord[]) =>
    windowStart === null
      ? records
      : records.filter((record) => Date.parse(record.occurredAt) >= windowStart);

  if (prisma) {
    try {
      const events = await prisma.systemEvent.findMany({
        where: { shopDomain, eventType: CHECKOUT_EVENT },
        orderBy: { createdAt: "asc" },
      });
      return filterByWindow((events.map((entry: any) => entry.payload) as CheckoutEventRecord[]) || []);
    } catch {}
  }

  const state = await readFileStore();
  return filterByWindow(state.checkoutEvents.filter((entry) => entry.shop === shopDomain));
}

export async function getLatestConfirmationSnapshotForShop(shopDomain: string) {
  if (!shopDomain) return null;
  const prisma = await getPrisma();

  if (prisma) {
    try {
      const event = await prisma.systemEvent.findFirst({
        where: { shopDomain, eventType: CONFIRMATION_SNAPSHOT_EVENT },
        orderBy: { createdAt: "desc" },
      });
      return (event?.payload as ConfirmationStateSnapshotRecord | null) || null;
    } catch {}
  }

  const state = await readFileStore();
  return state.confirmationSnapshots.find((entry) => entry.shopDomain === shopDomain) || null;
}

export async function markShopDisconnected(shopDomain: string) {
  const current = await getShopConnection(shopDomain);
  const now = new Date().toISOString();

  return upsertShopConnection({
    shopDomain,
    installStatus: "disconnected",
    isEmbeddedCapable: current?.isEmbeddedCapable ?? null,
    accessMode: current?.accessMode ?? "offline",
    installedAt: current?.installedAt ?? null,
    lastSeenAt: now,
    uninstalledAt: now,
    source: current?.source ?? "dashboard_callback",
    linkedScorecardSlug: current?.linkedScorecardSlug ?? null,
    linkedScorecardDomain: current?.linkedScorecardDomain ?? null,
  });
}

export async function getPersistentDashboardState(shopDomain: string) {
  const [shopConnection, scorecardPrediction, checkoutEvents, confirmationSnapshot] = await Promise.all([
    getShopConnection(shopDomain),
    getScorecardPrediction(shopDomain),
    getCheckoutEventsForShop(shopDomain, "all"),
    getLatestConfirmationSnapshotForShop(shopDomain),
  ]);

  return {
    shopConnection,
    scorecardPrediction,
    checkoutEvents,
    confirmationSnapshot,
    hasRealStoredState: Boolean(shopConnection || scorecardPrediction || checkoutEvents.length || confirmationSnapshot),
  };
}

export async function seedPersistentShopStateForVerification() {
  const state = await readFileStore();
  return {
    shopConnection: state.shopConnections.find((entry) => entry.shopDomain === "persisted-collecting.myshopify.com") || null,
    scorecardPrediction:
      state.scorecardPredictions.find((entry) => entry.shopDomain === "persisted-collecting.myshopify.com") || null,
    confirmationSnapshot:
      state.confirmationSnapshots.find((entry) => entry.shopDomain === "persisted-collecting.myshopify.com") || null,
  };
}
