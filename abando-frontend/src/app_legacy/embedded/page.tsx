"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TitleBar } from "@shopify/app-bridge-react";
import { buildRevenueRiskWidget } from "@/lib/revenueRisk";

type ScanResult = {
  scan_status: "completed" | "not_completed";
  store: string;
  checkout_url: string | null;
  top_issue: string | null;
  estimated_revenue_leak_yearly: number | null;
  confidence: string | null;
  recommendation: string | null;
  generated_at: string | null;
  sample_store: string | null;
};

type ScanState = "idle" | "loading" | "success" | "empty" | "error";

function formatCurrency(value: number | null) {
  if (typeof value !== "number") {
    return "Not available yet";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function EmbeddedAppShell() {
  const searchParams = useSearchParams();
  const merchantShop = searchParams.get("shop") || "";
  const [storeInput, setStoreInput] = useState(merchantShop);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState("");
  const [billingNote, setBillingNote] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);
  const autoRanRef = useRef(false);
  const revenueRisk = buildRevenueRiskWidget(scanResult);

  useEffect(() => {
    if (merchantShop) {
      setStoreInput(merchantShop);
    }
  }, [merchantShop]);

  async function runScan(options?: { sample?: boolean; store?: string }) {
    const targetStore = (options?.store ?? storeInput).trim();
    setScanState("loading");
    setScanError("");
    setBillingNote("");

    try {
      const response = await fetch("/api/embedded/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          store: targetStore,
          sample: Boolean(options?.sample),
        }),
      });

      const payload = (await response.json()) as ScanResult;
      setScanResult(payload);

      if (payload.scan_status === "completed") {
        setScanState("success");
        if (payload.store) {
          setStoreInput(payload.store);
        }
        return;
      }

      setScanState("empty");
    } catch (error) {
      setScanState("error");
      setScanError(error instanceof Error ? error.message : "Failed to run checkout scan.");
    }
  }

  useEffect(() => {
    if (!merchantShop || autoRanRef.current) {
      return;
    }

    autoRanRef.current = true;
    void runScan({ store: merchantShop });
  }, [merchantShop]);

  async function startPro() {
    const shop = merchantShop || storeInput.trim();
    if (!shop) {
      setBillingNote("A Shopify shop domain is required before starting Pro billing.");
      return;
    }

    setBillingLoading(true);
    setBillingNote("");

    try {
      const response = await fetch("/api/billing/createCharge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ shop }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        confirmationUrl?: string;
        error?: string;
      };

      if (!response.ok || !payload.confirmationUrl) {
        throw new Error(payload.error || "billing_create_failed");
      }

      window.location.assign(payload.confirmationUrl);
    } catch (error) {
      setBillingNote(
        error instanceof Error ? error.message : "Unable to start Shopify billing approval.",
      );
    } finally {
      setBillingLoading(false);
    }
  }

  return (
    <>
      <TitleBar title="Abando" />
      <main className="min-h-screen bg-[linear-gradient(180deg,_#f7f6f2_0%,_#f0ede3_100%)] text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_360px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Embedded checkout intelligence
                </p>
                <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                  Find checkout leaks before they cost you revenue
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                  Run a checkout scan, see likely friction, and fix your highest-impact issue.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void runScan()}
                    disabled={scanState === "loading"}
                    className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {scanState === "loading" ? "Running scan..." : "Run my checkout scan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void runScan({ sample: true })}
                    className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    View sample report
                  </button>
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <label className="text-sm font-medium text-slate-800" htmlFor="merchant-store">
                    Store domain
                  </label>
                  <input
                    id="merchant-store"
                    value={storeInput}
                    onChange={(event) => setStoreInput(event.target.value)}
                    placeholder="your-store.myshopify.com"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-500"
                  />
                  <p className="mt-2 text-sm text-slate-500">
                    {merchantShop
                      ? "We detected your Shopify shop and will use it automatically unless you change it."
                      : "Enter the storefront domain you want Abando to analyze."}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  What Abando checked
                </p>
                <div className="mt-5 grid gap-3">
                  {[
                    "Checkout friction signals visible before purchase",
                    "Likely revenue at risk from the top detected issue",
                    "Highest-impact first fix for the merchant team",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                      {item}
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-300">
                  Abando checks storefront signals and current benchmark outputs to surface a concrete issue, a leak estimate, and the next fix to prioritize.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Revenue at Risk Today
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {revenueRisk.hasData
                    ? formatCurrency(revenueRisk.revenueAtRiskToday)
                    : "No major revenue leak detected today"}
                </h2>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Monthly equivalent
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {revenueRisk.hasData ? formatCurrency(revenueRisk.monthlyEquivalent) : "Not available yet"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Revenue at risk today
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {revenueRisk.hasData ? formatCurrency(revenueRisk.revenueAtRiskToday) : "No major revenue leak detected today"}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Delta vs yesterday
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {revenueRisk.deltaVsYesterdayPercent}%
                </p>
                <p className="mt-1 text-xs text-slate-500">{revenueRisk.deltaLabel}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Top driver issue
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {revenueRisk.topDriverIssue}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Confidence
                </p>
                <p className="mt-2 text-lg font-semibold capitalize text-slate-950">
                  {revenueRisk.confidence}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Last checked {revenueRisk.lastCheckedAt}
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Scan results
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Checkout report</h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                  {scanState === "success"
                    ? "Ready"
                    : scanState === "loading"
                    ? "Scanning"
                    : scanState === "error"
                    ? "Needs attention"
                    : "Waiting"}
                </span>
              </div>

              {scanState === "loading" ? (
                <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-sm text-emerald-900">
                  Running checkout scan and looking for the latest verified result...
                </div>
              ) : null}

              {scanState === "error" ? (
                <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-5 text-sm text-rose-900">
                  {scanError || "The checkout scan request failed."}
                </div>
              ) : null}

              {scanState === "empty" ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
                  <p className="text-lg font-semibold text-slate-900">Scan not completed yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Abando did not find a completed scan result for this store yet. Run the scan again later or use the sample report to preview the result format.
                  </p>
                </div>
              ) : null}

              {scanResult && scanState === "success" ? (
                <div className="mt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Top detected issue
                      </p>
                      <p className="mt-3 text-lg font-semibold text-slate-950">
                        {scanResult.top_issue || "Not available yet"}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Estimated yearly revenue leak
                      </p>
                      <p className="mt-3 text-lg font-semibold text-slate-950">
                        {formatCurrency(scanResult.estimated_revenue_leak_yearly)}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Confidence
                      </p>
                      <p className="mt-3 text-lg font-semibold capitalize text-slate-950">
                        {scanResult.confidence || "Not available yet"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Recommended first fix
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {scanResult.recommendation || "Abando will show the first recommended fix once a scan completes."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span>Store: {scanResult.store || storeInput || "Not set"}</span>
                      <span>
                        Generated from scan at {scanResult.generated_at || "Not available yet"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Plans
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Choose your monitoring depth</h2>
                <div className="mt-5 grid gap-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-950">Free</h3>
                      <span className="text-sm font-semibold text-slate-600">$0</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      One checkout scan, summary results, and a first issue to fix.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-emerald-300 bg-emerald-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-950">Pro</h3>
                      <span className="text-sm font-semibold text-emerald-800">Continuous monitoring</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Continuous monitoring, prioritized fixes, and automated reports for the merchant team.
                    </p>
                    <button
                      type="button"
                      onClick={() => void startPro()}
                      disabled={billingLoading}
                      className="mt-4 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {billingLoading ? "Redirecting to Shopify billing..." : "Start Pro"}
                    </button>
                    <p className="mt-3 text-xs leading-5 text-slate-600">
                      Billing uses Shopify-managed approval and is structured so merchants can later upgrade or downgrade in-app without reinstalling.
                    </p>
                    {billingNote ? (
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        {billingNote}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Trust and proof
                </p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Detected issue</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {scanResult?.top_issue || "Abando highlights the highest-friction checkout issue found in the current scan."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Estimated revenue at risk</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {scanResult?.estimated_revenue_leak_yearly != null
                        ? `${formatCurrency(scanResult.estimated_revenue_leak_yearly)} yearly`
                        : "Abando estimates likely yearly revenue at risk once the scan completes."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Recommended first fix</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {scanResult?.recommendation || "Abando recommends the first fix that should unlock the highest impact."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
