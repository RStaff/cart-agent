import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createCareerP0Store } from "./careerP0Store.mjs";
import { extractContextClaims } from "./contextClaims.mjs";
import { parseCareerText } from "./careerP0Intake.mjs";
import { listCapabilities } from "./capabilityCatalog.mjs";

test("only confirmed facts produce bounded contextual claims", () => {
  const statement = "I used Jira and Agile practices while working with developers and marketing to manage the project schedule.";
  const claims = extractContextClaims({ id: "fact-1", sourceId: "source-1", sourceOrder: 0, authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED", statement });
  assert.deepEqual(claims.map((claim) => [claim.dimension, claim.displayValue]), [
    ["TOOL", "Jira"],
    ["METHOD", "Agile"],
    ["STAKEHOLDER", "developers"],
    ["STAKEHOLDER", "marketing"],
    ["PROCESS", "project scheduling"],
  ]);
  assert.deepEqual(extractContextClaims({ id: "fact-1", sourceId: "source-1", sourceOrder: 0, authorityState: "SYSTEM_PROPOSED", statement }), []);
  assert.deepEqual(extractContextClaims({ authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED", statement: "What did you personally do?" }), []);
});

test("normalization is lexical and unsupported occupational inference is absent", () => {
  const claims = extractContextClaims({ id: "fact-2", sourceId: "source-2", sourceOrder: 1, authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED", statement: "I used Salesforce to coordinate marketing." });
  assert.equal(claims.find((claim) => claim.dimension === "TOOL")?.normalizedValue, "salesforce");
  assert.equal(claims.some((claim) => /administrator|architect|manager/i.test(claim.displayValue)), false);
  assert.equal(extractContextClaims({ authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED", statement: "I worked on something important." }).length, 0);
});

test("confirmed fact extraction persists idempotent proposals and preserves provenance", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "careeros-context-"));
  const store = createCareerP0Store({ filePath: path.join(directory, "store.json") });
  const account = await store.createAccount({ email: "brother@example.test", password: "long-enough-password", displayName: "Brother Beta" });
  await store.saveProfile(account.sessionId, { displayName: "Brother Beta" });
  const sourceText = "I used Jira and Agile practices while working with developers and marketing to manage the project schedule.";
  const source = await store.createSource(account.sessionId, { sourceType: "PROJECT", textContent: sourceText, sourceDigest: "brother-source" });
  const parsed = parseCareerText({ sourceId: source.id, sourceType: "PROJECT", text: sourceText });
  const candidates = await store.saveCandidates(account.sessionId, source.id, parsed);
  await store.reviewCandidate(account.sessionId, candidates[0].candidateFactId, "CONFIRM");
  const first = await store.listContextClaims(account.sessionId);
  await store.reviewCandidate(account.sessionId, candidates[0].candidateFactId, "CONFIRM");
  const second = await store.listContextClaims(account.sessionId);
  assert.ok(first.claims.length > 0);
  assert.equal(second.claims.length, first.claims.length);
  assert.equal(first.claims[0].sourceOrder, 0);
  assert.equal(Object.hasOwn(first.claims[0], "tenantId"), false);
  assert.equal(Object.hasOwn(first.claims[0], "userId"), false);
  assert.equal(Object.hasOwn(first.claims[0], "profileId"), false);
});

test("context claim confirm, correct, and reject leave the CareerFact unchanged", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "careeros-context-review-"));
  const store = createCareerP0Store({ filePath: path.join(directory, "store.json") });
  const account = await store.createAccount({ email: "reviewer@example.test", password: "long-enough-password", displayName: "Reviewer" });
  await store.saveProfile(account.sessionId, { displayName: "Reviewer" });
  const statement = "I used Jira while working with developers.";
  const source = await store.createSource(account.sessionId, { sourceType: "PROJECT", textContent: statement, sourceDigest: "review-source" });
  const parsed = parseCareerText({ sourceId: source.id, sourceType: "PROJECT", text: statement });
  const candidates = await store.saveCandidates(account.sessionId, source.id, parsed);
  const result = await store.reviewCandidate(account.sessionId, candidates[0].candidateFactId, "CONFIRM");
  const before = result.careerFact.statement;
  const claims = await store.listContextClaims(account.sessionId);
  const corrected = await store.reviewContextClaim(account.sessionId, claims.claims[0].claimId, "CORRECT", "Jira platform");
  assert.equal(corrected.summary.TOOL[0], "Jira platform");
  const facts = await store.listCareerFacts(account.sessionId);
  assert.equal(facts[0].statement, before);
  const rejected = await store.reviewContextClaim(account.sessionId, corrected.claims.find((claim) => claim.displayValue === "Jira platform").claimId, "REJECT");
  assert.equal(rejected.summary.TOOL.length, 0);
});

test("context claims are isolated from capability answers and matching", async () => {
  const product = await fs.readFile(new URL("./careerP0Product.mjs", import.meta.url), "utf8");
  const answers = listCapabilities()[0].question.choices;
  assert.deepEqual(answers, ["DIRECT", "TRANSFERABLE", "PARTIAL", "NOT_SUPPORTED", "KEEP_UNRESOLVED"]);
  assert.equal(product.includes("listContextClaims"), false);
  assert.equal(product.includes("CareerFactContextClaim"), false);
  assert.deepEqual(extractContextClaims({ authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED", statement: "I used Python for financial services reporting." }).map((claim) => claim.displayValue), ["Python", "financial services"]);
  assert.deepEqual(extractContextClaims({ authorityState: "CUSTOMER_CONFIRMED_SOURCE_BACKED", statement: "I used Salesforce for ecommerce operations." }).map((claim) => claim.displayValue), ["Salesforce", "ecommerce"]);
});
