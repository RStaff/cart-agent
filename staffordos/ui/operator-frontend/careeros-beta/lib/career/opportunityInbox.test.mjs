import test from "node:test";
import assert from "node:assert/strict";
import { classifyInboxDuplicate, normalizeInboxInput, normalizeInboxUrl } from "./opportunityInbox.mjs";

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
