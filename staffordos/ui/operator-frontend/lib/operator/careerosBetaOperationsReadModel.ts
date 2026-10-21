import { createRequire } from "node:module";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as crypto from "node:crypto";

export const CAREEROS_BETA_OPERATIONS_MODEL_VERSION = "careeros.beta.operations.read-model.v1";
export const CAREEROS_BETA_USER_IDENTIFIER_PREFIX = "beta-user";

export type LifecycleStep = "KNOW_ME" | "FIND" | "UNDERSTAND" | "PURSUE" | "MANAGE" | "RETURN";
export type LifecycleStatus = "NOT_STARTED" | "IN_PROGRESS" | "OBSERVED";
export type HealthState = "OK" | "SETUP_NEEDED" | "NEEDS_ATTENTION";
export type PersistenceSource = "local_json" | "postgres";

export type HealthReasonCode =
  | "OK"
  | "ACCOUNT_RECORD_INCOMPLETE"
  | "NO_PROFILE"
  | "NO_SOURCES"
  | "NO_FACT_CANDIDATES"
  | "EVIDENCE_REVIEW_PENDING"
  | "NO_CONFIRMED_FACTS"
  | "NO_CAPABILITIES"
  | "NO_SEARCH_PREFERENCES"
  | "NO_OPPORTUNITIES"
  | "NO_EVALUATIONS"
  | "STALE_EVALUATION_PRESENT"
  | "NO_RECENT_SAFE_ACTIVITY";

export type AnyRow = Record<string, unknown>;

export type CareerOsBetaOperationsRows = {
  users?: AnyRow[];
  tenants?: AnyRow[];
  memberships?: AnyRow[];
  sessions?: AnyRow[];
  profiles?: AnyRow[];
  onboarding?: AnyRow[];
  sources?: AnyRow[];
  candidateFacts?: AnyRow[];
  reviewDecisions?: AnyRow[];
  careerFacts?: AnyRow[];
  contextClaims?: AnyRow[];
  capabilities?: AnyRow[];
  capabilityDecisions?: AnyRow[];
  searchPreferences?: AnyRow[];
  opportunities?: AnyRow[];
  matchEvaluations?: AnyRow[];
  opportunityEvents?: AnyRow[];
  inboxItems?: AnyRow[];
  auditEvents?: AnyRow[];
};

export type CareerOsBetaUserOperationalRow = {
  userIdentifier: string;
  accountStatus: "ACCOUNT_CREATED" | "ACTIVE_SESSION" | "ACCOUNT_RECORD_INCOMPLETE";
  accountCreatedAt: string | null;
  lastSafeActivityAt: string | null;
  currentLifecycleStage: LifecycleStep;
  lifecycle: Record<LifecycleStep, LifecycleStatus>;
  onboardingStage: string | null;
  profileObserved: boolean;
  searchPreferenceObserved: boolean;
  counts: {
    tenantCount: number;
    activeSessionCount: number;
    sourceCount: number;
    candidateFactCount: number;
    reviewDecisionCount: number;
    confirmedCareerFactCount: number;
    contextClaimCount: number;
    capabilityCount: number;
    capabilityDecisionCount: number;
    searchPreferenceCount: number;
    opportunityInboxCount: number;
    opportunityCount: number;
    evaluationCount: number;
    staleEvaluationCount: number;
    opportunityEventCount: number;
  };
  aggregates: {
    candidateStatusCounts: Record<string, number>;
    careerFactStatusCounts: Record<string, number>;
    capabilityAuthorityCounts: Record<string, number>;
    opportunityDecisionCounts: Record<string, number>;
    opportunityLifecycleCounts: Record<string, number>;
    inboxStatusCounts: Record<string, number>;
  };
  health: {
    state: HealthState;
    reasons: HealthReasonCode[];
  };
};

export type CareerOsBetaOperationsReadModel = {
  modelVersion: string;
  generatedAt: string;
  persistence: PersistenceSource;
  readOnly: true;
  schemaChangeRequired: false;
  customerDataMutated: false;
  privateEvidenceReturned: false;
  userIdentifierStrategy: "stable_pseudonymous_user_id_hash";
  sourceTables: string[];
  unavailableOptionalTables: string[];
  summary: {
    totalBetaUsers: number;
    activeLast7Days: number;
    usersWithKnowMeObserved: number;
    usersWithDiscoveryObserved: number;
    usersWithEvaluations: number;
    usersWithPursuitObserved: number;
    usersWithReturnObserved: number;
    usersNeedingAttention: number;
    totalOpportunities: number;
    totalEvaluations: number;
  };
  users: CareerOsBetaUserOperationalRow[];
};

