import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  BUSINESS_UNIT,
  CAMPAIGN_ID,
  OFFER_ID,
  ROSS_APPROVER,
  TENANT_ID,
  createFileRepository,
  createMemoryRepository,
  createRevenueOperationsService,
  isStaffordMediaEligibleLead,
} from "./staffordmedia_revenue_transaction_v1.mjs";
import { createResendProspectProvider } from "./resend_prospect_provider_v1.mjs";

const LEAD = {
  id: "lead-synthetic-1",
  businessUnit: BUSINESS_UNIT,
  offerId: OFFER_ID,
  campaignId: CAMPAIGN_ID,
  tenantId: TENANT_ID,
  contact: { email: "owner@example.com" },
};
const DRAFT = {
  leadId: LEAD.id,
  businessUnit: BUSINESS_UNIT,
  offerId: OFFER_ID,
  campaignId: CAMPAIGN_ID,
  tenantId: TENANT_ID,
  recipient: "owner@example.com",
  sender: "support@staffordmedia.ai",
  subject: "A practical workflow question",
  body: "Would a short workflow-fit conversation be useful?",
};

function fixture({ provider } = {}) {
  let instant = new Date("2026-09-24T12:00:00.000Z");
  const lead = structuredClone(LEAD);
  const repository = createMemoryRepository({ leads: [lead] });
  const sends = [];
  const selectedProvider = provider || {
    async send(message) {
      sends.push(structuredClone(message));
      return { id: "resend_receipt_1" };
    },
  };
  const service = createRevenueOperationsService({
    repository,
    provider: selectedProvider,
    now: () => new Date(instant),
    nonce: () => "nonce_single_use_1",
  });
  return {
    repository,
    service,
    sends,
    lead,
    advance(milliseconds) { instant = new Date(instant.getTime() + milliseconds); },
  };
}

function approve(service, draft, expiresAt = "2026-09-24T12:15:00.000Z") {
  return service.approve({
    transactionId: draft.id,
    contentHash: draft.draft.contentHash,
    approver: ROSS_APPROVER,
    expiresAt,
  });
}

function send(service, approved, overrides = {}) {
  return service.send({
    transactionId: approved.id,
    approvalId: approved.approval.id,
    recipient: approved.recipient,
    contentHash: approved.draft.contentHash,
    ...overrides,
  });
}

function fileFixture(t, { faultInjector = null, provider = null } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "staffordmedia-revenue-durability-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const statePath = path.join(root, "transactions.json");
  const leadPath = path.join(root, "leads.json");
  const eventPath = path.join(root, "events.json");
  fs.writeFileSync(leadPath, `${JSON.stringify({ items: [LEAD] }, null, 2)}\n`);
  const repository = createFileRepository({ statePath, leadRegistryPath: leadPath, eventPath, faultInjector });
  let providerCalls = 0;
  const selectedProvider = provider || {
    async send() {
      providerCalls += 1;
      return { id: "durable_provider_receipt" };
    },
  };
  const service = createRevenueOperationsService({
    repository,
    provider: selectedProvider,
    now: () => new Date("2026-09-24T12:00:00.000Z"),
    nonce: () => "durable_single_use_nonce",
  });
  return {
    root,
    statePath,
    leadPath,
    eventPath,
    envelopePath: `${statePath}.operation.json`,
    repository,
    service,
    providerCalls: () => providerCalls,
    reopen(options = {}) {
      return createFileRepository({ statePath, leadRegistryPath: leadPath, eventPath, ...options });
    },
  };
}

test("offer registry contains the exact bounded StaffordMedia assessment", () => {
  const registry = JSON.parse(fs.readFileSync(new URL("./staffordmedia_offer_registry_v1.json", import.meta.url), "utf8"));
  assert.equal(registry.offers.length, 1);
  assert.deepEqual(registry.offers[0], {
    offerId: OFFER_ID,
    businessUnit: BUSINESS_UNIT,
    audience: "home and field-service businesses",
    price: { currency: "USD", amount: 750 },
    deliveryTargetBusinessDays: 5,
    scope: [
      "one current-state workflow map",
      "three ranked automation opportunities",
      "one bounded first-automation specification",
      "human-review requirements",
      "system/data dependencies",
      "exclusions and separately priced implementation options"
    ],
    exclusions: ["implementation", "software fees", "migration", "compliance certification", "guaranteed savings"],
    creditPolicy: "$750 may be credited toward a separately approved implementation sprint"
  });
});

