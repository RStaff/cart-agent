import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SIGNAL_STORE_PATH = path.resolve(__dirname, "..", "data", "checkout_signal_capture.json");
const MAX_EVENTS = 1000;

function ensureSignalStore() {
  if (!fs.existsSync(SIGNAL_STORE_PATH)) {
    fs.mkdirSync(path.dirname(SIGNAL_STORE_PATH), { recursive: true });
    fs.writeFileSync(
      SIGNAL_STORE_PATH,
      `${JSON.stringify({ updatedAt: null, events: [] }, null, 2)}\n`,
      "utf8",
    );
  }
}

function readSignalStore() {
  ensureSignalStore();

  try {
    const parsed = JSON.parse(fs.readFileSync(SIGNAL_STORE_PATH, "utf8"));
    return {
      updatedAt: parsed?.updatedAt || null,
      events: Array.isArray(parsed?.events) ? parsed.events : [],
    };
  } catch {
    return {
      updatedAt: null,
      events: [],
    };
  }
}

function writeSignalStore(store) {
  fs.mkdirSync(path.dirname(SIGNAL_STORE_PATH), { recursive: true });
  fs.writeFileSync(SIGNAL_STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function appendCheckoutSignal({ type, payload, metadata }) {
  const store = readSignalStore();
  const now = new Date().toISOString();
  const event = {
    eventId: `checkout-signal-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    shopDomain: payload.shopDomain || null,
    cartToken: payload.cartToken || null,
    path: payload.path || null,
    ts: payload.ts || null,
    reason: payload.reason || null,
    receivedAt: now,
    metadata: {
      ip: metadata?.ip || null,
      userAgent: metadata?.userAgent || null,
      origin: metadata?.origin || null,
    },
  };

  const events = Array.isArray(store.events) ? store.events : [];
  events.push(event);

  store.updatedAt = now;
  store.events = events.slice(-MAX_EVENTS);
  writeSignalStore(store);

  return event;
}

export { SIGNAL_STORE_PATH, appendCheckoutSignal };
