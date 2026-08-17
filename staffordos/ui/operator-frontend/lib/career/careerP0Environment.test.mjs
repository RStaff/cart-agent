import assert from "node:assert/strict";
import test from "node:test";
import { validateCareerP0Environment } from "./careerP0Environment.mjs";
import { parseCareerText } from "./careerP0Intake.mjs";

test("production environment validation requires database, origin, pepper, and invite-only mode", () => {
  const status = validateCareerP0Environment({ env: { NODE_ENV: "production" } });
  assert.equal(status.valid, false);
  assert.deepEqual(status.missing, ["DATABASE_URL", "CAREEROS_APP_ORIGIN", "CAREEROS_SESSION_PEPPER", "CAREEROS_INVITE_ONLY=true"]);
});

test("complete invite-only production environment validates", () => {
  const status = validateCareerP0Environment({ env: { NODE_ENV: "production", DATABASE_URL: "postgresql://synthetic", CAREEROS_APP_ORIGIN: "https://career.example", CAREEROS_SESSION_PEPPER: "synthetic-secret", CAREEROS_INVITE_ONLY: "true" } });
  assert.equal(status.valid, true);
});

test("career text parser rejects oversized untrusted input", () => {
  assert.throws(() => parseCareerText({ sourceId: "source", sourceType: "RESUME_TEXT", text: "x".repeat(50_001) }), (error) => error?.code === "SOURCE_TEXT_TOO_LARGE");
});