test("one exact approval produces one idempotent provider attempt and canonical receipt", async () => {
  const { service, sends, repository } = fixture();
  const draft = service.createDraft(DRAFT);
  const approved = approve(service, draft);
  const sent = await send(service, approved);

  assert.equal(sends.length, 1);
  assert.deepEqual(sends[0], {
    to: DRAFT.recipient,
    from: DRAFT.sender,
    subject: DRAFT.subject,
    body: DRAFT.body,
    idempotencyKey: "nonce_single_use_1",
  });
  assert.equal(sent.status, "SENT");
  assert.equal(sent.approval.recipient, DRAFT.recipient);
  assert.equal(sent.approval.sender, DRAFT.sender);
  assert.equal(sent.approval.subject, DRAFT.subject);
  assert.equal(sent.approval.body, DRAFT.body);
  assert.equal(sent.approval.consumedAt, "2026-09-24T12:00:00.000Z");
  assert.equal(sent.providerReceipt.providerId, "resend_receipt_1");
  assert.equal(sent.providerReceipt.status, "ACCEPTED");
  assert.equal(sent.providerReceipt.deliveryResult, "PROVIDER_ACCEPTED_DELIVERY_UNCONFIRMED");
  assert.deepEqual(repository.events().map((item) => item.type), [
    "prospect_email_draft_created",
    "prospect_email_approved",
    "prospect_email_send_attempted",
    "prospect_email_provider_accepted",
  ]);
});

test("altered draft fails before approval", () => {
  const { service, repository } = fixture();
  const draft = service.createDraft(DRAFT);
  repository.mutate((state) => {
    state.transactions[0].body = "altered body";
    return state;
  });
  assert.throws(() => approve(service, draft), { message: "DRAFT_MUTATED" });
});

test("an unscoped or product-mismatched lead cannot become a StaffordMedia draft", () => {
  const repository = createMemoryRepository({ leads: [{ id: LEAD.id, product: "shopifixer", contact: { email: DRAFT.recipient } }] });
  const service = createRevenueOperationsService({ repository, provider: { async send() { throw new Error("must not send"); } } });
  assert.throws(() => service.createDraft(DRAFT), { message: "LEAD_SCOPE_MISMATCH" });
  assert.equal(repository.read().transactions.length, 0);
  assert.equal(repository.events().length, 0);
});

test("historical canonical leads are not implicitly StaffordMedia prospects", () => {
  const registry = JSON.parse(fs.readFileSync(new URL("./lead_registry_v1.json", import.meta.url), "utf8"));
  assert.equal(registry.items.some(isStaffordMediaEligibleLead), false);
});

test("content mismatch and wrong approver fail closed", () => {
  const { service } = fixture();
  const draft = service.createDraft(DRAFT);
  assert.throws(() => service.approve({ transactionId: draft.id, contentHash: "0".repeat(64), approver: ROSS_APPROVER, expiresAt: "2026-09-24T12:15:00.000Z" }), { message: "CONTENT_MISMATCH" });
  assert.throws(() => service.approve({ transactionId: draft.id, contentHash: draft.draft.contentHash, approver: "OTHER", expiresAt: "2026-09-24T12:15:00.000Z" }), { message: "APPROVER_INVALID" });
});

test("expired approval and recipient mismatch never call provider", async () => {
  const expired = fixture();
  const expiredDraft = expired.service.createDraft(DRAFT);
  const expiredApproval = approve(expired.service, expiredDraft, "2026-09-24T12:01:00.000Z");
  expired.advance(61_000);
  await assert.rejects(send(expired.service, expiredApproval), { message: "APPROVAL_EXPIRED" });
  assert.equal(expired.sends.length, 0);

  const mismatch = fixture();
  const mismatchDraft = mismatch.service.createDraft(DRAFT);
  const mismatchApproval = approve(mismatch.service, mismatchDraft);
  await assert.rejects(send(mismatch.service, mismatchApproval, { recipient: "other@example.com" }), { message: "RECIPIENT_MISMATCH" });
  assert.equal(mismatch.sends.length, 0);

  const staleRegistry = fixture();
  const staleDraft = staleRegistry.service.createDraft(DRAFT);
  const staleApproval = approve(staleRegistry.service, staleDraft);
  staleRegistry.lead.contact.email = "changed@example.com";
  await assert.rejects(send(staleRegistry.service, staleApproval), { message: "RECIPIENT_MISMATCH" });
  assert.equal(staleRegistry.sends.length, 0);

  const changedScope = fixture();
  const changedScopeDraft = changedScope.service.createDraft(DRAFT);
  const changedScopeApproval = approve(changedScope.service, changedScopeDraft);
  changedScope.lead.businessUnit = "SHOPIFIXER";
  await assert.rejects(send(changedScope.service, changedScopeApproval), { message: "LEAD_SCOPE_MISMATCH" });
  assert.equal(changedScope.sends.length, 0);
});

