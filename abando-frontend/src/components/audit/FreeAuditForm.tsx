"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuditProgressState from "./AuditProgressState";

type StartResponse = {
  audit_id: string;
  status: "processing" | "complete";
};

type StatusResponse = {
  status: "processing" | "complete";
  redirect_to?: string;
};

function validateStoreDomain(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  const pattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9-]+)+$/i;
  return pattern.test(normalized);
}

export default function FreeAuditForm() {
  const router = useRouter();
  const [storeDomain, setStoreDomain] = useState("");
  const [emailOptional, setEmailOptional] = useState("");
  const [auditId, setAuditId] = useState("");
  const [submittedAt, setSubmittedAt] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => validateStoreDomain(storeDomain), [storeDomain]);

  useEffect(() => {
    if (!auditId || !submittedAt) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - submittedAt);
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [auditId, submittedAt]);

  useEffect(() => {
    if (!auditId) {
      return;
    }

    let active = true;
    const poll = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/audit/status?audit_id=${encodeURIComponent(auditId)}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as StatusResponse;

        if (!active) {
          return;
        }

        if (data.status === "complete" && Date.now() - submittedAt >= 2100) {
          window.clearInterval(poll);
          router.push(data.redirect_to || "/audit-result");
        }
      } catch {
        if (active) {
          setError("Audit status could not be checked right now.");
        }
      }
    }, 700);

    return () => {
      active = false;
      window.clearInterval(poll);
    };
  }, [auditId, router, submittedAt]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Enter a valid Shopify store domain.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/audit/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store_domain: storeDomain.trim().toLowerCase(),
          email_optional: emailOptional.trim(),
        }),
      });

      const data = (await response.json()) as StartResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Audit could not be started.");
      }

      setAuditId(data.audit_id);
      setSubmittedAt(Date.now());
      setElapsedMs(0);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Audit could not be started.");
      setIsSubmitting(false);
    }
  }

  if (auditId) {
    return <AuditProgressState elapsedMs={elapsedMs} />;
  }

  return (
    <section className="rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.94))] p-8 shadow-2xl shadow-black/30">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">Merchant Audit</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Free Checkout Audit</h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
        Identify hidden revenue leaks and benchmark your checkout performance.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="store_domain">
            Store domain
          </label>
          <input
            id="store_domain"
            name="store_domain"
            type="text"
            value={storeDomain}
            onChange={(event) => {
              setStoreDomain(event.target.value);
            }}
            placeholder="your-store.myshopify.com"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email_optional">
            Email (optional)
          </label>
          <input
            id="email_optional"
            name="email_optional"
            type="email"
            value={emailOptional}
            onChange={(event) => {
              setEmailOptional(event.target.value);
            }}
            placeholder="founder@your-store.com"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Run Free Audit
        </button>
      </form>
    </section>
  );
}
