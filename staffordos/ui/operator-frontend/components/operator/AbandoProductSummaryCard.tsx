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

type AbandoProductSummaryCardProps = {
  summary: AbandoMerchantSummary | null;
  placeholderNote?: string;
};

export function AbandoProductSummaryCard({
  summary,
  placeholderNote,
}: AbandoProductSummaryCardProps) {
  return (
    <section className="panel">
      <div className="panelInner">
        <h2 className="sectionTitle">Abando</h2>
        <p className="subtitle" style={{ marginTop: 0 }}>
          Read-only control-plane summary from the Abando product surface. No merchant workflow is embedded here.
        </p>

        {summary ? (
          <div className="kv">
            <div><strong>Product Name:</strong> {summary.product}</div>
            <div><strong>Store Status:</strong> {summary.status}</div>
            <div><strong>Recovery Status:</strong> {summary.recoveryStatus}</div>
            <div><strong>Checkout Events Recorded:</strong> {summary.eventCount}</div>
            <div><strong>Last Event Timestamp:</strong> {summary.lastEventAt || "None recorded"}</div>
            <div>
              <strong>Last Recovery Action:</strong>{" "}
              {summary.lastRecoveryActionType
                ? `${summary.lastRecoveryActionType}${summary.lastRecoveryActionAt ? ` at ${summary.lastRecoveryActionAt}` : ""}`
                : "None recorded"}
            </div>
            {summary.lastEventSeen !== "none" ? (
              <div><strong>Last Event Seen:</strong> {summary.lastEventSeen}</div>
            ) : null}
            {summary.notes.length ? (
              <div><strong>Notes:</strong> {summary.notes.join(" ")}</div>
            ) : null}
          </div>
        ) : (
          <div className="emptyState">
            <p className="emptyStateLabel">Unavailable</p>
            <p className="emptyStateText">
              {placeholderNote || "Waiting for merchant state."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
