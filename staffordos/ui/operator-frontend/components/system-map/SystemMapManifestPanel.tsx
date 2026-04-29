"use client";

import { useEffect, useState } from "react";

type Blocker = {
  id: string;
  category: string;
  status: string;
  proof_required: string;
  blocks: string[];
};

type ManifestResponse = {
  ok: boolean;
  source?: string;
  manifest?: {
    generated_at: string;
    manifest_name: string;
    purpose: string;
    ui_readiness: {
      ready_for_ui_binding: boolean;
      ready_for_scheduler_display: boolean;
      proof_gate_required: boolean;
    };
    system_status_summary: {
      capability_status_counts: Record<string, number>;
      proof_status_counts: Record<string, number>;
      discovery_sync_status: string;
      discovery_runner_ready_for_scheduler: boolean;
    };
    display_sections: string[];
    blockers: Blocker[];
    rule: string;
  };
  error?: string;
};

export default function SystemMapManifestPanel() {
  const [data, setData] = useState<ManifestResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/system-map/manifest")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((error) =>
        setData({
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="rounded-xl border p-4">
        <p>Loading System Map truth manifest…</p>
      </section>
    );
  }

  if (!data?.ok || !data.manifest) {
    return (
      <section className="rounded-xl border border-red-300 p-4">
        <h2 className="text-lg font-semibold">System Map Manifest Error</h2>
        <p>{data?.error || "Manifest could not be loaded."}</p>
      </section>
    );
  }

  const manifest = data.manifest;
  const summary = manifest.system_status_summary;

  return (
    <section className="space-y-6 rounded-xl border p-5">
      <div>
        <p className="text-sm uppercase tracking-wide opacity-70">
          StaffordOS Truth-Bound System Map
        </p>
        <h2 className="text-2xl font-semibold">System Map Runtime Manifest</h2>
        <p className="mt-2 text-sm opacity-80">{manifest.purpose}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs uppercase opacity-60">UI Binding</p>
          <p className="text-lg font-semibold">
            {manifest.ui_readiness.ready_for_ui_binding ? "Ready" : "Not Ready"}
          </p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs uppercase opacity-60">Scheduler Display</p>
          <p className="text-lg font-semibold">
            {manifest.ui_readiness.ready_for_scheduler_display ? "Ready" : "Not Ready"}
          </p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs uppercase opacity-60">Proof Gate</p>
          <p className="text-lg font-semibold">
            {manifest.ui_readiness.proof_gate_required ? "Required" : "Not Required"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Capability Status</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(summary.capability_status_counts).map(([key, value]) => (
              <li key={key} className="flex justify-between gap-4">
                <span>{key}</span>
                <strong>{value}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Execution Proof Status</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(summary.proof_status_counts).map(([key, value]) => (
              <li key={key} className="flex justify-between gap-4">
                <span>{key}</span>
                <strong>{value}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="font-semibold">Discovery Sync</h3>
        <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          <p>
            <span className="opacity-60">Status:</span>{" "}
            <strong>{summary.discovery_sync_status}</strong>
          </p>
          <p>
            <span className="opacity-60">Runner ready for scheduler:</span>{" "}
            <strong>
              {summary.discovery_runner_ready_for_scheduler ? "YES" : "NO"}
            </strong>
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="font-semibold">Active Proof Blockers</h3>
        <div className="mt-3 space-y-3">
          {manifest.blockers.map((blocker) => (
            <div key={blocker.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{blocker.id}</strong>
                <span>{blocker.status}</span>
              </div>
              <p className="mt-2 opacity-80">{blocker.proof_required}</p>
              <p className="mt-2 text-xs opacity-60">
                Blocks: {blocker.blocks.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-4 text-sm">
        <h3 className="font-semibold">Rule</h3>
        <p className="mt-2 opacity-80">{manifest.rule}</p>
      </div>

      <p className="text-xs opacity-50">Source: {data.source}</p>
    </section>
  );
}
