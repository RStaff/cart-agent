import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { OperatorNav } from "../../../components/operator/OperatorNav";

const ROOT = path.resolve(process.cwd(), "../../..");

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

type RevenueTruth = {
  current_bottleneck?: string;
  next_actions?: Array<{ priority?: number; action?: string; expected_outcome?: string }>;
  funnel?: Record<string, number>;
  stages?: Record<string, number>;
  generated_at?: string;
};

type ApprovalQueue = {
  items?: Array<{ status?: string }>;
};

type SendLedger = {
  items?: Array<{ status?: string }>;
};

export default function OperatorRevenueCommandPage() {
  const revenueTruth = readJson<RevenueTruth>(
    path.join(ROOT, "staffordos/revenue/revenue_truth_v1.json"),
    {}
  );

  const approvals = readJson<ApprovalQueue>(
    path.join(ROOT, "staffordos/leads/approval_queue_v1.json"),
    { items: [] }
  );

  const ledger = readJson<SendLedger>(
    path.join(ROOT, "staffordos/leads/send_ledger_v1.json"),
    { items: [] }
  );

  const pendingApprovals = approvals.items?.filter((x) => x.status === "pending_review").length || 0;
  const approved = approvals.items?.filter((x) => x.status === "approved").length || 0;
  const pendingSend = ledger.items?.filter((x) => x.status === "pending_send").length || 0;
  const dryRunReady = ledger.items?.filter((x) => x.status === "dry_run_ready").length || 0;

  const nextAction = revenueTruth.next_actions?.[0]?.action || "Run revenue_agent_v1 to refresh current truth.";

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS Revenue</p>
            <h1 className="title">Revenue Command</h1>
            <p className="subtitle">
              Live operator view from local StaffordOS truth files. No fake metrics.
            </p>
            <OperatorNav activeHref="/operator/revenue-command" />
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Current Bottleneck</h2>
            <p className="subtitle" style={{ marginTop: 0 }}>
              {revenueTruth.current_bottleneck || "Unknown"}
            </p>
            <div className="kv">
              <div><strong>Next action:</strong> {nextAction}</div>
              <div><strong>Truth updated:</strong> {revenueTruth.generated_at || "Unavailable"}</div>
            </div>
          </div>
        </section>

        <div className="grid gridTwo">
          <section className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Approval Queue</h2>
              <div className="kv">
                <div><strong>Pending review:</strong> {pendingApprovals}</div>
                <div><strong>Approved:</strong> {approved}</div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panelInner">
              <h2 className="sectionTitle">Send Ledger</h2>
              <div className="kv">
                <div><strong>Pending send:</strong> {pendingSend}</div>
                <div><strong>Dry-run ready:</strong> {dryRunReady}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
