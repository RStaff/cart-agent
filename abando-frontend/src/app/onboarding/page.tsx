"use client";

import DevErrorBoundary from "@/components/DevErrorBoundary";
import OnboardingForm from "./OnboardingForm";

export default function OnboardingPage() {
  return (
    <DevErrorBoundary>
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Get started</h1>
        <p className="text-slate-500 mb-6">
          Tell us a few details to personalize your demo.
        </p>
        <OnboardingForm />
      </main>
    </DevErrorBoundary>
  );
}
