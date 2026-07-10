import Link from "next/link";
import { ExecutePrimaryActionButton } from "./ExecutePrimaryActionButton";
import { ProofRunWorkbench } from "./ProofRunWorkbench";

type PhaseState = "available" | "current" | "blocked" | "complete";

type Phase = {
  key: string;
  label: string;
  state: PhaseState;
  status: PhaseState;
  href: string;
  blockedReason: string;
  nextSafeAction: string;
  authority: string;
  note: string;
  ctaLabel: string;
  ctaHref: string;
};

type StatusLine = {
  label: string;
  value: string;
};

type ContextCard = {
  label: string;
  value: string;
  note: string;
  href?: string | null;
};

type ScopeSummary = {
  status: string;
  issue: string;
  proposedFix: string;
  inScope: string[];
  outOfScope: string[];
  merchantApprovalNeeded: string;
  currentOffer: string;
  currentPrice: string;
  successCriteria: string;
  missingFields: string[];
  sourceState: string;
};

type EvidenceArtifactSummary = {
  artifactId: string;
  createdAt: string;
  outputPath: string;
  sourceWriter: string;
  screenshotStatus: string;
  screenshotReference: string;
  screenshotStoredPath: string;
  screenshotArtifactId: string;
};

type ExecuteSummary = {
  status: string;
  primaryAction: string;
  actionType: string;
  domain: string;
  merchant: string;
  product: string;
  owner: string;
  confidence: string;
  executionModeDecision: string;
  executionModeExecutionMode: string;
  lastLaunchedAt: string;
  lastCompletedAt: string;
  lastFailedAt: string;
  executionArtifactPaths: string[];
  blockingReasons: string[];
  missingTruthOrGates: string[];
  preflightStatus: string;
  qaStatus: string;
  latestExecutionStatus: string;
  latestExecutionEvent: string;
  outcomeEventStatus: string;
  rollbackAvailability: string;
  fixScopeReadiness: string;
  primaryActionSource: string;
};

type AfterEvidenceArtifactSummary = {
  artifactId: string;
  createdAt: string;
  outputPath: string;
  sourceWriter: string;
  screenshotStatus: string;
  screenshotReference: string;
  screenshotStoredPath: string;
  screenshotArtifactId: string;
};

type AfterEvidenceSummary = {
  status: string;
  path: string;
  observedImprovement: string;
  merchantFacingSummary: string;
  remainingLimitations: string;
  screenshotReference: string;
  artifactIds: string[];
  artifacts: AfterEvidenceArtifactSummary[];
  lastCapturedAt: string;
};

type ProofAndSealSummary = {
  status: string;
  proofPackagePath: string;
  proofPackageVersion: string;
  proofRunId: string;
  generatedAt: string;
  manifestPath: string;
  manifestArtifactCount: string;
  evidenceSourcePaths: string[];
  sealStatus: string;
  sha256: string;
  sha256MatchStatus: string;
  missingScreenshotArtifactCount: string;
};

type DeliverySummary = {
  deliveryStatus: string;
  merchantDeliveryStatus: string;
  proofPackageReady: string;
  checksumSealStatus: string;
  offerStatus: string;
  paymentStatus: string;
  currentPaymentStatus: string;
  completionStatus: string;
  currentNextAction: string;
  recommendedOperatorAction: string;
  revenueOpportunity: string;
  completionReadiness: string;
  latestOutcomeEvent: string;
  latestSnapshot: string;
  latestRevenueState: string;
};

type RecommendedNextStep = {
  phaseLabel: string;
  state: string;
  blockedReason: string;
  missingTruthOrGate: string;
  nextSafeAction: string;
  href: string;
};

type ShopifixerPilotWorkspaceProps = {
  merchant: {
    store: string;
    clientId: string;
  };
  packet: {
    packetId: string;
    reservationId: string;
    paymentStatus: string;
    continuityStatus: string;
  };
  campaign: {
    campaignId: string;
    campaignType: string;
    totalCampaigns: number;
  };
  lead: {
    totalLeads: number;
    leadName: string;
  };
  workday: {
    status: string;
    heartbeat: string;
    safeMode: string;
    loopsRun: string;
  };
  proofRunId: string;
  currentPhase: string;
  phases: Phase[];
  progress: {
    completed: number;
    total: number;
  };
  merchantContext: ContextCard[];
  scopeSummary: ScopeSummary;
  scopeWorkbenchAction: (formData: FormData) => Promise<void>;
  scopeWorkbenchSaved: boolean;
  scopeWorkbenchDate: string;
  beforeEvidenceAction: (formData: FormData) => Promise<void>;
  beforeEvidenceSaved: boolean;
  beforeEvidenceDate: string;
  afterEvidenceAction: (formData: FormData) => Promise<void>;
  afterEvidenceSaved: boolean;
  afterEvidenceDate: string;
  proofPackageAction: (formData: FormData) => Promise<void>;
  proofPackageSaved: boolean;
  proofPackageDate: string;
  completionAction: (formData: FormData) => Promise<void>;
  completionSaved: boolean;
  completionDate: string;
  beforeEvidenceSummary: {
    status: string;
    path: string;
    issue: string;
    whyItMatters: string;
    artifactIds: string[];
    artifacts: EvidenceArtifactSummary[];
    lastCapturedAt: string;
  };
  executeSummary: ExecuteSummary;
  afterEvidenceSummary: AfterEvidenceSummary;
  proofAndSealSummary: ProofAndSealSummary;
  deliverySummary: DeliverySummary;
  recommendedNextStep: RecommendedNextStep;
  evidenceStatus: StatusLine[];
  validationStatus: StatusLine[];
  previousWork: string;
};

