import assert from "node:assert/strict";
import { isLoopbackPostgresHostname, normalizePostgresHostname, postgresSslForConnection } from "./careerosConnection.mjs";

assert.equal(normalizePostgresHostname("[::1]"), "::1");
assert.equal(isLoopbackPostgresHostname("[::1]"), true);
assert.equal(isLoopbackPostgresHostname("127.0.0.1"), true);
assert.equal(isLoopbackPostgresHostname("2001:db8::1"), false);
assert.equal(postgresSslForConnection("postgresql://[::1]:5432/postgres"), false);
assert.deepEqual(postgresSslForConnection("postgresql://db.example/postgres"), { rejectUnauthorized: false });
console.log("CareerOS connection classification tests passed");
