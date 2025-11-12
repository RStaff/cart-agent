"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-slate-200">
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="mb-6 opacity-80">{error?.message ?? "Unexpected error."}</p>
      <button onClick={reset} className="rounded-md px-4 py-2 bg-indigo-600 text-white">Try again</button>
    </main>
  );
}