function badgeClass(status: PhaseState) {
  if (status === "complete") return "healthGood";
  if (status === "current") return "healthWarn";
  if (status === "blocked") return "healthCritical";
  return "healthBadge";
}

export function ShopifixerPilotWorkspace({
  merchant,
  packet,
  campaign,
  lead,
  workday,
  proofRunId,
  currentPhase,
  phases,
  progress,
  merchantContext,
  scopeSummary,
  scopeWorkbenchAction,
  scopeWorkbenchSaved,
  scopeWorkbenchDate,
  beforeEvidenceAction,
  beforeEvidenceSaved,
  beforeEvidenceDate,
  afterEvidenceAction,
  afterEvidenceSaved,
  afterEvidenceDate,
  proofPackageAction,
  proofPackageSaved,
  proofPackageDate,
  completionAction,
  completionSaved,
  completionDate,
  beforeEvidenceSummary,
  executeSummary,
  afterEvidenceSummary,
  proofAndSealSummary,
  deliverySummary,
  recommendedNextStep,
  evidenceStatus,
  validationStatus,
  previousWork
}: ShopifixerPilotWorkspaceProps) {
  const activePhase = phases.find((phase) => phase.key === currentPhase) || phases[0];
  const executeCanLaunch =
    executeSummary.status === "Execute Ready" &&
    executeSummary.blockingReasons.length === 0 &&
    executeSummary.missingTruthOrGates.length === 0;
  const deliveryCanComplete =
    deliverySummary.completionReadiness === "Ready for Completion" &&
    deliverySummary.checksumSealStatus.toLowerCase() === "sealed";
  const executeConfirmation =
    "This invokes the governed StaffordOS execution spine. It does not automatically send email or collect payment. External actions remain subject to their existing governed workflows. I am confirming the displayed action only.";

  return (
    <div className="container shopifixerPilotWorkspace">
      <section className="panel dailyBriefPanel">
        <div className="panelInner">
          <p className="eyebrow">ShopiFixer Pilot Workspace</p>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <h1 className="title">One merchant, one governed engagement</h1>
              <p className="subtitle">
                Execute the full ShopiFixer pilot from merchant context through delivery without leaving the workspace.
              </p>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <Link href="/operator/command-center" className="chip">Open Executive</Link>
              <Link href="/operator/revenue-command" className="chip">Open Revenue</Link>
              <Link href="/operator/system-map" className="chip">Open System Map</Link>
            </div>
          </div>

          <div className="row" style={{ marginTop: 18 }}>
            <span className="chip">Merchant: {merchant.store}</span>
            <span className="chip">Current Phase: {activePhase.label}</span>
            <span className="chip">Packet: {packet.packetId}</span>
            <span className="chip">Proof Run: {proofRunId}</span>
            <span className="chip">Workday: {workday.status}</span>
          </div>
        </div>
      </section>

      <section className="grid gridThree shopifixerPilotGrid">
        <article className="panel">
          <div className="panelInner">
            <p className="eyebrow">Left Rail</p>
            <h2 className="sectionTitle">Current phase</h2>
            <div className="shopifixerPilotRail">
              {phases.map((phase) => (
                <Link
                  key={phase.key}
                  href={phase.href}
                  className={`shopifixerPilotPhaseButton ${badgeClass(phase.state)}${phase.key === activePhase.key ? " shopifixerPilotPhaseButtonActive" : ""}`}
                >
                  <span>{phase.label}</span>
                  <strong>{phase.state}</strong>
                  <span className="boardCardNote">{phase.state === "blocked" ? phase.blockedReason : phase.note}</span>
                </Link>
              ))}
            </div>

            <div style={{ marginTop: 18 }}>
              <p className="eyebrow">Primary CTA</p>
              <Link href={activePhase.ctaHref} className="button buttonPrimary" style={{ display: "block", textAlign: "center", width: "100%" }}>
                {activePhase.ctaLabel}
              </Link>
            </div>

            <div style={{ marginTop: 12 }}>
              <p className="eyebrow">Secondary CTA</p>
              <Link href="/operator/command-center" className="button" style={{ display: "block", textAlign: "center", width: "100%" }}>
                Open Executive
              </Link>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panelInner">
            <p className="eyebrow">Center</p>
            <h2 className="sectionTitle">Merchant context</h2>
            <div className="shopifixerPilotPlaceholder">
              <p className="subtitle" style={{ marginTop: 0 }}>
                {activePhase.label} is the only active phase in this shell. The panel below uses repository truth only and
                leaves the remaining phases as disabled placeholders.
              </p>
              <div className="grid gridTwo">
                {merchantContext.map((card) => (
                  <article key={card.label} className="boardCard">
                    <p className="boardCardTitle">{card.label}</p>
                    <p className="boardCardMeta">{card.value}</p>
                    <p className="boardCardNote">{card.note}</p>
                    {card.href ? (
                      <div style={{ marginTop: 10 }}>
                        <Link href={card.href} className="inlineLink">
                          Open related surface
                        </Link>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
                <div className="kv" style={{ marginTop: 16 }}>
                <div><strong>Current phase:</strong> {activePhase.label}</div>
                <div><strong>Status:</strong> {activePhase.state.replace("_", " ")}</div>
                <div><strong>Merchant:</strong> {merchant.store}</div>
                <div><strong>Previous work:</strong> {previousWork}</div>
              </div>

              {currentPhase === "scope" ? (
                <div className="boardCard" style={{ marginTop: 16 }}>
                  <p className="boardCardTitle">Scope Workbench</p>
                  <p className="boardCardMeta">{scopeSummary.status}</p>
                  <ProofRunWorkbench
                    stage="scoped_fix"
                    merchant={{ store: merchant.store, client_id: merchant.clientId }}
                    proofRunPath="staffordos/proof_runs/internal_shopifixer_dry_run_v1/"
                    date={scopeWorkbenchDate}
                    saved={scopeWorkbenchSaved}
                    onSubmit={scopeWorkbenchAction}
                  />
                </div>
              ) : null}

              <div className="boardCard" style={{ marginTop: 16 }}>
                <p className="boardCardTitle">Scope</p>
                <p className="boardCardMeta">{scopeSummary.status}</p>
                <div className="kv">
                  <div><strong>Issue / problem summary:</strong> {scopeSummary.issue}</div>
                  <div><strong>Proposed scoped fix:</strong> {scopeSummary.proposedFix}</div>
                  <div><strong>Current offer:</strong> {scopeSummary.currentOffer}</div>
                  <div><strong>Current price:</strong> {scopeSummary.currentPrice}</div>
                  <div><strong>Merchant approval needed:</strong> {scopeSummary.merchantApprovalNeeded}</div>
                  <div><strong>Blocking reason:</strong> {scopeSummary.status === "Scope Complete" ? "Not blocked" : scopeSummary.missingFields.length ? `Missing fields: ${scopeSummary.missingFields.join(", ")}` : scopeSummary.status}</div>
                  <div><strong>Missing fields:</strong> {scopeSummary.missingFields.length ? scopeSummary.missingFields.join(", ") : "Not Yet Available"}</div>
                </div>
                <div className="grid gridTwo" style={{ marginTop: 12 }}>
                  <div>
                    <p className="eyebrow">In scope</p>
                    <div className="kv">
                      {scopeSummary.inScope.length ? (
                        scopeSummary.inScope.map((item) => <div key={item}>{item}</div>)
                      ) : (
                        <div>Not Yet Available</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="eyebrow">Out of scope</p>
                    <div className="kv">
                      {scopeSummary.outOfScope.length ? (
                        scopeSummary.outOfScope.map((item) => <div key={item}>{item}</div>)
                      ) : (
                        <div>Not Yet Available</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="kv" style={{ marginTop: 12 }}>
                  <div><strong>Success criteria:</strong> {scopeSummary.successCriteria}</div>
                  <div><strong>Source state:</strong> {scopeSummary.sourceState}</div>
                </div>
                <div className="kv" style={{ marginTop: 12 }}>
                  <div><strong>Next safe action:</strong> {scopeSummary.status === "Scope Complete" ? "Continue to Before Evidence" : "Review Scope"}</div>
                </div>
              </div>

              {currentPhase === "before_evidence" ? (
                scopeSummary.status === "Scope Complete" ? (
                  <div className="boardCard" style={{ marginTop: 16 }}>
                    <p className="boardCardTitle">Before Evidence Workbench</p>
                    <p className="boardCardMeta">{beforeEvidenceSummary.status}</p>
                    <ProofRunWorkbench
                      stage="before_evidence"
                      merchant={{ store: merchant.store, client_id: merchant.clientId }}
                      proofRunPath="staffordos/proof_runs/internal_shopifixer_dry_run_v1/"
                      date={beforeEvidenceDate}
                      saved={beforeEvidenceSaved}
                      onSubmit={beforeEvidenceAction}
                    />
                  </div>
                ) : (
                  <div className="boardCard" style={{ marginTop: 16 }}>
                    <p className="boardCardTitle">Before Evidence Workbench</p>
                    <p className="boardCardMeta">Blocked</p>
                    <div className="kv">
                      <div><strong>Blocking reason:</strong> Scope incomplete</div>
                      <div><strong>Missing truth:</strong> {scopeSummary.missingFields.length ? scopeSummary.missingFields.join(", ") : "fix_scope.md"}</div>
                      <div><strong>Exact next safe action:</strong> Review Scope</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link href="/operator/shopifixer-pilot?phase=scope" className="inlineLink">
                        Open Scope phase
                      </Link>
                    </div>
                  </div>
                )
              ) : null}

              {currentPhase === "after_evidence" ? (
                scopeSummary.status !== "Scope Complete" ? (
                  <div className="boardCard" style={{ marginTop: 16 }}>
                    <p className="boardCardTitle">After Evidence Workbench</p>
                    <p className="boardCardMeta">Blocked</p>
                    <div className="kv">
                      <div><strong>Blocking reason:</strong> Scope incomplete</div>
                      <div><strong>Missing truth or gate:</strong> {scopeSummary.missingFields.length ? scopeSummary.missingFields.join(", ") : "fix_scope.md"}</div>
                      <div><strong>Exact next safe action:</strong> Review Scope</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link href="/operator/shopifixer-pilot?phase=scope" className="inlineLink">
                        Open Scope phase
                      </Link>
                    </div>
                  </div>
                ) : !beforeEvidenceSummary.artifactIds.length ? (
                  <div className="boardCard" style={{ marginTop: 16 }}>
                    <p className="boardCardTitle">After Evidence Workbench</p>
                    <p className="boardCardMeta">Blocked</p>
                    <div className="kv">
                      <div><strong>Blocking reason:</strong> Before Evidence Missing</div>
                      <div><strong>Missing truth or gate:</strong> before_evidence.md / evidence_manifest_v1.json</div>
                      <div><strong>Exact next safe action:</strong> Capture Before Evidence</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link href="/operator/shopifixer-pilot?phase=before-evidence" className="inlineLink">
                        Open Before Evidence phase
                      </Link>
                    </div>
                  </div>
                ) : executeSummary.status !== "Execute Complete" ? (
                  <div className="boardCard" style={{ marginTop: 16 }}>
                    <p className="boardCardTitle">After Evidence Workbench</p>
                    <p className="boardCardMeta">Blocked</p>
                    <div className="kv">
                      <div><strong>Blocking reason:</strong> Execution incomplete</div>
                      <div><strong>Missing truth or gate:</strong> {executeSummary.status}</div>
                      <div><strong>Exact next safe action:</strong> Review Execution Readiness</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link href="/operator/shopifixer-pilot?phase=execute" className="inlineLink">
                        Open Execute phase
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="boardCard" style={{ marginTop: 16 }}>
                    <p className="boardCardTitle">After Evidence Workbench</p>
                    <p className="boardCardMeta">{afterEvidenceSummary.status}</p>
                    <ProofRunWorkbench
                      stage="after_evidence"
                      merchant={{ store: merchant.store, client_id: merchant.clientId }}
                      proofRunPath="staffordos/proof_runs/internal_shopifixer_dry_run_v1/"
                      date={afterEvidenceDate}
                      saved={afterEvidenceSaved}
                      onSubmit={afterEvidenceAction}
                    />
                  </div>
                )
              ) : null}

              {currentPhase === "proof_seal" ? (
                scopeSummary.status !== "Scope Complete" ? (
                  <div className="boardCard" style={{ marginTop: 16 }}>
                    <p className="boardCardTitle">Proof &amp; Seal Workbench</p>
                    <p className="boardCardMeta">Blocked</p>
                    <div className="kv">
                      <div><strong>Blocking reason:</strong> Scope incomplete</div>
                      <div><strong>Missing truth or gate:</strong> {scopeSummary.missingFields.length ? scopeSummary.missingFields.join(", ") : "fix_scope.md"}</div>
                      <div><strong>Exact next safe action:</strong> Review Scope</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link href="/operator/shopifixer-pilot?phase=scope" className="inlineLink">
                        Open Scope phase
                      </Link>
                    </div>
                  </div>
                ) : !beforeEvidenceSummary.artifactIds.length ? (
                  <div className="boardCard" style={{ marginTop: 16 }}>
                    <p className="boardCardTitle">Proof &amp; Seal Workbench</p>
                    <p className="boardCardMeta">Blocked</p>
                    <div className="kv">
                      <div><strong>Blocking reason:</strong> Before Evidence Missing</div>
                      <div><strong>Missing truth or gate:</strong> before_evidence.md / evidence_manifest_v1.json</div>
                      <div><strong>Exact next safe action:</strong> Capture Before Evidence</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link href="/operator/shopifixer-pilot?phase=before-evidence" className="inlineLink">
                        Open Before Evidence phase
                      </Link>
                    </div>
                  </div>
                ) : executeSummary.status !== "Execute Complete" ? (
                  <div className="boardCard" style={{ marginTop: 16 }}>
                    <p className="boardCardTitle">Proof &amp; Seal Workbench</p>
                    <p className="boardCardMeta">Blocked</p>
                    <div className="kv">
                      <div><strong>Blocking reason:</strong> Execution incomplete</div>
                      <div><strong>Missing truth or gate:</strong> {executeSummary.status}</div>
                      <div><strong>Exact next safe action:</strong> Review Execution Readiness</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link href="/operator/shopifixer-pilot?phase=execute" className="inlineLink">
                        Open Execute phase
                      </Link>
                    </div>
                  </div>
                ) : !afterEvidenceSummary.artifactIds.length ? (
                  <div className="boardCard" style={{ marginTop: 16 }}>
                    <p className="boardCardTitle">Proof &amp; Seal Workbench</p>
                    <p className="boardCardMeta">Blocked</p>
                    <div className="kv">
                      <div><strong>Blocking reason:</strong> After Evidence Missing</div>
                      <div><strong>Missing truth or gate:</strong> after_evidence.md / evidence_manifest_v1.json</div>
                      <div><strong>Exact next safe action:</strong> Capture After Evidence</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Link href="/operator/shopifixer-pilot?phase=after-evidence" className="inlineLink">
                        Open After Evidence phase
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="boardCard" style={{ marginTop: 16 }}>
                    <p className="boardCardTitle">Proof &amp; Seal Workbench</p>
                    <p className="boardCardMeta">{proofAndSealSummary.status}</p>
                    <ProofRunWorkbench
                      stage="proof_package"
                      merchant={{ store: merchant.store, client_id: merchant.clientId }}
                      proofRunPath="staffordos/proof_runs/internal_shopifixer_dry_run_v1/"
                      date={proofPackageDate}
                      saved={proofPackageSaved}
                      onSubmit={proofPackageAction}
                    />
                  </div>
                )
              ) : null}

              <div className="boardCard" style={{ marginTop: 16 }}>
                <p className="boardCardTitle">Before Evidence</p>
                <p className="boardCardMeta">{beforeEvidenceSummary.status}</p>
                <div className="kv">
                  <div><strong>Before evidence path:</strong> {beforeEvidenceSummary.path}</div>
                  <div><strong>Issue:</strong> {beforeEvidenceSummary.issue}</div>
                  <div><strong>Why it matters:</strong> {beforeEvidenceSummary.whyItMatters}</div>
                  <div><strong>Last captured:</strong> {beforeEvidenceSummary.lastCapturedAt}</div>
                </div>
                <div className="grid gridTwo" style={{ marginTop: 12 }}>
                  <div>
                    <p className="eyebrow">Artifact IDs</p>
                    <div className="kv">
                      {beforeEvidenceSummary.artifactIds.length ? (
                        beforeEvidenceSummary.artifactIds.map((item) => <div key={item}>{item}</div>)
                      ) : (
                        <div>Not Yet Available</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="eyebrow">Screenshot status</p>
                    <div className="kv">
                      {beforeEvidenceSummary.artifacts.length ? (
                        beforeEvidenceSummary.artifacts.map((item) => (
                          <div key={item.artifactId}>
                            <strong>{item.screenshotStatus}:</strong> {item.screenshotReference}
                          </div>
                        ))
                      ) : (
                        <div>Not Yet Available</div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }} className="kv">
                  {beforeEvidenceSummary.artifacts.length ? (
                    beforeEvidenceSummary.artifacts.map((item) => (
                      <div key={item.artifactId}>
                        <strong>{item.artifactId}</strong> · {item.createdAt} · {item.sourceWriter} · {item.screenshotStoredPath}
                      </div>
                    ))
                  ) : (
                    <div>Not Yet Available</div>
                  )}
                </div>
              </div>

              {currentPhase === "execute" ? (
                <div className="boardCard" style={{ marginTop: 16 }}>
                  <p className="boardCardTitle">Execute Workbench</p>
                  <p className="boardCardMeta">{executeSummary.status}</p>
                  <div className="grid gridTwo" style={{ marginTop: 12 }}>
                    <div>
                      <p className="eyebrow">Execution preview</p>
                      <div className="kv">
                        <div><strong>Primary action:</strong> {executeSummary.primaryAction}</div>
                        <div><strong>Action type:</strong> {executeSummary.actionType}</div>
                        <div><strong>Domain / merchant:</strong> {executeSummary.domain} · {executeSummary.merchant}</div>
                        <div><strong>Product:</strong> {executeSummary.product}</div>
                        <div><strong>Owner:</strong> {executeSummary.owner}</div>
                        <div><strong>Confidence:</strong> {executeSummary.confidence}</div>
                      </div>
                    </div>
                    <div>
                      <p className="eyebrow">Governance</p>
                      <div className="kv">
                        <div><strong>Execution mode decision:</strong> {executeSummary.executionModeDecision}</div>
                        <div><strong>Execution mode:</strong> {executeSummary.executionModeExecutionMode}</div>
                        <div><strong>Next step:</strong> {executeSummary.primaryAction}</div>
                        <div><strong>Rollback availability:</strong> {executeSummary.rollbackAvailability}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gridTwo" style={{ marginTop: 12 }}>
                    <div>
                      <p className="eyebrow">Evidence references</p>
                      <div className="kv">
                        {executeSummary.missingTruthOrGates.length ? executeSummary.missingTruthOrGates.map((item) => <div key={item}>{item}</div>) : <div>Not Yet Available</div>}
                      </div>
                    </div>
                    <div>
                      <p className="eyebrow">Risk references</p>
                      <div className="kv">
                        {executeSummary.blockingReasons.length ? executeSummary.blockingReasons.map((item) => <div key={item}>{item}</div>) : <div>Not Yet Available</div>}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <p className="eyebrow">Expected execution artifacts</p>
                    <div className="kv">
                      {executeSummary.executionArtifactPaths.length ? (
                        executeSummary.executionArtifactPaths.map((item) => <div key={item}>{item}</div>)
                      ) : (
                        <div>Not Yet Available</div>
                      )}
                    </div>
                  </div>
                  <div className="kv" style={{ marginTop: 12 }}>
                    <div><strong>Last launched:</strong> {executeSummary.lastLaunchedAt}</div>
                    <div><strong>Last completed:</strong> {executeSummary.lastCompletedAt}</div>
                    <div><strong>Last failed:</strong> {executeSummary.lastFailedAt}</div>
                    <div><strong>Latest execution status:</strong> {executeSummary.latestExecutionStatus}</div>
                    <div><strong>Latest execution event:</strong> {executeSummary.latestExecutionEvent}</div>
                    <div><strong>Outcome event status:</strong> {executeSummary.outcomeEventStatus}</div>
                    <div><strong>Rollback availability:</strong> {executeSummary.rollbackAvailability}</div>
                    <div><strong>Fix scope readiness:</strong> {executeSummary.fixScopeReadiness}</div>
                    <div><strong>Primary action source:</strong> {executeSummary.primaryActionSource}</div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {executeSummary.status === "Execute Ready" && executeCanLaunch ? (
                      <div>
                        <p className="hint">{executeConfirmation}</p>
                        <ExecutePrimaryActionButton
                          requireConfirmation
                          confirmationLabel={executeConfirmation}
                          submitLabel="Review and Execute"
                          refreshOnSuccess
                        />
                      </div>
                    ) : (
                      <div className="kv">
                        <div><strong>Blocking reason:</strong> {executeSummary.blockingReasons.length ? executeSummary.blockingReasons.join(" · ") : executeSummary.status}</div>
                        <div><strong>Missing truth or gate:</strong> {executeSummary.missingTruthOrGates.length ? executeSummary.missingTruthOrGates.join(" · ") : "Not Yet Available"}</div>
                        <div><strong>Exact next safe action:</strong> {executeSummary.status === "Execute Complete" ? "Continue to After Evidence" : executeSummary.status === "Execute Failed" ? "Review Failure Evidence" : "Resolve Execution Gate"}</div>
                        {executeSummary.missingTruthOrGates.some((item) => item.includes("fix_scope.md")) ? (
                          <div style={{ marginTop: 12 }}>
                            <Link href="/operator/shopifixer-pilot?phase=scope" className="inlineLink">
                              Open Scope phase
                            </Link>
                          </div>
                        ) : null}
                        {executeSummary.missingTruthOrGates.some((item) => item.includes("before_evidence.md")) ? (
                          <div style={{ marginTop: 12 }}>
                            <Link href="/operator/shopifixer-pilot?phase=before-evidence" className="inlineLink">
                              Open Before Evidence phase
                            </Link>
                          </div>
                        ) : null}
                        {executeSummary.missingTruthOrGates.some((item) => item.includes("preflight_report_v1.json") || item.includes("command_center_primary_action_qa_v1.json") || item.includes("required_agent_validation_v1.json") || item.includes("agent_loop_latest.json")) ? (
                          <div style={{ marginTop: 12 }}>
                            <Link href="/operator/command-center" className="inlineLink">
                              Resolve Execution Gate
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="boardCard" style={{ marginTop: 16 }}>
                  <p className="boardCardTitle">Execute</p>
                  <p className="boardCardMeta">{executeSummary.status}</p>
                  <div className="kv">
                    <div><strong>Primary action:</strong> {executeSummary.primaryAction}</div>
                    <div><strong>Preflight status:</strong> {executeSummary.preflightStatus}</div>
                    <div><strong>QA status:</strong> {executeSummary.qaStatus}</div>
                    <div><strong>Latest execution status:</strong> {executeSummary.latestExecutionStatus}</div>
                    <div><strong>Latest execution event:</strong> {executeSummary.latestExecutionEvent}</div>
                    <div><strong>Outcome event status:</strong> {executeSummary.outcomeEventStatus}</div>
                    <div><strong>Rollback availability:</strong> {executeSummary.rollbackAvailability}</div>
                    <div><strong>Fix scope readiness:</strong> {executeSummary.fixScopeReadiness}</div>
                    <div><strong>Primary action source:</strong> {executeSummary.primaryActionSource}</div>
                  </div>
                </div>
              )}

              <div className="boardCard" style={{ marginTop: 16 }}>
                <p className="boardCardTitle">After Evidence</p>
                <p className="boardCardMeta">{afterEvidenceSummary.status}</p>
                <div className="kv">
                  <div><strong>After evidence path:</strong> {afterEvidenceSummary.path}</div>
                  <div><strong>Observed improvement:</strong> {afterEvidenceSummary.observedImprovement}</div>
                  <div><strong>Merchant-facing summary:</strong> {afterEvidenceSummary.merchantFacingSummary}</div>
                  <div><strong>Remaining limitations:</strong> {afterEvidenceSummary.remainingLimitations}</div>
                  <div><strong>Last captured:</strong> {afterEvidenceSummary.lastCapturedAt}</div>
                </div>
                <div className="grid gridTwo" style={{ marginTop: 12 }}>
                  <div>
                    <p className="eyebrow">Artifact IDs</p>
                    <div className="kv">
                      {afterEvidenceSummary.artifactIds.length ? (
                        afterEvidenceSummary.artifactIds.map((item) => <div key={item}>{item}</div>)
                      ) : (
                        <div>Not Yet Available</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="eyebrow">Screenshot status</p>
                    <div className="kv">
                      {afterEvidenceSummary.artifacts.length ? (
                        afterEvidenceSummary.artifacts.map((item) => (
                          <div key={item.artifactId}>
                            <strong>{item.screenshotStatus}:</strong> {item.screenshotReference}
                          </div>
                        ))
                      ) : (
                        <div>Not Yet Available</div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }} className="kv">
                  {afterEvidenceSummary.artifacts.length ? (
                    afterEvidenceSummary.artifacts.map((item) => (
                      <div key={item.artifactId}>
                        <strong>{item.artifactId}</strong> · {item.createdAt} · {item.sourceWriter} · {item.screenshotStoredPath}
                      </div>
                    ))
                  ) : (
                    <div>Not Yet Available</div>
                  )}
                </div>
              </div>

              <div className="boardCard" style={{ marginTop: 16 }}>
                <p className="boardCardTitle">Proof &amp; Seal</p>
                <p className="boardCardMeta">{proofAndSealSummary.status}</p>
                <div className="kv">
                  <div><strong>Proof package status:</strong> {proofAndSealSummary.status}</div>
                  <div><strong>Proof package path:</strong> {proofAndSealSummary.proofPackagePath}</div>
                  <div><strong>Proof package version:</strong> {proofAndSealSummary.proofPackageVersion}</div>
                  <div><strong>Proof run ID:</strong> {proofAndSealSummary.proofRunId}</div>
                  <div><strong>Generated At:</strong> {proofAndSealSummary.generatedAt}</div>
                  <div><strong>Manifest path:</strong> {proofAndSealSummary.manifestPath}</div>
                  <div><strong>Manifest artifact count:</strong> {proofAndSealSummary.manifestArtifactCount}</div>
                  <div><strong>Seal status:</strong> {proofAndSealSummary.sealStatus}</div>
                  <div><strong>SHA-256:</strong> {proofAndSealSummary.sha256}</div>
                  <div><strong>SHA-256 match status:</strong> {proofAndSealSummary.sha256MatchStatus}</div>
                  <div><strong>Missing screenshot artifact count:</strong> {proofAndSealSummary.missingScreenshotArtifactCount}</div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <p className="eyebrow">Evidence source paths</p>
                  <div className="kv">
                    {proofAndSealSummary.evidenceSourcePaths.length ? (
                      proofAndSealSummary.evidenceSourcePaths.map((item) => <div key={item}>{item}</div>)
                    ) : (
                      <div>Not Yet Available</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="boardCard" style={{ marginTop: 16 }}>
                <p className="boardCardTitle">Delivery &amp; Payment</p>
                <p className="boardCardMeta">{deliverySummary.completionReadiness}</p>
                <div className="kv">
                  <div><strong>Delivery status:</strong> {deliverySummary.deliveryStatus}</div>
                  <div><strong>Merchant delivery status:</strong> {deliverySummary.merchantDeliveryStatus}</div>
                  <div><strong>Proof package ready:</strong> {deliverySummary.proofPackageReady}</div>
                  <div><strong>Checksum seal status:</strong> {deliverySummary.checksumSealStatus}</div>
                  <div><strong>Offer status:</strong> {deliverySummary.offerStatus}</div>
                  <div><strong>Current payment status:</strong> {deliverySummary.currentPaymentStatus}</div>
                  <div><strong>Payment gate:</strong> {deliverySummary.paymentStatus}</div>
                  <div><strong>Completion status:</strong> {deliverySummary.completionStatus}</div>
                  <div><strong>Current next action:</strong> {deliverySummary.currentNextAction}</div>
                  <div><strong>Recommended operator action:</strong> {deliverySummary.recommendedOperatorAction}</div>
                  <div><strong>Revenue opportunity:</strong> {deliverySummary.revenueOpportunity}</div>
                  <div><strong>Completion readiness:</strong> {deliverySummary.completionReadiness}</div>
                  <div><strong>Latest outcome event:</strong> {deliverySummary.latestOutcomeEvent}</div>
                  <div><strong>Latest snapshot:</strong> {deliverySummary.latestSnapshot}</div>
                  <div><strong>Latest revenue state:</strong> {deliverySummary.latestRevenueState}</div>
                </div>
                <div style={{ marginTop: 16 }}>
                  {currentPhase === "delivery_payment" ? (
                    deliveryCanComplete ? (
                      <div>
                        <p className="hint">This invokes the governed StaffordOS delivery/completion spine. It does not change payment authority, send email, or rewrite proof state outside the existing completion writer.</p>
                        <ProofRunWorkbench
                          stage="completion"
                          merchant={{ store: merchant.store, client_id: merchant.clientId }}
                          proofRunPath="staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json"
                          date={completionDate}
                          saved={completionSaved}
                          onSubmit={completionAction}
                        />
                      </div>
                    ) : (
                      <div className="kv">
                        <div><strong>Blocking reason:</strong> {deliverySummary.completionReadiness === "Complete" ? "Complete" : deliverySummary.merchantDeliveryStatus}</div>
                        <div><strong>Missing governed artifact:</strong> {deliverySummary.completionReadiness === "Complete" ? "Not Yet Available" : deliverySummary.proofPackageReady === "Waiting for Proof" ? "merchant_proof_package.md / merchant_proof_package.seal.json" : deliverySummary.currentPaymentStatus}</div>
                        <div><strong>Exact next safe action:</strong> {deliverySummary.completionReadiness === "Complete" ? "Pilot Complete" : deliverySummary.completionReadiness === "Ready for Completion" ? "Proceed using governed delivery action" : deliverySummary.paymentStatus === "Payment Pending" ? "Waiting for Merchant" : "Return to blocking phase"}</div>
                        {deliverySummary.paymentStatus === "Payment Pending" || /waiting_for_payment|payment_pending/i.test(deliverySummary.currentPaymentStatus) ? (
                          <div style={{ marginTop: 12 }}>
                            <Link href="/operator/command-center" className="inlineLink">
                              Open command center
                            </Link>
                          </div>
                        ) : null}
                        {deliverySummary.completionReadiness !== "Complete" && deliverySummary.completionReadiness !== "Ready for Completion" ? (
                          <div style={{ marginTop: 12 }}>
                            <Link href={recommendedNextStep.href} className="inlineLink">
                              Open blocking phase
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    )
                  ) : null}
                </div>
              </div>

              <div className="boardCard" style={{ marginTop: 16 }}>
                <p className="boardCardTitle">Recommended Next Step</p>
                <p className="boardCardMeta">{recommendedNextStep.phaseLabel}</p>
                <div className="kv">
                  <div><strong>Phase:</strong> {recommendedNextStep.phaseLabel}</div>
                  <div><strong>Status:</strong> {recommendedNextStep.state}</div>
                  <div><strong>Blocking reason:</strong> {recommendedNextStep.blockedReason}</div>
                  <div><strong>Missing truth or gate:</strong> {recommendedNextStep.missingTruthOrGate}</div>
                  <div><strong>Exact next safe action:</strong> {recommendedNextStep.nextSafeAction}</div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Link href={recommendedNextStep.href} className="inlineLink">
                    Open recommended phase
                  </Link>
                </div>
              </div>

              <div className="shopifixerPilotPhaseNotes">
                <div className="boardCard">
                  <p className="boardCardTitle">Evidence</p>
                  <p className="boardCardNote">Before and after artifacts append to the manifest here.</p>
                </div>
                <div className="boardCard">
                  <p className="boardCardTitle">Proof &amp; Seal</p>
                  <p className="boardCardNote">Proof package preview, checksum seal, and artifact list live here.</p>
                </div>
                <div className="boardCard">
                  <p className="boardCardTitle">Delivery</p>
                  <p className="boardCardNote">Send proof, verify payment, and clear the completion gate here.</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panelInner">
            <p className="eyebrow">Right Rail</p>
            <h2 className="sectionTitle">Merchant summary</h2>
            <div className="kv">
              <div><strong>Merchant:</strong> {merchant.store}</div>
              <div><strong>Client ID:</strong> {merchant.clientId}</div>
              <div><strong>Packet:</strong> {packet.packetId}</div>
              <div><strong>Reservation:</strong> {packet.reservationId}</div>
              <div><strong>Payment:</strong> {packet.paymentStatus}</div>
              <div><strong>Continuity:</strong> {packet.continuityStatus}</div>
              <div><strong>Campaign:</strong> {campaign.campaignId}</div>
              <div><strong>Campaign type:</strong> {campaign.campaignType}</div>
              <div><strong>Campaigns resolved:</strong> {campaign.totalCampaigns}</div>
              <div><strong>Lead:</strong> {lead.leadName}</div>
              <div><strong>Workday:</strong> {workday.status}</div>
              <div><strong>Heartbeat:</strong> {workday.heartbeat}</div>
            </div>

            <h3 className="sectionTitle" style={{ marginTop: 18 }}>Progress summary</h3>
            <div className="kv">
              <div><strong>Phases complete:</strong> {progress.completed}/{progress.total}</div>
              <div><strong>Current phase:</strong> {activePhase.label}</div>
              <div><strong>Progress state:</strong> In Progress</div>
              <div><strong>Loops run:</strong> {workday.loopsRun}</div>
              <div><strong>Safe mode:</strong> {workday.safeMode}</div>
            </div>

            <h3 className="sectionTitle" style={{ marginTop: 18 }}>Evidence status</h3>
            <div className="kv">
              {evidenceStatus.map((item) => (
                <div key={item.label}><strong>{item.label}:</strong> {item.value}</div>
              ))}
            </div>

            <h3 className="sectionTitle" style={{ marginTop: 18 }}>Validation status</h3>
            <div className="kv">
              {validationStatus.map((item) => (
                <div key={item.label}><strong>{item.label}:</strong> {item.value}</div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