type PgQueryResult = { rows: AnyRow[]; rowCount?: number | null };
type PgPool = {
  query(sql: string, params?: unknown[]): Promise<PgQueryResult>;
  end(): Promise<void>;
};

type BuildOptions = {
  now?: Date;
  persistence?: PersistenceSource;
  availableTables?: string[];
  optionalTables?: string[];
};

type LoadOptions = {
  env?: Record<string, string | undefined>;
  now?: Date;
  localStorePath?: string;
  userLimit?: number;
  rowLimit?: number;
};

const POSTGRES_TABLES: Record<keyof Required<CareerOsBetaOperationsRows>, { table: string; columns: string[] }> = {
  users: { table: "CareerUser", columns: ["id", "createdAt", "updatedAt"] },
  tenants: { table: "CareerTenant", columns: ["id", "createdAt", "updatedAt"] },
  memberships: { table: "CareerTenantMembership", columns: ["id", "tenantId", "userId", "role", "createdAt"] },
  sessions: { table: "CareerSession", columns: ["id", "userId", "tenantId", "expiresAt", "createdAt", "lastUsedAt", "revokedAt"] },
  profiles: { table: "CareerProfile", columns: ["id", "tenantId", "userId", "status", "version", "createdAt", "updatedAt"] },
  onboarding: { table: "CareerOnboardingState", columns: ["id", "tenantId", "profileId", "stage", "updatedAt"] },
  sources: { table: "CareerSource", columns: ["id", "tenantId", "userId", "profileId", "sourceStatus", "createdAt", "updatedAt"] },
  candidateFacts: { table: "CareerFactCandidate", columns: ["id", "candidateFactId", "tenantId", "userId", "profileId", "status", "createdAt", "updatedAt"] },
  reviewDecisions: { table: "CareerFactReviewDecision", columns: ["id", "tenantId", "userId", "candidateFactId", "decision", "createdAt"] },
  careerFacts: { table: "CareerFact", columns: ["id", "tenantId", "userId", "profileId", "authorityState", "status", "createdAt", "updatedAt"] },
  contextClaims: { table: "CareerFactContextClaim", columns: ["id", "tenantId", "userId", "profileId", "authorityState", "status", "createdAt", "updatedAt"] },
  capabilities: { table: "CareerCapabilityAuthority", columns: ["id", "tenantId", "userId", "profileId", "authorityState", "createdAt", "updatedAt"] },
  capabilityDecisions: { table: "CareerCapabilityDecision", columns: ["id", "tenantId", "userId", "capabilityId", "decisionState", "createdAt", "supersededAt"] },
  searchPreferences: { table: "CareerSearchPreference", columns: ["id", "tenantId", "userId", "active", "createdAt", "updatedAt"] },
  opportunities: { table: "CareerOpportunity", columns: ["id", "tenantId", "userId", "profileId", "decisionState", "lifecycleState", "createdAt", "updatedAt"] },
  matchEvaluations: { table: "CareerMatchEvaluation", columns: ["id", "tenantId", "userId", "profileId", "opportunityId", "stale", "createdAt"] },
  opportunityEvents: { table: "CareerOpportunityEvent", columns: ["id", "tenantId", "userId", "opportunityId", "eventType", "createdAt"] },
  inboxItems: { table: "CareerOpportunityInboxItem", columns: ["id", "tenantId", "userId", "profileId", "status", "duplicateStatus", "discoveredAt", "importedAt", "createdAt", "updatedAt"] },
  auditEvents: { table: "CareerAuditEvent", columns: ["id", "tenantId", "userId", "eventType", "entityType", "createdAt"] },
};

const OPTIONAL_TABLE_KEYS = Object.keys(POSTGRES_TABLES) as Array<keyof Required<CareerOsBetaOperationsRows>>;
const CONTENT_BEARING_TABLES_EXCLUDED = Object.freeze([
  "CareerInvite",
  "CareerOpportunityNote",
  "CareerOpportunityRequirement",
  "CareerResumeDraft",
]);

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function rowId(row: AnyRow) {
  return clean(row.id);
}

function userId(row: AnyRow) {
  return clean(row.userId);
}

function tenantId(row: AnyRow) {
  return clean(row.tenantId);
}

