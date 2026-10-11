import * as crypto from "node:crypto";
// @ts-expect-error pg is a runtime dependency of the operator frontend and does not ship declarations.
import { Pool } from "pg";
import type { StaffordOsOperatorAuthConfig, StaffordOsOperatorSession, VerifiedStaffordOsOperator } from "./staffordosOperatorSession";

export type StaffordOsOperatorSessionRepository = {
  createSession(input: {
    verified: VerifiedStaffordOsOperator;
    config: StaffordOsOperatorAuthConfig;
    session: StaffordOsOperatorSession;
    now: Date;
  }): Promise<void>;
  resolveSession(input: {
    sessionId: string;
    config: StaffordOsOperatorAuthConfig;
    now: Date;
  }): Promise<StaffordOsOperatorSession | null>;
  revokeSession(input: {
    sessionId: string;
    config: StaffordOsOperatorAuthConfig;
    now: Date;
  }): Promise<void>;
};

type SqlClient = {
  query(text: string, values?: unknown[]): Promise<{ rows: Array<Record<string, any>> }>;
  release(): void;
};

type SqlPool = {
  connect(): Promise<SqlClient>;
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  viewer: ["shopifixer.audit.read", "shopifixer.scope.read", "shopifixer.approval.read", "shopifixer.packet.read"],
  reviewer: ["shopifixer.audit.read", "shopifixer.scope.read", "shopifixer.approval.read", "shopifixer.packet.read"],
  execution_authorizer: [
    "shopifixer.audit.read",
    "shopifixer.scope.read",
    "shopifixer.approval.read",
    "shopifixer.packet.read",
    "shopifixer.execution.authorization.request",
    "shopifixer.execution.authorization.revoke",
  ],
  careeros_beta_operations_viewer: ["careeros.beta.operations.read"],
  staffordmedia_revenue_operator: ["staffordos.revenue_operations.write"],
  administrator: [
    "shopifixer.audit.read",
    "shopifixer.scope.read",
    "shopifixer.approval.read",
    "shopifixer.packet.read",
    "shopifixer.execution.authorization.request",
    "shopifixer.execution.authorization.revoke",
    "shopifixer.operator.manage",
    "careeros.beta.operations.read",
    "staffordos.revenue_operations.write",
  ],
};

const poolKey = Symbol.for("staffordos.operator.session.pool");
const globalState = globalThis as typeof globalThis & { [poolKey]?: SqlPool };

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizedEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function operatorId(verified: VerifiedStaffordOsOperator) {
  return `staffordos_operator_${crypto
    .createHash("sha256")
    .update(`${verified.issuer}:${verified.subject}`)
    .digest("hex")
    .slice(0, 24)}`;
}

function sessionFingerprint(sessionId: string, issuer: string, audience: string) {
  return crypto.createHash("sha256").update(`${issuer}\0${audience}\0${sessionId}`).digest("hex");
}

function id() {
  return crypto.randomUUID();
}

function permissionsForRoles(roles: string[]) {
  return Array.from(new Set(roles.flatMap((role) => ROLE_PERMISSIONS[role] || []))).sort();
}

function isRenderDatabaseUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "render.com" || hostname.endsWith(".render.com");
  } catch {
    return false;
  }
}

function getPool(): SqlPool {
  if (globalState[poolKey]) return globalState[poolKey];
  const connectionString = clean(process.env.DATABASE_URL);
  if (!connectionString) throw new Error("STAFFORDOS_OPERATOR_DATABASE_URL_MISSING");
  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    ssl: isRenderDatabaseUrl(connectionString) ? { rejectUnauthorized: false } : undefined,
  }) as SqlPool;
  globalState[poolKey] = pool;
  return pool;
}

