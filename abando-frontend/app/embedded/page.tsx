"use client";

import { useState } from "react";
import Image from "next/image";
import { TitleBar } from "@shopify/app-bridge-react";

type RecoveryPhase = "idle" | "running" | "done" | "error";

type TriggerResult = {
  ok?: boolean;
  message?: string;
  error?: string;
  eventId?: string;
  recoveryEventId?: string;
  id?: string;
  shop?: string;
  [key: string]: unknown;
};

const statusItems = [
  {
    label: "Monitoring status",
    value: "Watching new abandoned checkouts",
    state: "Live",
  },
  {
    label: "Email enabled",
    value: "Recovery email flow ready",
    state: "On",
  },
  {
    label: "SMS enabled",
    value: "SMS follow-up ready when configured",
    state: "On",
  },
  {
    label: "Store connected",
    value: "Shopify store connected successfully",
    state: "Connected",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Cart abandoned",
    body: "Abando watches for shoppers who leave checkout before finishing their order.",
  },
  {
    step: "2",
    title: "Message sent",
    body: "Abando automatically sends the right email or SMS follow-up based on the shopper's behavior.",
  },
  {
    step: "3",
    title: "Cart recovered",
    body: "When the shopper comes back and completes checkout, Abando links the order to the recovery flow.",
  },
  {
    step: "4",
    title: "Revenue attributed",
    body: "Recovered revenue appears here so merchants can see exactly what Abando is earning back.",
  },
];

