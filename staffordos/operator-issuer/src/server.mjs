import crypto from "node:crypto";
import http from "node:http";
import { URL } from "node:url";
import {
  CloudKmsJwtSigner,
  IssuerError,
  cleanString,
  completeOAuthCallback,
  browserBindingChallenge,
  browserBindingMatches,
  configFromEnv,
  createLoginResponse,
  isCanonicalHandoffSharedSecret,
  parseCookies,
  validateRuntimeConfig,
} from "./issuer.mjs";
import { HandoffStoreError, createPostgresHandoffStore } from "./handoffStore.mjs";

const HANDOFF_GRANT_TTL_SECONDS = 60;
export const HANDOFF_CLEANUP_MIN_INTERVAL_MS = 10_000;
export const HANDOFF_CLEANUP_BATCH_SIZE = 100;

function jsonResponse(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
    ...headers,
  });
  res.end(payload);
}

function sanitizedError(error) {
  if (error instanceof IssuerError) {
    return { status: error.status, body: { ok: false, error: error.code } };
  }
  return { status: 500, body: { ok: false, error: "operator_issuer_internal_error" } };
}

function isLoopbackRemoteAddress(remoteAddress = "") {
  return ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(cleanString(remoteAddress));
}

function assertLocalHandoffRequest(req) {
  if (!isLoopbackRemoteAddress(req.socket?.remoteAddress || "")) {
    throw new IssuerError("staffordos_handoff_not_local", 403);
  }
}

function assertAuthenticatedHandoffRequest(req, config) {
  const provided = req.headers?.["x-staffordos-handoff-secret"];
  const expected = config.handoffSharedSecret;
  if (!isCanonicalHandoffSharedSecret(provided) || !isCanonicalHandoffSharedSecret(expected)) {
    throw new IssuerError("staffordos_handoff_unauthorized", 401);
  }
  const providedDigest = crypto.createHash("sha256").update(provided).digest();
  const expectedDigest = crypto.createHash("sha256").update(expected).digest();
  if (!crypto.timingSafeEqual(providedDigest, expectedDigest)) {
    throw new IssuerError("staffordos_handoff_unauthorized", 401);
  }
}

function assertHandoffTransport(req, config) {
  if (new URL(config.frontendHandoffUrl).protocol === "http:") assertLocalHandoffRequest(req);
}

function createHandoffGrant(result, now = new Date()) {
  const code = crypto.randomBytes(24).toString("base64url");
  const assertionExpiresAt = Number(result.payload.exp || 0) * 1000;
  const ttlExpiresAt = now.getTime() + HANDOFF_GRANT_TTL_SECONDS * 1000;
  const expiresAt = Math.min(assertionExpiresAt, ttlExpiresAt);
  return {
    code,
    jwt: result.jwt,
    header: result.header,
    payload: result.payload,
    createdAt: now.toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    returnTo: result.returnTo || "",
    browserChallenge: result.browserChallenge || "",
  };
}

function redirectResponse(res, location, headers = {}) {
  res.writeHead(302, {
    Location: location,
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end();
}

export function createIssuerServer({ config = configFromEnv(), signer = new CloudKmsJwtSigner(config), deps = {} } = {}) {
  validateRuntimeConfig(config, { handoffStoreProvided: Boolean(deps.handoffStore) });
  const handoffStore = deps.handoffStore || (config.frontendHandoffUrl ? createPostgresHandoffStore(config) : null);
  let lastCleanupAt = 0;
  const clock = deps.clock || (() => Date.now());

  async function maybeCleanup(now = clock()) {
    if (!handoffStore?.cleanupExpired || now - lastCleanupAt < HANDOFF_CLEANUP_MIN_INTERVAL_MS) return;
    lastCleanupAt = now;
    try {
      await handoffStore.cleanupExpired(HANDOFF_CLEANUP_BATCH_SIZE, new Date(now));
    } catch {
      // Cleanup is opportunistic; redemption correctness does not depend on it.
    }
  }

  return http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    try {
      if (req.method === "GET" && url.pathname === "/health") {
        return jsonResponse(res, 200, { ok: true, service: "staffordos-operator-issuer" });
      }

      if (req.method === "GET" && url.pathname === "/login") {
        const login = createLoginResponse(config, new Date(), url.searchParams.get("returnTo"), url.searchParams.get("browserChallenge") || config.browserChallenge || "");
        res.writeHead(login.status, login.headers);
        return res.end();
      }

      if (req.method === "GET" && url.pathname === "/auth/google/callback") {
        const cookies = parseCookies(req.headers.cookie || "");
        const result = await completeOAuthCallback({
          code: url.searchParams.get("code"),
          state: url.searchParams.get("state"),
          stateCookie: cookies.staffordos_oauth_state,
          config,
          signer,
          deps,
        });
        if (config.frontendHandoffUrl) {
          assertHandoffTransport(req, config);
          const handoff = await handoffStore.create(createHandoffGrant(result, new Date(clock())));
          void maybeCleanup();
          const location = new URL(config.frontendHandoffUrl);
          location.searchParams.set("code", handoff.code);
          return redirectResponse(res, location.toString(), {
            "Set-Cookie": "staffordos_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
          });
        }
        if (!config.nonInteractiveAssertionMode) {
          throw new IssuerError("frontend_handoff_required", 500);
        }
        return jsonResponse(res, 200, {
          ok: true,
          token_type: "StaffordOS-Operator-Assertion",
          assertion: result.jwt,
          expires_at: result.payload.exp,
          kid: result.header.kid,
        }, {
          "Set-Cookie": "staffordos_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
        });
      }

      if (req.method === "GET" && url.pathname === "/auth/staffordos/handoff") {
        assertHandoffTransport(req, config);
        assertAuthenticatedHandoffRequest(req, config);
        const code = cleanString(url.searchParams.get("code"));
        if (!code) throw new IssuerError("staffordos_handoff_code_missing", 400);
        const grant = await handoffStore.consume(code, req.headers?.["x-staffordos-browser-verifier"] || "");
        return jsonResponse(res, 200, {
          ok: true,
          token_type: "StaffordOS-Operator-Assertion",
          assertion: grant.jwt,
          expires_at: grant.payload.exp,
          kid: grant.header.kid,
          return_to: grant.returnTo,
        });
      }

      if (req.method === "GET" && url.pathname === "/public-key") {
        const pem = await signer.publicKeyPem();
        return jsonResponse(res, 200, {
          ok: true,
          kid: cleanString(signer.kid),
          algorithm: "EC_SIGN_ED25519",
          alg: "EdDSA",
          public_key_pem: pem,
        });
      }

      return jsonResponse(res, 404, { ok: false, error: "not_found" });
    } catch (error) {
      if (error instanceof HandoffStoreError) error = new IssuerError(error.code, error.status);
      const response = sanitizedError(error);
      return jsonResponse(res, response.status, response.body);
    }
  });
}
