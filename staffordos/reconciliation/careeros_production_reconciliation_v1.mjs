import crypto from "node:crypto";
import { assertCareerP0Environment } from "../ui/operator-frontend/careeros-beta/lib/career/careerP0Environment.mjs";

export const OPERATION_NAME = "CAREEROS_PRODUCTION_OPPORTUNITY_RECONCILIATION_V1";
const ID_PATTERN = /^[A-Za-z0-9_-]{1,160}$/;
const MAX_OUTPUT_BYTES = 100_000;
const ALLOWED_EVENT_METADATA = new Set(["regeneration"]);

function fail(code, details = {}) {
  throw Object.assign(new Error(code), { code, ...details });
}

function validateOpportunityId(opportunityId) {
  if (typeof opportunityId !== "string" || !ID_PATTERN.test(opportunityId)) fail("INVALID_OPPORTUNITY_ID");
  return opportunityId;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

function boundedEventMetadata(metadata) {
  if (metadata == null) return {};
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) fail("UNEXPECTED_EVENT_METADATA");
  const keys = Object.keys(metadata);
  if (keys.some((key) => !ALLOWED_EVENT_METADATA.has(key))) fail("UNEXPECTED_EVENT_METADATA");
  return { ...(Object.hasOwn(metadata, "regeneration") ? { regeneration: Boolean(metadata.regeneration) } : {}) };
}

function outputSize(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

export function createCareerOSProductionReconciler({ pool, expectedIdentity }) {
  if (!pool || typeof pool.connect !== "function") fail("READ_POOL_REQUIRED");
  if (!expectedIdentity?.database || !expectedIdentity?.schema) fail("PRODUCTION_IDENTITY_REQUIRED");

  return async function reconcileCareerOpportunity(opportunityId) {
    const id = validateOpportunityId(opportunityId);
    const client = await pool.connect();
    let inTransaction = false;
    try {
      await client.query("BEGIN TRANSACTION READ ONLY");
      inTransaction = true;
      const readOnly = (await client.query("SHOW transaction_read_only")).rows[0]?.transaction_read_only;
      if (String(readOnly).toLowerCase() !== "on") fail("READ_ONLY_TRANSACTION_NOT_ENFORCED");
      const identity = (await client.query("SELECT current_database() AS database, current_schema() AS schema")).rows[0];
      if (!identity || identity.database !== expectedIdentity.database || identity.schema !== expectedIdentity.schema) fail("PRODUCTION_IDENTITY_MISMATCH");

      const opportunityResult = await client.query(
        'SELECT id,"tenantId","userId", "decisionState","lifecycleState","createdAt","updatedAt" FROM "CareerOpportunity" WHERE id=$1',
        [id],
      );
      if (opportunityResult.rowCount !== 1) fail(opportunityResult.rowCount === 0 ? "OPPORTUNITY_NOT_FOUND" : "AMBIGUOUS_OPPORTUNITY_OWNERSHIP");
      const opportunity = opportunityResult.rows[0];
      if (!opportunity.tenantId || !opportunity.userId) fail("AMBIGUOUS_OPPORTUNITY_OWNERSHIP");

      const drafts = (await client.query(
        'SELECT id,"draftVersion","createdAt","updatedAt",content FROM "CareerResumeDraft" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3 AND "materialType"=$4 ORDER BY "draftVersion" ASC,"createdAt" ASC,id ASC',
        [id, opportunity.tenantId, opportunity.userId, "RESUME"],
      )).rows;
      const normalizedDrafts = drafts.map((draft) => {
        const content = draft.content && typeof draft.content === "object" ? draft.content : null;
        if (!content) fail("INVALID_DRAFT_CONTENT");
        return {
          id: draft.id,
          draftVersion: Number(draft.draftVersion),
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
          editedByUser: Boolean(content.editedByUser),
          contentDigest: digest(content),
        };
      });
      const versions = normalizedDrafts.map((draft) => draft.draftVersion);
      const latest = normalizedDrafts.at(-1) || null;
      const expectedVersions = versions.map((_, index) => versions[0] + index);
      const versionSequenceValid = versions.length === 0 || versions.every((version, index) => version === expectedVersions[index]);

      const eventRows = (await client.query(
        'SELECT id,"eventType","createdAt",metadata FROM "CareerOpportunityEvent" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3 AND "eventType"=$4 ORDER BY "createdAt" ASC,id ASC',
        [id, opportunity.tenantId, opportunity.userId, "APPLICATION_MATERIAL_REGENERATED"],
      )).rows;
      const events = eventRows.map((event) => ({ id: event.id, eventType: event.eventType, createdAt: event.createdAt, metadata: boundedEventMetadata(event.metadata) }));
      const result = {
        operation: OPERATION_NAME,
        productionIdentityStatus: "VERIFIED",
        opportunityId: id,
        opportunity: { decisionState: opportunity.decisionState, lifecycleState: opportunity.lifecycleState, createdAt: opportunity.createdAt, updatedAt: opportunity.updatedAt },
        resumeDrafts: {
          count: normalizedDrafts.length,
          versions,
          latestVersion: latest?.draftVersion ?? null,
          latestDraftId: latest?.id ?? null,
          previousDraftPreserved: normalizedDrafts.length > 1,
          versionSequenceValid,
          historicalDigests: normalizedDrafts.slice(0, -1).map(({ id: draftId, draftVersion, contentDigest }) => ({ id: draftId, draftVersion, contentDigest })),
          editedByUserByVersion: Object.fromEntries(normalizedDrafts.map((draft) => [String(draft.draftVersion), draft.editedByUser])),
        },
        regeneration: { eventPresent: events.length > 0, eventCount: events.length, events },
        verification: { readOnlyEnforced: true, exactOpportunityScope: true, crossTenantRejected: true, productionIdentityVerified: true },
      };
      if (outputSize(result) > MAX_OUTPUT_BYTES) fail("OUTPUT_TOO_LARGE");
      await client.query("ROLLBACK");
      inTransaction = false;
      return result;
    } catch (error) {
      if (inTransaction) await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  };
}

export async function reconcileCareerOpportunity(opportunityId) {
  assertCareerP0Environment();
  const expectedDatabase = String(process.env.CAREEROS_RECONCILIATION_PRODUCTION_DATABASE || "").trim();
  const expectedSchema = String(process.env.CAREEROS_RECONCILIATION_PRODUCTION_SCHEMA || "public").trim();
  if (!expectedDatabase) fail("PRODUCTION_IDENTITY_REQUIRED");
  const { createCareerP0PostgresStore } = await import("../ui/operator-frontend/careeros-beta/lib/career/careerP0Postgres.mjs");
  const store = createCareerP0PostgresStore({ connectionString: process.env.DATABASE_URL });
  try {
    return await createCareerOSProductionReconciler({ pool: store._pool, expectedIdentity: { database: expectedDatabase, schema: expectedSchema } })(opportunityId);
  } finally {
    await store._pool.end();
  }
}
