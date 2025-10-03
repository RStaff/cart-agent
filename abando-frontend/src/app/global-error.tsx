"use client";
export default function GlobalError({ error, reset }: { error: any; reset: () => void }) {
  console.error("Global error:", error);
  return (
    <html>
      <body className="p-6">
        <h1 className="text-2xl font-semibold mb-2">App crashed</h1>
        <p className="text-slate-500 mb-4">We’re sorry — the app hit an unexpected error.</p>
        <button onClick={reset} className="px-3 py-2 rounded bg-slate-900 text-white">Reload</button>
      </body>
    </html>
  );
}
