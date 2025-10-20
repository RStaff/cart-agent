export const metadata = { title: "Privacy Policy – Abando" };
export default function Privacy() {
  return (
    <main className="container prose prose-slate max-w-3xl py-12">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toISOString().slice(0,10)}</p>
      <p>We collect the minimum data needed to run Abando, provide support, and improve the product.</p>
      <h2>Data We Process</h2>
      <ul>
        <li>Account/contact info you provide</li>
        <li>Operational data for abandoned-cart outreach</li>
        <li>Billing metadata via Stripe</li>
      </ul>
      <h2>Third Parties</h2>
      <p>We use trusted vendors (e.g., Stripe for payments, email providers) with appropriate safeguards.</p>
      <h2>Your Rights</h2>
      <p>Request access or deletion: <a href="mailto:privacy@abando.ai">privacy@abando.ai</a></p>
    </main>
  );
}
