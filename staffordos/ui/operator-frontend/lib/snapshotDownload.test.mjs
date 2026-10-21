import test from "node:test";
import assert from "node:assert/strict";
import { snapshotDownloadFilename, verifySnapshotDownload } from "./snapshotDownload.mjs";

async function digest(value) { const bytes = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(bytes), (item) => item.toString(16).padStart(2, "0")).join(""); }

test("download verifies the selected snapshot's exact HTML and derives a safe filename", async () => {
  const html = "<!doctype html><p>snapshot A</p>";
  const result = await verifySnapshotDownload({ id: "pkg/A?wrong", renderedHtml: html, contentDigest: await digest(html) });
  assert.deepEqual(result, { ok: true, html, filename: "stafford-media-blueprint-pkg-A-wrong.html" });
});

test("digest mismatch prevents download", async () => {
  const result = await verifySnapshotDownload({ id: "pkg-a", renderedHtml: "<p>tampered</p>", contentDigest: "not-the-digest" });
  assert.deepEqual(result, { ok: false, error: "SNAPSHOT_DIGEST_MISMATCH" });
});

test("selection changes use the newly selected snapshot and never relabel its HTML", async () => {
  const first = { id: "pkg-a", renderedHtml: "<p>A</p>" };
  first.contentDigest = await digest(first.renderedHtml);
  const second = { id: "pkg-b", renderedHtml: "<p>B</p>" };
  second.contentDigest = await digest(second.renderedHtml);
  const selected = await verifySnapshotDownload(second);
  assert.equal(selected.ok, true);
  assert.equal(selected.filename, "stafford-media-blueprint-pkg-b.html");
  assert.equal(selected.html, second.renderedHtml);
  assert.notEqual(selected.html, first.renderedHtml);
});
