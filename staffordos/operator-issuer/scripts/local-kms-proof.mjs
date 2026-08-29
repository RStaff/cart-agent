import {
  CloudKmsJwtSigner,
  buildAndSignStaffordosJwt,
  configFromEnv,
  sha256Hex,
  verifyStaffordosJwt,
} from "../src/issuer.mjs";

const config = {
  ...configFromEnv(),
  googleClientId: process.env.GOOGLE_CLIENT_ID || "local-proof-google-client",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "local-proof-unused",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || "http://127.0.0.1:8787/auth/google/callback",
  googleIssuer: process.env.GOOGLE_ISSUER || "https://accounts.google.com",
  googleAudience: process.env.GOOGLE_AUDIENCE || "local-proof-google-client",
  staffordosIssuer: process.env.STAFFORDOS_OPERATOR_JWT_ISSUER || "https://local.staffordos-operator.test",
  staffordosAudience: process.env.STAFFORDOS_OPERATOR_JWT_AUDIENCE || "staffordos.operator.local-proof",
  sessionSecret: process.env.ISSUER_SESSION_SECRET || "local-proof-session-secret-not-production",
  allowedSubjects: [process.env.LOCAL_PROOF_GOOGLE_SUB || "local-proof-google-subject"],
  allowedEmails: [process.env.LOCAL_PROOF_GOOGLE_EMAIL || "local-proof@example.test"],
  operatorRoles: ["viewer"],
  operatorPermissions: ["shopifixer.audit.read", "shopifixer.scope.read", "shopifixer.approval.read", "shopifixer.packet.read"],
  kmsUseGcloudAuth: true,
};

const signer = new CloudKmsJwtSigner(config);
const now = new Date("2026-07-30T00:00:00.000Z");
const googleClaims = {
  iss: config.googleIssuer,
  aud: config.googleAudience,
  sub: config.allowedSubjects[0],
  email: config.allowedEmails[0],
  email_verified: true,
  name: "Local Proof Operator",
  iat: Math.floor(now.getTime() / 1000),
  exp: Math.floor(now.getTime() / 1000) + 300,
  nonce: "local-proof-nonce",
};

const result = await buildAndSignStaffordosJwt(googleClaims, config, signer, now);
const publicKeyPem = await signer.publicKeyPem();
const payload = verifyStaffordosJwt(result.jwt, publicKeyPem, config, now);

process.stdout.write(
  `${JSON.stringify(
    {
      ok: true,
      jwtCreated: true,
      jwtPrinted: false,
      kid: result.header.kid,
      kmsVersion: signer.versionName,
      signatureSha256: result.signatureSha256,
      publicKeyFingerprintSha256: sha256Hex(publicKeyPem),
      payloadSubject: payload.sub,
      payloadIssuer: payload.iss,
      payloadAudience: payload.aud,
      expiresAt: payload.exp,
    },
    null,
    2,
  )}\n`,
);