test("replay and duplicate send permit one provider attempt", async () => {
  let release;
  const entered = new Promise((resolve) => { release = resolve; });
  let providerCalls = 0;
  const pending = fixture({ provider: { async send() { providerCalls += 1; await entered; return { id: "receipt" }; } } });
  const draft = pending.service.createDraft(DRAFT);
  const approved = approve(pending.service, draft);
  const first = send(pending.service, approved);
  await assert.rejects(send(pending.service, approved), { message: "SEND_NOT_APPROVED" });
  release();
  await first;
  await assert.rejects(send(pending.service, approved), { message: "SEND_NOT_APPROVED" });
  assert.equal(providerCalls, 1);
});

test("provider failure is durably recorded and consumes approval", async () => {
  let calls = 0;
  const { service, repository } = fixture({ provider: { async send() { calls += 1; throw new Error("provider unavailable"); } } });
  const draft = service.createDraft(DRAFT);
  const approved = approve(service, draft);
  await assert.rejects(send(service, approved), { message: "PROVIDER_SEND_FAILED" });
  await assert.rejects(send(service, approved), { message: "SEND_NOT_APPROVED" });
  const failed = repository.read().transactions[0];
  assert.equal(calls, 1);
  assert.equal(failed.status, "FAILED");
  assert.equal(failed.providerReceipt.status, "FAILED");
  assert.equal(failed.providerReceipt.deliveryResult, "PROVIDER_REJECTED");
  assert.ok(failed.approval.consumedAt);
});

test("an invalid provider receipt is distinct, durable, and never retried", async () => {
  let calls = 0;
  const { service, repository } = fixture({ provider: { async send() { calls += 1; return {}; } } });
  const draft = service.createDraft(DRAFT);
  const approved = approve(service, draft);
  await assert.rejects(send(service, approved), { message: "PROVIDER_RECEIPT_INVALID" });
  await assert.rejects(send(service, approved), { message: "SEND_NOT_APPROVED" });
  const failed = repository.read().transactions[0];
  assert.equal(calls, 1);
  assert.equal(failed.status, "FAILED");
  assert.equal(failed.providerReceipt.deliveryResult, "PROVIDER_RESPONSE_INVALID_DELIVERY_UNCONFIRMED");
});

test("Resend adapter forwards the approval nonce as provider idempotency key", async () => {
  let captured;
  const provider = createResendProspectProvider({
    async send(message) {
      captured = message;
      return { id: "resend_injected_receipt" };
    },
  });
  assert.deepEqual(await provider.send({ ...DRAFT, to: DRAFT.recipient, from: DRAFT.sender, idempotencyKey: "nonce_exact" }), { id: "resend_injected_receipt" });
  assert.equal(captured.idempotencyKey, "nonce_exact");
  assert.equal(captured.text, DRAFT.body);
});

test("manual outcome and follow-up require a sent transaction", async () => {
  const { service } = fixture();
  const draft = service.createDraft(DRAFT);
  assert.throws(() => service.recordOutcome({ transactionId: draft.id, outcome: "REPLIED", note: "Reply received" }), { message: "OUTCOME_REQUIRES_SENT_TRANSACTION" });
  const sent = await send(service, approve(service, draft));
  const followUp = service.recordOutcome({ transactionId: sent.id, outcome: "FOLLOW_UP_DUE", note: "Ross will follow up manually.", followUpAt: "2026-09-26T14:00:00.000Z" });
  assert.equal(followUp.status, "FOLLOW_UP_DUE");
  assert.equal(followUp.outcome.recordedBy, ROSS_APPROVER);
  const replied = service.recordOutcome({ transactionId: sent.id, outcome: "REPLIED", note: "Reply recorded manually." });
  assert.equal(replied.status, "CLOSED");
});

