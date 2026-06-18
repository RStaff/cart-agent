import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/brand/PublicHeader";
import CenteredContainer from "@/components/layout/CenteredContainer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type MerchantLifecycleRecord = {
  merchant_id?: string;
  client_id?: string;
  merchant_shop?: string;
  store_domain?: string;
  reservation_id?: string | null;
  payment_status?: string;
  fulfillment_status?: string;
  proof_package_status?: string;
  review_status?: string;
  referral_status?: string;
  current_stage?: string;
  next_required_action?: string;
};

type FulfillmentItem = {
  reservation_id?: string | null;
  store_domain?: string | null;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  execution_status?: string | null;
  proof_status?: string | null;
  completion_status?: string | null;
  proof_package_location?: string | null;
};

type RevenueTruth = {
  latest_stripe_payment?: {
    packet_id?: string | null;
    merchant_shop?: string | null;
    session_id?: string | null;
    payment_status?: string | null;
  } | null;
  payment_summary?: {
    packet_id?: string | null;
    merchant_shop?: string | null;
    session_id?: string | null;
    payment_status?: string | null;
  } | null;
};

type PacketRecord = {
  packet_id?: string;
  reservation_id?: string | null;
  store_domain?: string;
  payment_reference?: string | null;
  status?: string;
  execution_status?: string;
  proof_status?: string;
  completion_status?: string;
};

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "merchant_registry", "merchant_lifecycle_registry_v1.json"))) {
      return candidate;
    }
  }
  return process.cwd();
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function readText(filePath: string, fallback = "") {
  try {
    if (!existsSync(filePath)) return fallback;
    return readFileSync(filePath, "utf8");
  } catch {
    return fallback;
  }
}

