import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const TRANSACTION_SCHEMA = "staffordos.staffordmedia_revenue_transactions.v1";
export const OPERATION_ENVELOPE_SCHEMA = "staffordos.staffordmedia_revenue_operation.v1";
export const OFFER_ID = "STAFFORDMEDIA_AUTOMATION_OPPORTUNITY_ASSESSMENT_V1";
export const BUSINESS_UNIT = "STAFFORDMEDIA";
export const CAMPAIGN_ID = "STAFFORDMEDIA_HOME_FIELD_SERVICES_OUTREACH_V1";
export const TENANT_ID = "STAFFORD_MEDIA";
export const ROSS_APPROVER = "ROSS_STAFFORD";
export const REVENUE_OPERATIONS_PERMISSION = "staffordos.revenue_operations.write";

const EMAIL_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const OUTCOMES = new Set(["REPLIED", "FOLLOW_UP_DUE", "NOT_INTERESTED", "QUALIFIED", "WON", "LOST"]);

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

function text(value, max, code) {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(normalized)) fail(code);
  return normalized;
}

function email(value, code = "PROSPECT_EMAIL_INVALID") {
  const normalized = text(value, 254, code).toLowerCase();
  if (!EMAIL_PATTERN.test(normalized) || /[\r\n,;]/.test(normalized)) fail(code);
  return normalized;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function contentHash(binding) {
  return crypto.createHash("sha256").update(canonicalJson(binding)).digest("hex");
}

function stateVersion(state) {
  const version = state?.version ?? 0;
  if (!Number.isSafeInteger(version) || version < 0) fail("TRANSACTION_STATE_VERSION_INVALID");
  return version;
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function immutableDraftInput(input) {
  const binding = {
    leadId: text(input.leadId, 180, "LEAD_ID_INVALID"),
    businessUnit: text(input.businessUnit, 80, "BUSINESS_UNIT_INVALID"),
    offerId: text(input.offerId, 120, "OFFER_ID_INVALID"),
    campaignId: text(input.campaignId, 120, "CAMPAIGN_ID_INVALID"),
    tenantId: text(input.tenantId, 120, "TENANT_ID_INVALID"),
    recipient: email(input.recipient, "RECIPIENT_INVALID"),
    sender: email(input.sender, "SENDER_INVALID"),
    subject: text(input.subject, 180, "SUBJECT_INVALID"),
    body: text(input.body, 10000, "BODY_INVALID"),
  };
  if (binding.businessUnit !== BUSINESS_UNIT) fail("BUSINESS_UNIT_MISMATCH");
  if (binding.offerId !== OFFER_ID) fail("OFFER_MISMATCH");
  if (binding.campaignId !== CAMPAIGN_ID) fail("CAMPAIGN_MISMATCH");
  if (binding.tenantId !== TENANT_ID) fail("TENANT_MISMATCH");
  return binding;
}

function validateState(state) {
  if (state?.schema !== TRANSACTION_SCHEMA || !Array.isArray(state.transactions)) fail("TRANSACTION_STATE_INVALID");
  stateVersion(state);
  return state;
}

export function createMemoryRepository({ leads = [] } = {}) {
  let state = { schema: TRANSACTION_SCHEMA, transactions: [] };
  const events = [];
  return {
    read: () => structuredClone(state),
    mutate(fn) {
      const next = fn(structuredClone(state));
      state = validateState(next);
      return structuredClone(state);
    },
    transition(fn) {
      const operationId = id("revenue_operation");
      const eventId = deterministicEventId(operationId);
      const result = fn({ state: structuredClone(state), eventId, operationId });
      const next = validateState(result.state);
      next.version = stateVersion(state) + 1;
      const canonicalEvent = validateCanonicalEvent(result.event, eventId);
      if (events.some((item) => item.id === eventId)) fail("DUPLICATE_EVENT_ID");
      state = next;
      events.push(structuredClone(canonicalEvent));
      return structuredClone(result.result);
    },
    findLead(leadId) { return structuredClone(leads.find((lead) => (lead.id || lead.lead_id) === leadId) || null); },
    appendEvent(event) { events.push(structuredClone(event)); },
    events: () => structuredClone(events),
  };
}

function readJson(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch (error) { if (error?.code === "ENOENT") return fallback; throw error; }
}

function atomicWrite(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, "wx", 0o600);
    fs.writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`);
    fs.fsyncSync(descriptor);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
  fs.renameSync(temporary, filePath);
  fsyncDirectory(path.dirname(filePath));
}

function fsyncDirectory(directory) {
  let descriptor;
  try {
    descriptor = fs.openSync(directory, "r");
    fs.fsyncSync(descriptor);
  } catch (error) {
    if (!["EINVAL", "ENOTSUP", "EBADF"].includes(error?.code)) throw error;
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
}

function deterministicEventId(operationId) {
  return `event_${contentHash({ operationId, purpose: "staffordmedia_revenue_transition_event_v1" })}`;
}

function validateCanonicalEvent(value, expectedId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("OPERATION_EVENT_INVALID");
  if (value.id !== expectedId) fail("OPERATION_EVENT_ID_INVALID");
  if (!value.transaction_id || !value.type || !value.created_at) fail("OPERATION_EVENT_INVALID");
  return value;
}

function validateEnvelope(value) {
  if (value?.schema !== OPERATION_ENVELOPE_SCHEMA) fail("OPERATION_ENVELOPE_INVALID");
  const expectedEventId = deterministicEventId(value.operationId);
  validateCanonicalEvent(value.event, expectedEventId);
  if (value.transitionId !== value.operationId || value.transactionId !== value.event.transaction_id) fail("OPERATION_ENVELOPE_BINDING_INVALID");
  if (!Number.isSafeInteger(value.priorStateVersion) || !Number.isSafeInteger(value.resultingStateVersion) || value.resultingStateVersion !== value.priorStateVersion + 1) fail("OPERATION_ENVELOPE_VERSION_INVALID");
  const priorState = validateState(structuredClone(value.priorState));
  const resultingState = validateState(structuredClone(value.resultingState));
  if (stateVersion(priorState) !== value.priorStateVersion) fail("OPERATION_ENVELOPE_VERSION_INVALID");
  if (stateVersion(resultingState) !== value.resultingStateVersion) fail("OPERATION_ENVELOPE_VERSION_INVALID");
  if (contentHash(priorState) !== value.priorStateHash) fail("OPERATION_ENVELOPE_STATE_HASH_INVALID");
  if (contentHash(resultingState) !== value.resultingStateHash) fail("OPERATION_ENVELOPE_STATE_HASH_INVALID");
  const transaction = resultingState.transactions.find((item) => item.id === value.transactionId);
  if (!transaction || contentHash(transaction) !== value.transactionHash) fail("OPERATION_ENVELOPE_TRANSACTION_HASH_INVALID");
  if (contentHash(value.event) !== value.eventHash) fail("OPERATION_ENVELOPE_EVENT_HASH_INVALID");
  if (!Number.isFinite(Date.parse(value.timestamp))) fail("OPERATION_ENVELOPE_TIMESTAMP_INVALID");
  return value;
}

export function createFileRepository({ statePath, leadRegistryPath, eventPath, faultInjector = null }) {
  const lockPath = `${statePath}.lock`;
  const envelopePath = `${statePath}.operation.json`;

  function withLock(fn) {
    let lock;
    try {
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      lock = fs.openSync(lockPath, "wx", 0o600);
    } catch (error) {
      if (error?.code === "EEXIST") fail("TRANSACTION_STATE_LOCKED");
      throw error;
    }
    try {
      return fn();
    } finally {
      if (lock !== undefined) fs.closeSync(lock);
      fs.rmSync(lockPath, { force: true });
    }
  }

  function inject(point, envelope) {
    if (faultInjector) faultInjector(point, structuredClone(envelope));
  }

  function projectEnvelope(envelope) {
    const current = validateState(readJson(statePath, { schema: TRANSACTION_SCHEMA, transactions: [] }));
    const currentVersion = stateVersion(current);
    const currentHash = contentHash(current);
    if (currentVersion === envelope.priorStateVersion) {
      if (currentHash !== envelope.priorStateHash) fail("OPERATION_ENVELOPE_STALE_PRIOR_STATE");
      atomicWrite(statePath, envelope.resultingState);
      inject("afterTransactionProjection", envelope);
    } else if (currentVersion !== envelope.resultingStateVersion || currentHash !== envelope.resultingStateHash) {
      fail("OPERATION_ENVELOPE_STALE_PRIOR_STATE");
    }

    const eventState = readJson(eventPath, { version: "lead_events_v1", events: [] });
    if (!Array.isArray(eventState.events)) fail("LEAD_EVENT_STATE_INVALID");
    const existing = eventState.events.find((item) => item.id === envelope.event.id);
    if (existing) {
      if (contentHash(existing) !== envelope.eventHash) fail("DUPLICATE_EVENT_ID");
    } else {
      eventState.events.push(envelope.event);
      atomicWrite(eventPath, eventState);
    }
    inject("afterEventProjection", envelope);
    fs.unlinkSync(envelopePath);
    fsyncDirectory(path.dirname(envelopePath));
  }

  function recoverLocked() {
    if (!fs.existsSync(envelopePath)) return false;
    const envelope = validateEnvelope(readJson(envelopePath, null));
    projectEnvelope(envelope);
    return true;
  }

  function recover() {
    if (!fs.existsSync(envelopePath)) return false;
    return withLock(recoverLocked);
  }

  function transition(fn) {
    return withLock(() => {
      recoverLocked();
      const priorState = validateState(readJson(statePath, { schema: TRANSACTION_SCHEMA, transactions: [] }));
      const priorStateVersion = stateVersion(priorState);
      const operationId = id("revenue_operation");
      const eventId = deterministicEventId(operationId);
      const transitionResult = fn({ state: structuredClone(priorState), eventId, operationId });
      const resultingState = validateState(transitionResult.state);
      resultingState.version = priorStateVersion + 1;
      const canonicalEvent = validateCanonicalEvent(transitionResult.event, eventId);
      const transaction = resultingState.transactions.find((item) => item.id === canonicalEvent.transaction_id);
      if (!transaction) fail("OPERATION_TRANSACTION_MISSING");
      const timestamp = canonicalEvent.created_at;
      const envelope = validateEnvelope({
        schema: OPERATION_ENVELOPE_SCHEMA,
        operationId,
        transitionId: operationId,
        transactionId: transaction.id,
        priorStateVersion,
        resultingStateVersion: resultingState.version,
        priorStateHash: contentHash(priorState),
        resultingStateHash: contentHash(resultingState),
        transactionHash: contentHash(transaction),
        eventHash: contentHash(canonicalEvent),
        timestamp,
        priorState,
        resultingState,
        event: canonicalEvent,
      });
      atomicWrite(envelopePath, envelope);
      inject("afterEnvelopePersistence", envelope);
      projectEnvelope(envelope);
      return structuredClone(transitionResult.result);
    });
  }

  recover();
  return {
    read() {
      recover();
      return validateState(readJson(statePath, { schema: TRANSACTION_SCHEMA, transactions: [] }));
    },
    transition,
    recover,
    envelopePath,
    findLead(leadId) {
      const registry = readJson(leadRegistryPath, { items: [] });
      return (Array.isArray(registry.items) ? registry.items : []).find((lead) => (lead.id || lead.lead_id) === leadId) || null;
    },
  };
}

function leadEmail(lead) {
  return String(lead?.contact?.email || lead?.email || lead?.execution?.send_target || "").trim().toLowerCase();
}

function leadScope(lead) {
  return {
    businessUnit: String(lead?.businessUnit || lead?.business_unit || "").trim(),
    offerId: String(lead?.offerId || lead?.offer_id || "").trim(),
    campaignId: String(lead?.campaignId || lead?.campaign_id || lead?.campaign?.campaign_id || "").trim(),
    tenantId: String(lead?.tenantId || lead?.tenant_id || "").trim(),
  };
}

export function isStaffordMediaEligibleLead(lead) {
  const scope = leadScope(lead);
  return scope.businessUnit === BUSINESS_UNIT
    && scope.offerId === OFFER_ID
    && scope.campaignId === CAMPAIGN_ID
    && scope.tenantId === TENANT_ID;
}

function assertStaffordMediaLeadScope(lead) {
  if (!isStaffordMediaEligibleLead(lead)) fail("LEAD_SCOPE_MISMATCH");
}

function event(eventId, type, transaction, now, extra = {}) {
  return {
    id: eventId,
    lead_id: transaction.leadId,
    type,
    event_type: type,
    source: "staffordos_staffordmedia_revenue_transaction_v1",
    business_unit: transaction.businessUnit,
    offer_id: transaction.offerId,
    campaign_id: transaction.campaignId,
    tenant_id: transaction.tenantId,
    transaction_id: transaction.id,
    created_at: now,
    ...extra,
  };
}

export function createRevenueOperationsService({ repository, provider, now = () => new Date(), nonce = () => crypto.randomBytes(24).toString("base64url") }) {
  function timestamp() { return now().toISOString(); }
  function find(state, transactionId) {
    const transaction = state.transactions.find((item) => item.id === transactionId);
    if (!transaction) fail("TRANSACTION_NOT_FOUND");
    return transaction;
  }

  return {
    createDraft(input) {
      const binding = immutableDraftInput(input);
      const lead = repository.findLead(binding.leadId);
      if (!lead) fail("LEAD_NOT_FOUND");
      if (leadEmail(lead) !== binding.recipient) fail("RECIPIENT_MISMATCH");
      assertStaffordMediaLeadScope(lead);
      const hash = contentHash(binding);
      const createdAt = timestamp();
      return repository.transition(({ state, eventId }) => {
        if (state.transactions.some((item) => item.leadId === binding.leadId && !["CLOSED", "FAILED"].includes(item.status))) fail("OPEN_TRANSACTION_EXISTS");
        const created = { id: id("revenue_tx"), status: "DRAFTED", ...binding, draft: { id: id("draft"), contentHash: hash, createdAt }, approval: null, providerReceipt: null, outcome: null, createdAt, updatedAt: createdAt };
        state.transactions.push(created);
        return {
          state,
          result: created,
          event: event(eventId, "prospect_email_draft_created", created, createdAt, { draft_id: created.draft.id, content_hash: hash }),
        };
      });
    },

    approve({ transactionId, contentHash: assertedHash, approver, expiresAt }) {
      const approvedAt = timestamp();
      const expiry = new Date(expiresAt);
      if (approver !== ROSS_APPROVER) fail("APPROVER_INVALID");
      if (!Number.isFinite(expiry.getTime()) || expiry <= now()) fail("APPROVAL_EXPIRY_INVALID");
      return repository.transition(({ state, eventId }) => {
        const transaction = find(state, transactionId);
        if (transaction.status !== "DRAFTED" || transaction.approval) fail("APPROVAL_DUPLICATE_OR_INVALID_STATE");
        if (transaction.draft.contentHash !== assertedHash) fail("CONTENT_MISMATCH");
        const currentHash = contentHash(immutableDraftInput(transaction));
        if (currentHash !== transaction.draft.contentHash) fail("DRAFT_MUTATED");
        transaction.approval = { id: id("approval"), approver: ROSS_APPROVER, draftId: transaction.draft.id, contentHash: transaction.draft.contentHash, recipient: transaction.recipient, sender: transaction.sender, subject: transaction.subject, body: transaction.body, approvedAt, expiresAt: expiry.toISOString(), nonce: nonce(), consumedAt: null, providerAttemptId: null };
        transaction.status = "APPROVED";
        transaction.updatedAt = approvedAt;
        return {
          state,
          result: transaction,
          event: event(eventId, "prospect_email_approved", transaction, approvedAt, { approval_id: transaction.approval.id, approver: ROSS_APPROVER, draft_id: transaction.draft.id, content_hash: transaction.draft.contentHash, expires_at: transaction.approval.expiresAt }),
        };
      });
    },

    async send({ transactionId, approvalId, recipient, contentHash: assertedHash }) {
      const attemptedAt = timestamp();
      const claimed = repository.transition(({ state, eventId }) => {
        const transaction = find(state, transactionId);
        if (transaction.status !== "APPROVED" || !transaction.approval) fail("SEND_NOT_APPROVED");
        if (transaction.approval.id !== approvalId) fail("APPROVAL_MISMATCH");
        if (transaction.approval.consumedAt || transaction.approval.providerAttemptId) fail("APPROVAL_ALREADY_CONSUMED");
        if (Date.parse(transaction.approval.expiresAt) <= now().getTime()) fail("APPROVAL_EXPIRED");
        if (email(recipient, "RECIPIENT_INVALID") !== transaction.recipient || transaction.approval.recipient !== transaction.recipient) fail("RECIPIENT_MISMATCH");
        const currentLead = repository.findLead(transaction.leadId);
        if (leadEmail(currentLead) !== transaction.recipient) fail("RECIPIENT_MISMATCH");
        assertStaffordMediaLeadScope(currentLead);
        if (assertedHash !== transaction.draft.contentHash || transaction.approval.contentHash !== transaction.draft.contentHash) fail("CONTENT_MISMATCH");
        if (contentHash(immutableDraftInput(transaction)) !== transaction.draft.contentHash) fail("DRAFT_MUTATED");
        transaction.approval.consumedAt = attemptedAt;
        transaction.approval.providerAttemptId = id("provider_attempt");
        transaction.status = "SEND_ATTEMPTED";
        transaction.updatedAt = attemptedAt;
        return {
          state,
          result: transaction,
          event: event(eventId, "prospect_email_send_attempted", transaction, attemptedAt, { approval_id: approvalId, provider_attempt_id: transaction.approval.providerAttemptId, recipient: transaction.recipient, content_hash: transaction.draft.contentHash, idempotency_key: transaction.approval.nonce }),
        };
      });
      function recordProviderFailure(deliveryResult, error) {
        const failedAt = timestamp();
        return repository.transition(({ state, eventId }) => {
          const transaction = find(state, transactionId);
          if (transaction.status !== "SEND_ATTEMPTED" || transaction.approval.providerAttemptId !== claimed.approval.providerAttemptId) fail("PROVIDER_RECEIPT_STATE_MISMATCH");
          transaction.providerReceipt = { provider: "resend", providerId: null, status: "FAILED", deliveryResult, attemptedAt, recordedAt: failedAt, idempotencyKey: transaction.approval.nonce, error: String(error?.code || error?.message || "PROVIDER_FAILED").slice(0, 300) };
          transaction.status = "FAILED";
          transaction.updatedAt = failedAt;
          return {
            state,
            result: transaction,
            event: event(eventId, "prospect_email_provider_failed", transaction, failedAt, { provider: "resend", approval_id: approvalId, delivery_result: deliveryResult, error: transaction.providerReceipt.error }),
          };
        });
      }

      let result;
      try {
        result = await provider.send({ to: claimed.recipient, from: claimed.sender, subject: claimed.subject, body: claimed.body, idempotencyKey: claimed.approval.nonce });
      } catch (error) {
        recordProviderFailure("PROVIDER_REJECTED", error);
        throw Object.assign(new Error("PROVIDER_SEND_FAILED"), { code: "PROVIDER_SEND_FAILED" });
      }

      let providerId;
      try {
        providerId = text(result?.id || result?.providerId, 300, "PROVIDER_RECEIPT_MISSING");
      } catch (error) {
        recordProviderFailure("PROVIDER_RESPONSE_INVALID_DELIVERY_UNCONFIRMED", error);
        throw Object.assign(new Error("PROVIDER_RECEIPT_INVALID"), { code: "PROVIDER_RECEIPT_INVALID" });
      }

      const completedAt = timestamp();
      return repository.transition(({ state, eventId }) => {
        const transaction = find(state, transactionId);
        if (transaction.status !== "SEND_ATTEMPTED" || transaction.approval.providerAttemptId !== claimed.approval.providerAttemptId) fail("PROVIDER_RECEIPT_STATE_MISMATCH");
        transaction.providerReceipt = { provider: "resend", providerId, status: "ACCEPTED", deliveryResult: "PROVIDER_ACCEPTED_DELIVERY_UNCONFIRMED", attemptedAt, recordedAt: completedAt, idempotencyKey: transaction.approval.nonce };
        transaction.status = "SENT";
        transaction.updatedAt = completedAt;
        return {
          state,
          result: transaction,
          event: event(eventId, "prospect_email_provider_accepted", transaction, completedAt, { provider: "resend", provider_id: providerId, delivery_result: transaction.providerReceipt.deliveryResult, approval_id: approvalId }),
        };
      });
    },

    recordOutcome({ transactionId, outcome, note, followUpAt = null }) {
      if (!OUTCOMES.has(outcome)) fail("OUTCOME_INVALID");
      const recordedAt = timestamp();
      const cleanNote = text(note, 2000, "OUTCOME_NOTE_INVALID");
      if (outcome === "FOLLOW_UP_DUE" && (!followUpAt || !Number.isFinite(Date.parse(followUpAt)))) fail("FOLLOW_UP_AT_INVALID");
      return repository.transition(({ state, eventId }) => {
        const transaction = find(state, transactionId);
        if (!["SENT", "FOLLOW_UP_DUE"].includes(transaction.status)) fail("OUTCOME_REQUIRES_SENT_TRANSACTION");
        transaction.outcome = { outcome, note: cleanNote, followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null, recordedAt, recordedBy: ROSS_APPROVER };
        transaction.status = outcome === "FOLLOW_UP_DUE" ? "FOLLOW_UP_DUE" : "CLOSED";
        transaction.updatedAt = recordedAt;
        return {
          state,
          result: transaction,
          event: event(eventId, "prospect_manual_outcome_recorded", transaction, recordedAt, { outcome, follow_up_at: transaction.outcome.followUpAt, recorded_by: ROSS_APPROVER }),
        };
      });
    },
  };
}