function profileId(row: AnyRow) {
  return clean(row.profileId);
}

function toRows(value: unknown): AnyRow[] {
  return Array.isArray(value) ? value.filter((item): item is AnyRow => item !== null && typeof item === "object") : [];
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(clean(value));
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}

function latestIso(values: Array<string | null>) {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);
  if (!timestamps.length) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function safeCode(value: unknown, fallback = "UNKNOWN") {
  const normalized = clean(value).toUpperCase().replace(/[^A-Z0-9_:-]/g, "_").slice(0, 64);
  return normalized || fallback;
}

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] || 0) + 1;
}

function countBy(rows: AnyRow[], field: string) {
  const counts: Record<string, number> = {};
  for (const row of rows) increment(counts, safeCode(row[field]));
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function pseudonymousUserIdentifier(id: string) {
  const digest = crypto.createHash("sha256").update(`careeros-beta-operations:${id}`).digest("hex").slice(0, 12);
  return `${CAREEROS_BETA_USER_IDENTIFIER_PREFIX}-${digest}`;
}

function activeSessionCount(rows: AnyRow[], now: Date) {
  const nowMs = now.getTime();
  return rows.filter((row) => {
    const expiresAt = toIso(row.expiresAt);
    const revokedAt = toIso(row.revokedAt);
    return Boolean(expiresAt && Date.parse(expiresAt) > nowMs && !revokedAt);
  }).length;
}

function returnObserved(sessions: AnyRow[]) {
  if (sessions.length > 1) return true;
  return sessions.some((session) => {
    const createdAt = toIso(session.createdAt);
    const lastUsedAt = toIso(session.lastUsedAt);
    return Boolean(createdAt && lastUsedAt && Date.parse(lastUsedAt) - Date.parse(createdAt) > 60_000);
  });
}

function statusFromEvidence(started: boolean, observed: boolean) {
  if (observed) return "OBSERVED";
  return started ? "IN_PROGRESS" : "NOT_STARTED";
}

function lifecycleForUser(input: {
  profileCount: number;
  sourceCount: number;
  candidateFactCount: number;
  confirmedCareerFactCount: number;
  contextClaimCount: number;
  capabilityCount: number;
  searchPreferenceCount: number;
  inboxCount: number;
  opportunityCount: number;
  evaluationCount: number;
  opportunityDecisionCounts: Record<string, number>;
  opportunityLifecycleCounts: Record<string, number>;
  explicitDecisionEventCount: number;
  explicitLifecycleEventCount: number;
  returnObserved: boolean;
}): Record<LifecycleStep, LifecycleStatus> {
  const knowMeStarted = input.profileCount > 0 || input.sourceCount > 0 || input.candidateFactCount > 0;
  const knowMeObserved = input.confirmedCareerFactCount > 0 || input.contextClaimCount > 0 || input.capabilityCount > 0;
  const findObserved = input.opportunityCount > 0 || input.inboxCount > 0;
  const pursueObserved =
    input.explicitDecisionEventCount > 0 ||
    Number(input.opportunityDecisionCounts.PURSUE || 0) > 0 ||
    Number(input.opportunityDecisionCounts.PASS || 0) > 0;
  const manageObserved =
    input.explicitLifecycleEventCount > 0 ||
    Object.entries(input.opportunityLifecycleCounts).some(([state, count]) => state !== "NEW" && Number(count) > 0);

  return {
    KNOW_ME: statusFromEvidence(knowMeStarted, knowMeObserved),
    FIND: statusFromEvidence(input.searchPreferenceCount > 0, findObserved),
    UNDERSTAND: statusFromEvidence(false, input.evaluationCount > 0),
    PURSUE: statusFromEvidence(input.opportunityCount > 0, pursueObserved),
    MANAGE: statusFromEvidence(input.opportunityCount > 0, manageObserved),
    RETURN: statusFromEvidence(false, input.returnObserved),
  };
}

function currentLifecycleStage(lifecycle: Record<LifecycleStep, LifecycleStatus>): LifecycleStep {
  for (const step of ["RETURN", "MANAGE", "PURSUE", "UNDERSTAND", "FIND", "KNOW_ME"] as LifecycleStep[]) {
    if (lifecycle[step] !== "NOT_STARTED") return step;
  }
  return "KNOW_ME";
}

function healthForUser(input: {
  tenantCount: number;
  profileCount: number;
  sourceCount: number;
  candidateFactCount: number;
  pendingCandidateCount: number;
  confirmedCareerFactCount: number;
  capabilityCount: number;
  searchPreferenceCount: number;
  opportunityCount: number;
  inboxCount: number;
  evaluationCount: number;
  staleEvaluationCount: number;
  lastSafeActivityAt: string | null;
  now: Date;
}) {
  const reasons: HealthReasonCode[] = [];
  if (input.tenantCount === 0) reasons.push("ACCOUNT_RECORD_INCOMPLETE");
  if (input.profileCount === 0) reasons.push("NO_PROFILE");
  if (input.profileCount > 0 && input.sourceCount === 0) reasons.push("NO_SOURCES");
  if (input.sourceCount > 0 && input.candidateFactCount === 0) reasons.push("NO_FACT_CANDIDATES");
  if (input.pendingCandidateCount > 0) reasons.push("EVIDENCE_REVIEW_PENDING");
  if ((input.sourceCount > 0 || input.candidateFactCount > 0) && input.confirmedCareerFactCount === 0) {
    reasons.push("NO_CONFIRMED_FACTS");
  }
  if (input.confirmedCareerFactCount > 0 && input.capabilityCount === 0) reasons.push("NO_CAPABILITIES");
  if (input.confirmedCareerFactCount > 0 && input.searchPreferenceCount === 0) reasons.push("NO_SEARCH_PREFERENCES");
  if (input.searchPreferenceCount > 0 && input.opportunityCount + input.inboxCount === 0) reasons.push("NO_OPPORTUNITIES");
  if (input.opportunityCount > 0 && input.evaluationCount === 0) reasons.push("NO_EVALUATIONS");
  if (input.staleEvaluationCount > 0) reasons.push("STALE_EVALUATION_PRESENT");
  if (input.lastSafeActivityAt && input.now.getTime() - Date.parse(input.lastSafeActivityAt) > 14 * 24 * 60 * 60 * 1000) {
    reasons.push("NO_RECENT_SAFE_ACTIVITY");
  }

  const uniqueReasons = unique(reasons) as HealthReasonCode[];
  if (!uniqueReasons.length) return { state: "OK" as HealthState, reasons: ["OK" as HealthReasonCode] };
  const setupNeeded = uniqueReasons.includes("ACCOUNT_RECORD_INCOMPLETE") || uniqueReasons.includes("NO_PROFILE");
  return { state: setupNeeded ? "SETUP_NEEDED" as HealthState : "NEEDS_ATTENTION" as HealthState, reasons: uniqueReasons };
}

function rowsForUser(rows: AnyRow[], id: string) {
  return rows.filter((row) => userId(row) === id);
}

function rowsForProfiles(rows: AnyRow[], profileIds: string[]) {
  const ids = new Set(profileIds);
  return rows.filter((row) => ids.has(profileId(row)));
}

function activeDecisionRows(rows: AnyRow[]) {
  return rows.filter((row) => !toIso(row.supersededAt));
}

function pendingCandidates(rows: AnyRow[]) {
  return rows.filter((row) => ["PROPOSED", "NEEDS_REVIEW"].includes(safeCode(row.status)));
}

function confirmedFacts(rows: AnyRow[]) {
  return rows.filter((row) => safeCode(row.status) === "CUSTOMER_CONFIRMED" || safeCode(row.authorityState).startsWith("CUSTOMER_CONFIRMED"));
}

function explicitOpportunityDecisionEvents(rows: AnyRow[]) {
  return rows.filter((row) => safeCode(row.eventType) === "OPPORTUNITY_DECISION_CHANGED");
}

function explicitOpportunityLifecycleEvents(rows: AnyRow[]) {
  return rows.filter((row) => safeCode(row.eventType).startsWith("OPPORTUNITY_LIFECYCLE") || safeCode(row.eventType).endsWith("_STATE_CHANGED"));
}

export function buildCareerOsBetaOperationsReadModel(
  rows: CareerOsBetaOperationsRows = {},
  options: BuildOptions = {},
): CareerOsBetaOperationsReadModel {
  const now = options.now || new Date();
  const generatedAt = now.toISOString();
  const users = toRows(rows.users);
  const memberships = toRows(rows.memberships);
  const sessions = toRows(rows.sessions);
  const profiles = toRows(rows.profiles);
  const onboarding = toRows(rows.onboarding);
  const sources = toRows(rows.sources);
  const candidateFacts = toRows(rows.candidateFacts);
  const reviewDecisions = toRows(rows.reviewDecisions);
  const careerFacts = toRows(rows.careerFacts);
  const contextClaims = toRows(rows.contextClaims);
  const capabilities = toRows(rows.capabilities);
  const capabilityDecisions = toRows(rows.capabilityDecisions);
  const searchPreferences = toRows(rows.searchPreferences);
  const opportunities = toRows(rows.opportunities);
  const matchEvaluations = toRows(rows.matchEvaluations);
  const opportunityEvents = toRows(rows.opportunityEvents);
  const inboxItems = toRows(rows.inboxItems);
  const auditEvents = toRows(rows.auditEvents);

  const availableTables = new Set(options.availableTables || OPTIONAL_TABLE_KEYS.map((key) => POSTGRES_TABLES[key].table));
  const optionalTables = options.optionalTables || OPTIONAL_TABLE_KEYS.map((key) => POSTGRES_TABLES[key].table);
  const sourceTables = optionalTables.filter((table) => availableTables.has(table)).sort();
  const unavailableOptionalTables = optionalTables.filter((table) => !availableTables.has(table)).sort();

  const modelUsers = users.map((user): CareerOsBetaUserOperationalRow => {
    const id = rowId(user);
    const userMemberships = rowsForUser(memberships, id);
    const userSessions = rowsForUser(sessions, id);
    const userProfiles = rowsForUser(profiles, id);
    const userProfileIds = userProfiles.map(rowId).filter(Boolean);
    const userOnboarding = rowsForProfiles(onboarding, userProfileIds);
    const userSources = rowsForUser(sources, id);
    const userCandidateFacts = rowsForUser(candidateFacts, id);
    const userReviewDecisions = rowsForUser(reviewDecisions, id);
    const userCareerFacts = rowsForUser(careerFacts, id);
    const userContextClaims = rowsForUser(contextClaims, id);
    const userCapabilities = rowsForUser(capabilities, id);
    const userCapabilityDecisions = activeDecisionRows(rowsForUser(capabilityDecisions, id));
    const userSearchPreferences = rowsForUser(searchPreferences, id);
    const userOpportunities = rowsForUser(opportunities, id);
    const userMatchEvaluations = rowsForUser(matchEvaluations, id);
    const userOpportunityEvents = rowsForUser(opportunityEvents, id);
    const userInboxItems = rowsForUser(inboxItems, id);
    const userAuditEvents = rowsForUser(auditEvents, id);
    const pendingCandidateCount = pendingCandidates(userCandidateFacts).length;
    const confirmedCareerFactCount = confirmedFacts(userCareerFacts).length;
    const staleEvaluationCount = userMatchEvaluations.filter((row) => row.stale === true).length;
    const accountCreatedAt = toIso(user.createdAt);
    const safeLastActivityAt = latestIso([
      accountCreatedAt,
      toIso(user.updatedAt),
      ...userSessions.flatMap((row) => [toIso(row.createdAt), toIso(row.lastUsedAt)]),
      ...userProfiles.map((row) => toIso(row.updatedAt)),
      ...userOnboarding.map((row) => toIso(row.updatedAt)),
      ...userSources.map((row) => toIso(row.updatedAt)),
      ...userCandidateFacts.map((row) => toIso(row.updatedAt)),
      ...userReviewDecisions.map((row) => toIso(row.createdAt)),
      ...userCareerFacts.map((row) => toIso(row.updatedAt)),
      ...userContextClaims.map((row) => toIso(row.updatedAt)),
      ...userCapabilities.map((row) => toIso(row.updatedAt)),
      ...userCapabilityDecisions.map((row) => toIso(row.createdAt)),
      ...userSearchPreferences.map((row) => toIso(row.updatedAt)),
      ...userOpportunities.map((row) => toIso(row.updatedAt)),
      ...userMatchEvaluations.map((row) => toIso(row.createdAt)),
      ...userOpportunityEvents.map((row) => toIso(row.createdAt)),
      ...userInboxItems.flatMap((row) => [toIso(row.updatedAt), toIso(row.importedAt), toIso(row.discoveredAt)]),
      ...userAuditEvents.map((row) => toIso(row.createdAt)),
    ]);
    const opportunityDecisionCounts = countBy(userOpportunities, "decisionState");
    const opportunityLifecycleCounts = countBy(userOpportunities, "lifecycleState");
    const activeSessions = activeSessionCount(userSessions, now);
    const lifecycle = lifecycleForUser({
      profileCount: userProfiles.length,
      sourceCount: userSources.length,
      candidateFactCount: userCandidateFacts.length,
      confirmedCareerFactCount,
      contextClaimCount: userContextClaims.length,
      capabilityCount: userCapabilities.length,
      searchPreferenceCount: userSearchPreferences.length,
      inboxCount: userInboxItems.length,
      opportunityCount: userOpportunities.length,
      evaluationCount: userMatchEvaluations.length,
      opportunityDecisionCounts,
      opportunityLifecycleCounts,
      explicitDecisionEventCount: explicitOpportunityDecisionEvents(userOpportunityEvents).length,
      explicitLifecycleEventCount: explicitOpportunityLifecycleEvents(userOpportunityEvents).length,
      returnObserved: returnObserved(userSessions),
    });
    const health = healthForUser({
      tenantCount: userMemberships.length,
      profileCount: userProfiles.length,
      sourceCount: userSources.length,
      candidateFactCount: userCandidateFacts.length,
      pendingCandidateCount,
      confirmedCareerFactCount,
      capabilityCount: userCapabilities.length,
      searchPreferenceCount: userSearchPreferences.length,
      opportunityCount: userOpportunities.length,
      inboxCount: userInboxItems.length,
      evaluationCount: userMatchEvaluations.length,
      staleEvaluationCount,
      lastSafeActivityAt: safeLastActivityAt,
      now,
    });

    return {
      userIdentifier: pseudonymousUserIdentifier(id),
      accountStatus: userMemberships.length === 0 ? "ACCOUNT_RECORD_INCOMPLETE" : activeSessions > 0 ? "ACTIVE_SESSION" : "ACCOUNT_CREATED",
      accountCreatedAt,
      lastSafeActivityAt: safeLastActivityAt,
      currentLifecycleStage: currentLifecycleStage(lifecycle),
      lifecycle,
      onboardingStage: userOnboarding[0] ? safeCode(userOnboarding[0].stage, "UNKNOWN") : null,
      profileObserved: userProfiles.length > 0,
      searchPreferenceObserved: userSearchPreferences.length > 0,
      counts: {
        tenantCount: userMemberships.length,
        activeSessionCount: activeSessions,
        sourceCount: userSources.length,
        candidateFactCount: userCandidateFacts.length,
        reviewDecisionCount: userReviewDecisions.length,
        confirmedCareerFactCount,
        contextClaimCount: userContextClaims.length,
        capabilityCount: userCapabilities.length,
        capabilityDecisionCount: userCapabilityDecisions.length,
        searchPreferenceCount: userSearchPreferences.length,
        opportunityInboxCount: userInboxItems.length,
        opportunityCount: userOpportunities.length,
        evaluationCount: userMatchEvaluations.length,
        staleEvaluationCount,
        opportunityEventCount: userOpportunityEvents.length,
      },
      aggregates: {
        candidateStatusCounts: countBy(userCandidateFacts, "status"),
        careerFactStatusCounts: countBy(userCareerFacts, "status"),
        capabilityAuthorityCounts: countBy(userCapabilities, "authorityState"),
        opportunityDecisionCounts,
        opportunityLifecycleCounts,
        inboxStatusCounts: countBy(userInboxItems, "status"),
      },
      health,
    };
  });

  modelUsers.sort((left, right) => {
    const rightActivity = right.lastSafeActivityAt ? Date.parse(right.lastSafeActivityAt) : 0;
    const leftActivity = left.lastSafeActivityAt ? Date.parse(left.lastSafeActivityAt) : 0;
    if (rightActivity !== leftActivity) return rightActivity - leftActivity;
    const leftCreated = left.accountCreatedAt ? Date.parse(left.accountCreatedAt) : 0;
    const rightCreated = right.accountCreatedAt ? Date.parse(right.accountCreatedAt) : 0;
    if (leftCreated !== rightCreated) return leftCreated - rightCreated;
    return left.userIdentifier.localeCompare(right.userIdentifier);
  });

  const activeCutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  return {
    modelVersion: CAREEROS_BETA_OPERATIONS_MODEL_VERSION,
    generatedAt,
    persistence: options.persistence || "local_json",
    readOnly: true,
    schemaChangeRequired: false,
    customerDataMutated: false,
    privateEvidenceReturned: false,
    userIdentifierStrategy: "stable_pseudonymous_user_id_hash",
    sourceTables,
    unavailableOptionalTables: unavailableOptionalTables.filter((table) => !CONTENT_BEARING_TABLES_EXCLUDED.includes(table)),
    summary: {
      totalBetaUsers: modelUsers.length,
      activeLast7Days: modelUsers.filter((user) => user.lastSafeActivityAt && Date.parse(user.lastSafeActivityAt) >= activeCutoff).length,
      usersWithKnowMeObserved: modelUsers.filter((user) => user.lifecycle.KNOW_ME === "OBSERVED").length,
      usersWithDiscoveryObserved: modelUsers.filter((user) => user.lifecycle.FIND === "OBSERVED").length,
      usersWithEvaluations: modelUsers.filter((user) => user.counts.evaluationCount > 0).length,
      usersWithPursuitObserved: modelUsers.filter((user) => user.lifecycle.PURSUE === "OBSERVED").length,
      usersWithReturnObserved: modelUsers.filter((user) => user.lifecycle.RETURN === "OBSERVED").length,
      usersNeedingAttention: modelUsers.filter((user) => user.health.state !== "OK").length,
      totalOpportunities: modelUsers.reduce((sum, user) => sum + user.counts.opportunityCount, 0),
      totalEvaluations: modelUsers.reduce((sum, user) => sum + user.counts.evaluationCount, 0),
    },
    users: modelUsers,
  };
}

export function rowsFromLocalStoreData(data: AnyRow): CareerOsBetaOperationsRows {
  return {
    users: toRows(data.users),
    tenants: toRows(data.tenants),
    memberships: toRows(data.memberships),
    sessions: toRows(data.sessions),
    profiles: toRows(data.profiles),
    onboarding: toRows(data.onboarding),
    sources: toRows(data.sources),
    candidateFacts: toRows(data.candidateFacts),
    reviewDecisions: toRows(data.reviewDecisions),
    careerFacts: toRows(data.careerFacts),
    contextClaims: toRows(data.contextClaims),
    capabilities: toRows(data.capabilities),
    capabilityDecisions: toRows(data.capabilityDecisions),
    searchPreferences: toRows(data.searchPreferences),
    opportunities: toRows(data.opportunities),
    matchEvaluations: toRows(data.matchEvaluations),
    opportunityEvents: toRows(data.opportunityEvents),
    inboxItems: toRows(data.inboxItems),
    auditEvents: toRows(data.auditEvents),
  };
}

function defaultLocalStorePath(env: Record<string, string | undefined>) {
  return env.CAREEROS_P0_STORE_PATH || path.join(process.cwd(), ".careeros-p0", "store.json");
}

export async function loadCareerOsBetaOperationsRowsFromLocalStore(options: LoadOptions = {}) {
  const env = options.env || process.env;
  const filePath = options.localStorePath || defaultLocalStorePath(env);
  try {
    const data = JSON.parse(await fs.readFile(filePath, "utf8")) as AnyRow;
    return rowsFromLocalStoreData(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return {};
    throw error;
  }
}

function pgPool(connectionString: string): PgPool {
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const pg = require("pg") as { Pool: new (config: Record<string, unknown>) => PgPool };
  return new pg.Pool({
    connectionString,
    max: 2,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 1000,
  });
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, "\"\"")}"`;
}

