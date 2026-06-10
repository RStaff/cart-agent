import Link from "next/link";
import { OperatorNav } from "./OperatorNav";
import { ExecutePrimaryActionButton } from "./ExecutePrimaryActionButton";
import { ProofRunWorkbench } from "./ProofRunWorkbench";

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

type ShopifixerCommandCenter = {
  merchant?: {
    store?: string;
    client_id?: string;
  };
  audit?: {
    score?: number;
    top_issue?: string;
    recommendation?: string;
  };
  offer?: {
    offer_status?: string;
    offer_price?: number;
    send_allowed?: boolean;
  };
  payment?: {
    payment_status?: string;
    readiness?: string;
  };
  fulfillment?: {
    fulfillment_status?: string;
    execution_status?: string;
    proof_status?: string;
  };
  lifecycle_lane?: {
    audit_complete?: boolean;
    conversion_brief_generated?: boolean;
    offer_sent?: boolean;
    payment_received?: boolean;
    fulfillment_started?: boolean;
    proof_complete?: boolean;
    completed?: boolean;
  };
  overall?: {
    current_stage?: string;
    next_required_action?: string;
    readiness_score?: number;
  };
};

type BeforeEvidenceAction = (formData: FormData) => Promise<void>;
type AfterEvidenceAction = (formData: FormData) => Promise<void>;
type ScopedFixAction = (formData: FormData) => Promise<void>;
type ProofPackageAction = (formData: FormData) => Promise<void>;
type CompletionAction = (formData: FormData) => Promise<void>;

