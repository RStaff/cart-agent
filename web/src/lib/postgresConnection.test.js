import assert from "node:assert/strict";
import test from "node:test";
import { postgresConnectionOptions } from "./postgresConnection.js";

test("localhost remains available for disposable development databases", () => {
  assert.deepEqual(postgresConnectionOptions("postgresql://u:p@localhost:5432/app"), {
    connectionString: "postgresql://u:p@localhost:5432/app",
  });
});

test("Render internal endpoint requires encryption without claiming identity verification", () => {
  assert.deepEqual(postgresConnectionOptions("postgresql://u:p@dpg-example-a:5432/app").ssl, {
    rejectUnauthorized: false,
  });
});

test("external endpoint uses system trust and hostname verification", () => {
  const options = postgresConnectionOptions("postgresql://u:p@db.example.com:5432/app?sslmode=require");
  assert.deepEqual(options.ssl, { rejectUnauthorized: true, servername: "db.example.com" });
  assert.equal(new URL(options.connectionString).searchParams.has("sslmode"), false);
});

test("non-PostgreSQL URLs reject", () => {
  assert.throws(() => postgresConnectionOptions("https://example.com"), /DATABASE_URL_PROTOCOL_INVALID/);
});
