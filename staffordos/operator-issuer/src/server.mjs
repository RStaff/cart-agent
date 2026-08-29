import crypto from "node:crypto";
import http from "node:http";
import { URL } from "node:url";
import {
  CloudKmsJwtSigner,
  IssuerError,
  cleanString,
  completeOAuthCallback,
  configFromEnv,
  createLoginResponse,
  parseCookies,
  validateRuntimeConfig,
} from "./issuer.mjs";

const HANDOFF_GRANT_TTL_SECONDS = 60;

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

function createHandoffGrant(handoffGrants, result, now = new Date()) {
  const code = crypto.randomBytes(24).toString("base64url");
  const assertionExpiresAt = Number(result.payload.exp || 0) * 1000;
  const ttlExpiresAt = now.getTime() + HANDOFF_GRANT_TTL_SECONDS * 1000;
  const expiresAt = Math.min(assertionExpiresAt, ttlExpiresAt);
  handoffGrants.set(code, {
    jwt: result.jwt,
    header: result.header,
    payload: result.payload,
    expiresAt,
  });
  return { code, expiresAt };
}

function consumeHandoffGrant(handoffGrants, code, now = new Date()) {
  const cleanCode = cleanString(code);
  if (!cleanCode) throw new IssuerError("staffordos_handoff_code_missing", 400);
  const grant = handoffGrants.get(cleanCode);
  handoffGrants.delete(cleanCode);
  if (!grant) throw new IssuerError("staffordos_handoff_code_invalid", 401);
  if (!Number.isFinite(grant.expiresAt) || grant.expiresAt <= now.getTime()) {
    throw new IssuerError("staffordos_handoff_code_expired", 401);
  }
  return grant;
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
  validateRuntimeConfig(config);
  const handoffGrants = new Map();

  return http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    try {
      if (req.method === "GET" && url.pathname === "/health") {
        return jsonResponse(res, 200, { ok: true, service: "staffordos-operator-issuer" });
      }

      if (req.method === "GET" && url.pathname === "/login") {
        const login = createLoginResponse(config);
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
          assertLocalHandoffRequest(req);
          const handoff = createHandoffGrant(handoffGrants, result);
          const location = new URL(config.frontendHandoffUrl);
          location.searchParams.set("code", handoff.code);
          return redirectResponse(res, location.toString(), {
            "Set-Cookie": "staffordos_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
          });
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
        assertLocalHandoffRequest(req);
        const grant = consumeHandoffGrant(handoffGrants, url.searchParams.get("code"));
        return jsonResponse(res, 200, {
          ok: true,
          token_type: "StaffordOS-Operator-Assertion",
          assertion: grant.jwt,
          expires_at: grant.payload.exp,
          kid: grant.header.kid,
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
      const response = sanitizedError(error);
      return jsonResponse(res, response.status, response.body);
    }
  });
}
