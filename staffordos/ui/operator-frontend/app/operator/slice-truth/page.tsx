import fs from "node:fs";
import path from "node:path";

function readJson(filePath: string) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export default function SliceTruthPage() {
  const repoRoot = path.resolve(process.cwd(), "../../..");

  const sliceTruthPath = path.join(
    repoRoot,
    "staffordos/system_inventory/output/system_map_slice_truth_v1.json"
  );

  const lockPath = path.join(
    repoRoot,
    "staffordos/slices/operator_lock_state.json"
  );

  const data = readJson(sliceTruthPath);
  const lock = readJson(lockPath);

  const locked = Boolean(lock?.active_slice);

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1>StaffordOS Slice Truth</h1>

      <p style={{ opacity: 0.75 }}>
        Operator Lock, slice verification, and System Map truth. Read-only control surface.
      </p>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #333", borderRadius: 12 }}>
        <h2>Operator Lock</h2>
        <div><strong>Locked:</strong> {locked ? "YES" : "NO"}</div>
        <div><strong>Active Slice:</strong> {lock?.active_slice || "none"}</div>
        <div><strong>Reason:</strong> {lock?.reason || "unknown"}</div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          <button disabled={!locked}>Repair Active Slice</button>
          <button disabled={locked}>Select Next Slice</button>
          <button disabled={locked}>Run Verifier</button>
          <button disabled={locked}>Update System Map Truth</button>
        </div>

        <p style={{ opacity: 0.65, marginTop: 12 }}>
          Buttons are intentionally disabled/read-only until execution routes are explicitly sliced.
        </p>
      </section>

      {!data ? (
        <pre>Missing slice truth file.</pre>
      ) : (
        <>
          <section style={{ marginTop: 24 }}>
            <h2>Summary</h2>
            <div>Total: {data.summary?.total ?? 0}</div>
            <div>Verified: {data.summary?.verified ?? 0}</div>
            <div>Failed: {data.summary?.failed ?? 0}</div>
            <div>Unknown: {data.summary?.unknown ?? 0}</div>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Registered Slices</h2>

            {(data.slices || []).map((slice: any) => (
              <div
                key={slice.slice_id}
                style={{
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12
                }}
              >
                <h3>{slice.slice_id}</h3>
                <div><strong>Status:</strong> {slice.status}</div>
                <div><strong>Verification:</strong> {slice.verification_status}</div>
                <div><strong>Reason:</strong> {slice.verification_reason}</div>
                <div><strong>Proof:</strong> {slice.output_proof}</div>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
