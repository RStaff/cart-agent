"use client";

import * as React from "react";

type VerificationResult = {
  surface: string;
  verified_at: string;
  final_status: string;
};

type VerificationState = {
  marketing: VerificationResult;
  embedded: VerificationResult;
};

async function postJson<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "VERIFIED"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : status === "NOT VERIFIED"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
      : "border-slate-700 bg-slate-950 text-slate-300";

  return <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${tone}`}>{status}</span>;
}

function VerificationCard({ result }: { result: VerificationResult }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{result.surface}</p>
          <p className="mt-2 text-xl font-semibold text-white">{result.surface === "marketing" ? "Marketing Surface" : "Embedded Surface"}</p>
        </div>
        <StatusPill status={result.final_status || "UNKNOWN"} />
      </div>
      <p className="mt-4 text-sm text-slate-400">Last verified: {result.verified_at || "not yet verified"}</p>
    </div>
  );
}

export default function SurfaceVerificationPanel({
  verification,
  onMutate,
}: {
  verification: VerificationState;
  onMutate: () => Promise<void>;
}) {
  const [busy, setBusy] = React.useState("");
  const [message, setMessage] = React.useState("");

  async function verifySurface(surface: "marketing" | "embedded") {
    setBusy(surface);
    setMessage(`Verifying ${surface} surface...`);

    try {
      await postJson("/api/director/enqueue", {
        title: `verify ${surface} from verification panel`,
        type: "verify_surface",
        payload: { surface },
      });
      await postJson("/api/director/runBatch", { limit: 1 });
      await onMutate();
      setMessage(`${surface} verification completed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Failed to verify ${surface}.`);
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">Verification</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Surface verification status</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Run the source-of-truth verifier for marketing and embedded surfaces directly from the director console.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy !== ""}
            onClick={() => verifySurface("marketing")}
            type="button"
          >
            Verify Marketing
          </button>
          <button
            className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy !== ""}
            onClick={() => verifySurface("embedded")}
            type="button"
          >
            Verify Embedded
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <VerificationCard result={verification.marketing} />
        <VerificationCard result={verification.embedded} />
      </div>

      {message ? <div className="mt-4 text-sm text-slate-400">{message}</div> : null}
    </section>
  );
}
