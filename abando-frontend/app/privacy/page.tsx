export const metadata = { title: "Privacy Policy — Abando" };

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px", lineHeight: 1.6 }}>
      <h1>Privacy Policy</h1>
      <p><strong>Effective date:</strong> March 1, 2026</p>

      <p>
        Abando (“we”, “us”) provides a Shopify app that helps merchants recover checkouts.
        This Privacy Policy describes what information we collect and how we use it.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Shop information (e.g., shop domain) required to provide the service.</li>
        <li>App usage and diagnostic data to operate and improve the app.</li>
        <li>Store data you authorize via Shopify scopes (e.g., products) as needed for features.</li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>To provide and operate the app.</li>
        <li>To maintain security, prevent abuse, and troubleshoot issues.</li>
        <li>To improve product performance and user experience.</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We do not sell personal information. We may share information with service providers
        that help us operate the app (hosting, analytics), and as required by law.
      </p>

      <h2>Data retention</h2>
      <p>
        We retain data only as long as needed to provide the service and meet legal obligations.
      </p>

      <h2>Contact</h2>
      <p>
        Email: support@abando.ai
      </p>
    </main>
  );
}
