import crypto from "node:crypto";
import { careerP0Pool } from "./careerP0Auth";
import { CAREEROS_CAPABILITY_TAXONOMY_VERSION, capabilityForKey, decisionStateForAnswer, deriveCapabilityCandidates, listCapabilities } from "./capabilityCatalog.mjs";
import { parseJobDescription } from "./jobProduct.mjs";

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

function publicCapability(row, decision = null) {
  const catalog = capabilityForKey(row.capabilityKey);
  return { id: row.id, key: row.capabilityKey, label: row.label, domain: row.domain, scope: row.scope, authorityState: row.authorityState, version: row.version, provenance: { factCount: row.provenance?.factIds?.length || 0, sourceCount: row.provenance?.sourceIds?.length || 0 }, question: catalog?.question || null, decision: decision ? { answer: decision.answer, decisionState: decision.decisionState, createdAt: decision.createdAt } : null };
}

async function activeDecisions(pool, context, capabilityIds = []) {
  if (!capabilityIds.length) return new Map();
  const result = await pool.query('SELECT DISTINCT ON ("capabilityId", "questionKey") * FROM "CareerCapabilityDecision" WHERE "tenantId"=$1 AND "userId"=$2 AND "supersededAt" IS NULL AND "capabilityId" = ANY($3::text[]) ORDER BY "capabilityId", "questionKey", "createdAt" DESC', [context.tenant.id, context.user.id, capabilityIds]);
  return new Map(result.rows.map((row) => [row.capabilityId, row]));
}

export async function deriveCapabilities(context) {
  requireContext(context);
  const pool = await careerP0Pool();
  const profile = await profileId(pool, context);
  const facts = (await pool.query('SELECT id,"sourceId",statement,"factType" FROM "CareerFact" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3 AND "authorityState"=$4 ORDER BY "createdAt"', [context.tenant.id, context.user.id, profile, "CUSTOMER_CONFIRMED_SOURCE_BACKED"])).rows;
  const candidates = deriveCapabilityCandidates(facts);
  for (const candidate of candidates) {
    await pool.query('INSERT INTO "CareerCapabilityAuthority" ("id","tenantId","userId","profileId","capabilityKey",label,domain,scope,"authorityState",provenance,"taxonomyVersion","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) ON CONFLICT ("tenantId","profileId","capabilityKey") DO UPDATE SET provenance=EXCLUDED.provenance,"taxonomyVersion"=EXCLUDED."taxonomyVersion","updatedAt"=NOW()', [id("capability"), context.tenant.id, context.user.id, profile, candidate.capabilityKey, candidate.label, candidate.domain, candidate.scope, candidate.authorityState, JSON.stringify(candidate.provenance), candidate.taxonomyVersion]);
  }
  const rows = (await pool.query('SELECT * FROM "CareerCapabilityAuthority" WHERE "tenantId"=$1 AND "userId"=$2 AND "profileId"=$3 ORDER BY "label"', [context.tenant.id, context.user.id, profile])).rows;
  const decisions = await activeDecisions(pool, context, rows.map((row) => row.id));
  return { profileId: profile, capabilities: rows.map((row) => publicCapability(row, decisions.get(row.id))), factsConsidered: facts.length };
}

export async function getCapabilities(context) { return deriveCapabilities(context); }

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

export async function evaluateOpportunity(context, opportunityId) {
  requireContext(context);
  const pool = await careerP0Pool();
  const opportunity = (await pool.query('SELECT * FROM "CareerOpportunity" WHERE id=$1 AND "tenantId"=$2 AND "userId"=$3', [opportunityId, context.tenant.id, context.user.id])).rows[0];
  if (!opportunity) throw Object.assign(new Error("OPPORTUNITY_NOT_FOUND"), { code: "OPPORTUNITY_NOT_FOUND" });
  const requirements = (await pool.query('SELECT * FROM "CareerOpportunityRequirement" WHERE "opportunityId"=$1 AND "tenantId"=$2 ORDER BY "sourceOrder"', [opportunityId, context.tenant.id])).rows;
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
    const row = (await client.query('INSERT INTO "CareerOpportunity" ("id","tenantId","userId","profileId","sourceType",title,company,location,description,"sourceUrl","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING *', [id("opportunity"), context.tenant.id, context.user.id, profile, parsed.sourceType, parsed.title, parsed.company, parsed.location, parsed.description, parsed.sourceUrl])).rows[0];
    for (const item of parsed.requirements) await client.query('INSERT INTO "CareerOpportunityRequirement" ("id","tenantId","opportunityId","sourceOrder",text,"conceptKey",importance,scope,specialist) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id("requirement"), context.tenant.id, row.id, item.sourceOrder, item.text, item.conceptKey, item.importance, item.scope, item.specialist]);
    return row;
  });
  const match = await evaluateOpportunity(context, opportunity.id);
  return { opportunity: { id: opportunity.id, title: opportunity.title, company: opportunity.company, location: opportunity.location, sourceType: opportunity.sourceType, createdAt: opportunity.createdAt }, requirements: parsed.requirements, match };
}

