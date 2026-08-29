import Link from "next/link";
import { cookies } from "next/headers";
import {
  CAREEROS_BETA_OPERATIONS_READ_PERMISSION,
  STAFFORDOS_OPERATOR_SESSION_COOKIE,
} from "../../../../lib/operator/staffordosOperatorSession";
import { getCareerOsBetaOperationsResult } from "../../../../lib/operator/careerosBetaOperationsAccess";
import type {
  CareerOsBetaUserOperationalRow,
  HealthState,
  LifecycleStatus,
  LifecycleStep,
} from "../../../../lib/operator/careerosBetaOperationsReadModel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LIFECYCLE_STEPS: LifecycleStep[] = ["KNOW_ME", "FIND", "UNDERSTAND", "PURSUE", "MANAGE", "RETURN"];

function count(value: number) {
  return value.toLocaleString();
}

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function dateTime(value: string | null) {
  if (!value) return "Not observed";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function lifecycleClass(status: LifecycleStatus) {
  if (status === "OBSERVED") return "statusPillReady";
  if (status === "IN_PROGRESS") return "statusPillPartial";
  return "statusPillMissing";
}

function healthClass(state: HealthState) {
  if (state === "OK") return "statusPillReady";
  if (state === "SETUP_NEEDED") return "statusPillPartial";
  return "statusPillDegraded";
}

function lifecycleBadge(status: LifecycleStatus) {
  return <span className={`statusPill ${lifecycleClass(status)}`}>{label(status)}</span>;
}

function metric(labelText: string, value: number, detail: string) {
  return (
    <div className="betaOperationsMetric">
      <dt>{labelText}</dt>
      <dd>{count(value)}</dd>
      <span>{detail}</span>
    </div>
  );
}

function stageText(user: CareerOsBetaUserOperationalRow) {
  return `${label(user.currentLifecycleStage)} · ${label(user.lifecycle[user.currentLifecycleStage]).toLowerCase()}`;
}

function authorizationPanel(status: number, error: string) {
  const isMissingSession = status === 401;
  return (
    <div className="container operatorHomeContainer">
      <section className="panel errorPanel">
        <div className="panelInner">
          <p className="eyebrow">CareerOS Operations</p>
          <h1 className="title">{isMissingSession ? "Operator session required" : "Permission required"}</h1>
          <p className="subtitle">
            {isMissingSession
              ? "The StaffordOS operator session was not established or is no longer trusted."
              : "The trusted operator session does not include the required CareerOS operations read permission."}
          </p>
          <div className="row navRow">
            {isMissingSession ? (
              <Link href="/api/operator/auth/login" className="chip">
                Start operator login
              </Link>
            ) : null}
            <span className="statusPill statusPillMissing">{error}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function readModelFailurePanel() {
  return (
    <div className="container operatorHomeContainer">
      <section className="panel errorPanel">
        <div className="panelInner">
          <p className="eyebrow">CareerOS Operations</p>
          <h1 className="title">Read model unavailable</h1>
          <p className="subtitle">The authorized operator boundary is active, but the operations model could not be loaded.</p>
          <span className="statusPill statusPillDegraded">CAREEROS_BETA_OPERATIONS_READ_MODEL_UNAVAILABLE</span>
        </div>
      </section>
    </div>
  );
}

function lifecycleCell(user: CareerOsBetaUserOperationalRow, step: LifecycleStep) {
  const counts = user.counts;
  const detail: Record<LifecycleStep, string> = {
    KNOW_ME: `${count(counts.confirmedCareerFactCount)} facts · ${count(counts.contextClaimCount)} context · ${count(counts.capabilityCount)} capabilities`,
    FIND: `${count(counts.searchPreferenceCount)} preferences · ${count(counts.opportunityInboxCount + counts.opportunityCount)} opportunities`,
    UNDERSTAND: `${count(counts.evaluationCount)} evaluations · ${count(counts.staleEvaluationCount)} stale`,
    PURSUE: `${count(user.aggregates.opportunityDecisionCounts.PURSUE || 0)} pursue · ${count(user.aggregates.opportunityDecisionCounts.PASS || 0)} pass`,
    MANAGE: `${count(counts.opportunityEventCount)} events · ${count(Object.keys(user.aggregates.opportunityLifecycleCounts).length)} states`,
    RETURN: `${count(counts.activeSessionCount)} active sessions`,
  };

  return (
    <div className="betaOperationsLifecycleCell">
      {lifecycleBadge(user.lifecycle[step])}
      <span>{detail[step]}</span>
    </div>
  );
}

export default async function CareerOsBetaUsersPage() {
  const jar = await cookies();
  const cookieValue = jar.get(STAFFORDOS_OPERATOR_SESSION_COOKIE)?.value || "";
  const result = await getCareerOsBetaOperationsResult(cookieValue);

  if (result.status === 401 || result.status === 403) {
    return authorizationPanel(result.status, String(result.body.error || "OPERATOR_AUTHORIZATION_FAILED"));
  }

  if (result.status !== 200) return readModelFailurePanel();

  const readModel = result.body;

  return (
    <div className="container betaOperationsContainer">
      <section className="panel betaOperationsHero">
        <div className="panelInner">
          <p className="eyebrow">CareerOS Operations</p>
          <div className="betaOperationsTitleRow">
            <div>
              <h1 className="title">CareerOS Beta Users</h1>
              <p className="subtitle">
                Privacy-safe account progress, lifecycle observations, aggregate activity, and deterministic health reasons.
              </p>
            </div>
            <div className="betaOperationsAuthority">
              <span className="statusPill statusPillReady">Authorized</span>
              <span>{CAREEROS_BETA_OPERATIONS_READ_PERMISSION}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelInner">
          <dl className="betaOperationsMetricGrid">
            {metric("Beta users", readModel.summary.totalBetaUsers, "Account records")}
            {metric("Active last 7 days", readModel.summary.activeLast7Days, "Safe activity timestamps")}
            {metric("Know Me observed", readModel.summary.usersWithKnowMeObserved, "Reviewed model evidence")}
            {metric("Discovery observed", readModel.summary.usersWithDiscoveryObserved, "Opportunities or inbox items")}
            {metric("Evaluations", readModel.summary.usersWithEvaluations, "Users with match evaluations")}
            {metric("Needs attention", readModel.summary.usersNeedingAttention, "Reason-coded only")}
          </dl>
        </div>
      </section>

      <section className="panel">
        <div className="panelInner">
          <div className="betaOperationsSectionHeader">
            <div>
              <h2 className="sectionTitle">User Operations</h2>
              <p className="hint">Generated {dateTime(readModel.generatedAt)} from {readModel.persistence}.</p>
            </div>
            <span className="statusPill statusPillReady">No private evidence returned</span>
          </div>

          {readModel.users.length === 0 ? (
            <div className="emptyState">
              <p className="emptyStateLabel">No beta users</p>
              <p className="emptyStateText">No CareerOS beta account records are available to this read model.</p>
            </div>
          ) : (
            <div className="tableWrap">
              <table className="table betaOperationsTable">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Account</th>
                    <th>Lifecycle</th>
                    {LIFECYCLE_STEPS.map((step) => (
                      <th key={step}>{label(step)}</th>
                    ))}
                    <th>Last safe activity</th>
                    <th>Health</th>
                  </tr>
                </thead>
                <tbody>
                  {readModel.users.map((user) => (
                    <tr key={user.userIdentifier}>
                      <td>
                        <strong className="betaOperationsUserId">{user.userIdentifier}</strong>
                        <span className="betaOperationsCellDetail">Created {dateTime(user.accountCreatedAt)}</span>
                      </td>
                      <td>
                        <span className="statusPill">{label(user.accountStatus)}</span>
                        <span className="betaOperationsCellDetail">{count(user.counts.tenantCount)} tenant memberships</span>
                      </td>
                      <td>
                        <strong className="betaOperationsStage">{stageText(user)}</strong>
                        <span className="betaOperationsCellDetail">{user.onboardingStage || "No onboarding stage observed"}</span>
                      </td>
                      {LIFECYCLE_STEPS.map((step) => (
                        <td key={`${user.userIdentifier}-${step}`}>{lifecycleCell(user, step)}</td>
                      ))}
                      <td>{dateTime(user.lastSafeActivityAt)}</td>
                      <td>
                        <div className="betaOperationsHealth">
                          <span className={`statusPill ${healthClass(user.health.state)}`}>{label(user.health.state)}</span>
                          <span>{user.health.reasons.map(label).join(", ")}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
