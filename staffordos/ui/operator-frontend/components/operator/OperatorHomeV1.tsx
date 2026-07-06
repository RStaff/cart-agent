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
  checkout_linkage?: {
    packet_id?: string | null;
    reservation_id?: string | null;
    store_domain?: string | null;
    payment_reference?: string | null;
    status?: string | null;
    continuity_status?: string | null;
    shopifixer_url?: string | null;
    pricing_url?: string | null;
    merchant_workspace_url?: string | null;
    packet_authority_url?: string | null;
  };
  customer_outcomes?: Array<{
    customer?: string;
    outcome_state?: string;
    why?: string;
    suggested_next_action?: string;
    revenue_impact?: string;
    visible_on_fulfillment?: boolean;
    completed?: boolean;
    completed_at?: string | null;
  }>;
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
  const readinessScore = Number(shopifixerOverall.readiness_score);
  const readinessDisplay = Number.isFinite(readinessScore) ? `${Math.round(readinessScore)}/100` : "—";
  const readinessGoodValues = Array.from({ length: 11 }, (_, index) => `${90 + index}/100`);
  const shopifixerCheckoutLinkage = shopifixer.checkout_linkage || {};
  const customerOutcomes = Array.isArray(shopifixer.customer_outcomes) ? shopifixer.customer_outcomes : [];
  const visibleCustomerOutcomes = customerOutcomes.filter((outcome) => outcome.visible_on_fulfillment);
  const lifecycleLaneStages = [
    { key: "audit_complete", label: "Work ready" },
    { key: "conversion_brief_generated", label: "Scope written" },
    { key: "offer_sent", label: "Offer sent" },
    { key: "payment_received", label: "Payment received" },
    { key: "fulfillment_started", label: "Work started" },
    { key: "proof_complete", label: "Proof ready" },
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
            <p className="eyebrow">StaffordOS Fulfillment</p>

            <div className="operatorHomeTitleRow">
              <div>
                <h1 className="title">What paid work needs attention?</h1>
                <p className="subtitle">
                  One paid work item, the proof that is still missing, and the next fulfillment step.
                </p>
              </div>
            </div>

            <OperatorNav activeHref="/operator/command-center" />

            <div className="operatorHomeProofRow">
              {proofStatus("Work check", preflightReport.status, ["go"])}
              {proofStatus("Proof gate", qaReport.verdict, ["pass"])}
              {proofStatus("Readiness", readinessDisplay, readinessGoodValues)}
            </div>

            <article className="operatorHomeActionCard">
              <div className="operatorHomeActionMeta">
                <span>{action.action_type || "action"}</span>
                <span>{action.product_id || action.domain_id || "domain"}</span>
                <span>{action.urgency || "urgency_unknown"}</span>
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
                  View payment context
                </Link>
              </div>

              <div className="hint">
                
      <div className="operatorMicroProof">
        <span className="badge success">Paid work path</span>
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
            <summary>Why this fulfillment step? (hidden)</summary>
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
              <summary>Completion blockers (hidden)</summary>
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
            <p className="eyebrow">Fulfillment</p>
            <h2 className="sectionTitle" style={{ marginTop: 0 }}>Status for the active customer</h2>
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
                  <small>What is blocked</small>
                  <strong>{shopifixerAudit.top_issue || "unavailable"}</strong>
                </div>
                <div>
                  <small>Can proceed</small>
                  <strong>{String(Boolean(shopifixerOffer.send_allowed))}</strong>
                </div>
                <div>
                  <small>Readiness</small>
                  <strong>{shopifixerOverall.readiness_score ?? 0}</strong>
                </div>
              </div>
              <div className="operatorHomeNextStep" style={{ marginTop: 16 }}>
                <span>Next fulfillment action</span>
                <strong>{shopifixerOverall.next_required_action || "unavailable"}</strong>
              </div>
              <div className="operatorHomeActionFooter" style={{ marginTop: 16 }}>
                <div>
                  <small>Fulfillment stage</small>
                  <strong>{shopifixerOverall.current_stage || "unavailable"}</strong>
                </div>
                <div>
                  <small>Work status</small>
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
                  <small>Packet ID</small>
                  <strong>{shopifixerCheckoutLinkage.packet_id || "unavailable"}</strong>
                </div>
                <div>
                  <small>Reservation ID</small>
                  <strong>{shopifixerCheckoutLinkage.reservation_id || "unavailable"}</strong>
                </div>
                <div>
                  <small>Payment status</small>
                  <strong>{shopifixerCheckoutLinkage.status || "unavailable"}</strong>
                </div>
                <div>
                  <small>Continuity</small>
                  <strong>{shopifixerCheckoutLinkage.continuity_status || "unavailable"}</strong>
                </div>
              </div>
              <div className="operatorHomeNextStep" style={{ marginTop: 16 }}>
                <span>Checkout linkage</span>
                <strong>{shopifixerCheckoutLinkage.store_domain || shopifixerMerchant.store || "unavailable"}</strong>
              </div>
              <div className="operatorHomeCTAGroup" style={{ marginTop: 16, flexWrap: "wrap" }}>
                {shopifixerCheckoutLinkage.shopifixer_url ? (
                  <Link className="button" href={shopifixerCheckoutLinkage.shopifixer_url}>
                    Open ShopiFixer
                  </Link>
                ) : null}
                {shopifixerCheckoutLinkage.pricing_url ? (
                  <Link className="button" href={shopifixerCheckoutLinkage.pricing_url}>
                    Open Pricing
                  </Link>
                ) : null}
                {shopifixerCheckoutLinkage.merchant_workspace_url ? (
                  <Link className="button" href={shopifixerCheckoutLinkage.merchant_workspace_url}>
                    Open Merchant Workspace
                  </Link>
                ) : null}
                {shopifixerCheckoutLinkage.packet_authority_url ? (
                  <Link className="button" href={shopifixerCheckoutLinkage.packet_authority_url}>
                    Open Packet Authority
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="operatorHomeActionCard" style={{ marginTop: 16 }}>
              <div className="operatorHomeActionFooter">
                <div>
                  <small>Merchant</small>
                  <strong>{shopifixerMerchant.store || "unavailable"}</strong>
                </div>
                <div>
                  <small>Fulfillment stage</small>
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
                  <small>Work status</small>
                  <strong>{shopifixerFulfillment.execution_status || "unavailable"}</strong>
                </div>
                <div>
                  <small>Proof status</small>
                  <strong>{shopifixerFulfillment.proof_status || "unavailable"}</strong>
                </div>
                <div>
                  <small>Next fulfillment action</small>
                  <strong>{shopifixerOverall.next_required_action || "unavailable"}</strong>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <small className="eyebrow">Work path</small>
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

              {visibleCustomerOutcomes.length > 0 ? (
                <div className="operatorHomeActionCard" style={{ marginTop: 16 }}>
                    <p className="eyebrow">Outcome</p>
                    <h3 className="sectionTitle" style={{ marginTop: 0, marginBottom: 10 }}>
                      What happened after completion?
                    </h3>
                    <div className="operatorHomeSupportGrid">
                      {visibleCustomerOutcomes.map((outcome) => (
                        <article key={`${outcome.customer || "customer"}-${outcome.outcome_state || "outcome"}`} className="operatorHomeSupportCard">
                          <div>
                            <strong>{outcome.customer || "unavailable"}</strong>
                            <p>{outcome.outcome_state || "Awaiting Outcome Review"}</p>
                          </div>
                          <p>{outcome.why || "No outcome reason recorded."}</p>
                          <p>{outcome.suggested_next_action || "No next action recorded."}</p>
                          <p className="hint">Revenue impact: {outcome.revenue_impact || "unknown"}</p>
                        </article>
                      ))}
                    </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <details className="panel operatorHomeDetails">
          <summary>Additional fulfillment context (hidden)</summary>
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
          Work snapshot refreshed: {primaryActionSnapshot.generated_at || "unknown"}
        </p>
      </div>
    </main>
  );
}
