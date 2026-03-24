import { LeadQueue } from "../../../components/operator/LeadQueue";
import { OperatorNav } from "../../../components/operator/OperatorNav";

export default function OperatorLeadsPage() {
  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS Leads</p>
            <h1 className="title">Operator Leads</h1>
            <p className="subtitle">
              Cross-product lead coordination belongs in StaffordOS. This workspace should route and prioritize leads without absorbing product-specific workflows.
            </p>
            <OperatorNav activeHref="/operator/leads" />
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Workspace Scope</h2>
            <div className="kv">
              <div><strong>Owner:</strong> StaffordOS control plane</div>
              <div><strong>Purpose:</strong> Lead routing, prioritization, and operator follow-up across products</div>
              <div><strong>Product-specific execution:</strong> Kept out of this route</div>
            </div>
          </div>
        </section>

        <LeadQueue />
      </div>
    </main>
  );
}