type OperatorHomeV1Props = {
  primaryActionSnapshot: PrimaryActionSnapshot;
  preflightReport: PreflightReport;
  qaReport: QaReport;
  unitWorkSnapshot: UnitWorkSnapshot;
  shopifixerCommandCenter?: ShopifixerCommandCenter;
  beforeEvidenceAction: BeforeEvidenceAction;
  beforeEvidenceSaved?: boolean;
  beforeEvidenceDate?: string;
  afterEvidenceAction: AfterEvidenceAction;
  afterEvidenceSaved?: boolean;
  afterEvidenceDate?: string;
  scopedFixAction: ScopedFixAction;
  scopedFixSaved?: boolean;
  scopedFixDate?: string;
  proofPackageAction: ProofPackageAction;
  proofPackageSaved?: boolean;
  proofPackageDate?: string;
  completionAction: CompletionAction;
  completionSaved?: boolean;
  completionDate?: string;
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
  unitWorkSnapshot,
  shopifixerCommandCenter,
  beforeEvidenceAction,
  beforeEvidenceSaved,
  beforeEvidenceDate,
  afterEvidenceAction,
  afterEvidenceSaved,
  afterEvidenceDate,
  scopedFixAction,
  scopedFixSaved,
  scopedFixDate,
  proofPackageAction,
  proofPackageSaved,
  proofPackageDate,
  completionAction,
  completionSaved,
  completionDate
}: OperatorHomeV1Props) {
  const action = primaryActionSnapshot.primary_action || {};
  const evidence = Array.isArray(action.evidence) ? action.evidence : [];
  const risk = Array.isArray(action.risk) ? action.risk : [];
  const supportingWork = Array.isArray(unitWorkSnapshot.open_work) ? unitWorkSnapshot.open_work : [];
  const summary = unitWorkSnapshot.summary || {};
  const shopifixer = shopifixerCommandCenter || {};
  const shopifixerMerchant = shopifixer.merchant || {};
  const shopifixerAudit = shopifixer.audit || {};
  const shopifixerOffer = shopifixer.offer || {};
  const shopifixerPayment = shopifixer.payment || {};
  const shopifixerFulfillment = shopifixer.fulfillment || {};
  const shopifixerLifecycleLane = shopifixer.lifecycle_lane || {};
  const shopifixerOverall = shopifixer.overall || {};
  const lifecycleLaneStages = [
    { key: "audit_complete", label: "Audit Complete" },
    { key: "conversion_brief_generated", label: "Conversion Brief Generated" },
    { key: "offer_sent", label: "Offer Sent" },
    { key: "payment_received", label: "Payment Received" },
    { key: "fulfillment_started", label: "Fulfillment Started" },
    { key: "proof_complete", label: "Proof Package Complete" },
    { key: "completed", label: "Completed" }
  ] as const;
  const activeLifecycleStage = String(shopifixerOverall.current_stage || "").toLowerCase();
  const activeLifecycleIndex = lifecycleLaneStages.findIndex((stage) => stage.key === activeLifecycleStage);

  function lifecycleStageState(stageKey: string, index: number) {
    if (activeLifecycleIndex === index) return "active";
    const isComplete = Boolean((shopifixerLifecycleLane as Record<string, boolean | undefined>)[stageKey]);
    if (isComplete) return "complete";
    if (activeLifecycleIndex >= 0 && index < activeLifecycleIndex) return "blocked";
    return "pending";
  }

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

              <div className="hint">
                
      <div className="operatorMicroProof">
        <span className="badge success">Revenue path</span>
        <span className="badge success">Not blocked</span>
        <span className="badge warn">Human judgment</span>
      </div>
    
Expected outcome: {action.expected_outcome || "Outcome not yet defined."}
              </div>
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

        <section className="panel operatorHomeDetails" style={{ marginTop: 18 }}>
          <div className="panelInner">
            <p className="eyebrow">ShopiFixer Command Center</p>
            <h2 className="sectionTitle" style={{ marginTop: 0 }}>Lifecycle status for the active merchant</h2>
            <div className="operatorHomeSummaryPills" style={{ marginBottom: 16 }}>
              <span>Merchant: {shopifixerMerchant.store || "unavailable"}</span>
              <span>Client ID: {shopifixerMerchant.client_id || "unavailable"}</span>
              <span>Audit: {shopifixerAudit.score ?? 0}</span>
              <span>Offer: {shopifixerOffer.offer_status || "unavailable"}</span>
              <span>Payment: {shopifixerPayment.payment_status || "unavailable"}</span>
              <span>Fulfillment: {shopifixerFulfillment.fulfillment_status || "unavailable"}</span>
            </div>
            <div className="operatorHomeActionCard" style={{ marginTop: 0 }}>
              <div className="operatorHomeActionFooter">
                <div>
                  <small>Top issue</small>
                  <strong>{shopifixerAudit.top_issue || "unavailable"}</strong>
                </div>
                <div>
                  <small>Send allowed</small>
                  <strong>{String(Boolean(shopifixerOffer.send_allowed))}</strong>
                </div>
                <div>
                  <small>Readiness</small>
                  <strong>{shopifixerOverall.readiness_score ?? 0}</strong>
                </div>
              </div>
              <div className="operatorHomeNextStep" style={{ marginTop: 16 }}>
                <span>Next required action</span>
                <strong>{shopifixerOverall.next_required_action || "unavailable"}</strong>
              </div>
              <div className="operatorHomeActionFooter" style={{ marginTop: 16 }}>
                <div>
                  <small>Current stage</small>
                  <strong>{shopifixerOverall.current_stage || "unavailable"}</strong>
                </div>
                <div>
                  <small>Execution</small>
                  <strong>{shopifixerFulfillment.execution_status || "unavailable"}</strong>
                </div>
                <div>
                  <small>Proof</small>
                  <strong>{shopifixerFulfillment.proof_status || "unavailable"}</strong>
                </div>
              </div>
              <p className="hint" style={{ marginTop: 14 }}>
                {shopifixerAudit.recommendation || "unavailable"}
              </p>
            </div>

            <div className="operatorHomeActionCard" style={{ marginTop: 16 }}>
              <div className="operatorHomeActionFooter">
                <div>
                  <small>Merchant</small>
                  <strong>{shopifixerMerchant.store || "unavailable"}</strong>
                </div>
                <div>
                  <small>Current stage</small>
                  <strong>{shopifixerOverall.current_stage || "unavailable"}</strong>
                </div>
                <div>
                  <small>Readiness score</small>
                  <strong>{shopifixerOverall.readiness_score ?? "—"}</strong>
                </div>
                <div>
                  <small>Payment status</small>
                  <strong>{shopifixerPayment.payment_status || "unavailable"}</strong>
                </div>
                <div>
                  <small>Fulfillment status</small>
                  <strong>{shopifixerFulfillment.fulfillment_status || "unavailable"}</strong>
                </div>
                <div>
                  <small>Execution status</small>
                  <strong>{shopifixerFulfillment.execution_status || "unavailable"}</strong>
                </div>
                <div>
                  <small>Proof status</small>
                  <strong>{shopifixerFulfillment.proof_status || "unavailable"}</strong>
                </div>
                <div>
                  <small>Next required action</small>
                  <strong>{shopifixerOverall.next_required_action || "unavailable"}</strong>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <small className="eyebrow">Lifecycle Lane</small>
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    marginTop: 10,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
                  }}
                >
                  {lifecycleLaneStages.map((stage, index) => {
                    const state = lifecycleStageState(stage.key, index);
                    return (
                      <div
                        key={stage.key}
                        className={`operatorHomeProofBadge ${state === "complete" ? "operatorHomeProofGood" : state === "active" ? "operatorHomeProofWarn" : ""}`}
                        style={{
                          alignItems: "flex-start",
                          minHeight: 72
                        }}
                      >
                        <span>{stage.label}</span>
                        <strong style={{ textTransform: "capitalize" }}>{state}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              <ProofRunWorkbench
                stage="before_evidence"
                merchant={shopifixerMerchant}
                proofRunPath="staffordos/proof_runs/internal_shopifixer_dry_run_v1/"
                date={beforeEvidenceDate || ""}
                saved={beforeEvidenceSaved}
                onSubmit={beforeEvidenceAction}
              />

              <ProofRunWorkbench
                stage="scoped_fix"
                merchant={shopifixerMerchant}
                proofRunPath="staffordos/proof_runs/internal_shopifixer_dry_run_v1/"
                date={scopedFixDate || beforeEvidenceDate || ""}
                saved={scopedFixSaved}
                onSubmit={scopedFixAction}
              />

              <ProofRunWorkbench
                stage="after_evidence"
                merchant={shopifixerMerchant}
                proofRunPath="staffordos/proof_runs/internal_shopifixer_dry_run_v1/"
                date={afterEvidenceDate || scopedFixDate || beforeEvidenceDate || ""}
                saved={afterEvidenceSaved}
                onSubmit={afterEvidenceAction}
              />

              <ProofRunWorkbench
                stage="proof_package"
                merchant={shopifixerMerchant}
                proofRunPath="staffordos/proof_runs/internal_shopifixer_dry_run_v1/"
                date={proofPackageDate || afterEvidenceDate || scopedFixDate || beforeEvidenceDate || ""}
                saved={proofPackageSaved}
                onSubmit={proofPackageAction}
              />

              <ProofRunWorkbench
                stage="completion"
                merchant={shopifixerMerchant}
                proofRunPath="staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json"
                date={completionDate || proofPackageDate || afterEvidenceDate || scopedFixDate || beforeEvidenceDate || ""}
                saved={completionSaved}
                onSubmit={completionAction}
              />
            </div>
          </div>
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
