"use client";
import { PlaygroundExplainer } from "@/components/Explainers";
import DevErrorBoundary from "@/components/DevErrorBoundary";
import PlaygroundClient from "./Client";

export default function DemoPlaygroundPage() {
  return (
    <DevErrorBoundary>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <PlaygroundExplainer />
        <h1 className="text-3xl font-semibold mb-4">Demo playground</h1>
        <p className="text-slate-400 mb-6">Type a product, pick a tone, and generate a cart-recovery snippet.</p>
        <PlaygroundClient />
      </main>
    </DevErrorBoundary>
  );
}
