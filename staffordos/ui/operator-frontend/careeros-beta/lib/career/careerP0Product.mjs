import crypto from "node:crypto";
import { careerP0Pool } from "./careerP0Auth";
import { CAREEROS_CAPABILITY_TAXONOMY_VERSION, capabilityForKey, capabilityQuestionForEvidence, decisionStateForAnswer, deriveCapabilityCandidates, listCapabilities, refreshCapabilityAuthorityState } from "./capabilityCatalog.mjs";
import { capabilityNeedsReview } from "./capabilityReview.mjs";
import { parseJobDescription } from "./jobProduct.mjs";
import { CAREEROS_OPPORTUNITY_DECISION_LABELS, normalizeOpportunityDecision } from "./jobDecision.mjs";
import { normalizeComparisonIds, summarizeOpportunityForComparison } from "./jobComparison.mjs";
import { buildApplicationEvidencePacket, buildMatchEvidenceRelationships } from "./applicationEvidence.mjs";
import { buildDecisionFirstMatchSummary } from "./decisionFirstMatchSummary.mjs";
import { buildResumeDraft, normalizeDraftText } from "./resumeTailoring.mjs";
import { buildApplicationAnswerDraft, buildCoverLetterDraft, classifyApplicationQuestion } from "./applicationMaterials.mjs";
import { improveApplicationMaterial, writingEvidence } from "./applicationWriting.mjs";
import { classifyInboxDuplicate, normalizeInboxInput, publicInboxItem } from "./opportunityInbox.mjs";
import { boundUsajobsSearch } from "./usajobsDiscovery.mjs";
import { canTransition, lifecycleEventFor, nextOpportunityAction, normalizeLifecycleState } from "./opportunityLifecycle.mjs";
import { reconcileCapabilityAuthority } from "./capabilityAuthorityReconciliation.mjs";
import { compareCapabilityDerivationInputs } from "./capabilityDiagnostic.mjs";

const EVALUATION_VERSION = "CAREEROS_MATCH_EVALUATION_V1";
const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;

function requireContext(context) {
  if (!context?.tenant?.id || !context?.user?.id) throw Object.assign(new Error("UNAUTHORIZED"), { code: "UNAUTHORIZED" });
  return context;
}

async function profileId(pool, context) {
  const result = await pool.query('SELECT id FROM "CareerProfile" WHERE "tenantId"=$1 AND "userId"=$2 LIMIT 1', [context.tenant.id, context.user.id]);
  if (!result.rowCount) throw Object.assign(new Error("PROFILE_REQUIRED"), { code: "PROFILE_REQUIRED" });
  return result.rows[0].id;
}

