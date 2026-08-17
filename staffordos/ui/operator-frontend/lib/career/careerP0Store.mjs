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

function safeSource(source) {
  if (!source) return null;
  const { textContent, ...metadata } = source;
  return metadata;
}

function audit(data, tenantId, userId, eventType, entityType = null, entityId = null) {
  data.auditEvents ||= [];
  data.auditEvents.push({ id: id("audit"), tenantId, userId, eventType, entityType, entityId, createdAt: now() });
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
      const data = JSON.parse(await fs.readFile(filePath, "utf8"));
      data.candidateFacts ||= [];
      data.reviewDecisions ||= [];
      data.careerFacts ||= [];
      data.auditEvents ||= [];
      data.rateLimitBuckets ||= {};
      return data;
    } catch (error) {
      if (error?.code === "ENOENT") {
        return { users: [], tenants: [], memberships: [], profiles: [], sources: [], sessions: [], candidateFacts: [], reviewDecisions: [], careerFacts: [], auditEvents: [], rateLimitBuckets: {} };
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
    audit(data, tenant.id, user.id, "ACCOUNT_CREATED");
    await write(data);
    audit(data, tenant.id, user.id, "LOGIN");
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
    const current = data.sessions.find((session) => session.id === sessionId);
    data.sessions = data.sessions.filter((session) => session.id !== sessionId);
    if (current) audit(data, current.tenantId, current.userId, "LOGOUT");
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
    audit(data, context.tenant.id, context.user.id, "PROFILE_UPDATED", "CareerProfile", profile.id);
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
    const sourceTypes = new Set(["RESUME", "MANUAL_WORK_HISTORY", "PORTFOLIO", "CERTIFICATION", "PROJECT", "OTHER_USER_SUPPLIED_SOURCE", "RESUME_TEXT", "PORTFOLIO_DESCRIPTION", "OTHER_USER_PROVIDED_TEXT"]);
    if (!sourceTypes.has(input?.sourceType)) throw Object.assign(new Error("invalid_source_type"), { code: "INVALID_SOURCE_TYPE" });
    const timestamp = now();
    const textContent = input.textContent == null ? null : String(input.textContent).trim().slice(0, 50000);
    const source = { id: id("source"), tenantId: context.tenant.id, userId: context.user.id, profileId: profile.id, sourceType: input.sourceType, sourceStatus: textContent ? "STORED" : "PENDING_STORAGE", originalFilename: input.originalFilename ? String(input.originalFilename).trim().slice(0, 240) : null, contentReference: null, textContent, sourceDigest: input.sourceDigest || null, createdAt: timestamp, updatedAt: timestamp };
    data.sources.push(source);
    audit(data, context.tenant.id, context.user.id, "SOURCE_CREATED", "CareerSource", source.id);
    await write(data);
    return safeSource(source);
  }

  async function getSource(sessionId, sourceId) {
    const context = await resolveSession(sessionId);
    if (!context) throw Object.assign(new Error("unauthorized"), { code: "UNAUTHORIZED" });
    const data = await read();
    const source = data.sources.find((candidate) => candidate.id === sourceId && candidate.tenantId === context.tenant.id && candidate.userId === context.user.id);
    return source ? { ...safeSource(source), textContent: source.textContent || null } : null;
  }

  async function saveCandidates(sessionId, sourceId, extraction) {
    const context = await resolveSession(sessionId);
    if (!context) throw Object.assign(new Error("unauthorized"), { code: "UNAUTHORIZED" });
    const data = await read();
    const source = data.sources.find((candidate) => candidate.id === sourceId && candidate.tenantId === context.tenant.id && candidate.userId === context.user.id);
    if (!source) throw Object.assign(new Error("source_not_found"), { code: "SOURCE_NOT_FOUND" });
    source.sourceDigest = extraction.sourceDigest;
    source.extractorVersion = extraction.extractorVersion;
    source.sourceStatus = "READY";
    source.updatedAt = now();
    data.candidateFacts ||= [];
    const existing = data.candidateFacts.filter((candidate) => candidate.sourceId === sourceId && candidate.extractionVersion === extraction.extractorVersion);
    if (existing.length === 0) data.candidateFacts.push(...extraction.candidates.map((candidate) => ({ ...candidate, tenantId: context.tenant.id, userId: context.user.id, profileId: source.profileId })));
    await write(data);
    return data.candidateFacts.filter((candidate) => candidate.sourceId === sourceId && candidate.tenantId === context.tenant.id && candidate.userId === context.user.id);
  }

  async function listCandidateFacts(sessionId) {
    const context = await resolveSession(sessionId);
    if (!context) throw Object.assign(new Error("unauthorized"), { code: "UNAUTHORIZED" });
    const data = await read();
    return (data.candidateFacts || []).filter((candidate) => candidate.tenantId === context.tenant.id && candidate.userId === context.user.id).map(({ tenantId, userId, profileId, ...candidate }) => candidate);
  }

  async function reviewCandidate(sessionId, candidateId, decision, correction = null) {
    const context = await resolveSession(sessionId);
    if (!context) throw Object.assign(new Error("unauthorized"), { code: "UNAUTHORIZED" });
    const data = await read();
    const candidate = (data.candidateFacts || []).find((item) => item.candidateFactId === candidateId && item.tenantId === context.tenant.id && item.userId === context.user.id);
    if (!candidate) throw Object.assign(new Error("candidate_not_found"), { code: "CANDIDATE_NOT_FOUND" });
    const allowed = new Set(["CONFIRM", "CORRECT", "REJECT", "KEEP_FOR_LATER"]);
    if (!allowed.has(decision)) throw Object.assign(new Error("invalid_review_decision"), { code: "INVALID_REVIEW_DECISION" });
    data.reviewDecisions ||= [];
    data.careerFacts ||= [];
    const timestamp = now();
    const previousStatement = candidate.statement;
    if (decision === "CORRECT") {
      const nextStatement = String(correction || "").trim().slice(0, 500);
      if (!nextStatement) throw Object.assign(new Error("correction_required"), { code: "CORRECTION_REQUIRED" });
      candidate.statement = nextStatement;
      candidate.status = "CORRECTED";
    } else if (decision === "CONFIRM") candidate.status = "CONFIRMED";
    else if (decision === "REJECT") candidate.status = "REJECTED";
    else candidate.status = "NEEDS_REVIEW";
    candidate.updatedAt = timestamp;
    data.reviewDecisions.push({ id: id("review"), candidateFactId: candidateId, tenantId: context.tenant.id, userId: context.user.id, decision, previousStatement, activeStatement: candidate.statement, createdAt: timestamp });
    audit(data, context.tenant.id, context.user.id, `FACT_${decision}`, "CareerFactCandidate", candidateId);
    if (decision === "CONFIRM" || decision === "CORRECT") {
      const existing = data.careerFacts.find((fact) => fact.candidateFactId === candidateId && fact.tenantId === context.tenant.id);
      const fact = { ...(existing || {}), id: existing?.id || id("fact"), candidateFactId: candidateId, tenantId: context.tenant.id, userId: context.user.id, profileId: candidate.profileId, sourceId: candidate.sourceId, factType: candidate.factType, statement: candidate.statement, sourceExcerpt: candidate.sourceExcerpt, sourceOrder: candidate.sourceOrder, scopeStatement: candidate.scopeStatement, status: "CUSTOMER_CONFIRMED", authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED", createdAt: existing?.createdAt || timestamp, updatedAt: timestamp };
      if (!existing) data.careerFacts.push(fact);
      else Object.assign(existing, fact);
    }
    await write(data);
    return { candidate: { ...candidate }, careerFact: data.careerFacts.find((fact) => fact.candidateFactId === candidateId && fact.tenantId === context.tenant.id) || null };
  }

  async function listCareerFacts(sessionId) {
    const context = await resolveSession(sessionId);
    if (!context) throw Object.assign(new Error("unauthorized"), { code: "UNAUTHORIZED" });
    const data = await read();
    return data.careerFacts.filter((fact) => fact.tenantId === context.tenant.id && fact.userId === context.user.id).map(({ tenantId, userId, profileId, ...fact }) => fact);
  }

  async function getOnboardingState(sessionId) {
    const context = await resolveSession(sessionId);
    if (!context) throw Object.assign(new Error("unauthorized"), { code: "UNAUTHORIZED" });
    const data = await read();
    const profile = data.profiles.find((item) => item.tenantId === context.tenant.id && item.userId === context.user.id);
    const sources = data.sources.filter((item) => item.tenantId === context.tenant.id && item.userId === context.user.id);
    const candidates = (data.candidateFacts || []).filter((item) => item.tenantId === context.tenant.id && item.userId === context.user.id);
    return { stage: !profile ? "PROFILE" : sources.length === 0 ? "CAREER_SOURCE" : candidates.some((item) => ["PROPOSED", "NEEDS_REVIEW"].includes(item.status)) ? "FACT_REVIEW" : "READY_FOR_CAPABILITIES", sourceCount: sources.length, candidateCount: candidates.length, confirmedFactCount: data.careerFacts.filter((item) => item.tenantId === context.tenant.id && item.userId === context.user.id).length };
  }

  async function consumeRateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
    const data = await read();
    data.rateLimitBuckets ||= {};
    const current = data.rateLimitBuckets[key];
    const timestamp = Date.now();
    if (!current || current.expiresAt <= timestamp) {
      data.rateLimitBuckets[key] = { count: 1, expiresAt: timestamp + windowMs };
      await write(data);
      return { allowed: true, remaining: Math.max(0, limit - 1) };
    }
    if (current.count >= limit) return { allowed: false, remaining: 0 };
    current.count += 1;
    await write(data);
    return { allowed: true, remaining: Math.max(0, limit - current.count) };
  }

  async function exportAccount(sessionId) {
    const context = await resolveSession(sessionId);
    if (!context) throw Object.assign(new Error("unauthorized"), { code: "UNAUTHORIZED" });
    const data = await read();
    return {
      profile: data.profiles.filter((item) => item.tenantId === context.tenant.id && item.userId === context.user.id).map(safeProfile),
      sources: data.sources.filter((item) => item.tenantId === context.tenant.id && item.userId === context.user.id).map(safeSource),
      candidates: (data.candidateFacts || []).filter((item) => item.tenantId === context.tenant.id && item.userId === context.user.id),
      reviews: (data.reviewDecisions || []).filter((item) => item.tenantId === context.tenant.id && item.userId === context.user.id),
      careerFacts: data.careerFacts.filter((item) => item.tenantId === context.tenant.id && item.userId === context.user.id),
      onboarding: await getOnboardingState(sessionId),
    };
  }

  async function deleteAccount(sessionId) {
    const context = await resolveSession(sessionId);
    if (!context) throw Object.assign(new Error("unauthorized"), { code: "UNAUTHORIZED" });
    const data = await read();
    audit(data, context.tenant.id, context.user.id, "ACCOUNT_DELETED");
    data.sessions = data.sessions.filter((item) => item.tenantId !== context.tenant.id);
    data.sources = data.sources.filter((item) => item.tenantId !== context.tenant.id);
    data.candidateFacts = (data.candidateFacts || []).filter((item) => item.tenantId !== context.tenant.id);
    data.reviewDecisions = (data.reviewDecisions || []).filter((item) => item.tenantId !== context.tenant.id);
    data.careerFacts = data.careerFacts.filter((item) => item.tenantId !== context.tenant.id);
    data.profiles = data.profiles.filter((item) => item.tenantId !== context.tenant.id);
    data.memberships = data.memberships.filter((item) => item.tenantId !== context.tenant.id);
    data.auditEvents = data.auditEvents.filter((item) => item.tenantId !== context.tenant.id);
    data.tenants = data.tenants.filter((item) => item.id !== context.tenant.id);
    data.users = data.users.filter((item) => item.id !== context.user.id);
    await write(data);
  }

  async function auditEvents(sessionId) {
    const context = await resolveSession(sessionId);
    if (!context) throw Object.assign(new Error("unauthorized"), { code: "UNAUTHORIZED" });
    const data = await read();
    return data.auditEvents.filter((item) => item.tenantId === context.tenant.id && item.userId === context.user.id);
  }

  return { createAccount, login, resolveSession, destroySession, consumeRateLimit, getProfile, saveProfile, listSources, createSource, getSource, saveCandidates, listCandidateFacts, reviewCandidate, listCareerFacts, getOnboardingState, exportAccount, deleteAccount, auditEvents, _read: read };
}

export const CAREEROS_P0_COOKIE = "careeros_p0_session";
