"use client";
export default function Error({ error, reset }: { error: any; reset: () => void }) {
  console.error("Page error:", error);
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-slate-500 mb-4">We hit a snag rendering this page.</p>
      <button onClick={reset} className="px-3 py-2 rounded bg-slate-900 text-white">Try again</button>
    </div>
  );
}