export async function listOpportunities(context) {
  requireContext(context); const pool = await careerP0Pool();
  return (await pool.query('SELECT id,title,company,location,"sourceType","createdAt","updatedAt" FROM "CareerOpportunity" WHERE "tenantId"=$1 AND "userId"=$2 ORDER BY "updatedAt" DESC', [context.tenant.id, context.user.id])).rows;
}

export async function getOpportunity(context, opportunityId) {
  requireContext(context); const pool = await careerP0Pool();
  const row = (await pool.query('SELECT id,title,company,location,"sourceType",description,"sourceUrl","createdAt","updatedAt" FROM "CareerOpportunity" WHERE id=$1 AND "tenantId"=$2 AND "userId"=$3', [opportunityId, context.tenant.id, context.user.id])).rows[0];
  if (!row) throw Object.assign(new Error("OPPORTUNITY_NOT_FOUND"), { code: "OPPORTUNITY_NOT_FOUND" });
  const requirements = (await pool.query('SELECT id,text,"conceptKey",importance,scope,specialist,"sourceOrder" FROM "CareerOpportunityRequirement" WHERE "opportunityId"=$1 AND "tenantId"=$2 ORDER BY "sourceOrder"', [opportunityId, context.tenant.id])).rows;
  const latest = (await pool.query('SELECT * FROM "CareerMatchEvaluation" WHERE "opportunityId"=$1 AND "tenantId"=$2 AND "userId"=$3 ORDER BY "createdAt" DESC LIMIT 1', [opportunityId, context.tenant.id, context.user.id])).rows[0];
  return { opportunity: row, requirements, match: latest ? { id: latest.id, stale: latest.stale, summary: latest.summary, relationships: latest.relationships } : await evaluateOpportunity(context, opportunityId) };
}

export async function getCapabilityProfile(context) {
  const data = await getCapabilities(context);
  const categories = { direct: [], transferable: [], partial: [], unresolved: [] };
  for (const capability of data.capabilities) {
    const key = capability.authorityState === "VERIFIED_DIRECT" ? "direct" : capability.authorityState === "VERIFIED_TRANSFERABLE" ? "transferable" : capability.authorityState === "PARTIALLY_SUPPORTED" ? "partial" : "unresolved";
    categories[key].push(capability);
  }
  const reviewed = data.capabilities.filter((item) => item.decision).length;
  return { ...data, categories, progress: { reviewed, total: data.capabilities.length }, leverage: { decisionsAsked: reviewed, capabilitiesResolved: reviewed, requirementsInformed: null, note: "Opportunity-specific requirements are measured after a job is supplied." } };
}

export async function exportProductAccount(context) {
  requireContext(context); const pool = await careerP0Pool();
  const [capabilities, decisions, opportunities, requirements, matches] = await Promise.all([
    pool.query('SELECT id,"capabilityKey",label,domain,scope,"authorityState",provenance,"taxonomyVersion",version,"createdAt","updatedAt" FROM "CareerCapabilityAuthority" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id]),
    pool.query('SELECT "capabilityId","questionKey",answer,"decisionState",rationale,"taxonomyVersion", "createdAt", "supersededAt" FROM "CareerCapabilityDecision" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id]),
    pool.query('SELECT id,"sourceType",title,company,location,description,"sourceUrl","createdAt","updatedAt" FROM "CareerOpportunity" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id]),
    pool.query('SELECT r.id,r."opportunityId",r."sourceOrder",r.text,r."conceptKey",r.importance,r.scope,r.specialist,r."createdAt" FROM "CareerOpportunityRequirement" r JOIN "CareerOpportunity" o ON o.id=r."opportunityId" WHERE r."tenantId"=$1 AND o."userId"=$2', [context.tenant.id, context.user.id]),
    pool.query('SELECT id,"opportunityId","taxonomyVersion","evaluationVersion",summary,relationships,stale,"createdAt" FROM "CareerMatchEvaluation" WHERE "tenantId"=$1 AND "userId"=$2', [context.tenant.id, context.user.id]),
  ]);
  return { capabilities: capabilities.rows, capabilityDecisions: decisions.rows, opportunities: opportunities.rows, requirements: requirements.rows, matchEvaluations: matches.rows };
}