async function transaction(pool, work) {
  const client = await pool.connect();
  try { await client.query("BEGIN"); const value = await work(client); await client.query("COMMIT"); return value; } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

function publicCapability(row, decision = null, supportingEvidence = []) {
  const catalog = capabilityForKey(row.capabilityKey);
  const question = catalog?.question ? { ...catalog.question, prompt: capabilityQuestionForEvidence(catalog, supportingEvidence.map((item) => item.statement)) } : null;
  return { id: row.id, key: row.capabilityKey, label: row.label, domain: row.domain, scope: row.scope, authorityState: row.authorityState, version: row.version, provenance: { factCount: row.provenance?.factIds?.length || 0, sourceCount: row.provenance?.sourceIds?.length || 0 }, supportingEvidence, question, decision: decision ? { answer: decision.answer, decisionState: decision.decisionState, createdAt: decision.createdAt } : null };
}

async function activeDecisions(pool, context, capabilityIds = []) {
  if (!capabilityIds.length) return new Map();
  const result = await pool.query('SELECT DISTINCT ON ("capabilityId", "questionKey") * FROM "CareerCapabilityDecision" WHERE "tenantId"=$1 AND "userId"=$2 AND "supersededAt" IS NULL AND "capabilityId" = ANY($3::text[]) ORDER BY "capabilityId", "questionKey", "createdAt" DESC', [context.tenant.id, context.user.id, capabilityIds]);
  return new Map(result.rows.map((row) => [row.capabilityId, row]));
}

export async function deriveCapabilities(context, { includeTrace = false, executionTrace = null } = {}) {
  requireContext(context);
  if (executionTrace) { executionTrace.deriveCapabilitiesEntered = true; executionTrace.includeTraceAtDeriveCapabilities = includeTrace; }
  const pool = await careerP0Pool();
  const profile = await profileId(pool, context);
  const facts = (await pool.query('SELECT f.id,f."sourceId",f.statement,f."sourceExcerpt",f."scopeStatement",f."factType",s."sourceType" FROM "CareerFact" f JOIN "CareerSource" s ON s.id=f."sourceId" AND s."tenantId"=f."tenantId" WHERE f."tenantId"=$1 AND f."userId"=$2 AND f."profileId"=$3 AND f."authorityState"=$4 ORDER BY f."createdAt"', [context.tenant.id, context.user.id, profile, "CUSTOMER_CONFIRMED_SOURCE_BACKED"])).rows;
  if (executionTrace) { executionTrace.factQueryExecuted = true; executionTrace.factCountInsideDeriveCapabilities = facts.length; }
  const candidates = deriveCapabilityCandidates(facts);
  if (executionTrace) { executionTrace.deriveCapabilityCandidatesCalled = true; executionTrace.candidateCountInsideDeriveCapabilities = candidates.length; executionTrace.candidateKeysInsideDeriveCapabilities = candidates.map((candidate) => candidate.capabilityKey); }
  const factsById = new Map(facts.map((fact) => [fact.id, fact]));
  const existingAuthorities = new Map((await pool.query('SELECT "capabilityKey","authorityState",provenance FROM "CareerCapabilityAuthority" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3', [context.tenant.id, context.user.id, profile])).rows.map((row) => [row.capabilityKey, row]));
  const reconciliationTrace = includeTrace ? [] : null;
  const derivationTrace = includeTrace ? { candidateKeys: candidates.map((candidate) => candidate.capabilityKey), refreshInvokedKeys: [], reconciliationEnteredKeys: [], reconciliationReturnedKeys: [] } : null;
  for (const candidate of candidates) {
    const existing = existingAuthorities.get(candidate.capabilityKey);
    const authorityState = refreshCapabilityAuthorityState(existing, candidate);
    if (derivationTrace) derivationTrace.refreshInvokedKeys.push(candidate.capabilityKey);
    if (reconciliationTrace) {
      derivationTrace.reconciliationEnteredKeys.push(candidate.capabilityKey);
      await reconcileCapabilityAuthority(pool, context, profile, candidate, authorityState, reconciliationTrace, { authorityState: existing?.authorityState, exists: Boolean(existing) });
      derivationTrace.reconciliationReturnedKeys.push(candidate.capabilityKey);
    } else await reconcileCapabilityAuthority(pool, context, profile, candidate, authorityState);
  }
  const rows = (await pool.query('SELECT * FROM "CareerCapabilityAuthority" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3 ORDER BY "label"', [context.tenant.id, context.user.id, profile])).rows;
  const decisions = await activeDecisions(pool, context, rows.map((row) => row.id));
  return { profileId: profile, capabilities: rows.map((row) => {
    const evidence = (Array.isArray(row.provenance?.factIds) ? row.provenance.factIds : []).map((factId) => factsById.get(factId)).filter(Boolean).map((fact) => ({ statement: fact.statement, sourceType: fact.sourceType || null, sourceExcerpt: fact.sourceExcerpt || null, scopeStatement: fact.scopeStatement || null }));
    return publicCapability(row, decisions.get(row.id), evidence);
  }), factsConsidered: facts.length, ...(reconciliationTrace ? { reconciliationTrace, derivationTrace } : {}) };
}


export async function getCapabilities(context, options = {}) {
  if (options.executionTrace) { options.executionTrace.getCapabilitiesEntered = true; options.executionTrace.includeTraceAtGetCapabilities = Boolean(options.includeTrace); }
  const result = await deriveCapabilities(context, options);
  if (options.executionTrace) { options.executionTrace.deriveCapabilitiesReturnedCount = result.capabilities.length; options.executionTrace.getCapabilitiesReturnedCount = result.capabilities.length; }
  return result;
}

export async function getCapabilityDerivationComparison(context) {
  requireContext(context);
  const pool = await careerP0Pool();
  const profile = await profileId(pool, context);
  const values = [context.tenant.id, context.user.id, profile, "CUSTOMER_CONFIRMED_SOURCE_BACKED"];
  const [diagnosticFacts, canonicalFacts] = await Promise.all([
    pool.query('SELECT id,"sourceId",statement,"factType","authorityState" FROM "CareerFact" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3 AND "authorityState"=$4 ORDER BY "createdAt"', values),
    pool.query('SELECT f.id,f."sourceId",f.statement,f."factType",f."authorityState" FROM "CareerFact" f JOIN "CareerSource" s ON s.id=f."sourceId" AND s."tenantId"=f."tenantId" WHERE f."tenantId"=$1 AND f."userId"=$2 AND f."profileId"=$3 AND f."authorityState"=$4 ORDER BY f."createdAt"', values),
  ]);
  return compareCapabilityDerivationInputs({ diagnosticFacts: diagnosticFacts.rows, canonicalFacts: canonicalFacts.rows });
}

export async function answerCapability(context, { capabilityId, questionKey, answer }) {
  requireContext(context);
  const state = decisionStateForAnswer(answer);
  if (!state) throw Object.assign(new Error("INVALID_CAPABILITY_ANSWER"), { code: "INVALID_CAPABILITY_ANSWER" });
  const pool = await careerP0Pool();
  const row = (await pool.query('SELECT * FROM "CareerCapabilityAuthority" WHERE id=$1 AND "tenantId"=$2 AND "userId"=$3', [capabilityId, context.tenant.id, context.user.id])).rows[0];
  if (!row) throw Object.assign(new Error("CAPABILITY_NOT_FOUND"), { code: "CAPABILITY_NOT_FOUND" });
  const catalog = capabilityForKey(row.capabilityKey);
  if (!catalog || catalog.question.key !== questionKey) throw Object.assign(new Error("QUESTION_NOT_FOUND"), { code: "QUESTION_NOT_FOUND" });
  return transaction(pool, async (client) => {
    await client.query('UPDATE "CareerCapabilityDecision" SET "supersededAt"=NOW() WHERE "tenantId"=$1 AND "userId"=$2 AND "capabilityId"=$3 AND "questionKey"=$4 AND "supersededAt" IS NULL', [context.tenant.id, context.user.id, capabilityId, questionKey]);
    const decision = (await client.query('INSERT INTO "CareerCapabilityDecision" ("id","tenantId","userId","capabilityId","questionKey",answer,"decisionState",rationale,"taxonomyVersion") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *', [id("decision"), context.tenant.id, context.user.id, capabilityId, questionKey, answer, state, catalog.question.uncertainty, CAREEROS_CAPABILITY_TAXONOMY_VERSION])).rows[0];
    const updated = (await client.query('UPDATE "CareerCapabilityAuthority" SET "authorityState"=$1,version=version+1,"updatedAt"=NOW() WHERE id=$2 AND "tenantId"=$3 AND "userId"=$4 RETURNING *', [state, capabilityId, context.tenant.id, context.user.id])).rows[0];
    await client.query('INSERT INTO "CareerAuditEvent" ("id","tenantId","userId","eventType","entityType","entityId","metadata") VALUES ($1,$2,$3,$4,$5,$6,$7)', [id("audit"), context.tenant.id, context.user.id, "CAPABILITY_DECISION_RECORDED", "CareerCapabilityAuthority", capabilityId, JSON.stringify({ questionKey, answer, decisionState: state })]);
    return { capability: publicCapability(updated, decision), decision: { id: decision.id, answer: decision.answer, decisionState: decision.decisionState, createdAt: decision.createdAt } };
  });
}

function relationship(requirement, capability) {
  if (requirement.specialist) return { state: "SPECIALIST_BLOCKED", explanation: "This requirement appears to call for specialist experience not currently established in your profile." };
  if (!capability) return { state: "UNKNOWN", explanation: "CareerOS does not yet have enough evidence to determine this." };
  const state = capability.authorityState === "VERIFIED_DIRECT" ? "DIRECT" : capability.authorityState === "VERIFIED_TRANSFERABLE" ? "TRANSFERABLE" : capability.authorityState === "PARTIALLY_SUPPORTED" ? "PARTIAL" : "UNKNOWN";
  const explanation = ({ DIRECT: "Your confirmed experience directly supports this requirement.", TRANSFERABLE: "You have closely related experience that may transfer to this requirement.", PARTIAL: "Your background supports part of this requirement, but some scope remains unproven.", UNKNOWN: "CareerOS does not yet have enough evidence to determine this." })[state];
  return { state, capabilityKey: capability.capabilityKey, capabilityLabel: capability.label, explanation };
}

async function refreshOpportunityRequirements(pool, context, opportunity) {
  const parsed = parseJobDescription({ title: opportunity.title, company: opportunity.company, location: opportunity.location, description: opportunity.description, sourceUrl: opportunity.sourceUrl, sourceType: opportunity.sourceType });
  await transaction(pool, async (client) => {
    await client.query('DELETE FROM "CareerOpportunityRequirement" WHERE "opportunityId"=$1 AND "tenantId"=$2', [opportunity.id, context.tenant.id]);
    for (const item of parsed.requirements) await client.query('INSERT INTO "CareerOpportunityRequirement" ("id","tenantId","opportunityId","sourceOrder",text,"conceptKey",importance,scope,specialist) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id("requirement"), context.tenant.id, opportunity.id, item.sourceOrder, item.text, item.conceptKey, item.importance, item.scope, item.specialist]);
  });
  return parsed.requirements;
}

export async function evaluateOpportunity(context, opportunityId) {
  requireContext(context);
  const pool = await careerP0Pool();
  const opportunity = (await pool.query('SELECT * FROM "CareerOpportunity" WHERE id=$1 AND "tenantId"=$2 AND "userId"=$3', [opportunityId, context.tenant.id, context.user.id])).rows[0];
  if (!opportunity) throw Object.assign(new Error("OPPORTUNITY_NOT_FOUND"), { code: "OPPORTUNITY_NOT_FOUND" });
  const requirements = await refreshOpportunityRequirements(pool, context, opportunity);
  const capabilities = (await pool.query('SELECT * FROM "CareerCapabilityAuthority" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3', [context.tenant.id, context.user.id, opportunity.profileId])).rows;
  const byKey = new Map(capabilities.map((item) => [item.capabilityKey, item]));
  const relationships = requirements.map((item) => ({ id: item.id, text: item.text, conceptKey: item.conceptKey, importance: item.importance, ...relationship(item, byKey.get(item.conceptKey)) }));
  const counts = Object.fromEntries(["DIRECT", "TRANSFERABLE", "PARTIAL", "UNKNOWN", "SPECIALIST_BLOCKED", "SCOPE_BLOCKED"].map((state) => [state.toLowerCase(), relationships.filter((item) => item.state === state).length]));
  const summary = { ...counts, headline: counts.direct > 0 ? "Several requirements are supported by your confirmed experience." : "CareerOS found some relevant signals and areas that remain unresolved.", requirements: relationships.length, informedRequirements: relationships.filter((item) => ["DIRECT", "TRANSFERABLE", "PARTIAL"].includes(item.state)).length };
  await pool.query('UPDATE "CareerMatchEvaluation" SET stale=true WHERE "opportunityId"=$1 AND "tenantId"=$2 AND stale=false', [opportunityId, context.tenant.id]);
  const evaluation = (await pool.query('INSERT INTO "CareerMatchEvaluation" ("id","tenantId","userId","profileId","opportunityId","taxonomyVersion","evaluationVersion",summary,relationships) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *', [id("match"), context.tenant.id, context.user.id, opportunity.profileId, opportunityId, CAREEROS_CAPABILITY_TAXONOMY_VERSION, EVALUATION_VERSION, JSON.stringify(summary), JSON.stringify(relationships)])).rows[0];
  return { id: evaluation.id, stale: evaluation.stale, summary, relationships, opportunity: { id: opportunity.id, title: opportunity.title, company: opportunity.company, location: opportunity.location } };
}

export async function createOpportunity(context, input) {
  requireContext(context);
  const pool = await careerP0Pool();
  const profile = await profileId(pool, context);
  const parsed = parseJobDescription(input || {});
  const opportunity = await transaction(pool, async (client) => {
    const row = (await client.query('INSERT INTO "CareerOpportunity" ("id","tenantId","userId","profileId","sourceType",title,company,location,description,"sourceUrl","decisionState","lifecycleState","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW()) RETURNING *', [id("opportunity"), context.tenant.id, context.user.id, profile, parsed.sourceType, parsed.title, parsed.company, parsed.location, parsed.description, parsed.sourceUrl, "CONSIDERING", "NEW"])).rows[0];
    for (const item of parsed.requirements) await client.query('INSERT INTO "CareerOpportunityRequirement" ("id","tenantId","opportunityId","sourceOrder",text,"conceptKey",importance,scope,specialist) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id("requirement"), context.tenant.id, row.id, item.sourceOrder, item.text, item.conceptKey, item.importance, item.scope, item.specialist]);
    return row;
  });
  await recordOpportunityEvent(context, opportunity.id, "OPPORTUNITY_IMPORTED", { sourceType: parsed.sourceType });
  const match = await evaluateOpportunity(context, opportunity.id);
  await recordOpportunityEvent(context, opportunity.id, "OPPORTUNITY_ANALYZED", { evaluationCreated: true });
  return { opportunity: { id: opportunity.id, title: opportunity.title, company: opportunity.company, location: opportunity.location, sourceType: opportunity.sourceType, sourceUrl: opportunity.sourceUrl, decisionState: opportunity.decisionState, createdAt: opportunity.createdAt }, requirements: parsed.requirements, match };
}

async function inboxProfile(pool, context) {
  const row = (await pool.query('SELECT id FROM "CareerProfile" WHERE "tenantId"=$1 AND "userId"=$2 LIMIT 1', [context.tenant.id, context.user.id])).rows[0];
  if (!row) throw Object.assign(new Error("PROFILE_REQUIRED"), { code: "PROFILE_REQUIRED" });
  return row.id;
}

async function inboxAudit(pool, context, eventType, itemId) {
  await pool.query('INSERT INTO "CareerAuditEvent" ("id","tenantId","userId","eventType","entityType","entityId","metadata") VALUES ($1,$2,$3,$4,$5,$6,$7)', [id("audit"), context.tenant.id, context.user.id, eventType, "CareerOpportunityInboxItem", itemId, JSON.stringify({ sourceContentStored: true })]);
}

export async function importOpportunityToInbox(context, input) {
  requireContext(context);
  const pool = await careerP0Pool();
  const profile = await inboxProfile(pool, context);
  const candidate = normalizeInboxInput(input);
  const existingRows = (await pool.query('SELECT id,"sourceName","externalOpportunityId",title,company,"normalizedDigest","normalizedUrl",status,"opportunityId" FROM "CareerOpportunityInboxItem" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id])).rows;
  const existingOpportunities = (await pool.query('SELECT id,title,company,"sourceUrl" AS "normalizedUrl" FROM "CareerOpportunity" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id])).rows;
  const duplicate = classifyInboxDuplicate(candidate, [...existingRows, ...existingOpportunities]);
  const status = duplicate.duplicateStatus === "DUPLICATE" ? "DUPLICATE" : duplicate.duplicateStatus === "POSSIBLE_DUPLICATE" ? "NEEDS_REVIEW" : candidate.initialStatus;
  const row = (await pool.query('INSERT INTO "CareerOpportunityInboxItem" ("id","tenantId","userId","profileId","sourceType","sourceName","sourceUrl","externalOpportunityId","discoveredAt","title",company,location,description,provenance,"normalizedDigest","normalizedUrl","normalizationStatus","duplicateStatus",status,"duplicateOfInboxItemId","opportunityId","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW()) RETURNING *', [id("inbox"), context.tenant.id, context.user.id, profile, candidate.sourceType, candidate.sourceName, candidate.sourceUrl, candidate.externalOpportunityId, candidate.discoveredAt, candidate.title, candidate.company, candidate.location, candidate.description, JSON.stringify(candidate.provenance), candidate.normalizedDigest, candidate.normalizedUrl, candidate.normalizationStatus, duplicate.duplicateStatus, status, duplicate.duplicateOf?.id || null, duplicate.duplicateOf?.opportunityId || null])).rows[0];
  await inboxAudit(pool, context, duplicate.duplicateStatus === "NEW" ? "OPPORTUNITY_IMPORTED" : "OPPORTUNITY_DUPLICATE_DETECTED", row.id);
  return { item: publicInboxItem(row), duplicate: duplicate.duplicateStatus, duplicateOf: duplicate.duplicateOf ? publicInboxItem(duplicate.duplicateOf) : null };
}

export async function importOpportunityBatchToInbox(context, inputs) {
  requireContext(context);
  const values = Array.isArray(inputs) ? inputs.slice(0, 20) : [];
  return { items: await Promise.all(values.map((input) => importOpportunityToInbox(context, input))) };
}

export async function listOpportunityInbox(context) {
  requireContext(context); const pool = await careerP0Pool();
  return (await pool.query('SELECT id,"sourceType","sourceName","sourceUrl",title,company,location,"discoveredAt","importedAt","normalizationStatus","duplicateStatus",status,"opportunityId" FROM "CareerOpportunityInboxItem" WHERE "tenantId"=$1 AND "userId"=$2 ORDER BY "updatedAt" DESC', [context.tenant.id, context.user.id])).rows.map(publicInboxItem);
}

export async function updateOpportunityInboxItem(context, itemId, action) {
  requireContext(context);
  const pool = await careerP0Pool();
  const row = (await pool.query('SELECT * FROM "CareerOpportunityInboxItem" WHERE id=$1 AND "tenantId"=$2 AND "userId"=$3', [itemId, context.tenant.id, context.user.id])).rows[0];
  if (!row) throw Object.assign(new Error("INBOX_ITEM_NOT_FOUND"), { code: "INBOX_ITEM_NOT_FOUND" });
  if (action === "dismiss") {
    const updated = (await pool.query('UPDATE "CareerOpportunityInboxItem" SET status=$1,"updatedAt"=NOW() WHERE id=$2 AND "tenantId"=$3 AND "userId"=$4 RETURNING *', ["DISMISSED", itemId, context.tenant.id, context.user.id])).rows[0];
    await inboxAudit(pool, context, "OPPORTUNITY_DISMISSED", itemId); return { item: publicInboxItem(updated) };
  }
  if (action === "review" || action === "resolve") {
    const updated = (await pool.query('UPDATE "CareerOpportunityInboxItem" SET status=$1,"duplicateStatus"=CASE WHEN "duplicateStatus"=\'POSSIBLE_DUPLICATE\' THEN \'REVIEWED\' ELSE "duplicateStatus" END,"updatedAt"=NOW() WHERE id=$2 AND "tenantId"=$3 AND "userId"=$4 RETURNING *', ["READY_TO_ANALYZE", itemId, context.tenant.id, context.user.id])).rows[0];
    await inboxAudit(pool, context, "OPPORTUNITY_INBOX_REVIEWED", itemId); return { item: publicInboxItem(updated) };
  }
  if (action === "analyze") {
    if (row.status === "DISMISSED" || row.status === "DUPLICATE" || (row.status === "NEEDS_REVIEW" && row.duplicateStatus === "POSSIBLE_DUPLICATE")) throw Object.assign(new Error("INBOX_ITEM_REQUIRES_REVIEW"), { code: "INBOX_ITEM_REQUIRES_REVIEW" });
    if (!row.description) throw Object.assign(new Error("JOB_DESCRIPTION_REQUIRED"), { code: "JOB_DESCRIPTION_REQUIRED" });
    const created = await createOpportunity(context, { sourceType: row.sourceType, title: row.title, company: row.company, location: row.location, sourceUrl: row.sourceUrl, description: row.description });
    const updated = (await pool.query('UPDATE "CareerOpportunityInboxItem" SET status=$1,"opportunityId"=$2,"updatedAt"=NOW() WHERE id=$3 AND "tenantId"=$4 AND "userId"=$5 RETURNING *', ["IMPORTED", created.opportunity.id, itemId, context.tenant.id, context.user.id])).rows[0];
    await inboxAudit(pool, context, "OPPORTUNITY_ANALYZED", itemId); return { item: publicInboxItem(updated), opportunity: created.opportunity, match: created.match };
  }
  throw Object.assign(new Error("INVALID_INBOX_ACTION"), { code: "INVALID_INBOX_ACTION" });
}

export async function listOpportunities(context) {
  requireContext(context); const pool = await careerP0Pool();
  return (await pool.query('SELECT o.id,o.title,o.company,o.location,o."sourceType",o."sourceUrl",o."decisionState",o."lifecycleState",o."createdAt",o."updatedAt",m.summary AS "matchSummary",m.stale AS "matchStale" FROM "CareerOpportunity" o LEFT JOIN LATERAL (SELECT summary,stale FROM "CareerMatchEvaluation" WHERE "opportunityId"=o.id AND "tenantId"=$1 AND "userId"=$2 ORDER BY "createdAt" DESC LIMIT 1) m ON true WHERE o."tenantId"=$1 AND o."userId"=$2 ORDER BY o."updatedAt" DESC', [context.tenant.id, context.user.id])).rows.map((row) => ({ ...row, nextAction: nextOpportunityAction(row) }));
}

export async function getSearchPreferences(context) {
  requireContext(context);
  const pool = await careerP0Pool();
  const row = (await pool.query('SELECT id,keywords,location,"remotePreference","postedWithinDays","salaryMin","resultLimit",active,"updatedAt" FROM "CareerSearchPreference" WHERE "tenantId"=$1 AND "userId"=$2 LIMIT 1', [context.tenant.id, context.user.id])).rows[0];
  return row || { id: null, keywords: "", location: "", remotePreference: "any", postedWithinDays: null, salaryMin: null, resultLimit: 10, active: true, updatedAt: null };
}

export async function saveSearchPreferences(context, input = {}) {
  requireContext(context);
  const pool = await careerP0Pool();
  const criteria = boundUsajobsSearch(input);
  const row = (await pool.query('INSERT INTO "CareerSearchPreference" ("id","tenantId","userId",keywords,location,"remotePreference","postedWithinDays","salaryMin","resultLimit",active,"updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) ON CONFLICT ("tenantId","userId") DO UPDATE SET keywords=EXCLUDED.keywords,location=EXCLUDED.location,"remotePreference"=EXCLUDED."remotePreference","postedWithinDays"=EXCLUDED."postedWithinDays","salaryMin"=EXCLUDED."salaryMin","resultLimit"=EXCLUDED."resultLimit",active=EXCLUDED.active,"updatedAt"=NOW() RETURNING id,keywords,location,"remotePreference","postedWithinDays","salaryMin","resultLimit",active,"updatedAt"', [id("search-preference"), context.tenant.id, context.user.id, criteria.keywords, criteria.location, criteria.remotePreference, criteria.postedWithinDays, criteria.salaryMin, criteria.resultLimit, input.active !== false])).rows[0];
  return row;
}

export async function getExistingDiscoveryStatuses(context, results = []) {
  requireContext(context);
  const pool = await careerP0Pool();
  const ids = results.map((item) => item.externalOpportunityId).filter(Boolean);
  const urls = results.map((item) => item.sourceUrl).filter(Boolean);
  if (!ids.length && !urls.length) return {};
  const rows = (await pool.query('SELECT "externalOpportunityId","sourceUrl",status,"duplicateStatus","opportunityId" FROM "CareerOpportunityInboxItem" WHERE "tenantId"=$1 AND "userId"=$2 AND (("externalOpportunityId" = ANY($3::text[])) OR ("sourceUrl" = ANY($4::text[])))', [context.tenant.id, context.user.id, ids, urls])).rows;
  const opportunities = (await pool.query('SELECT id,"sourceUrl","decisionState","lifecycleState" FROM "CareerOpportunity" WHERE "tenantId"=$1 AND "userId"=$2 AND "sourceUrl" = ANY($3::text[])', [context.tenant.id, context.user.id, urls])).rows;
  const status = {};
  for (const row of rows) {
    const key = row.externalOpportunityId || row.sourceUrl;
    status[key] = row.opportunityId ? (row.status === "IMPORTED" ? "Already analyzed" : "Already in Inbox") : row.duplicateStatus === "DUPLICATE" ? "Already in Inbox" : "Needs review";
  }
  for (const row of opportunities) status[row.sourceUrl] = row.decisionState === "PURSUE" ? "Pursuing" : row.decisionState === "PASS" ? "Passed" : "Already analyzed";
  return status;
}

export async function getOpportunity(context, opportunityId) {
  requireContext(context); const pool = await careerP0Pool();
  const row = (await pool.query('SELECT id,title,company,location,"sourceType",description,"sourceUrl","decisionState","lifecycleState","profileId","createdAt","updatedAt" FROM "CareerOpportunity" WHERE id=$1 AND "tenantId"=$2 AND "userId"=$3', [opportunityId, context.tenant.id, context.user.id])).rows[0];
  if (!row) throw Object.assign(new Error("OPPORTUNITY_NOT_FOUND"), { code: "OPPORTUNITY_NOT_FOUND" });
  const requirements = (await pool.query('SELECT id,text,"conceptKey",importance,scope,specialist,"sourceOrder" FROM "CareerOpportunityRequirement" WHERE "opportunityId"=$1 AND "tenantId"=$2 ORDER BY "sourceOrder"', [opportunityId, context.tenant.id])).rows;
  const latest = (await pool.query('SELECT * FROM "CareerMatchEvaluation" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3 ORDER BY "createdAt" DESC LIMIT 1', [opportunityId, context.tenant.id, context.user.id])).rows[0];
  const [events, notes] = await Promise.all([
    pool.query('SELECT id,"eventType","metadata","createdAt" FROM "CareerOpportunityEvent" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3 ORDER BY "createdAt" DESC', [opportunityId, context.tenant.id, context.user.id]),
    pool.query('SELECT id,content,"createdAt","updatedAt" FROM "CareerOpportunityNote" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3 ORDER BY "createdAt" DESC', [opportunityId, context.tenant.id, context.user.id]),
  ]);
  let match = latest ? { id: latest.id, stale: latest.stale, summary: latest.summary, relationships: latest.relationships } : await evaluateOpportunity(context, opportunityId);
  if (match?.relationships?.length) {
    const capabilities = (await pool.query('SELECT "capabilityKey",label,provenance FROM "CareerCapabilityAuthority" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3', [context.tenant.id, context.user.id, row.profileId])).rows;
    const factIds = [...new Set(capabilities.flatMap((item) => Array.isArray(item.provenance?.factIds) ? item.provenance.factIds : []))];
    const sourceIds = [...new Set(capabilities.flatMap((item) => Array.isArray(item.provenance?.sourceIds) ? item.provenance.sourceIds : []))];
    const [facts, sources] = await Promise.all([
      factIds.length ? pool.query('SELECT id,"sourceId",statement,"sourceExcerpt","scopeStatement" FROM "CareerFact" WHERE id=ANY($1::text[]) AND "tenantId"=$2 AND "userId"=$3 AND "profileId"=$4 AND "authorityState"=$5', [factIds, context.tenant.id, context.user.id, row.profileId, "CUSTOMER_CONFIRMED_SOURCE_BACKED"]) : { rows: [] },
      sourceIds.length ? pool.query('SELECT id,"sourceType" FROM "CareerSource" WHERE id=ANY($1::text[]) AND "tenantId"=$2 AND "userId"=$3 AND "profileId"=$4', [sourceIds, context.tenant.id, context.user.id, row.profileId]) : { rows: [] },
    ]);
    match = { ...match, relationships: buildMatchEvidenceRelationships({ relationships: match.relationships, capabilities, facts: facts.rows, sources: sources.rows }) };
  }
  const { profileId: _profileId, ...publicOpportunity } = row;
  const decisionSummary = buildDecisionFirstMatchSummary({ ...match, decisionState: row.decisionState });
  return { opportunity: { ...publicOpportunity, nextAction: nextOpportunityAction(row) }, requirements, activity: { events: events.rows, notes: notes.rows }, match: { ...match, decisionSummary } };
}

export async function compareOpportunities(context, values) {
  requireContext(context);
  const opportunityIds = normalizeComparisonIds(values);
  const pool = await careerP0Pool();
  const rows = (await pool.query('SELECT o.id,o.title,o.company,o.location,o."sourceType",o."sourceUrl",o."decisionState",o."lifecycleState",o."createdAt",o."updatedAt",m.id AS "matchId",m.stale AS "matchStale",m.summary AS "matchSummary",m.relationships AS "matchRelationships" FROM "CareerOpportunity" o LEFT JOIN LATERAL (SELECT id,stale,summary,relationships FROM "CareerMatchEvaluation" WHERE "opportunityId"=o.id AND "tenantId"=$2 AND "userId"=$3 ORDER BY "createdAt" DESC LIMIT 1) m ON true WHERE o."tenantId"=$2 AND o."userId"=$3 AND o.id=ANY($1::text[])', [opportunityIds, context.tenant.id, context.user.id])).rows;
  if (rows.length !== opportunityIds.length) throw Object.assign(new Error("OPPORTUNITY_NOT_FOUND"), { code: "OPPORTUNITY_NOT_FOUND" });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const opportunities = opportunityIds.map((id) => {
    const row = byId.get(id);
    const match = row.matchId ? { id: row.matchId, stale: row.matchStale, summary: row.matchSummary, relationships: row.matchRelationships } : null;
    const opportunity = { id: row.id, title: row.title, company: row.company, location: row.location, sourceType: row.sourceType, sourceUrl: row.sourceUrl, decisionState: row.decisionState, lifecycleState: row.lifecycleState, createdAt: row.createdAt, updatedAt: row.updatedAt, match };
    return { opportunity, comparison: summarizeOpportunityForComparison(opportunity) };
  });
  return { opportunities };
}

export async function getApplicationEvidencePacket(context, opportunityId) {
  requireContext(context);
  const pool = await careerP0Pool();
  const opportunity = (await pool.query('SELECT id,title,company,location,"sourceUrl","decisionState","profileId" FROM "CareerOpportunity" WHERE id=$1 AND "tenantId"=$2 AND "userId"=$3', [opportunityId, context.tenant.id, context.user.id])).rows[0];
  if (!opportunity) throw Object.assign(new Error("OPPORTUNITY_NOT_FOUND"), { code: "OPPORTUNITY_NOT_FOUND" });
  const [requirements, evaluation, capabilities] = await Promise.all([
    pool.query('SELECT id,text,"conceptKey",importance,scope,specialist,"sourceOrder" FROM "CareerOpportunityRequirement" WHERE "opportunityId"=$1 AND "tenantId"=$2 ORDER BY "sourceOrder"', [opportunityId, context.tenant.id]),
    pool.query('SELECT id,"evaluationVersion",summary,relationships,stale,"createdAt" FROM "CareerMatchEvaluation" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3 ORDER BY "createdAt" DESC LIMIT 1', [opportunityId, context.tenant.id, context.user.id]),
    pool.query('SELECT "capabilityKey",label,provenance FROM "CareerCapabilityAuthority" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3', [context.tenant.id, context.user.id, opportunity.profileId]),
  ]);
  const factIds = [...new Set(capabilities.rows.flatMap((item) => Array.isArray(item.provenance?.factIds) ? item.provenance.factIds : []))];
  const sourceIds = [...new Set(capabilities.rows.flatMap((item) => Array.isArray(item.provenance?.sourceIds) ? item.provenance.sourceIds : []))];
  const [facts, sources] = await Promise.all([
    factIds.length ? pool.query('SELECT id,"sourceId",statement,"sourceExcerpt","scopeStatement" FROM "CareerFact" WHERE id=ANY($1::text[]) AND "tenantId"=$2 AND "userId"=$3 AND "profileId"=$4 AND "authorityState"=$5', [factIds, context.tenant.id, context.user.id, opportunity.profileId, "CUSTOMER_CONFIRMED_SOURCE_BACKED"]) : { rows: [] },
    sourceIds.length ? pool.query('SELECT id,"sourceType" FROM "CareerSource" WHERE id=ANY($1::text[]) AND "tenantId"=$2 AND "userId"=$3 AND "profileId"=$4', [sourceIds, context.tenant.id, context.user.id, opportunity.profileId]) : { rows: [] },
  ]);
  const latest = evaluation.rows[0];
  return buildApplicationEvidencePacket({ opportunity, requirements: requirements.rows, capabilities: capabilities.rows, facts: facts.rows, sources: sources.rows, match: latest ? { ...latest, summary: latest.summary, relationships: latest.relationships } : null });
}

export async function getResumeDraft(context, opportunityId) {
  requireContext(context);
  const pool = await careerP0Pool();
  const opportunity = (await pool.query('SELECT id,title,company,location,"sourceUrl","decisionState","profileId" FROM "CareerOpportunity" WHERE id=$1 AND "tenantId"=$2 AND "userId"=$3', [opportunityId, context.tenant.id, context.user.id])).rows[0];
  if (!opportunity) throw Object.assign(new Error("OPPORTUNITY_NOT_FOUND"), { code: "OPPORTUNITY_NOT_FOUND" });
  const [profile, packet, drafts] = await Promise.all([
    pool.query('SELECT "displayName",headline,location,"careerStage",version FROM "CareerProfile" WHERE id=$1 AND "tenantId"=$2 AND "userId"=$3', [opportunity.profileId, context.tenant.id, context.user.id]),
    getApplicationEvidencePacket(context, opportunityId),
    pool.query('SELECT id,"materialType","generationMethod",provider,model,"evaluationVersion","authorityVersion","draftVersion",content,stale,"createdAt","updatedAt" FROM "CareerResumeDraft" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3 AND COALESCE(content->>\'materialType\',"materialType")=\'RESUME\' ORDER BY "createdAt" DESC LIMIT 1', [opportunityId, context.tenant.id, context.user.id]),
  ]);
  if (!profile.rows[0]) throw Object.assign(new Error("PROFILE_REQUIRED"), { code: "PROFILE_REQUIRED" });
  const draft = drafts.rows[0] || null;
  if (draft && packet.status === "APPLICATION_EVIDENCE_STALE") draft.stale = true;
  return { opportunity, profile: profile.rows[0], packet, draft };
}

export async function createResumeDraft(context, opportunityId) {
  requireContext(context);
  const data = await getResumeDraft(context, opportunityId);
  if (data.opportunity.decisionState !== "PURSUE") throw Object.assign(new Error("OPPORTUNITY_MUST_BE_PURSUED"), { code: "OPPORTUNITY_MUST_BE_PURSUED" });
  if (data.packet.status !== "CURRENT") throw Object.assign(new Error("RESUME_TAILORING_STALE"), { code: "RESUME_TAILORING_STALE" });
  const generated = buildResumeDraft({ profile: data.profile, packet: data.packet });
  const pool = await careerP0Pool();
  const nextVersion = Number((await pool.query('SELECT COALESCE(MAX("draftVersion"),0)+1 AS version FROM "CareerResumeDraft" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3', [opportunityId, context.tenant.id, context.user.id])).rows[0].version);
  const row = (await pool.query('INSERT INTO "CareerResumeDraft" ("id","tenantId","userId","profileId","opportunityId","materialType","generationMethod","evaluationVersion","authorityVersion","draftVersion",content,"updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING id,"materialType","generationMethod",provider,model,"evaluationVersion","authorityVersion","draftVersion",content,stale,"createdAt","updatedAt"', [id("resume"), context.tenant.id, context.user.id, data.opportunity.profileId, opportunityId, "RESUME", "DETERMINISTIC", data.packet.analysis.evaluationVersion, data.profile.version, nextVersion, JSON.stringify(generated.content)])).rows[0];
  await recordOpportunityEvent(context, opportunityId, "APPLICATION_MATERIAL_CREATED", { materialType: "RESUME" });
  return { ...data, draft: row };
}

export async function saveResumeDraft(context, opportunityId, draftId, text) {
  requireContext(context);
  const normalized = normalizeDraftText(text);
  const pool = await careerP0Pool();
  const row = (await pool.query('SELECT id,content FROM "CareerResumeDraft" WHERE id=$1 AND "opportunityId"=$2 AND "tenantId"=$3 AND "userId"=$4', [draftId, opportunityId, context.tenant.id, context.user.id])).rows[0];
  if (!row) throw Object.assign(new Error("DRAFT_NOT_FOUND"), { code: "DRAFT_NOT_FOUND" });
  const content = { ...(row.content || {}), text: normalized, editedByUser: true };
  const updated = (await pool.query('UPDATE "CareerResumeDraft" SET content=$1,"updatedAt"=NOW() WHERE id=$2 AND "opportunityId"=$3 AND "tenantId"=$4 AND "userId"=$5 RETURNING id,"evaluationVersion","authorityVersion","draftVersion",content,stale,"createdAt","updatedAt"', [JSON.stringify(content), draftId, opportunityId, context.tenant.id, context.user.id])).rows[0];
  return updated;
}

async function materialContext(context, opportunityId, materialType, question = null) {
  requireContext(context);
  const pool = await careerP0Pool();
  const opportunity = (await pool.query('SELECT id,title,company,location,"sourceUrl","decisionState","profileId" FROM "CareerOpportunity" WHERE id=$1 AND "tenantId"=$2 AND "userId"=$3', [opportunityId, context.tenant.id, context.user.id])).rows[0];
  if (!opportunity) throw Object.assign(new Error("OPPORTUNITY_NOT_FOUND"), { code: "OPPORTUNITY_NOT_FOUND" });
  const [profile, packet] = await Promise.all([
    pool.query('SELECT "displayName",headline,location,"careerStage",version FROM "CareerProfile" WHERE id=$1 AND "tenantId"=$2 AND "userId"=$3', [opportunity.profileId, context.tenant.id, context.user.id]),
    getApplicationEvidencePacket(context, opportunityId),
  ]);
  const drafts = await pool.query('SELECT id,"materialType","generationMethod",provider,model,"evaluationVersion","authorityVersion","draftVersion",content,stale,"createdAt","updatedAt" FROM "CareerResumeDraft" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3 AND "materialType"=$4 AND ($5::text IS NULL OR content->>\'question\'=$5) ORDER BY "createdAt" DESC LIMIT 1', [opportunityId, context.tenant.id, context.user.id, materialType, question]);
  return { opportunity, profile: profile.rows[0], packet, draft: drafts.rows[0] || null };
}

async function createMaterial(context, opportunityId, materialType, generated) {
  const data = await materialContext(context, opportunityId, materialType, generated.content?.question || null);
  if (data.opportunity.decisionState !== "PURSUE") throw Object.assign(new Error("OPPORTUNITY_MUST_BE_PURSUED"), { code: "OPPORTUNITY_MUST_BE_PURSUED" });
  if (data.packet.status !== "CURRENT") throw Object.assign(new Error("APPLICATION_MATERIAL_STALE"), { code: "APPLICATION_MATERIAL_STALE" });
  const pool = await careerP0Pool();
  const nextVersion = Number((await pool.query('SELECT COALESCE(MAX("draftVersion"),0)+1 AS version FROM "CareerResumeDraft" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3 AND "materialType"=$4', [opportunityId, context.tenant.id, context.user.id, materialType])).rows[0].version);
  const row = (await pool.query('INSERT INTO "CareerResumeDraft" ("id","tenantId","userId","profileId","opportunityId","materialType","generationMethod","evaluationVersion","authorityVersion","draftVersion",content,"updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING id,"materialType","generationMethod",provider,model,"evaluationVersion","authorityVersion","draftVersion",content,stale,"createdAt","updatedAt"', [id("material"), context.tenant.id, context.user.id, data.opportunity.profileId, opportunityId, materialType, "DETERMINISTIC", data.packet.analysis.evaluationVersion, data.profile.version, nextVersion, JSON.stringify(generated.content)])).rows[0];
  await recordOpportunityEvent(context, opportunityId, "APPLICATION_MATERIAL_CREATED", { materialType });
  return { ...data, draft: row };
}

export async function getCoverLetterDraft(context, opportunityId) { return materialContext(context, opportunityId, "COVER_LETTER"); }
export async function createCoverLetterDraft(context, opportunityId) { const data = await materialContext(context, opportunityId, "COVER_LETTER"); return createMaterial(context, opportunityId, "COVER_LETTER", buildCoverLetterDraft({ profile: data.profile, packet: data.packet })); }
export async function listApplicationAnswerDrafts(context, opportunityId) { requireContext(context); const pool = await careerP0Pool(); return (await pool.query('SELECT id,"materialType","generationMethod",provider,model,"evaluationVersion","authorityVersion","draftVersion",content,stale,"createdAt","updatedAt" FROM "CareerResumeDraft" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3 AND "materialType"=\'APPLICATION_ANSWER\' ORDER BY "createdAt" DESC', [opportunityId, context.tenant.id, context.user.id])).rows; }
export async function createApplicationAnswerDraft(context, opportunityId, question, userIntent = "") { const data = await materialContext(context, opportunityId, "APPLICATION_ANSWER", question); const generated = buildApplicationAnswerDraft({ profile: data.profile, packet: data.packet, question, userIntent }); if (generated.status !== "CURRENT") return { ...data, draft: null, generated, questionType: classifyApplicationQuestion(question) }; return createMaterial(context, opportunityId, "APPLICATION_ANSWER", generated); }
export async function saveApplicationMaterialDraft(context, opportunityId, draftId, text) { return saveResumeDraft(context, opportunityId, draftId, text); }

function materialEvidence(data) { return writingEvidence(data.packet); }

export async function improveApplicationMaterialDraft(context, opportunityId, materialType, draftId, style = "PROFESSIONAL", userIntent = "") {
  requireContext(context);
  const data = await materialContext(context, opportunityId, materialType);
  if (!data.draft || data.draft.id !== draftId) throw Object.assign(new Error("DRAFT_NOT_FOUND"), { code: "DRAFT_NOT_FOUND" });
  if (data.packet.status !== "CURRENT") return { ...data, generated: { status: "APPLICATION_MATERIAL_STALE", message: "Your career information changed since this draft was prepared. Refresh the grounded draft before using AI wording assistance." } };
  const originalText = String(data.draft.content?.originalText || data.draft.content?.text || "");
  try {
    const generated = await improveApplicationMaterial({ materialType, target: { title: data.opportunity.title, company: data.opportunity.company, location: data.opportunity.location }, deterministicDraft: originalText, evidence: materialEvidence(data), question: data.draft.content?.question || "", userIntent: userIntent || data.draft.content?.userIntent || "", style });
    const pool = await careerP0Pool();
    const nextVersion = Number((await pool.query('SELECT COALESCE(MAX("draftVersion"),0)+1 AS version FROM "CareerResumeDraft" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3 AND "materialType"=$4', [opportunityId, context.tenant.id, context.user.id, materialType])).rows[0].version);
    const content = { ...(data.draft.content || {}), text: generated.text, originalText, claims: generated.claims, groundingStatus: generated.groundingStatus, style: generated.style, editedByUser: false };
    const row = (await pool.query('INSERT INTO "CareerResumeDraft" ("id","tenantId","userId","profileId","opportunityId","materialType","generationMethod",provider,model,"evaluationVersion","authorityVersion","draftVersion",content,"updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW()) RETURNING id,"materialType","generationMethod",provider,model,"evaluationVersion","authorityVersion","draftVersion",content,stale,"createdAt","updatedAt"', [id("material-ai"), context.tenant.id, context.user.id, data.opportunity.profileId, opportunityId, materialType, "AI_ASSISTED", generated.provider, generated.model, data.packet.analysis.evaluationVersion, data.profile.version, nextVersion, JSON.stringify(content)])).rows[0];
    return { ...data, draft: row, generated: { status: "AI_ASSISTED", groundingStatus: generated.groundingStatus } };
  } catch (error) {
    const code = error?.code || "APPLICATION_WRITING_FAILED";
    return { ...data, generated: { status: code, message: "AI wording improvement isn't available right now. Your grounded CareerOS draft is still available." } };
  }
}

export async function restoreDeterministicMaterial(context, opportunityId, materialType, draftId) {
  requireContext(context);
  const data = await materialContext(context, opportunityId, materialType);
  if (!data.draft || data.draft.id !== draftId) throw Object.assign(new Error("DRAFT_NOT_FOUND"), { code: "DRAFT_NOT_FOUND" });
  if (data.packet.status !== "CURRENT") return { ...data, generated: { status: "APPLICATION_MATERIAL_STALE", message: "Your career information changed since this draft was prepared. Re-analyze the job before restoring a grounded draft." } };
  const originalText = data.draft.content?.originalText;
  if (!originalText) return { ...data, generated: { status: "NO_GROUNDED_VERSION" } };
  const pool = await careerP0Pool();
  const nextVersion = Number((await pool.query('SELECT COALESCE(MAX("draftVersion"),0)+1 AS version FROM "CareerResumeDraft" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3 AND "materialType"=$4', [opportunityId, context.tenant.id, context.user.id, materialType])).rows[0].version);
  const content = { ...(data.draft.content || {}), text: originalText, originalText: undefined, claims: undefined, style: undefined, editedByUser: false, groundingStatus: "SUPPORTED" };
  const row = (await pool.query('INSERT INTO "CareerResumeDraft" ("id","tenantId","userId","profileId","opportunityId","materialType","generationMethod","evaluationVersion","authorityVersion","draftVersion",content,"updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW()) RETURNING id,"materialType","generationMethod",provider,model,"evaluationVersion","authorityVersion","draftVersion",content,stale,"createdAt","updatedAt"', [id("material-grounded"), context.tenant.id, context.user.id, data.opportunity.profileId, opportunityId, materialType, "DETERMINISTIC", data.packet.analysis.evaluationVersion, data.profile.version, nextVersion, JSON.stringify(content)])).rows[0];
  return { ...data, draft: row, generated: { status: "DETERMINISTIC_RESTORED" } };
}

async function recordOpportunityEvent(context, opportunityId, eventType, metadata = {}) {
  requireContext(context);
  const pool = await careerP0Pool();
  const safeMetadata = Object.fromEntries(Object.entries(metadata).filter(([key, value]) => typeof key === "string" && value !== undefined && typeof value !== "object"));
  const result = await pool.query('INSERT INTO "CareerOpportunityEvent" ("id","tenantId","userId","opportunityId","eventType",metadata) SELECT $1,$2,$3,id,$4,$5 FROM "CareerOpportunity" WHERE id=$6 AND "tenantId"=$2 AND "userId"=$3 RETURNING id,"eventType","metadata","createdAt"', [id("opportunity-event"), context.tenant.id, context.user.id, eventType, JSON.stringify(safeMetadata), opportunityId]);
  if (!result.rowCount) throw Object.assign(new Error("OPPORTUNITY_NOT_FOUND"), { code: "OPPORTUNITY_NOT_FOUND" });
  return result.rows[0];
}

export async function updateOpportunityLifecycle(context, opportunityId, value) {
  requireContext(context);
  const next = normalizeLifecycleState(value);
  const pool = await careerP0Pool();
  const current = (await pool.query('SELECT id,"lifecycleState" FROM "CareerOpportunity" WHERE id=$1 AND "tenantId"=$2 AND "userId"=$3', [opportunityId, context.tenant.id, context.user.id])).rows[0];
  if (!current) throw Object.assign(new Error("OPPORTUNITY_NOT_FOUND"), { code: "OPPORTUNITY_NOT_FOUND" });
  if (!canTransition(current.lifecycleState, next)) throw Object.assign(new Error("INVALID_LIFECYCLE_TRANSITION"), { code: "INVALID_LIFECYCLE_TRANSITION" });
  const row = (await pool.query('UPDATE "CareerOpportunity" SET "lifecycleState"=$1,"updatedAt"=NOW() WHERE id=$2 AND "tenantId"=$3 AND "userId"=$4 RETURNING id,"decisionState","lifecycleState"', [next, opportunityId, context.tenant.id, context.user.id])).rows[0];
  if (current.lifecycleState !== next) await recordOpportunityEvent(context, opportunityId, lifecycleEventFor(next), { lifecycleState: next });
  return { ...row, nextAction: nextOpportunityAction(row) };
}

export async function addOpportunityNote(context, opportunityId, content) {
  requireContext(context);
  const normalized = String(content || "").trim();
  if (!normalized || normalized.length > 2000) throw Object.assign(new Error("NOTE_INVALID"), { code: "NOTE_INVALID" });
  const pool = await careerP0Pool();
  const row = (await pool.query('INSERT INTO "CareerOpportunityNote" ("id","tenantId","userId","opportunityId",content) SELECT $1,$2,$3,id,$4 FROM "CareerOpportunity" WHERE id=$5 AND "tenantId"=$2 AND "userId"=$3 RETURNING id,content,"createdAt","updatedAt"', [id("opportunity-note"), context.tenant.id, context.user.id, normalized, opportunityId])).rows[0];
  if (!row) throw Object.assign(new Error("OPPORTUNITY_NOT_FOUND"), { code: "OPPORTUNITY_NOT_FOUND" });
  await recordOpportunityEvent(context, opportunityId, "OPPORTUNITY_NOTE_ADDED", { noteAdded: true });
  return row;
}

export async function updateOpportunityDecision(context, opportunityId, value) {
  requireContext(context);
  const decision = normalizeOpportunityDecision(value);
  const pool = await careerP0Pool();
  const row = (await pool.query('UPDATE "CareerOpportunity" SET "decisionState"=$1,"updatedAt"=NOW() WHERE id=$2 AND "tenantId"=$3 AND "userId"=$4 RETURNING id,"decisionState"', [decision, opportunityId, context.tenant.id, context.user.id])).rows[0];
  if (!row) throw Object.assign(new Error("OPPORTUNITY_NOT_FOUND"), { code: "OPPORTUNITY_NOT_FOUND" });
  await recordOpportunityEvent(context, opportunityId, "OPPORTUNITY_DECISION_CHANGED", { decisionState: decision });
  return { id: row.id, decisionState: row.decisionState, decisionLabel: CAREEROS_OPPORTUNITY_DECISION_LABELS[row.decisionState] };
}

export async function getCapabilityProfile(context, options = {}) {
  const executionTrace = options.includeTrace ? (options.executionTrace || {}) : null;
  if (executionTrace) { executionTrace.getCapabilityProfileEntered = true; executionTrace.includeTraceAtProfile = true; }
  const data = await getCapabilities(context, { ...options, ...(executionTrace ? { executionTrace } : {}) });
  const categories = { direct: [], transferable: [], partial: [], unresolved: [] };
  for (const capability of data.capabilities) {
    const key = capability.authorityState === "VERIFIED_DIRECT" ? "direct" : capability.authorityState === "VERIFIED_TRANSFERABLE" ? "transferable" : capability.authorityState === "PARTIALLY_SUPPORTED" ? "partial" : "unresolved";
    categories[key].push(capability);
  }
  const reviewed = data.capabilities.filter((item) => !capabilityNeedsReview(item)).length;
  const capabilityTrace = data.reconciliationTrace || [];
  for (const item of data.capabilities) {
    const trace = capabilityTrace.find((entry) => entry.capabilityKey === item.key);
    if (trace) { trace.publicAuthorityState = item.authorityState; trace.capabilityNeedsReview = capabilityNeedsReview(item); }
  }
  if (capabilityTrace.length) capabilityTrace.push({ profileId: data.profileId, candidateCount: data.capabilities.length, reviewed, total: data.capabilities.length, completion: data.capabilities.length > 0 && reviewed === data.capabilities.length });
  if (executionTrace) executionTrace.getCapabilityProfileReturnedCount = data.capabilities.length;
  return { ...data, categories, progress: { reviewed, total: data.capabilities.length }, leverage: { decisionsAsked: reviewed, capabilitiesResolved: reviewed, requirementsInformed: null, note: "Opportunity-specific requirements are measured after a job is supplied." } };
}

export async function exportProductAccount(context) {
  requireContext(context); const pool = await careerP0Pool();
  const [capabilities, decisions, opportunities, requirements, matches, resumeDrafts, inboxItems, opportunityEvents, opportunityNotes] = await Promise.all([
    pool.query('SELECT id,"capabilityKey",label,domain,scope,"authorityState",provenance,"taxonomyVersion",version,"createdAt","updatedAt" FROM "CareerCapabilityAuthority" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id]),
    pool.query('SELECT "capabilityId","questionKey",answer,"decisionState",rationale,"taxonomyVersion", "createdAt", "supersededAt" FROM "CareerCapabilityDecision" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id]),
    pool.query('SELECT id,"sourceType",title,company,location,description,"sourceUrl","decisionState","lifecycleState","createdAt","updatedAt" FROM "CareerOpportunity" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id]),
    pool.query('SELECT r.id,r."opportunityId",r."sourceOrder",r.text,r."conceptKey",r.importance,r.scope,r.specialist,r."createdAt" FROM "CareerOpportunityRequirement" r JOIN "CareerOpportunity" o ON o.id=r."opportunityId" WHERE r."tenantId"=$1 AND o."userId"=$2', [context.tenant.id, context.user.id]),
    pool.query('SELECT id,"opportunityId","taxonomyVersion","evaluationVersion",summary,relationships,stale,"createdAt" FROM "CareerMatchEvaluation" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id]),
    pool.query('SELECT id,"opportunityId","materialType","generationMethod",provider,model,"evaluationVersion","authorityVersion","draftVersion",content,stale,"createdAt","updatedAt" FROM "CareerResumeDraft" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id]),
    pool.query('SELECT id,"sourceType","sourceName","sourceUrl","externalOpportunityId","discoveredAt","importedAt",title,company,location,description,provenance,"normalizationStatus","duplicateStatus",status,"opportunityId","createdAt","updatedAt" FROM "CareerOpportunityInboxItem" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id]),
    pool.query('SELECT id,"opportunityId","eventType",metadata,"createdAt" FROM "CareerOpportunityEvent" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id]),
    pool.query('SELECT id,"opportunityId",content,"createdAt","updatedAt" FROM "CareerOpportunityNote" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id]),
  ]);
  return { capabilities: capabilities.rows, capabilityDecisions: decisions.rows, opportunities: opportunities.rows, requirements: requirements.rows, matchEvaluations: matches.rows, resumeDrafts: resumeDrafts.rows, inboxItems: inboxItems.rows, opportunityEvents: opportunityEvents.rows, opportunityNotes: opportunityNotes.rows };
}
