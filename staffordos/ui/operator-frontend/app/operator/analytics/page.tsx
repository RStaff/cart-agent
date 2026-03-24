import { AnalyticsPlaceholderCard } from "../../../components/operator/AnalyticsPlaceholderCard";
import { OperatorNav } from "../../../components/operator/OperatorNav";

export default function OperatorAnalyticsPage() {
  const sections = [
    {
      title: "Operator",
      description:
        "Operator analytics should summarize cross-product workload, queue health, and handoff visibility for the control plane.",
      placeholderNote: "No operator analytics summary endpoint is connected yet.",
    },
    {
      title: "Abando",
      description:
        "Abando analytics here should be a read-only operator summary, not a merchant dashboard or product workflow surface.",
      placeholderNote: "No Abando summary endpoint is connected to StaffordOS analytics yet.",
    },
    {
      title: "Shopifixer",
      description:
        "Shopifixer analytics should appear here only as cross-product operator-facing summaries once a product summary API exists.",
      placeholderNote: "No Shopifixer summary endpoint is connected yet.",
    },
    {
      title: "Actinventory",
      description:
        "Actinventory analytics should surface control-plane summaries for prioritization and tracking, not product execution logic.",
      placeholderNote: "No Actinventory summary endpoint is connected yet.",
    },
  ];

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS Analytics</p>
            <h1 className="title">Operator Analytics</h1>
            <p className="subtitle">
              Cross-product operator analytics belong in StaffordOS. Product dashboards stay inside product engines.
            </p>
            <OperatorNav activeHref="/operator/analytics" />
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Analytics Status</h2>
            <div className="kv">
              <div><strong>Audience:</strong> Operator-facing only</div>
              <div><strong>Connected summary APIs:</strong> None currently present in this frontend</div>
              <div><strong>Metric policy:</strong> No fabricated counts or realistic synthetic metrics</div>
            </div>
          </div>
        </section>

        <div className="grid gridTwo">
          {sections.map((section) => (
            <AnalyticsPlaceholderCard
              key={section.title}
              title={section.title}
              description={section.description}
              placeholderNote={section.placeholderNote}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