test("no-send file rehearsal persists state and events without network access", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "staffordmedia-revenue-rehearsal-"));
  const statePath = path.join(root, "transactions.json");
  const leadPath = path.join(root, "leads.json");
  const eventPath = path.join(root, "events.json");
  fs.writeFileSync(leadPath, JSON.stringify({ items: [LEAD] }));
  const repository = createFileRepository({ statePath, leadRegistryPath: leadPath, eventPath });
  let calls = 0;
  const service = createRevenueOperationsService({ repository, provider: { async send() { calls += 1; return { id: "injected-no-network-receipt" }; } }, now: () => new Date("2026-09-24T12:00:00.000Z"), nonce: () => "rehearsal_nonce" });
  const draft = service.createDraft(DRAFT);
  const sent = await send(service, approve(service, draft));
  assert.equal(calls, 1);
  assert.equal(sent.providerReceipt.providerId, "injected-no-network-receipt");
  assert.equal(JSON.parse(fs.readFileSync(statePath, "utf8")).transactions.length, 1);
  assert.equal(JSON.parse(fs.readFileSync(eventPath, "utf8")).events.length, 4);
  assert.equal(fs.existsSync(`${statePath}.lock`), false);
  fs.rmSync(root, { recursive: true, force: true });
});

test("recovery projects a committed envelope after a crash before either projection", (t) => {
  const fixture = fileFixture(t, {
    faultInjector(point) {
      if (point === "afterEnvelopePersistence") throw new Error("SIMULATED_CRASH_AFTER_ENVELOPE");
    },
  });
  assert.throws(() => fixture.service.createDraft(DRAFT), { message: "SIMULATED_CRASH_AFTER_ENVELOPE" });
  assert.equal(fs.existsSync(fixture.statePath), false);
  assert.equal(fs.existsSync(fixture.eventPath), false);
  assert.equal(fs.existsSync(fixture.envelopePath), true);

  const recovered = fixture.reopen();
  assert.equal(recovered.read().transactions.length, 1);
  assert.equal(JSON.parse(fs.readFileSync(fixture.eventPath, "utf8")).events.length, 1);
  assert.equal(fs.existsSync(fixture.envelopePath), false);
});

test("recovery completes an event projection after transaction projection interruption", (t) => {
  const fixture = fileFixture(t, {
    faultInjector(point) {
      if (point === "afterTransactionProjection") throw new Error("SIMULATED_CRASH_AFTER_STATE");
    },
  });
  assert.throws(() => fixture.service.createDraft(DRAFT), { message: "SIMULATED_CRASH_AFTER_STATE" });
  assert.equal(JSON.parse(fs.readFileSync(fixture.statePath, "utf8")).transactions.length, 1);
  assert.equal(fs.existsSync(fixture.eventPath), false);
  assert.equal(fs.existsSync(fixture.envelopePath), true);

  fixture.reopen();
  assert.equal(JSON.parse(fs.readFileSync(fixture.eventPath, "utf8")).events.length, 1);
  assert.equal(fs.existsSync(fixture.envelopePath), false);
});

test("repeated recovery is idempotent and does not rewrite complete projections", (t) => {
  const fixture = fileFixture(t);
  fixture.service.createDraft(DRAFT);
  const stateBefore = fs.readFileSync(fixture.statePath);
  const eventsBefore = fs.readFileSync(fixture.eventPath);
  assert.equal(fixture.repository.recover(), false);
  assert.equal(fixture.repository.recover(), false);
  assert.deepEqual(fs.readFileSync(fixture.statePath), stateBefore);
  assert.deepEqual(fs.readFileSync(fixture.eventPath), eventsBefore);
});

test("the existing transaction lock rejects a concurrent transition attempt", (t) => {
  let secondService;
  let concurrentError;
  const fixture = fileFixture(t, {
    faultInjector(point) {
      if (point === "afterEnvelopePersistence") {
        try { secondService.createDraft(DRAFT); } catch (error) { concurrentError = error; }
      }
    },
  });
  const secondRepository = fixture.reopen();
  secondService = createRevenueOperationsService({
    repository: secondRepository,
    provider: { async send() { throw new Error("must not send"); } },
  });
  fixture.service.createDraft(DRAFT);
  assert.equal(concurrentError?.message, "TRANSACTION_STATE_LOCKED");
  assert.equal(fixture.repository.read().transactions.length, 1);
});

