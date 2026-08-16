import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function now() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function safeProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    tenantId: profile.tenantId,
    userId: profile.userId,
    displayName: profile.displayName,
    headline: profile.headline,
    location: profile.location,
    careerStage: profile.careerStage,
    status: profile.status,
    version: profile.version,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

async function derivePassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = await new Promise((resolve, reject) => {
    crypto.scrypt(String(password), salt, 64, (error, key) => error ? reject(error) : resolve(key));
  });
  return { salt, hash: Buffer.from(derived).toString("hex") };
}

async function passwordMatches(password, record) {
  const candidate = await derivePassword(password, record.salt);
  const expected = Buffer.from(record.hash, "hex");
  const actual = Buffer.from(candidate.hash, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function createCareerP0Store({ filePath = process.env.CAREEROS_P0_STORE_PATH || path.join(process.cwd(), ".careeros-p0", "store.json"), sessionTtlMs = DEFAULT_TTL_MS } = {}) {
  let writeChain = Promise.resolve();

  async function read() {
    try {
      return JSON.parse(await fs.readFile(filePath, "utf8"));
    } catch (error) {
      if (error?.code === "ENOENT") {
        return { users: [], tenants: [], memberships: [], profiles: [], sources: [], sessions: [] };
      }
      throw error;
    }
  }

  async function write(data) {
    writeChain = writeChain.then(async () => {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const temporaryPath = `${filePath}.${process.pid}.tmp`;
      await fs.writeFile(temporaryPath, JSON.stringify(data, null, 2), "utf8");
      await fs.rename(temporaryPath, filePath);
    });
    return writeChain;
  }

  async function createAccount({ email, password, displayName = "" }) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes("@") || String(password || "").length < 8) {
      throw Object.assign(new Error("invalid_account_input"), { code: "INVALID_ACCOUNT_INPUT" });
    }
    const data = await read();
    if (data.users.some((user) => user.email === normalizedEmail)) {
      throw Object.assign(new Error("account_exists"), { code: "ACCOUNT_EXISTS" });
    }
    const timestamp = now();
    const user = { id: id("usr"), email: normalizedEmail, password: await derivePassword(password), createdAt: timestamp, updatedAt: timestamp };
    const tenant = { id: id("ten"), name: String(displayName || normalizedEmail.split("@")[0]).trim() || "CareerOS profile", createdAt: timestamp, updatedAt: timestamp };
    const membership = { id: id("mem"), tenantId: tenant.id, userId: user.id, role: "OWNER", createdAt: timestamp };
    data.users.push(user);
    data.tenants.push(tenant);
    data.memberships.push(membership);
    await write(data);
    return createSessionFor(data, user, tenant);
  }

  async function createSessionFor(data, user, tenant) {
    const session = { id: id("ses"), userId: user.id, tenantId: tenant.id, expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(), createdAt: now() };
    data.sessions.push(session);
    await write(data);
    return { sessionId: session.id, user: { id: user.id, email: user.email }, tenant: { id: tenant.id, name: tenant.name } };
  }

  async function login({ email, password }) {
    const data = await read();
    const user = data.users.find((candidate) => candidate.email === normalizeEmail(email));
    if (!user || !(await passwordMatches(password, user.password))) {
      throw Object.assign(new Error("invalid_credentials"), { code: "INVALID_CREDENTIALS" });
    }
    const membership = data.memberships.find((candidate) => candidate.userId === user.id && candidate.role === "OWNER");
    const tenant = data.tenants.find((candidate) => candidate.id === membership?.tenantId);
    if (!tenant) throw Object.assign(new Error("tenant_membership_missing"), { code: "TENANT_MEMBERSHIP_MISSING" });
    return createSessionFor(data, user, tenant);
  }

  async function resolveSession(sessionId) {
    if (!sessionId) return null;
    const data = await read();
    const session = data.sessions.find((candidate) => candidate.id === sessionId && Date.parse(candidate.expiresAt) > Date.now());
    if (!session) return null;
    const user = data.users.find((candidate) => candidate.id === session.userId);
    const membership = data.memberships.find((candidate) => candidate.userId === session.userId && candidate.tenantId === session.tenantId);
    const tenant = data.tenants.find((candidate) => candidate.id === session.tenantId);
    if (!user || !membership || !tenant) return null;
    return { session, user: { id: user.id, email: user.email }, tenant: { id: tenant.id, name: tenant.name }, membership };
  }

  async function destroySession(sessionId) {
    const data = await read();
    data.sessions = data.sessions.filter((session) => session.id !== sessionId);
    await write(data);
  }

  async function getProfile(sessionId) {
    const context = await resolveSession(sessionId);
    if (!context) return null;
    const data = await read();
    return safeProfile(data.profiles.find((profile) => profile.tenantId === context.tenant.id && profile.userId === context.user.id));
  }

  async function saveProfile(sessionId, input) {
    const context = await resolveSession(sessionId);
    if (!context) throw Object.assign(new Error("unauthorized"), { code: "UNAUTHORIZED" });
    const data = await read();
    const timestamp = now();
    let profile = data.profiles.find((candidate) => candidate.tenantId === context.tenant.id && candidate.userId === context.user.id);
    const clean = (value) => value == null ? null : String(value).trim().slice(0, 240) || null;
    if (!profile) {
      profile = { id: id("profile"), tenantId: context.tenant.id, userId: context.user.id, displayName: clean(input.displayName) || context.user.email.split("@")[0], headline: clean(input.headline), location: clean(input.location), careerStage: clean(input.careerStage), status: "ACTIVE", version: 1, createdAt: timestamp, updatedAt: timestamp };
      data.profiles.push(profile);
    } else {
      profile.displayName = clean(input.displayName) || profile.displayName;
      profile.headline = input.headline === undefined ? profile.headline : clean(input.headline);
      profile.location = input.location === undefined ? profile.location : clean(input.location);
      profile.careerStage = input.careerStage === undefined ? profile.careerStage : clean(input.careerStage);
      profile.version += 1;
      profile.updatedAt = timestamp;
    }
    await write(data);
    return safeProfile(profile);
  }

  async function listSources(sessionId) {
    const context = await resolveSession(sessionId);
    if (!context) throw Object.assign(new Error("unauthorized"), { code: "UNAUTHORIZED" });
    const data = await read();
    return data.sources.filter((source) => source.tenantId === context.tenant.id && source.userId === context.user.id).map(({ id: sourceId, tenantId, userId, profileId, sourceType, sourceStatus, originalFilename, contentReference, createdAt, updatedAt }) => ({ id: sourceId, tenantId, userId, profileId, sourceType, sourceStatus, originalFilename, contentReference, createdAt, updatedAt }));
  }

  async function createSource(sessionId, input) {
    const context = await resolveSession(sessionId);
    if (!context) throw Object.assign(new Error("unauthorized"), { code: "UNAUTHORIZED" });
    const data = await read();
    const profile = data.profiles.find((candidate) => candidate.tenantId === context.tenant.id && candidate.userId === context.user.id);
    if (!profile) throw Object.assign(new Error("profile_required"), { code: "PROFILE_REQUIRED" });
    const sourceTypes = new Set(["RESUME", "MANUAL_WORK_HISTORY", "PORTFOLIO", "CERTIFICATION", "PROJECT", "OTHER_USER_SUPPLIED_SOURCE"]);
    if (!sourceTypes.has(input?.sourceType)) throw Object.assign(new Error("invalid_source_type"), { code: "INVALID_SOURCE_TYPE" });
    const timestamp = now();
    const source = { id: id("source"), tenantId: context.tenant.id, userId: context.user.id, profileId: profile.id, sourceType: input.sourceType, sourceStatus: "PENDING_STORAGE", originalFilename: input.originalFilename ? String(input.originalFilename).trim().slice(0, 240) : null, contentReference: null, createdAt: timestamp, updatedAt: timestamp };
    data.sources.push(source);
    await write(data);
    return source;
  }

  return { createAccount, login, resolveSession, destroySession, getProfile, saveProfile, listSources, createSource, _read: read };
}

export const CAREEROS_P0_COOKIE = "careeros_p0_session";
