import assert from "node:assert/strict";
import test from "node:test";

test("sendEmail passes a supplied single-use nonce as the Resend idempotency key", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.RESEND_API_KEY;
  const requests = [];
  process.env.RESEND_API_KEY = "re_test_no_network";
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify({ id: "resend_test_receipt" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const { sendEmail } = await import(`./mailer.js?test=${Date.now()}`);
    const result = await sendEmail({
      to: "owner@example.com",
      from: "support@staffordmedia.ai",
      subject: "Test subject",
      text: "Test body",
      idempotencyKey: "approval_nonce_exact",
    });
    assert.equal(result.id, "resend_test_receipt");
    assert.equal(requests.length, 1);
    assert.equal(new Headers(requests[0].init.headers).get("idempotency-key"), "approval_nonce_exact");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
  }
});