function text(value: unknown, fallback = "unavailable") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function normalizeStore(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

async function readPacket(packetId: string): Promise<PacketRecord | null> {
  if (!packetId) return null;
  const apiBase = (
    process.env.NEXT_PUBLIC_ABANDO_API_BASE ||
    process.env.NEXT_PUBLIC_ABANDO_BACKEND_ORIGIN ||
    process.env.ABANDO_BACKEND_ORIGIN ||
    "http://127.0.0.1:8081"
  ).replace(/\/$/, "");

  try {
    const response = await fetch(`${apiBase}/api/packets/${encodeURIComponent(packetId)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const result = (await response.json()) as { ok?: boolean; packet?: PacketRecord };
    return result?.packet || null;
  } catch {
    return null;
  }
}

function loadLifecycle(repoRoot: string) {
  const lifecyclePath = join(repoRoot, "staffordos", "merchant_registry", "merchant_lifecycle_registry_v1.json");
  const fulfillmentPath = join(repoRoot, "staffordos", "fulfillment", "shopifixer_fulfillment_truth_v1.json");
  const revenuePath = join(repoRoot, "staffordos", "revenue", "revenue_truth_v1.json");
  const proofPackagePath = join(repoRoot, "staffordos", "proof_runs", "internal_shopifixer_dry_run_v1", "merchant_proof_package.md");

  const lifecycle = readJson<{ records?: MerchantLifecycleRecord[]; active_record_selection?: { merchant_id?: string | null } }>(
    lifecyclePath,
    { records: [], active_record_selection: undefined }
  );
  const fulfillment = readJson<{ items?: FulfillmentItem[] }>(fulfillmentPath, { items: [] });
  const revenue = readJson<RevenueTruth>(revenuePath, {});
  const proofPackage = readText(proofPackagePath, "");

  return { lifecycle, fulfillment, revenue, proofPackage };
}

function selectRecord(
  records: MerchantLifecycleRecord[],
  store: string,
  reservationId: string,
  activeSelectionMerchantId: string
) {
  const normalizedStore = normalizeStore(store);
  const normalizedReservation = String(reservationId || "").trim();
  const normalizedSelection = normalizeStore(activeSelectionMerchantId);

  return (
    records.find((record) => normalizeStore(record.merchant_id || record.client_id || record.store_domain || record.merchant_shop) === normalizedSelection) ||
    records.find((record) => normalizeStore(record.store_domain || record.merchant_shop || record.client_id || record.merchant_id) === normalizedStore) ||
    records.find((record) => String(record.reservation_id || "").trim() === normalizedReservation) ||
    null
  );
}

function sectionState(label: string, value: string, detail: string) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">{label}</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{value}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-300">{detail}</p>
    </section>
  );
}

export default async function ShopifixerStatusPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const packetId = String(Array.isArray(params.packet_id) ? params.packet_id[0] : params.packet_id || "").trim();
  const sessionId = String(Array.isArray(params.session_id) ? params.session_id[0] : params.session_id || "").trim();
  const store = normalizeStore(Array.isArray(params.store) ? params.store[0] : params.store || params.store_domain || "");
  const reservationId = String(Array.isArray(params.reservation_id) ? params.reservation_id[0] : params.reservation_id || "").trim();

  const repoRoot = findCanonicalRoot();
  const { lifecycle, fulfillment, revenue, proofPackage } = loadLifecycle(repoRoot);
  const records = Array.isArray(lifecycle.records) ? lifecycle.records : [];
  const record = selectRecord(records, store, reservationId, lifecycle.active_record_selection?.merchant_id || "");
  const packet = packetId ? await readPacket(packetId) : null;
  const packetReservationId = String(packet?.reservation_id || reservationId || record?.reservation_id || "").trim();
  const targetStore = store || normalizeStore(record?.store_domain || record?.merchant_shop || packet?.store_domain || "");
  const fulfillmentItem = (Array.isArray(fulfillment.items) ? fulfillment.items : []).find((item) => {
    const itemStore = normalizeStore(item.store_domain || "");
    const itemReservation = String(item.reservation_id || "").trim();
    return (
      (targetStore && itemStore === targetStore) ||
      (packetReservationId && itemReservation === packetReservationId)
    );
  }) || null;

  if (!targetStore && !packet && !record && !fulfillmentItem) {
    notFound();
  }

  const paymentReceived = Boolean(
    ["paid", "payment_received", "collected", "completed"].includes(String(record?.payment_status || "").trim().toLowerCase()) ||
      ["payment_received", "paid"].includes(String(fulfillmentItem?.payment_status || "").trim().toLowerCase()) ||
      (revenue.latest_stripe_payment && normalizeStore(revenue.latest_stripe_payment.merchant_shop) === targetStore)
  );

  const workInProgress = Boolean(
    (
      paymentReceived &&
      [
        "in_progress",
        "payment_received",
        "working",
        "started",
        "complete",
      ].includes(String(fulfillmentItem?.fulfillment_status || "").trim().toLowerCase())
    ) ||
      ["in_progress", "started", "complete"].includes(String(fulfillmentItem?.execution_status || "").trim().toLowerCase()) ||
      ["fulfillment_started", "proof_pending", "proof_complete", "completed"].includes(String(record?.current_stage || "").trim().toLowerCase())
  );

  const proofReady = Boolean(
    paymentReceived &&
      (
        String(fulfillmentItem?.proof_status || "").trim().toLowerCase() === "complete" ||
        String(record?.proof_package_status || "").trim().toLowerCase() === "complete" ||
        String(fulfillmentItem?.proof_package_location || "").trim().length > 0 ||
        String(proofPackage || "").trim().length > 0
      )
  );

  const completed = Boolean(
    paymentReceived &&
      (
        String(fulfillmentItem?.completion_status || "").trim().toLowerCase() === "complete" ||
        String(record?.current_stage || "").trim().toLowerCase() === "completed"
      )
  );

  const merchantName = text(record?.merchant_shop || record?.store_domain || packet?.store_domain || targetStore, "ShopiFixer customer");
  const paymentText = paymentReceived
    ? `Payment received for ${merchantName}.`
    : "Payment has not yet been confirmed in StaffordOS truth.";
  const workText = workInProgress
    ? "Ross is actively working the fix."
    : "The fix is not yet marked in progress.";
  const proofText = proofReady
    ? "Proof package is ready and tied to the existing evidence package."
    : "Proof package has not been generated yet.";
  const completionText = completed
    ? "The fix is complete in fulfillment and lifecycle truth."
    : "Completion has not yet been recorded.";

  return (
    <CenteredContainer>
      <PublicHeader shop={merchantName} />

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">ShopiFixer status</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white">Merchant continuity workspace</h1>
        <p className="text-base leading-7 text-slate-300">
          Read-only state derived from StaffordOS truth. This page keeps the merchant oriented after payment.
        </p>
        <p className="text-sm text-slate-400">
          Store: {merchantName} · Packet: {packetId || "unavailable"} · Session: {sessionId || "unavailable"}
        </p>
      </section>

      <div className="grid gap-4">
        {sectionState("Payment Received", paymentReceived ? "Confirmed" : "Pending", paymentText)}
        {sectionState("Work In Progress", workInProgress ? "In progress" : "Pending", workText)}
        {sectionState("Proof Package Status", proofReady ? "Ready" : "Pending", proofText)}
        {sectionState("Completion Status", completed ? "Complete" : "Pending", completionText)}
      </div>
    </CenteredContainer>
  );
}
