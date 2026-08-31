import test from "node:test";
import assert from "node:assert/strict";
import { classifyInboxDuplicate, normalizeInboxInput, normalizeInboxUrl, urlOnlyOpportunityGuidance } from "./opportunityInbox.mjs";
import { buildUsajobsDescription } from "./usajobsDiscovery.mjs";
import { parseJobDescription } from "./jobProduct.mjs";

test("manual text and job-alert imports normalize into the provider-neutral contract", () => {
  const manual = normalizeInboxInput({ sourceType: "MANUAL_TEXT", title: "Program Manager", company: "Example", description: "Lead cross-functional delivery." });
  const alert = normalizeInboxInput({ sourceType: "EMAIL_ALERT", title: "Marketing Manager", description: "Coordinate launch work." });
  assert.equal(manual.initialStatus, "READY_TO_ANALYZE");
  assert.equal(alert.sourceType, "EMAIL_ALERT");
  assert.equal(alert.provenance.inputMode, "EMAIL_ALERT");
});

test("URL metadata is accepted without fetching and remains reviewable without description", () => {
  const item = normalizeInboxInput({ sourceType: "JOB_URL", sourceUrl: "HTTPS://Example.com/jobs/123/?utm_source=mail#top" });
  assert.equal(item.sourceUrl, "https://example.com/jobs/123");
  assert.equal(item.initialStatus, "NEEDS_REVIEW");
  assert.equal(item.description, null);
  assert.throws(() => normalizeInboxUrl("file:///tmp/job"), /INVALID_SOURCE_URL/);
});

test("exact and possible duplicates are classified without deleting either item", () => {
  const candidate = normalizeInboxInput({ sourceType: "MANUAL_TEXT", title: "Program Manager", company: "Example", description: "Lead cross-functional delivery." });
  const exact = classifyInboxDuplicate(candidate, [{ id: "one", normalizedDigest: candidate.normalizedDigest, title: candidate.title }]);
  const possible = classifyInboxDuplicate(candidate, [{ id: "two", normalizedDigest: "different", title: candidate.title, company: candidate.company }]);
  assert.equal(exact.duplicateStatus, "DUPLICATE");
  assert.equal(possible.duplicateStatus, "POSSIBLE_DUPLICATE");
});

test("bounded imported inputs remain provider-neutral", () => {
  const values = Array.from({ length: 30 }, (_, index) => normalizeInboxInput({ sourceType: "FEED_IMPORT", title: "Role " + index, description: "A bounded imported description." }));
  assert.equal(values[0].sourceType, "FEED_IMPORT");
});

test("URL-only opportunities request job content without fetching", () => {
  const item = normalizeInboxInput({ sourceType: "JOB_URL", sourceUrl: "https://example.com/jobs/1" });
  assert.equal(item.normalizationStatus, "NEEDS_USER_DESCRIPTION");
  assert.match(urlOnlyOpportunityGuidance({ ...item, status: "NEEDS_REVIEW" }), /does not fetch the job description/);
  assert.equal(urlOnlyOpportunityGuidance({ ...item, normalizationStatus: "NORMALIZED" }), null);
});

test("description normalization preserves meaningful line boundaries", () => {
  const item = normalizeInboxInput({ sourceType: "MANUAL_TEXT", title: "Program Manager", description: "Requirements:\n  Lead   delivery.\n\nQualifications:\n  Coordinate   stakeholders.\n\n\n" });
  assert.equal(item.description, "Requirements:\nLead delivery.\n\nQualifications:\nCoordinate stakeholders.");
  assert.equal(parseJobDescription(item).requirements.length, 2);
});

test("description normalization converts CRLF and CR deterministically", () => {
  const item = normalizeInboxInput({ sourceType: "MANUAL_TEXT", title: "Program Manager", description: "Requirements:\r\nLead delivery.\rQualifications:\r\nCoordinate stakeholders." });
  assert.equal(item.description, "Requirements:\nLead delivery.\nQualifications:\nCoordinate stakeholders.");
});

test("description normalization keeps empty input and length bounds fail closed", () => {
  assert.throws(() => normalizeInboxInput({ sourceType: "MANUAL_TEXT", title: "Program Manager", description: "   \n\r\n " }), { code: "JOB_DESCRIPTION_REQUIRED" });
  const item = normalizeInboxInput({ sourceType: "MANUAL_TEXT", title: "Program Manager", description: "Requirements:\n" + "x".repeat(50000) });
  assert.equal(item.description.length, 50000);
});

test("ordinary metadata remains space-normalized while USAJOBS structure reaches the parser", () => {
  const apiItem = { MatchedObjectDescriptor: { QualificationSummary: "Experience leading programs.", UserArea: { Details: { JobSummary: "Context prose.", MajorDuties: "Lead delivery.", KeyRequirements: ["Coordinate stakeholders.", "Report outcomes."] } } } };
  const built = buildUsajobsDescription(apiItem);
  const item = normalizeInboxInput({ sourceType: "API_IMPORT", title: "  Program   Manager  ", company: "  Example   Agency ", description: built });
  assert.equal(item.title, "Program Manager");
  assert.equal(item.company, "Example Agency");
  assert.equal(item.description.split("\n").length, 4);
  assert.ok(parseJobDescription(item).requirements.length >= 3);
});

test("single-line descriptions remain compatible", () => {
  const item = normalizeInboxInput({ sourceType: "MANUAL_TEXT", title: "Program Manager", description: "Lead   delivery   planning." });
  assert.equal(item.description, "Lead delivery planning.");
});
