import test from "node:test";
import assert from "node:assert/strict";
import { buildResendPayload, getMailerClient } from "./mailer.js";

test("mailer initializes only after configuration is available", () => {
  const previous = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  assert.equal(getMailerClient(), null);
  process.env.RESEND_API_KEY = "test-only-not-a-real-key";
  assert.ok(getMailerClient());
  if (previous === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = previous;
});

test("Resend payload uses the installed SDK Reply-To option", () => {
  const payload = buildResendPayload({
    to: "visitor@example.test",
    from: "support@staffordmedia.ai",
    replyTo: "support@staffordmedia.ai",
    subject: "Subject",
    text: "Body",
  });
  assert.equal(payload.replyTo, "support@staffordmedia.ai");
  assert.equal(Object.hasOwn(payload, "reply_to"), false);
});
