import type { ReactNode } from "react";

type EndpointConfig = {
  id: string;
  label: string;
  url: string;
  expectsJson?: boolean;
};

type EndpointStatus = {
  id: string;
  label: string;
  url: string;
  status: number | null;
  ok: boolean;
  summary: string;
  details?: string;
};

const ENDPOINTS: EndpointConfig[] = [
  {
    id: "marketing",
    label: "Marketing site",
    url: "https://abando.ai",
  },
  {
    id: "embedded",
    label: "Embedded app shell",
    url: "https://app.abando.ai/embedded",
  },
  {
    id: "pay",
    label: "Checkout API (pay.abando.ai)",
    url: "https://pay.abando.ai/api/health",
    expectsJson: true,
  },
  {
    id: "render",
    label: "Checkout API (Render origin)",
    url: "https://cart-agent-api.onrender.com/api/health",
    expectsJson: true,
  },
];

function isHealthy(status: number | null): boolean {
  if (status == null) return false;
  // Treat 2xx and 3xx as "up" so redirects (307) don't show as failures.
  return status >= 200 && status < 400;
}

async function checkEndpoint(cfg: EndpointConfig): Promise<EndpointStatus> {
  try {
    const res = await fetch(cfg.url, {
      cache: "no-store",
    });

    const status = res.status;

    if (!cfg.expectsJson) {
      const text = await res.text();
      const summary =
        text.length > 0
          ? text.slice(0, 120).replace(/\s+/g, " ") +
            (text.length > 120 ? "…" : "")
          : "HTML or non-JSON response";
      return {
        id: cfg.id,
        label: cfg.label,
        url: cfg.url,
        status,
        ok: isHealthy(status),
        summary,
      };
    }

    // JSON status endpoint
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      // ignore JSON parse errors
    }

    const summary =
      typeof json === "object" && json !== null
        ? JSON.stringify(json)
        : "JSON health payload";

    return {
      id: cfg.id,
      label: cfg.label,
      url: cfg.url,
      status,
      ok: isHealthy(status),
      summary,
    };
  } catch (err) {
    return {
      id: cfg.id,
      label: cfg.label,
      url: cfg.url,
      status: null,
      ok: false,
      summary: "Network error or timeout",
      details:
        err instanceof Error ? err.message : "Unknown error while fetching",
    };
  }
}

function StatusPill({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
        (ok
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-rose-500/15 text-rose-300")
      }
    >
      <span
        className={
          "h-1.5 w-1.5 rounded-full " +
          (ok ? "bg-emerald-400" : "bg-rose-400")
        }
      />
      {ok ? "Healthy" : "Check needed"}
    </span>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-50">{title}</h2>
      <div className="mt-3 text-sm text-slate-300">{children}</div>
    </section>
  );
}

export default async function CommandCenterPage() {
  const statuses = await Promise.all(ENDPOINTS.map(checkEndpoint));

  const overallHealthy = statuses.every((s) => s.ok);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-8 md:px-6">
      {/* Hero */}
      <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            Abando Command Center
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-50 md:text-3xl">
            Live stack status & health telemetry
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Quick view of your marketing surface, embedded app shell, and
            checkout API health. Built for fast debugging and future
            self-healing.
          </p>
        </div>

        <div className="mt-2 flex flex-col items-start gap-2 md:items-end">
          <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5">
            <span
              className={
                "h-2.5 w-2.5 rounded-full " +
                (overallHealthy ? "bg-emerald-400" : "bg-amber-400")
              }
            />
            <span className="text-xs font-medium text-slate-200">
              {overallHealthy ? "All systems nominal" : "Attention required"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Backed by /api/health on pay.abando.ai and Render origin.
          </p>
        </div>
      </header>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {statuses.map((s) => (
          <Card key={s.id} title={s.label}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusPill ok={s.ok} />
                  <span className="text-[11px] text-slate-400">
                    {s.status !== null ? `HTTP ${s.status}` : "No response"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 break-all">
                  {s.url}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-slate-900/70 p-3">
              <p className="text-[11px] text-slate-300">
                {s.summary}
                {s.details ? (
                  <>
                    <br />
                    <span className="text-rose-300">{s.details}</span>
                  </>
                ) : null}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Roadmap / AI features stub */}
      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <h2 className="text-sm font-semibold text-slate-50">
          Upcoming AI control plane
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          This Command Center is the base layer. Next, we can wire in:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          <li>• AI-driven alerts when conversion or health drops.</li>
          <li>
            • Automatic incident notes and suggested fixes when a region or
            endpoint degrades.
          </li>
          <li>
            • Cohort-level abandoned cart analysis tied directly into your
            checkout flows.
          </li>
        </ul>
        <p className="mt-3 text-[11px] text-slate-500">
          For now, this page gives you a live, always-on snapshot of the stack
          so you can prove reliability to yourself and to merchants.
        </p>
      </section>
    </main>
  );
}
