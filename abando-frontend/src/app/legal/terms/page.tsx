export const metadata = { title: "Terms of Service – Abando" };
export default function Terms() {
  return (
    <main className="container prose prose-slate max-w-3xl py-12 prose-invert prose-invert text-slate-200 prose-invert text-slate-200 pt-10 md:pt-12 first:mt-0 prose-headings:mt-0 prose-p:my-3 prose-li:my-1 prose-hr:my-6 prose-hr:border-slate-600">
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toISOString().slice(0,10)}</p>
      <p>Welcome to Abando. By using our site and services, you agree to these terms.</p>
      <h2>Use of Service</h2>
      <p>You’ll comply with applicable laws and use Abando for legitimate commerce.</p>
      <h2>Billing</h2>
      <p>Subscriptions and payments are handled via Stripe. Refunds follow our policy.</p>
      <h2>Contact</h2>
      <p>Questions? <a href="mailto:support@abando.ai">support@abando.ai</a></p>
    </main>
  );
}
