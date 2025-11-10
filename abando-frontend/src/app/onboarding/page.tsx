export const dynamic = "force-static";
export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-slate-100">
      <h1 className="text-3xl font-bold mb-4">Onboarding</h1>
      <p className="mb-4">Kick off your trial and connect your store. No credit card required for the demo.</p>
      <ol className="list-decimal pl-5 space-y-2 text-slate-300">
        <li>Start your trial.</li>
        <li>Connect your platform or paste a product URL to see instant copy.</li>
        <li>Preview guided checkout responses and recovery playbooks.</li>
      </ol>
      <div className="mt-6">
        <form action="/api/trial/start" method="POST">
          <button type="submit" className="wolf-btn-primary">Start Free Trial</button>
        </form>
      </div>
    </main>
  );
}