async function transaction<T>(operation: (client: SqlClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function sessionFromRow(row: Record<string, any>, roles: string[], config: StaffordOsOperatorAuthConfig): StaffordOsOperatorSession {
  return {
    id: row.sessionId,
    subject: row.externalSubject,
    issuer: row.identityProvider,
    audience: config.audience,
    roles,
    permissions: permissionsForRoles(roles),
    jwtId: "",
    issuedAt: Math.floor(new Date(row.issuedAt).getTime() / 1000),
    expiresAt: Math.floor(new Date(row.expiresAt).getTime() / 1000),
  };
}

export const postgresStaffordOsOperatorSessionRepository: StaffordOsOperatorSessionRepository = {
  async createSession({ verified, session, now }) {
    const email = normalizedEmail(verified.email);
    if (!email) throw new Error("STAFFORDOS_OPERATOR_EMAIL_MISSING");
    await transaction(async (client) => {
      const existing = await client.query(
        'SELECT "id", "externalSubject" FROM "public"."StaffordosOperator" WHERE "identityProvider" = $1 AND "normalizedEmail" = $2 FOR UPDATE',
        [verified.issuer, email],
      );
      if (existing.rows[0] && existing.rows[0].externalSubject !== verified.subject) {
        throw new Error("STAFFORDOS_OPERATOR_EMAIL_IDENTITY_CONFLICT");
      }

      const operator = await client.query(
        'INSERT INTO "public"."StaffordosOperator" ("id", "operatorId", "externalSubject", "email", "normalizedEmail", "displayName", "identityProvider", "status", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, \'active\', $8, $8) ON CONFLICT ("identityProvider", "externalSubject") DO UPDATE SET "email" = EXCLUDED."email", "normalizedEmail" = EXCLUDED."normalizedEmail", "displayName" = EXCLUDED."displayName", "updatedAt" = EXCLUDED."updatedAt" RETURNING "id", "status", "disabledAt"',
        [id(), operatorId(verified), verified.subject, email, email, verified.displayName || null, verified.issuer, now],
      );
      const operatorRow = operator.rows[0];
      if (!operatorRow || operatorRow.status !== "active" || operatorRow.disabledAt) throw new Error("STAFFORDOS_OPERATOR_DISABLED");

      const trustedRoles = Array.from(new Set([
        ...verified.roles.filter((role) => ROLE_PERMISSIONS[role]),
        ...(verified.permissions.includes("careeros.beta.operations.read") ? ["careeros_beta_operations_viewer"] : []),
      ]));
      await client.query(
        'UPDATE "public"."StaffordosOperatorRole" SET "revokedAt" = $2, "revokedByOperatorId" = $3, "revocationReason" = \'issuer_assertion_role_removed\', "updatedAt" = $2 WHERE "operatorId" = $3 AND "grantSource" = \'staffordos_operator_issuer\' AND "revokedAt" IS NULL AND NOT ("role" = ANY($1::text[]))',
        [trustedRoles, now, operatorRow.id],
      );
      for (const role of trustedRoles) {
        await client.query(
          'INSERT INTO "public"."StaffordosOperatorRole" ("id", "operatorId", "role", "scope", "activeKey", "grantSource", "createdAt", "updatedAt") VALUES ($1, $2, $3, \'shopifixer\', $4, \'staffordos_operator_issuer\', $5, $5) ON CONFLICT ("activeKey") DO UPDATE SET "revokedAt" = NULL, "revocationReason" = NULL, "updatedAt" = EXCLUDED."updatedAt"',
          [id(), operatorRow.id, role, `${operatorRow.id}:${role}:shopifixer`, now],
        );
      }

      await client.query(
        'INSERT INTO "public"."StaffordosOperatorSession" ("id", "operatorId", "sessionId", "sessionFingerprint", "identityProvider", "externalSubject", "issuedAt", "expiresAt", "authenticatedAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $9)',
        [id(), operatorRow.id, session.id, sessionFingerprint(session.id, verified.issuer, verified.audience), verified.issuer, verified.subject, new Date(session.issuedAt * 1000), new Date(session.expiresAt * 1000), now],
      );
      await client.query(
        'INSERT INTO "public"."StaffordosOperatorEvent" ("id", "operatorId", "actorOperatorId", "eventType", "visibility", "source", "idempotencyKey", "reasonCode", "sessionFingerprint", "createdAt") VALUES ($1, $2, $2, \'operator_session_created\', \'internal\', \'staffordos_operator_frontend\', $3, \'oauth_assertion_verified\', $4, $5)',
        [id(), operatorRow.id, `session:${session.id}:created`, sessionFingerprint(session.id, verified.issuer, verified.audience), now],
      );
    });
  },

  async resolveSession({ sessionId, config, now }) {
    return transaction(async (client) => {
      const result = await client.query(
        'SELECT s."sessionId", s."sessionFingerprint", s."identityProvider", s."externalSubject", s."issuedAt", s."expiresAt", s."revokedAt", o."status", o."disabledAt", r."role" FROM "public"."StaffordosOperatorSession" s JOIN "public"."StaffordosOperator" o ON o."id" = s."operatorId" LEFT JOIN "public"."StaffordosOperatorRole" r ON r."operatorId" = o."id" AND r."revokedAt" IS NULL WHERE s."sessionId" = $1 ORDER BY r."role" ASC',
        [sessionId],
      );
      const first = result.rows[0];
      if (!first || first.revokedAt || first.status !== "active" || first.disabledAt) return null;
      if (new Date(first.expiresAt).getTime() <= now.getTime()) return null;
      if (
        first.identityProvider !== config.issuer ||
        first.sessionFingerprint !== sessionFingerprint(sessionId, config.issuer, config.audience) ||
        !config.allowedSubjects.includes(first.externalSubject)
      ) return null;
      const roles = result.rows.map((row) => clean(row.role)).filter(Boolean);
      return sessionFromRow(first, roles, config);
    });
  },

  async revokeSession({ sessionId, now }) {
    await transaction(async (client) => {
      const result = await client.query(
        'SELECT "id", "operatorId", "sessionFingerprint" FROM "public"."StaffordosOperatorSession" WHERE "sessionId" = $1 FOR UPDATE',
        [sessionId],
      );
      const row = result.rows[0];
      if (!row) return;
      await client.query(
        'UPDATE "public"."StaffordosOperatorSession" SET "revokedAt" = COALESCE("revokedAt", $2), "revocationReason" = COALESCE("revocationReason", \'operator_logout\'), "revokedByOperatorId" = COALESCE("revokedByOperatorId", "operatorId"), "updatedAt" = $2 WHERE "id" = $1',
        [row.id, now],
      );
      await client.query(
        'INSERT INTO "public"."StaffordosOperatorEvent" ("id", "operatorId", "actorOperatorId", "eventType", "visibility", "source", "idempotencyKey", "reasonCode", "sessionFingerprint", "createdAt") VALUES ($1, $2, $2, \'operator_session_revoked\', \'internal\', \'staffordos_operator_frontend\', $3, \'operator_logout\', $4, $5) ON CONFLICT ("idempotencyKey") DO NOTHING',
        [id(), row.operatorId, `session:${sessionId}:revoked`, row.sessionFingerprint, now],
      );
    });
  },
};
