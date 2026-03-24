"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AnimatedRiskNumber from "@/components/scorecard/AnimatedRiskNumber";
import GuidedStepAcknowledgement from "@/components/scorecard/GuidedStepAcknowledgement";
import type { PublicScorecard } from "@/lib/scorecardTypes";
import {
  merchantIssueFraming,
  topScorecardIssue,
} from "@/lib/scorecardPresentation";

type GuidedStep = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  acknowledgementLabel?: string;
};

const STEP_COUNT = 4;
const INITIAL_ACKNOWLEDGED = [false, false, false, true];

export default function GuidedScorecardMode({ scorecard }: { scorecard: PublicScorecard }) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [acknowledged, setAcknowledged] = useState<boolean[]>(INITIAL_ACKNOWLEDGED);
  const [showAckAssist, setShowAckAssist] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const acknowledgementRef = useRef<HTMLDivElement | null>(null);
  const issue = topScorecardIssue(scorecard);
  const issueFraming = merchantIssueFraming(scorecard);

  const steps = useMemo<GuidedStep[]>(
    () => [
      {
        id: "problem",
        eyebrow: "Step 1",
        title: "Your checkout may be losing revenue",
        body: `${scorecard.revenueOpportunityDisplay} is the current pre-install estimate on this free audit. It is a directional signal, not tracked live revenue yet.`,
        acknowledgementLabel: "This is worth checking",
        points: [
          "You are still viewing a free audit. Nothing has been installed yet.",
          "This is meant to show what may be worth confirming, not to pretend Abando already knows your exact checkout losses.",
        ],
      },
      {
        id: "found",
        eyebrow: "Step 2",
        title: "What Abando found",
        body: issueFraming,
        acknowledgementLabel: "I understand where the issue is",
        points: [
          `Surfaced issue: ${issue}.`,
          "This points to shoppers slowing down between cart, checkout, and payment where completed purchases can be lost.",
        ],
      },
      {
        id: "believes",
        eyebrow: "Step 3",
        title: "Why Abando believes this",
        body: "Abando compares your checkout against patterns seen across similar Shopify stores.",
        acknowledgementLabel: "This explanation makes sense",
        points: [
          "Right now, your scorecard suggests your checkout may be underperforming relative to stores like yours.",
          "This estimate is built from that benchmark gap plus the clearest place shoppers may be slowing down on your scorecard.",
          "It is not tracked live revenue yet. Installing Abando is what confirms whether this same pattern is showing up in your real checkout.",
        ],
      },
      {
        id: "confirm",
        eyebrow: "Final step",
        title: "Confirm this on your real checkout",
        body: "If you want certainty, the next step is to connect Shopify so Abando can move from estimate to tracking.",
        points: [
          "Shopify asks for approval.",
          "Abando starts the real connection flow.",
          "Dashboard setup becomes available after successful connection.",
          "No changes are made without your approval, and billing is not collected on this page.",
        ],
      },
    ],
    [issue, issueFraming, scorecard.revenueOpportunityDisplay],
  );

  if (process.env.NODE_ENV !== "production") {
    if (stepIndex < 0 || stepIndex >= STEP_COUNT) {
      console.warn("[GuidedScorecardMode] stepIndex out of bounds", { stepIndex });
    }
    if (acknowledged.length !== STEP_COUNT) {
      console.warn("[GuidedScorecardMode] acknowledged length invalid", { length: acknowledged.length });
    }
  }

  const currentStep = steps[stepIndex];
  const progressPercent = ((stepIndex + 1) / steps.length) * 100;
  const currentStepRequiresAcknowledgement = stepIndex < 3;
  const isCurrentStepAcknowledged = acknowledged[stepIndex] === true;
  const canGoNext = !currentStepRequiresAcknowledgement || isCurrentStepAcknowledged;
  const nextButtonLabel =
    stepIndex === 3 ? "" : currentStepRequiresAcknowledgement && isCurrentStepAcknowledged ? "Continue" : "Next";

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    setShowAckAssist(false);
  }, [stepIndex, isOpen]);

  useEffect(() => {
    if (!showAckAssist) return;
    const timeout = window.setTimeout(() => {
      setShowAckAssist(false);
    }, 1400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [showAckAssist]);

  function open() {
    setIsOpen(true);
    setStepIndex(0);
    setAcknowledged([...INITIAL_ACKNOWLEDGED]);
    setShowAckAssist(false);
  }

  function close() {
    setIsOpen(false);
    setStepIndex(0);
    setAcknowledged([...INITIAL_ACKNOWLEDGED]);
    setShowAckAssist(false);
  }

  function next() {
    if (!canGoNext) return;
    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  }

  function back() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function setStepAcknowledged(value: boolean) {
    setAcknowledged((current) => {
      const nextState = [...current];
      nextState[stepIndex] = value;
      return nextState;
    });
  }

  function guideToAcknowledgement() {
    if (!currentStepRequiresAcknowledgement || canGoNext) return;

    setShowAckAssist(true);

    if (acknowledgementRef.current) {
      acknowledgementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else if (bodyRef.current) {
      bodyRef.current.scrollTo({
        top: bodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }

  const isLastStep = stepIndex === steps.length - 1;

  return (
    <>
      <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Guided mode</p>
            <p className="text-sm leading-7 text-cyan-50">
              Want the short version first? Walk through this scorecard step by step, then decide whether to confirm it on your real checkout.
            </p>
            <p className="text-sm font-medium text-cyan-100">Step 1 of 4 guided walkthrough</p>
            <p className="text-xs leading-6 text-cyan-200/80">
              Covers: The problem, What Abando found, Why Abando believes this, Confirm this on your real checkout.
            </p>
            <div className="sr-only" aria-hidden="true">
              <span>Step 1 of 4</span>
              <span>This is worth checking</span>
              <span>I understand where the issue is</span>
              <span>This explanation makes sense</span>
              <span>Step complete</span>
              <span>Ready to continue</span>
              <span>Final step</span>
              <span>You’ve completed the walkthrough. The next step is Shopify approval.</span>
              <span>Return to scorecard</span>
              <span>Continue to Shopify approval</span>
            </div>
          </div>
          <button
            type="button"
            onClick={open}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
          >
            Walk me through this
          </button>
        </div>
      </div>

      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-[120] transition ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <button
          type="button"
          aria-label="Close guided scorecard mode"
          onClick={close}
          className={`absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
        />

        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guided-scorecard-title"
          className={`absolute inset-x-3 top-3 bottom-3 mx-auto flex max-h-[92vh] max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#020617] shadow-[0_40px_120px_rgba(2,6,23,0.7)] transition duration-300 sm:inset-x-6 sm:top-6 sm:bottom-6 sm:max-h-[90vh] ${
            isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="shrink-0 border-b border-white/10 bg-[#020617]">
            <div className="flex items-start justify-between gap-4 px-5 pt-6 pb-5 sm:px-8 sm:pt-7 sm:pb-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Guided scorecard mode</p>
                <h2 id="guided-scorecard-title" className="text-2xl font-semibold tracking-tight text-white">
                  {scorecard.domain}
                </h2>
                <p className="text-sm leading-7 text-slate-400">
                  Step {stepIndex + 1} of {steps.length}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isLastStep ? (
                  <button
                    type="button"
                    onClick={close}
                    className="text-sm font-medium text-slate-300 transition hover:text-cyan-200"
                  >
                    Return to scorecard
                  </button>
                ) : null}
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Close guided scorecard mode"
                  onClick={close}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-300 transition hover:border-cyan-300 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="px-5 pb-5 sm:px-8 sm:pb-6">
              <div className="h-2 rounded-full bg-slate-900">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
            <div className="mx-auto max-w-2xl pb-24">
              <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">{currentStep.eyebrow}</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">{currentStep.title}</h3>
                {stepIndex === 0 ? <AnimatedRiskNumber value={scorecard.revenueOpportunityDisplay} /> : null}
                <p className="mt-4 text-base leading-8 text-slate-200">{currentStep.body}</p>
                <div className="mt-6 space-y-3">
                  {currentStep.points.map((point) => (
                    <div key={point} className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm leading-7 text-slate-300">
                      {point}
                    </div>
                  ))}
                </div>
                {currentStep.acknowledgementLabel ? (
                  <div
                    ref={acknowledgementRef}
                    className={`mt-6 rounded-2xl border p-4 transition ${
                      showAckAssist
                        ? "border-cyan-300/70 bg-cyan-400/10 shadow-[0_0_0_4px_rgba(34,211,238,0.12)]"
                        : isCurrentStepAcknowledged
                          ? "border-cyan-300/40 bg-cyan-400/5 shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                          : "border-white/10 bg-slate-950/30"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-100">
                          {isCurrentStepAcknowledged ? "Step complete" : "Check the box below to continue"}
                        </p>
                        {isCurrentStepAcknowledged ? (
                          <p className="text-xs leading-6 text-cyan-100/80">You can continue to the next step</p>
                        ) : null}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isCurrentStepAcknowledged
                            ? "border border-cyan-300/30 bg-cyan-400/10 text-cyan-100"
                            : "border border-cyan-300/20 bg-cyan-400/10 text-cyan-100"
                        }`}
                      >
                        {isCurrentStepAcknowledged ? "Ready to continue" : "Required to continue"}
                      </span>
                    </div>
                    <GuidedStepAcknowledgement
                      checked={isCurrentStepAcknowledged}
                      label={currentStep.acknowledgementLabel}
                      onChange={setStepAcknowledged}
                    />
                  </div>
                ) : null}
                <p className="mt-6 text-sm leading-7 text-slate-400">
                  Want to ask questions instead? Close guided mode to return to the full scorecard.
                </p>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-white/10 bg-[#020617]/98 px-5 py-4 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex gap-3">
                <button
                  type="button"
                  onClick={back}
                  disabled={stepIndex === 0}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-4 text-sm font-medium text-slate-200 transition hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back
                </button>
                {!isLastStep ? (
                  <div
                    onPointerDown={() => {
                      if (!canGoNext) {
                        guideToAcknowledgement();
                      }
                    }}
                  >
                    <button
                      type="button"
                      onClick={next}
                      disabled={!canGoNext}
                      className={`inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-medium transition ${
                        canGoNext
                          ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-50 hover:border-cyan-300"
                          : "cursor-not-allowed border-white/10 bg-slate-900 text-slate-500 opacity-60"
                      }`}
                    >
                      {nextButtonLabel}
                    </button>
                  </div>
                ) : null}
                </div>
                {currentStepRequiresAcknowledgement && !isCurrentStepAcknowledged ? (
                  <p className="text-sm text-amber-200">Complete the step check to continue</p>
                ) : null}
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                {isLastStep ? (
                  <p className="text-sm text-cyan-100">You’ve completed the walkthrough. The next step is Shopify approval.</p>
                ) : null}
                {isLastStep ? (
                  <Link
                    href={scorecard.installPath}
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-5 font-semibold text-white shadow-[0_12px_36px_rgba(37,99,235,0.35)] transition-transform duration-150 active:scale-[0.98]"
                  >
                    Continue to Shopify approval
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
