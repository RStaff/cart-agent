async function digest(value) {
  const bytes = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (item) => item.toString(16).padStart(2, "0")).join("");
}

export function snapshotDownloadFilename(snapshotId) {
  const safeId = String(snapshotId || "snapshot")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "snapshot";
  return `stafford-media-blueprint-${safeId}.html`;
}

export async function verifySnapshotDownload(snapshot) {
  if (!snapshot || typeof snapshot.renderedHtml !== "string" || typeof snapshot.contentDigest !== "string") {
    return { ok: false, error: "SNAPSHOT_CONTENT_MISSING" };
  }
  const actualDigest = await digest(snapshot.renderedHtml);
  if (actualDigest !== snapshot.contentDigest) return { ok: false, error: "SNAPSHOT_DIGEST_MISMATCH" };
  return { ok: true, html: snapshot.renderedHtml, filename: snapshotDownloadFilename(snapshot.id) };
}
