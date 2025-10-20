export const metadata = { title: "Data Processing Addendum (DPA) – Abando" };

export default function DPA() {
  return (
    <main className="container prose prose-slate max-w-3xl py-12 prose-invert">
      <h1>Data Processing Addendum (DPA)</h1>
      <p><em>Last updated: {new Date().toISOString().slice(0,10)}</em></p>
      <p>This DPA forms part of the Terms of Service ("Agreement") between the customer ("Controller")
      and Abando ("Processor"). Capitalized terms have the meanings in the Agreement or applicable
      data protection laws (e.g., GDPR/UK GDPR/CCPA/CPRA).</p>
      <h2>1. Subject Matter & Duration</h2>
      <p>Processor processes Personal Data solely to provide the Services under the Agreement for its term.</p>
      <h2>2. Nature & Purpose of Processing</h2>
      <p>Outreach automation for abandoned carts, enrichment, measurement, and related support ops.</p>
      <h2>3. Categories of Data & Data Subjects</h2>
      <ul>
        <li>End-customer contact info (name, email, phone if provided)</li>
        <li>Commerce context (cart items, order intent metadata)</li>
        <li>Support and usage metadata</li>
      </ul>
      <h2>4. Controller Instructions</h2>
      <p>Processor acts only on documented instructions; Controller provides lawful basis.</p>
      <h2>5. Subprocessors</h2>
      <p>Vetted providers (e.g., hosting, email, Stripe). Processor remains liable and keeps a current list on request.</p>
      <h2>6. Security</h2>
      <p>Appropriate technical and organizational measures (access control, encryption in transit, least privilege).</p>
      <h2>7. Data Subject Requests</h2>
      <p>Processor assists Controller to fulfill rights requests as required by law.</p>
      <h2>8. International Transfers</h2>
      <p>Where needed, parties rely on appropriate mechanisms (e.g., SCCs).</p>
      <h2>9. Incident Notifications</h2>
      <p>Processor notifies without undue delay after becoming aware of a Personal Data Breach.</p>
      <h2>10. Return & Deletion</h2>
      <p>On termination, delete or return data per Controller instructions unless law requires retention.</p>
      <h2>11. Audits</h2>
      <p>Reasonable cooperation to demonstrate compliance and with audits as required by law.</p>
      <hr />
      <p>Privacy/DPA inquiries: <a href="mailto:privacy@abando.ai">privacy@abando.ai</a></p>
    </main>
  );
}
