import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";

const port = 33211;
const base = `http://127.0.0.1:${port}`;

function startServer() {
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      NODE_ENV: "development",
      PORT: String(port),
      STAFFORDOS_LOCAL_OPERATOR_BIND_HOST: "127.0.0.1",
      STAFFORDOS_LOCAL_OPERATOR_WRITES_ENABLED: "true",
      STAFFORDOS_OPERATOR_JWT_ISSUER: "https://issuer.test",
      STAFFORDOS_OPERATOR_JWT_AUDIENCE: "audience.test",
      STAFFORDOS_OPERATOR_ALLOWED_SUBJECTS: "subject.test",
      STAFFORDOS_OPERATOR_FRONTEND_SESSION_SECRET: "local-integration-session-secret",
      STAFFORDOS_OPERATOR_FRONTEND_ORIGIN: base,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`custom server did not start: ${output}`)), 30_000);
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      if (output.includes(`http://127.0.0.1:${port}`)) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code !== null && !output.includes(`http://127.0.0.1:${port}`)) reject(new Error(`custom server exited ${code}: ${output}`));
    });
  });
  return { child, ready };
}

test("actual Next command route accepts governed transport before session authorization", async () => {
  const { child, ready } = startServer();
  try {
    await ready;
    const response = await fetch(`${base}/api/operator/blueprints/synthetic/commands`, {
      method: "POST",
      headers: { Host: `127.0.0.1:${port}`, Origin: base, "content-type": "application/json" },
      body: JSON.stringify({ expectedVersion: 0, command: "DECIDE_IDENTITY", data: {} }),
    });
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.error, "OPERATOR_SESSION_MISSING");

    const spoofed = await fetch(`${base}/api/operator/blueprints/synthetic/commands`, {
      method: "POST",
      headers: { Host: `127.0.0.1:${port}`, Origin: base, "x-forwarded-for": "127.0.0.1", "content-type": "application/json" },
      body: JSON.stringify({ expectedVersion: 0, command: "DECIDE_IDENTITY", data: {} }),
    });
    const spoofedBody = await spoofed.json();
    assert.equal(spoofed.status, 400);
    assert.equal(spoofedBody.error, "INCOMING_FORWARDING_HEADERS_REJECTED");
  } finally {
    child.kill("SIGTERM");
  }
});
