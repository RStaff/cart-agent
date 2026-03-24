"use client";

import { useEffect, useState } from "react";

type ServiceKey = "marketing" | "embedded" | "pay" | "render";

type ServiceStatus = {
  label: string;
  url: string;
  showBody: boolean;
};

const SERVICES: Record<ServiceKey, ServiceStatus> = {
  marketing: {
    label: "Marketing site",
    url: "https://abando.ai",
    showBody: false,
  },
  embedded: {
    label: "Embedded app shell",
    url: "https://app.abando.ai/embedded",
    showBody: false,
  },
  pay: {
    label: "Checkout API (pay.abando.ai)",
    url: "https://pay.abando.ai/api/health",
    showBody: true,
  },
  render: {
    label: "Checkout API (Render origin)",
    url: "https://cart-agent-api.onrender.com/health",
    showBody: true,
  },
};

type StatusState = {
  code: number | null;
  ok: boolean;
  body?: string;
  lastChecked?: string;
};

export default function StatusPanel() {
  const [statuses, setStatuses] = useState<Record<ServiceKey, StatusState>>({
    marketing: { code: null, ok: false },
    embedded: { code: null, ok: false },
    pay: { code: null, ok: false },
    render: { code: null, ok: false },
  });

  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    const now = new Date().toLocaleTimeString();

    const entries = await Promise.all(
      (Object.keys(SERVICES) as ServiceKey[]).map(async (key) => {
        const svc = SERVICES[key];
        try {
          const res = await fetch(svc.url, { method: "GET" });
          const text = await res.text();
          let body = "";

          if (svc.showBody) {
            // small JSON – keep it as-is for transparency
            body = text.slice(0, 200);
          }

          // Treat 200–307 as "ok" for marketing/embedded (redirects are fine)
          const ok =
            svc.showBody ? res.ok : res.status >= 200 && res.status < 400;

          return [
            key,
            {
              code: res.status,
              ok,
              body,
              lastChecked: now,
            } as StatusState,
          ] as const;
        } catch (err) {
          return [
            key,
            {
              code: null,
              ok: false,
              body: String(err),
              lastChecked: now,
            } as StatusState,
          ] as const;
        }
      })
    );

    setStatuses((prev) => ({
      ...prev,
      ...Object.fromEntries(entries),
    }));

    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000); // refresh every 60s
    return () => clearInterval(id);
  }, []);

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">
            Live stack status
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            pings your live endpoints every 60 seconds so you can see what Abando
            is doing without opening Render or a terminal.
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Checking…" : "Refresh now"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(SERVICES) as ServiceKey[]).map((key) => {
          const meta = SERVICES[key];
          const status = statuses[key];
          const ok = status.ok;
          const code =
            status.code === null ? "—" : String(status.code);

          return (
            <div
              key={key}
              className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-950/70 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-100">
                    {meta.label}
                  </p>
                  <p className="mt-1 line-clamp-1 break-all text-[10px] text-slate-500">
                    {meta.url}
                  </p>
                </div>

                <div className="flex flex-col items-end text-right">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      ok
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/15 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />
                    {ok ? "Healthy" : "Check"}
                  </span>
                  <span className="mt-1 text-[10px] text-slate-500">
                    HTTP {code}
                  </span>
                  {status.lastChecked && (
                    <span className="mt-0.5 text-[10px] text-slate-500">
                      as of {status.lastChecked}
                    </span>
                  )}
                </div>
              </div>

              {meta.showBody && status.body && (
                <pre className="mt-2 overflow-x-auto rounded-md bg-slate-900/80 p-2 text-[10px] text-slate-200">
                  {status.body}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