test("recovery rejects a duplicate deterministic event ID with different content", (t) => {
  let envelope;
  const fixture = fileFixture(t, {
    faultInjector(point, value) {
      if (point === "afterEnvelopePersistence") {
        envelope = value;
        throw new Error("SIMULATED_CRASH");
      }
    },
  });
  assert.throws(() => fixture.service.createDraft(DRAFT), { message: "SIMULATED_CRASH" });
  fs.writeFileSync(fixture.eventPath, `${JSON.stringify({ version: "lead_events_v1", events: [{ ...envelope.event, type: "altered" }] }, null, 2)}\n`);
  assert.throws(() => fixture.reopen(), { message: "DUPLICATE_EVENT_ID" });
  assert.equal(fs.existsSync(fixture.envelopePath), true);
});

test("recovery rejects a stale prior state version", (t) => {
  const fixture = fileFixture(t, {
    faultInjector(point) {
      if (point === "afterEnvelopePersistence") throw new Error("SIMULATED_CRASH");
    },
  });
  assert.throws(() => fixture.service.createDraft(DRAFT), { message: "SIMULATED_CRASH" });
  fs.writeFileSync(fixture.statePath, `${JSON.stringify({ schema: "staffordos.staffordmedia_revenue_transactions.v1", version: 7, transactions: [] }, null, 2)}\n`);
  assert.throws(() => fixture.reopen(), { message: "OPERATION_ENVELOPE_STALE_PRIOR_STATE" });
});

test("recovery rejects malformed and hash-mismatched operation envelopes", (t) => {
  const malformed = fileFixture(t, {
    faultInjector(point) {
      if (point === "afterEnvelopePersistence") throw new Error("SIMULATED_CRASH");
    },
  });
  assert.throws(() => malformed.service.createDraft(DRAFT), { message: "SIMULATED_CRASH" });
  const envelope = JSON.parse(fs.readFileSync(malformed.envelopePath, "utf8"));
  envelope.transactionHash = "0".repeat(64);
  fs.writeFileSync(malformed.envelopePath, `${JSON.stringify(envelope, null, 2)}\n`);
  assert.throws(() => malformed.reopen(), { message: "OPERATION_ENVELOPE_TRANSACTION_HASH_INVALID" });

  fs.writeFileSync(malformed.envelopePath, "{}\n");
  assert.throws(() => malformed.reopen(), { message: "OPERATION_ENVELOPE_INVALID" });
});

test("provider acceptance recovery never reuses approval or repeats the provider call", async (t) => {
  let providerCalls = 0;
  const fixture = fileFixture(t, {
    provider: {
      async send() {
        providerCalls += 1;
        return { id: "accepted_before_projection_interruption" };
      },
    },
    faultInjector(point, envelope) {
      if (point === "afterTransactionProjection" && envelope.event.type === "prospect_email_provider_accepted") {
        throw new Error("SIMULATED_ACCEPTANCE_PROJECTION_INTERRUPTION");
      }
    },
  });
  const draft = fixture.service.createDraft(DRAFT);
  const approved = approve(fixture.service, draft);
  await assert.rejects(send(fixture.service, approved), { message: "SIMULATED_ACCEPTANCE_PROJECTION_INTERRUPTION" });
  assert.equal(providerCalls, 1);
  assert.equal(JSON.parse(fs.readFileSync(fixture.statePath, "utf8")).transactions[0].status, "SENT");
  assert.equal(JSON.parse(fs.readFileSync(fixture.eventPath, "utf8")).events.filter((item) => item.type === "prospect_email_provider_accepted").length, 0);

  const recoveredRepository = fixture.reopen();
  const recoveredService = createRevenueOperationsService({
    repository: recoveredRepository,
    provider: { async send() { providerCalls += 1; return { id: "must_not_happen" }; } },
    now: () => new Date("2026-09-24T12:00:00.000Z"),
  });
  const recovered = recoveredRepository.read().transactions[0];
  assert.equal(recovered.status, "SENT");
  assert.ok(recovered.approval.consumedAt);
  await assert.rejects(send(recoveredService, approved), { message: "SEND_NOT_APPROVED" });
  assert.equal(providerCalls, 1);
  const events = JSON.parse(fs.readFileSync(fixture.eventPath, "utf8")).events;
  assert.equal(events.filter((item) => item.type === "prospect_email_provider_accepted").length, 1);
});
