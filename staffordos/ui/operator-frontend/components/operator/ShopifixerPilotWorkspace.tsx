import Link from "next/link";

type PhaseState = "ready" | "in_progress" | "blocked" | "complete";

type Phase = {
  key: string;
  label: string;
  status: PhaseState;
  disabled: boolean;
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
  evidenceStatus: StatusLine[];
  validationStatus: StatusLine[];
  previousWork: string;
};

function badgeClass(status: PhaseState) {
  if (status === "complete") return "healthGood";
  if (status === "in_progress") return "healthWarn";
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
  evidenceStatus,
  validationStatus,
  previousWork
}: ShopifixerPilotWorkspaceProps) {
  const activePhase = phases.find((phase) => phase.key === currentPhase) || phases[0];

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
                <button
                  key={phase.key}
                  type="button"
                  className={`shopifixerPilotPhaseButton ${badgeClass(phase.status)}${phase.key === activePhase.key ? " shopifixerPilotPhaseButtonActive" : ""}`}
                  disabled={phase.disabled}
                >
                  <span>{phase.label}</span>
                  <strong>{phase.status.replace("_", " ")}</strong>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 18 }}>
              <p className="eyebrow">Primary CTA</p>
              <button type="button" className="button buttonPrimary" disabled style={{ width: "100%" }}>
                Continue to {phases[1]?.label || "next phase"}
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <p className="eyebrow">Secondary CTA</p>
              <button type="button" className="button" disabled style={{ width: "100%" }}>
                Review merchant context
              </button>
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
                <div><strong>Status:</strong> {activePhase.status.replace("_", " ")}</div>
                <div><strong>Merchant:</strong> {merchant.store}</div>
                <div><strong>Previous work:</strong> {previousWork}</div>
              </div>

              <div className="shopifixerPilotPhaseNotes">
                <div className="boardCard">
                  <p className="boardCardTitle">Scope</p>
                  <p className="boardCardNote">Issue, proposed fix, estimated impact, and approval live here.</p>
                </div>
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
