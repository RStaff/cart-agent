export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-slate-100">
      <h1 className="text-3xl font-bold mb-3">Start Free Trial</h1>
      <p className="mb-6">Kick off a trial. You’ll be redirected to checkout if successful.</p>
      <form action="/api/trial/start" method="POST">
        <button type="submit" className="wolf-btn-primary">Start Trial</button>
      </form>
      <p className="mt-8"><a href="/" className="underline">← Back to home</a></p>
    </main>
  );
}
