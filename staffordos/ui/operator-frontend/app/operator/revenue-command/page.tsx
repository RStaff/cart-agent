import { OperatorNav } from "../../../components/operator/OperatorNav";

export default function OperatorRevenueCommandPage() {
  const sections = [
    {
      title: "Active Opportunities",
      description:
        "Cross-product opportunities that still need operator action, routing, or qualification should appear here.",
      status: "No Revenue Command opportunity API is connected yet.",
    },
    {
      title: "Follow-Up Queue",
      description:
        "This queue should hold operator-owned outreach and follow-up work across products without pushing product execution into StaffordOS.",
      status: "No follow-up queue API is connected yet.",
    },
    {
      title: "Closing Pipeline",
      description:
        "This stage should track deals moving toward agreement, approval, or final operator confirmation.",
      status: "No closing pipeline API is connected yet.",
    },
    {
      title: "Payment Handoff",
      description:
        "This area should track internal payment-ready handoffs and confirmation steps without claiming payment or revenue that has not been verified.",
      status: "No payment handoff API is connected yet.",
    },
  ];

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS Revenue</p>
            <h1 className="title">Revenue Command</h1>
            <p className="subtitle">
              Internal funnel control for outreach, follow-up, closing, payment handoff, and cross-product pipeline management.
            </p>
            <OperatorNav activeHref="/operator/revenue-command" />
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Module Status</h2>
            <p className="subtitle" style={{ marginTop: 0 }}>
              Minimal control-plane page is live. Structured Revenue Command APIs are not connected yet, so all sections below are explicit empty states.
            </p>
            <div className="kv">
              <div><strong>Merchant-facing:</strong> No</div>
              <div><strong>Product execution logic:</strong> Kept out of this route</div>
              <div><strong>Reused API:</strong> None for structured funnel data</div>
            </div>
          </div>
        </section>

        <div className="grid gridTwo">
          {sections.map((section) => (
            <section className="panel" key={section.title}>
              <div className="panelInner">
                <h2 className="sectionTitle">{section.title}</h2>
                <p className="subtitle" style={{ marginTop: 0 }}>
                  {section.description}
                </p>
                <div className="emptyState">
                  <p className="emptyStateLabel">Placeholder</p>
                  <p className="emptyStateText">{section.status}</p>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
