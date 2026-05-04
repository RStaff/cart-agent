import Link from "next/link";
import { OperatorNav } from "./OperatorNav";
import { ExecutePrimaryActionButton } from "./ExecutePrimaryActionButton";

type PrimaryActionSnapshot = {
  schema?: string;
  generated_at?: string;
  primary_action?: {
    action_id?: string;
    action_label?: string;
    action_type?: string;
    domain_id?: string;
    product_id?: string;
    owner?: string;
    priority_score?: number;
    urgency?: string;
    confidence?: number;
    confidence_band?: string;
    evidence?: string[];
    risk?: string[];
    next_step?: string;
    expected_outcome?: string;
  };
};

type PreflightReport = {
  status?: string;
  findings?: unknown[];
};

type QaReport = {
  verdict?: string;
  score?: number;
  findings?: unknown[];
};

type UnitWorkSnapshot = {
  summary?: {
    domains?: number;
    opportunities?: number;
    issues?: number;
    delivery_units?: number;
    actions?: number;
    memory_units?: number;
    outcome_events?: number;
  };
  open_work?: Array<{
    unit_id?: string;
    type?: string;
    domain_id?: string;
    status?: string;
    stage?: string;
    owner?: string;
    next_action?: string;
  }>;
};

type OperatorHomeV1Props = {
  primaryActionSnapshot: PrimaryActionSnapshot;
  preflightReport: PreflightReport;
  qaReport: QaReport;
  unitWorkSnapshot: UnitWorkSnapshot;
};

function percent(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function proofStatus(label: string, value: string | number | undefined, goodValues: string[]) {
  const text = value === undefined || value === null || value === "" ? "unknown" : String(value);
  const ok = goodValues.includes(text.toLowerCase());

  return (
    <div className={`operatorHomeProofBadge ${ok ? "operatorHomeProofGood" : "operatorHomeProofWarn"}`}>
      <span>{label}</span>
      <strong>{text}</strong>
    </div>
  );
}

export function OperatorHomeV1({
  primaryActionSnapshot,
  preflightReport,
  qaReport,
  unitWorkSnapshot
}: OperatorHomeV1Props) {
  const action = primaryActionSnapshot.primary_action || {};
  const evidence = Array.isArray(action.evidence) ? action.evidence : [];
  const risk = Array.isArray(action.risk) ? action.risk : [];
  const supportingWork = Array.isArray(unitWorkSnapshot.open_work) ? unitWorkSnapshot.open_work : [];
  const summary = unitWorkSnapshot.summary || {};

  return (
    <main className="shell">
      <div className="container operatorHomeContainer">
        <section className="panel operatorHomeHero">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS Operator Home v1</p>

            <div className="operatorHomeTitleRow">
              <div>
                <h1 className="title">What should Ross do next?</h1>
                <p className="subtitle">
                  One canonical action, one next move, three proof checks. Everything else is supporting context.
                </p>
              </div>
            </div>

            <OperatorNav activeHref="/operator/command-center" />

            <div className="operatorHomeProofRow">
              {proofStatus("Preflight", preflightReport.status, ["go"])}
              {proofStatus("QA Gate", qaReport.verdict, ["pass"])}
              {proofStatus("Confidence", percent(action.confidence), ["90%", "91%", "92%", "93%", "94%", "95%", "96%", "97%", "98%", "99%", "100%"])}
            </div>

            <article className="operatorHomeActionCard">
              <div className="operatorHomeActionMeta">
                <span>{action.action_type || "action"}</span>
                <span>{action.product_id || action.domain_id || "domain"}</span>
                <span>{action.urgency || "urgency_unknown"}</span>
                <span>{percent(action.confidence)} confidence</span>
              </div>

              <h2>{action.action_label || "No primary action resolved."}</h2>

              <div className="operatorHomeNextStep">
                <span>Next step</span>
                <strong>{action.next_step || "Resolve the next action snapshot."}</strong>
              </div>

              <div className="operatorHomeActionFooter">
                <div>
                  <small>Owner</small>
                  <strong>{action.owner || "unknown"}</strong>
                </div>
                <div>
                  <small>Priority</small>
                  <strong>{action.priority_score ?? "—"}</strong>
                </div>
                <div>
                  <small>Confidence band</small>
                  <strong>{action.confidence_band || "unknown"}</strong>
                </div>
              </div>

              <div className="operatorHomeCTAGroup">
                <ExecutePrimaryActionButton />
                <Link className="button" href="/operator/revenue-command">
                  View revenue context
                </Link>
              </div>

              <p className="hint">
                
      <div className="operatorMicroProof">
        <span className="badge success">Revenue path</span>
        <span className="badge success">Not blocked</span>
        <span className="badge warn">Human judgment</span>
      </div>
    
Expected outcome: {action.expected_outcome || "Outcome not yet defined."}
              </p>
            </article>
          </div>
        </section>

        <section className="grid gridTwo">
          <details className="panel operatorHomeDetails">
            <summary>Why this action? (hidden)</summary>
            <div className="panelInner">
              {evidence.length ? (
                <ul>
                  {evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="hint">No evidence recorded.</p>
              )}
            </div>
          </details>

          <details className="panel operatorHomeDetails">
            <summary>Guardrails / risks (hidden)</summary>
            <div className="panelInner">
              {risk.length ? (
                <ul>
                  {risk.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="hint">No risk notes recorded.</p>
              )}
            </div>
          </details>
        </section>

        <details className="panel operatorHomeDetails">
          <summary>Supporting system context (hidden)</summary>
          <div className="panelInner">
            <div className="operatorHomeSummaryPills">
              <span>Domains: {summary.domains ?? 0}</span>
              <span>Opportunities: {summary.opportunities ?? 0}</span>
              <span>Issues: {summary.issues ?? 0}</span>
              <span>Delivery: {summary.delivery_units ?? 0}</span>
              <span>Actions: {summary.actions ?? 0}</span>
              <span>Memory: {summary.memory_units ?? 0}</span>
              <span>Outcomes: {summary.outcome_events ?? 0}</span>
            </div>

            <div className="operatorHomeSupportGrid">
              {supportingWork.slice(0, 6).map((unit) => (
                <article key={unit.unit_id} className="operatorHomeSupportCard">
                  <div>
                    <strong>{unit.unit_id}</strong>
                    <p>{unit.type} · {unit.domain_id} · {unit.status}</p>
                  </div>
                  <p>{unit.next_action || "No next action recorded."}</p>
                </article>
              ))}
            </div>
          </div>
        </details>

        <p className="hint operatorHomeGenerated">
          Primary action snapshot generated: {primaryActionSnapshot.generated_at || "unknown"}
        </p>
      </div>
    </main>
  );
}