async function availableColumns(pool: PgPool, table: string) {
  const result = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position",
    [table],
  );
  return new Set(result.rows.map((row) => clean(row.column_name)));
}

function filterClause(columns: Set<string>, filters: { userIds: string[]; tenantIds: string[]; profileIds: string[] }) {
  if (columns.has("userId") && filters.userIds.length) return { clause: 'WHERE "userId" = ANY($1::text[])', values: [filters.userIds] };
  if (columns.has("profileId") && filters.profileIds.length) return { clause: 'WHERE "profileId" = ANY($1::text[])', values: [filters.profileIds] };
  if (columns.has("tenantId") && filters.tenantIds.length) return { clause: 'WHERE "tenantId" = ANY($1::text[])', values: [filters.tenantIds] };
  return { clause: "", values: [] as unknown[] };
}

async function selectSafeRows(
  pool: PgPool,
  key: keyof Required<CareerOsBetaOperationsRows>,
  filters: { userIds: string[]; tenantIds: string[]; profileIds: string[] },
  rowLimit: number,
) {
  const definition = POSTGRES_TABLES[key];
  const columns = await availableColumns(pool, definition.table);
  if (!columns.size) return { rows: [] as AnyRow[], tableAvailable: false };
  const selectedColumns = definition.columns.filter((column) => columns.has(column));
  if (!selectedColumns.length) return { rows: [] as AnyRow[], tableAvailable: true };
  const filter = filterClause(columns, filters);
  const orderColumn = ["updatedAt", "createdAt", "id"].find((column) => columns.has(column)) || selectedColumns[0];
  const sql = [
    `SELECT ${selectedColumns.map(quoteIdentifier).join(", ")}`,
    `FROM ${quoteIdentifier(definition.table)}`,
    filter.clause,
    `ORDER BY ${quoteIdentifier(orderColumn)} DESC`,
    `LIMIT $${filter.values.length + 1}`,
  ].filter(Boolean).join(" ");
  const result = await pool.query(sql, [...filter.values, rowLimit]);
  return { rows: result.rows, tableAvailable: true };
}

