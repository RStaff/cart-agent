"use client";

import DevErrorBoundary from "@/components/DevErrorBoundary";
import PlaygroundClient from "./Client";

export default function DemoPlaygroundPage() {
  return (
    <DevErrorBoundary>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <PlaygroundClient />
      </main>
    </DevErrorBoundary>
  );
}
