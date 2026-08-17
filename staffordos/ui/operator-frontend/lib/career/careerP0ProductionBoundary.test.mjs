import assert from "node:assert/strict";
import test from "node:test";
import { createCareerP0PostgresStore } from "./careerP0Postgres.mjs";

test("production adapter fails closed without a database URL", () => {
  assert.throws(() => createCareerP0PostgresStore({ connectionString: "" }), /CAREEROS_DATABASE_URL_REQUIRED/);
});

test("production adapter can be constructed with an injected pool without opening a connection", () => {
  const pool = { query: async () => ({ rows: [], rowCount: 0 }), connect: async () => { throw new Error("not used"); } };
  const store = createCareerP0PostgresStore({ connectionString: "postgresql://synthetic.invalid/careeros", pool });
  assert.equal(typeof store.createAccount, "function");
  assert.equal(typeof store.deleteAccount, "function");
});