export async function loadCareerOsBetaOperationsRowsFromPostgres(options: LoadOptions = {}) {
  const env = options.env || process.env;
  const connectionString = env.DATABASE_URL;
  if (!connectionString) throw new Error("CAREEROS_DATABASE_URL_REQUIRED");
  const userLimit = Math.max(1, Math.min(500, Number(options.userLimit || 200)));
  const rowLimit = Math.max(1, Math.min(10000, Number(options.rowLimit || 5000)));
  const pool = pgPool(connectionString);
  const availableTables: string[] = [];
  const rows: CareerOsBetaOperationsRows = {};

  try {
    const usersResult = await selectSafeRows(pool, "users", { userIds: [], tenantIds: [], profileIds: [] }, userLimit);
    rows.users = usersResult.rows;
    if (usersResult.tableAvailable) availableTables.push(POSTGRES_TABLES.users.table);
    const userIds = rows.users.map(rowId).filter(Boolean);
    if (!userIds.length) return { rows, availableTables: unique(availableTables).sort() };
    const baseFilters = { userIds, tenantIds: [] as string[], profileIds: [] as string[] };

    const membershipsResult = await selectSafeRows(pool, "memberships", baseFilters, rowLimit);
    rows.memberships = membershipsResult.rows;
    if (membershipsResult.tableAvailable) availableTables.push(POSTGRES_TABLES.memberships.table);
    baseFilters.tenantIds = unique(rows.memberships.map(tenantId));

    const profilesResult = await selectSafeRows(pool, "profiles", baseFilters, rowLimit);
    rows.profiles = profilesResult.rows;
    if (profilesResult.tableAvailable) availableTables.push(POSTGRES_TABLES.profiles.table);
    baseFilters.profileIds = unique(rows.profiles.map(rowId));

    const remainingKeys = OPTIONAL_TABLE_KEYS.filter((key) => !["users", "tenants", "memberships", "profiles"].includes(key));
    const results = await Promise.all(remainingKeys.map(async (key) => [key, await selectSafeRows(pool, key, baseFilters, rowLimit)] as const));
    for (const [key, result] of results) {
      rows[key] = result.rows;
      if (result.tableAvailable) availableTables.push(POSTGRES_TABLES[key].table);
    }

    return { rows, availableTables: unique(availableTables).sort() };
  } finally {
    await pool.end();
  }
}

export async function loadCareerOsBetaOperationsReadModel(options: LoadOptions = {}) {
  const env = options.env || process.env;
  const persistence: PersistenceSource = env.CAREEROS_PERSISTENCE === "postgres" || clean(env.NODE_ENV) === "production"
    ? "postgres"
    : "local_json";

  if (persistence === "postgres") {
    const postgres = await loadCareerOsBetaOperationsRowsFromPostgres(options);
    return buildCareerOsBetaOperationsReadModel(postgres.rows, {
      now: options.now,
      persistence,
      availableTables: postgres.availableTables,
      optionalTables: OPTIONAL_TABLE_KEYS.map((key) => POSTGRES_TABLES[key].table),
    });
  }

  const localRows = await loadCareerOsBetaOperationsRowsFromLocalStore(options);
  return buildCareerOsBetaOperationsReadModel(localRows, {
    now: options.now,
    persistence,
    availableTables: OPTIONAL_TABLE_KEYS.map((key) => POSTGRES_TABLES[key].table),
    optionalTables: OPTIONAL_TABLE_KEYS.map((key) => POSTGRES_TABLES[key].table),
  });
}