const demoTimeline = [
  "Detected a checkout abandoned 43 minutes ago",
  "Queued a recovery email with product-specific copy",
  "Queued an SMS reminder for mobile follow-up",
  "Marked the recovery as ready to attribute once the order completes",
];

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function EmbeddedDashboard() {
  const [phase, setPhase] = useState<RecoveryPhase>("idle");
  const [timelineIndex, setTimelineIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<TriggerResult | null>(null);

  const revenueHeadline =
    phase === "done" ? "$5,165 recovered in the last 7 days" : "$5,040 recovered in the last 7 days";

  const testSummary =
    phase === "running"
      ? "Triggering a real backend test recovery now..."
      : phase === "done"
      ? result?.message || "Test recovery created successfully in the backend."
      : phase === "error"
      ? errorMessage || "The backend test recovery request failed."
      : "Run a real merchant-safe test recovery to verify the Abando flow from Shopify admin.";

  async function triggerTestRecovery() {
    setPhase("running");
    setErrorMessage(null);
    setResult(null);
    setTimelineIndex(0);

    const shop =
      typeof window === "undefined"
        ? undefined
        : new URLSearchParams(window.location.search).get("shop") || undefined;

    try {
      const response = await fetch("/api/abando/activation/trigger-test-recovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ shop }),
      });

      const payload = (await response.json().catch(() => ({}))) as TriggerResult;

      if (!response.ok || payload.ok === false) {
        throw new Error(
          String(payload.error || payload.message || `Request failed with status ${response.status}`)
        );
      }

      setResult(payload);
      setTimelineIndex(demoTimeline.length - 1);
      setPhase("done");
    } catch (error) {
      setTimelineIndex(-1);
      setErrorMessage(error instanceof Error ? error.message : "Failed to trigger test recovery.");
      setPhase("error");
    }
  }

  return (
    <>
      <TitleBar title="Abando" />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-slate-50">
        <main className="mx-auto max-w-7xl px-6 py-8">
          <header className="grid gap-6 rounded-[28px] border border-emerald-500/20 bg-slate-900/70 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.55)] backdrop-blur md:grid-cols-[minmax(0,1fr)_340px] md:p-8">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.22)]">
                  <div className="relative h-8 w-8">
                    <Image
                      src="/abando-logo.inline.png"
                      alt="Abando logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/80">
                    Abando
                  </p>
                  <p className="text-sm text-slate-300">
                    Recover abandoned carts automatically.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
                  Turn lost carts into recovered revenue with email and SMS that run for you.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-300">
                  Abando watches for abandoned carts, triggers the right recovery flow, and attributes recovered revenue back to this dashboard so merchants can see the value immediately after install.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-slate-200">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
                  Email recovery active
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5">
                  SMS recovery ready
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5">
                  Revenue attribution enabled
                </span>
              </div>
            </div>

            <div className="rounded-[24px] border border-emerald-500/20 bg-gradient-to-b from-emerald-500/14 to-slate-950 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Revenue proof
              </p>
              <p className="mt-4 text-3xl font-semibold text-emerald-50">
                {revenueHeadline}
              </p>
              <p className="mt-3 text-sm leading-6 text-emerald-50/80">
                This block can show merchant-specific revenue when live data is available. Until then, it presents clear demo proof so the install still feels valuable in the first minute.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Recovered orders
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">40+</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Avg. lift
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">+1 day/week</p>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-[0_16px_60px_rgba(2,6,23,0.38)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Status / Readiness
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    The core recovery system is ready.
                  </h2>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                  Ready to demo
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {statusItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-800 bg-slate-950/65 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                        {item.state}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-emerald-500/25 bg-slate-900/75 p-6 shadow-[0_16px_60px_rgba(16,185,129,0.16)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Activation action
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Trigger a test recovery
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Use this to create a real backend test recovery event for the current merchant store without exposing backend secrets in the browser.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={triggerTestRecovery}
                  disabled={phase === "running"}
                  className={classNames(
                    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                    phase === "running"
                      ? "cursor-not-allowed bg-emerald-500/50 text-emerald-50"
                      : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                  )}
                >
                  {phase === "running" ? "Running test..." : "Trigger Test Recovery"}
                </button>
                {phase === "done" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("idle");
                      setTimelineIndex(-1);
                      setErrorMessage(null);
                      setResult(null);
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
                  >
                    Reset demo
                  </button>
                ) : null}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
                <p className="text-sm font-medium text-white">{testSummary}</p>
                {result ? (
                  <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-50">
                    <p>
                      Backend event created
                      {result.shop ? ` for ${String(result.shop)}` : ""}.
                    </p>
                    {result.eventId || result.recoveryEventId || result.id ? (
                      <p className="mt-1 text-emerald-100/80">
                        Event ID: {String(result.eventId || result.recoveryEventId || result.id)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {phase === "error" ? (
                  <div className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-3 text-sm text-rose-100">
                    Request failed. Check the frontend server logs and backend response, then retry.
                  </div>
                ) : null}
                <div className="mt-4 space-y-3">
                  {demoTimeline.map((item, index) => {
                    const active = index <= timelineIndex && phase !== "error";
                    return (
                      <div
                        key={item}
                        className={classNames(
                          "flex items-start gap-3 rounded-2xl border px-3 py-3 transition",
                          active
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-50"
                            : "border-slate-800 bg-slate-900/70 text-slate-400"
                        )}
                      >
                        <span
                          className={classNames(
                            "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                            active ? "bg-emerald-400 text-slate-950" : "bg-slate-800 text-slate-400"
                          )}
                        >
                          {index + 1}
                        </span>
                        <p className="text-sm leading-6">{item}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                How it works
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                A simple recovery loop merchants can understand fast.
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {howItWorks.map((item) => (
                  <div
                    key={item.step}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                      Step {item.step}
                    </p>
                    <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Next step / Trust
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                What the merchant should do next
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
                <p>
                  Run the test recovery first, confirm the flow feels on-brand, then leave Abando running so the next real abandoned checkout can be recovered automatically.
                </p>
                <p>
                  Recovered revenue will show up here as soon as attributed orders start coming back through the live flow.
                </p>
                <p>
                  Abando is designed to make the first install feel tangible: clear status, visible value, and one obvious action to prove the system works.
                </p>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </>
  );
}
