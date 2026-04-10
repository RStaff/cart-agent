import Link from "next/link";
import { AbandoProductSummaryCard } from "../../../components/operator/AbandoProductSummaryCard";
import { OperatorNav } from "../../../components/operator/OperatorNav";
import { ProductSummaryPlaceholderCard } from "../../../components/operator/ProductSummaryPlaceholderCard";

type AbandoMerchantSummary = {
  ok: true;
  product: "abando";
  status: "not_connected" | "listening" | "recovery_ready";
  recoveryStatus: "none" | "created" | "sent" | "failed";
  eventCount: number;
  lastEventSeen: "none" | "checkout_started" | "checkout_risk" | "test_event";
  lastEventAt: string | null;
  lastRecoveryActionAt: string | null;
  lastRecoveryActionType: string | null;
  notes: string[];
};

function getAbandoBaseUrl() {
  const raw =
    process.env.ABANDO_API_BASE ||
    process.env.NEXT_PUBLIC_ABANDO_API_BASE ||
    "http://localhost:3000";

  return raw.replace(/\/$/, "");
}

async function getAbandoSummary() {
  const shop =
    process.env.ABANDO_SUMMARY_SHOP ||
    process.env.NEXT_PUBLIC_ABANDO_SUMMARY_SHOP ||
    "";
  const endpoint = shop
    ? `${getAbandoBaseUrl()}/api/abando/merchant-summary?shop=${encodeURIComponent(shop)}`
    : `${getAbandoBaseUrl()}/api/abando/merchant-summary`;

  try {
    const response = await fetch(endpoint, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Abando summary request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as AbandoMerchantSummary;
    const hasObservableState =
      payload.status !== "not_connected" ||
      payload.eventCount > 0 ||
      payload.lastEventAt !== null ||
      payload.lastRecoveryActionAt !== null ||
      payload.lastRecoveryActionType !== null;

    return {
      summary: hasObservableState ? payload : null,
      placeholderNote: payload.notes[0] || "Waiting for merchant state.",
    };
  } catch (error) {
    return {
      summary: null,
      placeholderNote:
        error instanceof Error
          ? `Abando summary endpoint could not be reached: ${error.message}`
          : "Abando summary endpoint could not be reached.",
    };
  }
}

export default async function OperatorProductsPage() {
  const { summary, placeholderNote } = await getAbandoSummary();

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS Products</p>
            <h1 className="title">Product Overview</h1>
            <p className="subtitle">
              This control-plane view aggregates product summaries by API. Product workflows and merchant dashboards stay inside the product engines.
            </p>
            <OperatorNav activeHref="/operator/products" />
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Summary Status</h2>
            <div className="kv">
              <div><strong>Audience:</strong> StaffordOS operators</div>
              <div><strong>Embedded product workflows:</strong> None</div>
              <div><strong>Metric policy:</strong> No fake metrics or synthetic product dashboards</div>
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              <Link href="/operator/products/shopifixer/outreach" className="button buttonPrimary">
                Open Shopifixer Outreach Console
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gridTwo">
          <AbandoProductSummaryCard summary={summary} placeholderNote={placeholderNote} />

          <ProductSummaryPlaceholderCard
            title="Shopifixer"
            description="Shopifixer outreach now has a thin StaffordOS operator console for draft generation, Gmail compose handoff, and explicit outreach logging."
            placeholderNote="Use the Outreach Console for first-touch drafts and explicit status logging."
            actionHref="/operator/products/shopifixer/outreach"
            actionLabel="Open Outreach Console"
          />

          <ProductSummaryPlaceholderCard
            title="Actinventory"
            description="Actinventory should appear here only as a control-plane summary once a product summary endpoint exists."
            placeholderNote="No Actinventory product summary endpoint is connected yet."
          />
        </div>
      </div>
    </main>
  );
}
