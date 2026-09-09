import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { test } from "node:test";
import {
  CANDIDATE_VERSION, CERTIFICATE_SCHEMA, CERTIFICATE_VERSION, DATABASE_POLICY, DEFAULT_MAX_CERTIFICATE_AGE_MS, DEFAULT_CERTIFICATE_CLOCK_SKEW_MS,
  DeploymentAuthorityError, EVIDENCE_MAX_AGE_MS, MAX_CERTIFICATE_AGE_LIMIT_MS, REQUIRED_TREE_MODE, STATUS,
  assertNoDownstreamOverrides, assertPass, attestCertificate, canonicalize, computeCertificateDigest, createCandidateText, createEd25519Signer, createTrustedKeys,
  normalizeForgeHost, parseCandidate, parseJsonText, repositoryIdentityFromRemoteUrl, toPlainData, verifyCertificate,
} from "./deployment_authority_certificate_v1.mjs";
import * as Module from "./deployment_authority_certificate_v1.mjs";
import { renderReport, reportPayload } from "./render_deployment_authority_certificate_v1.mjs";

// ---------------------------------------------------------------------------
// Fixtures. Instance data lives only here; the module and schema are generic.
// All keys are ephemeral in-memory Ed25519 pairs. No private key material is printed or written.
// ---------------------------------------------------------------------------

const COMMIT = "38e9bd60b0a0114c650743d284f386f6d2d04ae7";
const TREE = "0123456789012345678901234567890123456789";
const ROOT_TREES = ["1111111111111111111111111111111111111111", "2222222222222222222222222222222222222222", "3333333333333333333333333333333333333333"];
const OTHER_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const NOW_MS = Date.parse("2026-09-08T12:00:00.000Z");
const OBSERVED = "2026-09-08T11:59:30.000Z";
const clock = () => NOW_MS;

const gateKeys = crypto.generateKeyPairSync("ed25519");
const secondGateKeys = crypto.generateKeyPairSync("ed25519");
const attackerKeys = crypto.generateKeyPairSync("ed25519");
const GATE_KEY_ID = "gate-key-2026-09";
const SECOND_KEY_ID = "gate-key-2026-10";
const trustedKeys = createTrustedKeys({ [GATE_KEY_ID]: gateKeys.publicKey, [SECOND_KEY_ID]: secondGateKeys.publicKey.export({ type: "spki", format: "pem" }) });
const signer = createEd25519Signer({ privateKey: gateKeys.privateKey, keyId: GATE_KEY_ID });
const attackerSigner = createEd25519Signer({ privateKey: attackerKeys.privateKey, keyId: "attacker-key" });
const attackerAsGate = createEd25519Signer({ privateKey: attackerKeys.privateKey, keyId: GATE_KEY_ID });
const AUDIENCE = "deploy-gate.production";
const FREE_AUDIENCE = "acme-release-gate:eu";
const policy = (overrides = {}) => ({ trustedKeys, clock, expectedAudience: AUDIENCE, ...overrides });
const freePolicy = (overrides = {}) => policy({ expectedAudience: FREE_AUDIENCE, ...overrides });

const FORGE = "github.com";
const repoIdentity = { forgeHost: FORGE, owner: "RStaff", name: "cart-agent" };
const roots = [
  { role: "issuer", path: "staffordos/operator-issuer", treeObjectSha: ROOT_TREES[0] },
  { role: "frontend", path: "staffordos/ui/operator-frontend", treeObjectSha: ROOT_TREES[1] },
  { role: "nested_careeros", path: "staffordos/ui/operator-frontend/careeros-beta", treeObjectSha: ROOT_TREES[2] },
];
const service = { id: "srv-da16c39t0dsc73b434ig", type: "web_service", repository: repoIdentity, branch: "careeros/private-beta", rootDirectory: "staffordos/ui/operator-frontend/careeros-beta", region: "oregon" };
const database = { id: "dpg-da16b20u01pc739ir9gg-a", region: "oregon" };
const input = {
  audience: AUDIENCE,
  repository: { ...repoIdentity, remoteName: "origin" },
  branch: { shortName: "careeros/private-beta" },
  commit: { sha: COMMIT, treeSha: TREE },
  roots,
  provider: { name: "render", accountId: "tea-staffordos", databasePolicy: DATABASE_POLICY.REQUIRED, services: [service], databases: [database] },
};

const candidateText = () => createCandidateText(input);
const candidateObject = () => JSON.parse(candidateText());

function gitEvidence(overrides = {}) {
  return {
    observedAtUtc: OBSERVED,
    repository: repoIdentity,
    remoteName: "origin",
    ref: { fullRef: "refs/heads/careeros/private-beta", sha: COMMIT },
    commit: { sha: COMMIT, treeSha: TREE },
    roots: roots.map((root) => ({ path: root.path, mode: REQUIRED_TREE_MODE, type: "tree", objectSha: root.treeObjectSha })),
    ...overrides,
  };
}

function providerEvidence(overrides = {}) {
  return {
    observedAtUtc: OBSERVED,
    name: "render",
    accountId: "tea-staffordos",
    services: [{ requestedId: service.id, ...service }],
    databases: [{ requestedId: database.id, ...database }],
    ...overrides,
  };
}

function attest({ git = gitEvidence(), provider = providerEvidence(), text = candidateText(), sign = signer, keys = trustedKeys, now = clock, audience = AUDIENCE, ...rest } = {}) {
  return attestCertificate({ candidateText: text, collectGitEvidence: async () => git, collectProviderEvidence: async () => provider, signer: sign, trustedKeys: keys, expectedAudience: audience, clock: now, ...rest });
}

// Database-free instance on a different forge and provider.
const FREE_FORGE = "git.example.org";
const freeRepo = { forgeHost: FREE_FORGE, owner: "acme", name: "widgets" };
const freeInput = {
  audience: FREE_AUDIENCE,
  repository: { ...freeRepo, remoteName: "upstream" },
  branch: { shortName: "release/2026.09" },
  commit: { sha: OTHER_SHA, treeSha: ROOT_TREES[0] },
  roots: [{ role: "api", path: "services/api", treeObjectSha: TREE }, { role: "web", path: "apps/web", treeObjectSha: COMMIT }],
  provider: {
    name: "fly", accountId: "org_123", databasePolicy: DATABASE_POLICY.NONE,
    services: [
      { id: "app-api", type: "machine", repository: freeRepo, branch: "release/2026.09", rootDirectory: "services/api", region: "iad" },
      { id: "app-web", type: "machine", repository: freeRepo, branch: "release/2026.09", rootDirectory: "apps/web", region: "iad" },
    ],
    databases: [],
  },
};
const freeGit = () => ({ observedAtUtc: OBSERVED, repository: freeRepo, remoteName: "upstream", ref: { fullRef: "refs/heads/release/2026.09", sha: OTHER_SHA }, commit: { sha: OTHER_SHA, treeSha: ROOT_TREES[0] }, roots: [{ path: "services/api", mode: REQUIRED_TREE_MODE, type: "tree", objectSha: TREE }, { path: "apps/web", mode: REQUIRED_TREE_MODE, type: "tree", objectSha: COMMIT }] });
const freeProvider = (overrides = {}) => ({ observedAtUtc: OBSERVED, name: "fly", accountId: "org_123", services: freeInput.provider.services.map((s) => ({ requestedId: s.id, ...s })), databases: [], ...overrides });
const attestFree = (overrides = {}) => attest({ text: createCandidateText(freeInput), git: freeGit(), provider: freeProvider(), audience: FREE_AUDIENCE, ...overrides });

// Credential-shaped synthetic strings are assembled at runtime from harmless fragments so that no
// committed source line contains a complete token shape. They exercise the runtime rejection of
// credential-shaped values without placing a scanner-matching literal in the repository.
const shaped = (...fragments) => fragments.join("");
const GH_PREFIX = shaped("gh", "p_");
const GL_PREFIX = shaped("gl", "pat", "-");
const SIGNATURE_VALUE_BYTES = 64;
const SIGNATURE_VALUE_BASE64URL_LENGTH = 86;
const CREDENTIAL_PREFIXES = Object.freeze([
  GH_PREFIX,
  shaped("github", "_pat", "_"),
  GL_PREFIX,
  shaped("xox", "b", "-"),
  shaped("sk", "_live", "_"),
  shaped("AKIA", "IOSFODNN7", "EXAMPLE"),
  shaped("rnd", "_"),
  shaped("AI", "za"),
  shaped("ey", "J", "hbGciOiJIUzI1NiJ9"),
]);

function credentialShapedString(prefix) {
  return shaped(prefix, "abcdefghijklmnopqrstuvwxyz", "0123456789");
}

function credentialShapedSignatureValue(prefix) {
  const value = shaped(prefix, "A".repeat(SIGNATURE_VALUE_BASE64URL_LENGTH - prefix.length));
  const bytes = Buffer.from(value, "base64url");
  assert.equal(bytes.length, SIGNATURE_VALUE_BYTES);
  assert.equal(bytes.toString("base64url"), value);
  return value;
}

const rejects = (fn, code) => assert.rejects(fn, (error) => (error instanceof DeploymentAuthorityError && error.code === code) || assert.fail(`expected ${code}, got ${error.message}`));
const throwsCode = (fn, code) => assert.throws(fn, (error) => (error instanceof DeploymentAuthorityError && error.code === code) || assert.fail(`expected ${code}, got ${error.message}`));
// Re-sign a tampered certificate with an arbitrary in-memory signer (models attacker capabilities).
// The test signers are synchronous, so this helper is synchronous as well.
function resign(certificateObject, withSigner) {
  const { signature: _drop, ...unsigned } = certificateObject;
  unsigned.certificatePayloadSha256 = computeCertificateDigest(unsigned);
  const raw = withSigner.sign(Buffer.from(canonicalize(unsigned), "utf8"));
  return JSON.stringify({ ...unsigned, signature: { algorithm: "Ed25519", keyId: withSigner.keyId, value: Buffer.from(raw).toString("base64url") } });
}

// ---------------------------------------------------------------------------
// Generic policy and schema
// ---------------------------------------------------------------------------

test("module and schema carry no mission-specific instance data", () => {
  const sources = ["deployment_authority_certificate_v1.mjs", "deployment_authority_certificate_v1.schema.json", "render_deployment_authority_certificate_v1.mjs"]
    .map((name) => fs.readFileSync(new URL(`./${name}`, import.meta.url), "utf8")).join("\n");
  for (const literal of ["careeros", "careos", "RStaff", "cart-agent", "operator-issuer", "operator-frontend", "\"render\"", "'render'", "srv-", "dpg-", "oregon", "tea-", "github\\.com", "gitlab\\.com", "example\\.org", "deploy-gate", "release-gate", COMMIT.slice(0, 12), "38e9bd60"]) {
    assert.doesNotMatch(sources, new RegExp(literal, "i"), `generic sources must not embed ${literal}`);
  }
  assert.doesNotMatch(sources, /CERTIFIED_/);
});

test("public API exposes no unauthenticated certificate parser or raw evidence evaluator", () => {
  const exported = Object.keys(Module);
  for (const forbidden of ["parseCertificate", "evaluateEvidence", "validateCertificateShape", "makeCertificate", "validateGitAuthority", "validateProviderBindings"]) {
    assert.ok(!exported.includes(forbidden), `${forbidden} must not be exported`);
  }
  assert.deepEqual(exported.filter((name) => /^[a-z]/.test(name)).sort(), [
    "assertNoDownstreamOverrides", "assertPass", "attestCertificate", "canonicalize", "computeCandidateDigest", "computeCertificateDigest", "createCandidateText",
    "createEd25519Signer", "createTrustedKeys", "normalizeForgeHost", "parseCandidate", "parseJsonText", "repositoryIdentityFromRemoteUrl", "toPlainData", "verifyCertificate",
  ]);
  assert.ok(!exported.includes("validateAgainstSchema"), "schema validation helper must be internal");
});

test("schema is closed, bounded, and every object requires all of its properties", () => {
  const defs = CERTIFICATE_SCHEMA.$defs;
  for (const [name, def] of Object.entries(defs)) {
    if (def.type === "object") {
      assert.equal(def.additionalProperties, false, name);
      assert.deepEqual([...def.required].sort(), Object.keys(def.properties).sort(), name);
    }
    if (def.type === "string" && def.const === undefined && def.enum === undefined) {
      assert.match(def.pattern, /^\^.*\$$/, name);
      assert.equal(typeof def.maxLength, "number", name);
    }
    if (def.type === "array") assert.equal(typeof def.maxItems, "number", name);
  }
  assert.deepEqual(defs.signature.required, ["algorithm", "keyId", "value"]);
  assert.deepEqual(defs.signatureAlgorithm.enum, ["Ed25519"]);
  assert.deepEqual(defs.databasePolicy.enum, ["required", "none"]);
  assert.equal(defs.provider.properties.databases.minItems, 0);
  assert.equal(defs.providerEvidence.properties.databases.minItems, 0);
  assert.ok(Object.isFrozen(CERTIFICATE_SCHEMA) && Object.isFrozen(defs.certificate.properties));
  assert.ok(defs.candidate.required.includes("audience"));
  assert.match(defs.audience.pattern, /^\^.*\$$/);
});

// ---------------------------------------------------------------------------
// Strict input handling (preserved)
// ---------------------------------------------------------------------------

test("strict JSON parser rejects duplicates, trailing tokens, malformed text, and unsafe values", () => {
  const cases = [
    ['{"a":1,"a":2}', "json_duplicate_key"], ['{"a":{"b":1,"b":2}}', "json_duplicate_key"], ['{"a":1} x', "json_trailing_tokens"], ['{"a":1}}', "json_trailing_tokens"], ["{", "json_unexpected_end"],
    ['{"a":}', "json_malformed"], ["[1,]", "json_malformed"], ['{"a":1,}', "json_malformed"], ["01", "json_malformed_number"], ["1.", "json_malformed_number"],
    ["1e999", "number_not_finite"], ["-0", "number_negative_zero"], ["-0.0", "number_negative_zero"], ["9007199254740993", "number_unsafe_integer"],
    ['{"__proto__":{}}', "json_forbidden_key"], ['{"a":[{"__proto__":{}}]}', "json_forbidden_key"], ['{"constructor":{}}', "json_forbidden_key"], ['{"prototype":1}', "json_forbidden_key"],
    ['"\\ud800"', "json_lone_surrogate"], ['"\t"', "json_control_character"], ['"\\x"', "json_bad_escape"], ['"\\u12"', "json_bad_unicode_escape"],
    ["﻿{}", "json_malformed"], ["NaN", "json_malformed"], ["undefined", "json_malformed"], ["tru", "json_malformed"], ["", "json_unexpected_end"],
    [`${"[".repeat(40)}${"]".repeat(40)}`, "json_depth_exceeded"], [`"${"a".repeat(1024 * 1024)}"`, "json_text_too_large"],
  ];
  for (const [text, code] of cases) throwsCode(() => parseJsonText(text), code);
  throwsCode(() => parseJsonText({}), "json_text_not_string");
  throwsCode(() => parseJsonText(Buffer.from("{}")), "json_text_not_string");
  const parsed = parseJsonText(' {"b":[1,2.5,"x",true,null,{"c":"\\u00e9"}],"a":-1e3} ');
  assert.deepEqual(parsed, { b: [1, 2.5, "x", true, null, { c: "é" }], a: -1000 });
  assert.ok(Object.isFrozen(parsed) && Object.isFrozen(parsed.b) && Object.isFrozen(parsed.b[5]));
  assert.equal(Object.getPrototypeOf(parsed), Object.prototype);
});

test("defensive clone rejects every non-plain-data shape", () => {
  const withGetter = {}; Object.defineProperty(withGetter, "x", { get: () => 1, enumerable: true });
  const withSetter = {}; Object.defineProperty(withSetter, "x", { set: () => {}, enumerable: true });
  const nonEnumerable = {}; Object.defineProperty(nonEnumerable, "x", { value: 1, enumerable: false });
  const cyclic = { a: {} }; cyclic.a.self = cyclic;
  const polluted = JSON.parse('{"__proto__":{"admin":true}}');
  const extraArray = [1]; extraArray.extra = 1;
  class Custom { constructor() { this.x = 1; } }
  const cases = [
    [withGetter, "data_accessor_forbidden"], [withSetter, "data_accessor_forbidden"], [nonEnumerable, "data_non_enumerable_forbidden"], [cyclic, "data_cycle"],
    [{ f() {} }, "data_function_forbidden"], [{ s: Symbol("s") }, "data_symbol_forbidden"], [{ [Symbol("k")]: 1 }, "data_symbol_key_forbidden"], [{ b: 10n }, "data_bigint_forbidden"],
    [{ d: new Date(0) }, "data_custom_prototype"], [{ b: Buffer.from("x") }, "data_custom_prototype"], [{ t: new Uint8Array(1) }, "data_custom_prototype"], [{ m: new Map() }, "data_custom_prototype"],
    [new Custom(), "data_custom_prototype"], [Object.create({ inherited: 1 }), "data_custom_prototype"], [[1, , 3], "data_sparse_array"], [extraArray, "data_array_extra_properties"],
    [{ u: undefined }, "data_undefined_forbidden"], [undefined, "data_undefined_forbidden"], [{ n: Number.NaN }, "number_not_finite"], [{ n: Number.POSITIVE_INFINITY }, "number_not_finite"],
    [{ n: -0 }, "number_negative_zero"], [{ n: 2 ** 53 }, "number_unsafe_integer"], [polluted, "data_forbidden_key"], [{ constructor: {} }, "data_forbidden_key"],
  ];
  for (const [value, code] of cases) throwsCode(() => toPlainData(value), code);
  const source = { z: [1, { y: "x" }], a: null, n: Object.create(null) };
  source.n.k = 1;
  const clone = toPlainData(source);
  assert.deepEqual(clone, { z: [1, { y: "x" }], a: null, n: { k: 1 } });
  assert.notEqual(clone.z, source.z);
  assert.ok(Object.isFrozen(clone) && Object.isFrozen(clone.z[1]));
  assert.equal(canonicalize({ b: 1, a: [true, null, "é"] }), '{"a":[true,null,"é"],"b":1}');
  throwsCode(() => canonicalize({ d: new Date(0) }), "data_custom_prototype");
});

// ---------------------------------------------------------------------------
// Candidate instance data
// ---------------------------------------------------------------------------

test("candidate text is parsed strictly and rejects caller-supplied status, digests, and incomplete provider data", () => {
  const candidate = parseCandidate(candidateText());
  assert.equal(candidate.candidateVersion, CANDIDATE_VERSION);
  assert.equal(candidate.branch.nameByteLength, 21);
  assert.equal(candidate.branch.nameUtf8Hex, Buffer.from("careeros/private-beta").toString("hex"));
  assert.ok(Object.isFrozen(candidate) && Object.isFrozen(candidate.provider.services[0].repository));
  const mutate = (fn) => { const c = candidateObject(); fn(c); return JSON.stringify(c); };
  throwsCode(() => parseCandidate(mutate((c) => { c.status = "PASS"; })), "schema_additional_property");
  throwsCode(() => parseCandidate(mutate((c) => { c.signature = { algorithm: "Ed25519", keyId: GATE_KEY_ID, value: "A".repeat(86) }; })), "schema_additional_property");
  throwsCode(() => parseCandidate(mutate((c) => { c.commit.sha = OTHER_SHA; })), "candidate_digest_mismatch");
  throwsCode(() => parseCandidate(mutate((c) => { c.branch.fullRef = "refs/heads/careeros/private-beta2"; })), "candidate_digest_mismatch");
  throwsCode(() => parseCandidate(mutate((c) => { delete c.provider.accountId; })), "schema_required_missing");
  throwsCode(() => parseCandidate(mutate((c) => { c.provider.services = []; })), "schema_min_items");
  throwsCode(() => parseCandidate(mutate((c) => { delete c.provider.services[0].region; })), "schema_required_missing");
  throwsCode(() => parseCandidate(mutate((c) => { c.provider.services[0].secretToken = "x"; })), "schema_additional_property");
  throwsCode(() => parseCandidate(mutate((c) => { c.roots = []; })), "schema_min_items");
  throwsCode(() => parseCandidate(JSON.stringify({ ...candidateObject(), candidatePayloadSha256: "0".repeat(64) })), "candidate_digest_mismatch");
  throwsCode(() => parseCandidate(`${candidateText()}}`), "json_trailing_tokens");
  throwsCode(() => parseCandidate(`${candidateText()} null`), "json_trailing_tokens");
  throwsCode(() => createCandidateText({ ...input, status: "PASS" }), "candidate_input_keys_invalid");
  throwsCode(() => createCandidateText({ ...input, branch: { shortName: "careeros/private-beta", fullRef: "refs/heads/other" } }), "candidate_input_keys_invalid");
  throwsCode(() => createCandidateText({ ...input, provider: { ...input.provider, services: [{ ...service, branch: "careos/private-beta" }] } }), "service_branch_inconsistent");
  throwsCode(() => createCandidateText({ ...input, provider: { ...input.provider, services: [{ ...service, repository: { ...repoIdentity, owner: "Other" } }] } }), "service_repository_inconsistent");
  throwsCode(() => createCandidateText({ ...input, provider: { ...input.provider, services: [{ ...service, rootDirectory: "staffordos/ui/operator-frontend/careos-beta" }] } }), "service_root_not_certified");
  throwsCode(() => createCandidateText({ ...input, roots: [...roots, { ...roots[0], role: "again" }] }), "root_path_duplicate");
  throwsCode(() => createCandidateText({ ...input, roots: [{ role: "bad", path: "staffordos/../etc", treeObjectSha: ROOT_TREES[0] }] }), "path_segment_invalid");
  throwsCode(() => createCandidateText({ ...input, roots: [{ role: "bad", path: "/staffordos/operator-issuer", treeObjectSha: ROOT_TREES[0] }] }), "schema_pattern_mismatch");
  throwsCode(() => createCandidateText({ ...input, roots: [{ role: "bad", path: "staffordos/operator-issuer/", treeObjectSha: ROOT_TREES[0] }] }), "schema_pattern_mismatch");
  const badBranches = [
    ["careeros/private-beta ", "schema_pattern_mismatch"], ["careeros/private-beta​", "schema_pattern_mismatch"], ["careeros//private-beta", "schema_pattern_mismatch"],
    ["/careeros/private-beta", "schema_pattern_mismatch"], ["careeros/private-beta/", "schema_pattern_mismatch"], ["careeros/.private-beta", "schema_pattern_mismatch"],
    ["careeros/private-beta.lock", "path_segment_invalid"], ["careeros/private..beta", "path_segment_invalid"],
  ];
  for (const [shortName, code] of badBranches) {
    throwsCode(() => createCandidateText({ ...input, branch: { shortName }, provider: { ...input.provider, services: [{ ...service, branch: shortName }] } }), code);
  }
});

test("branch spellings that differ by a byte are distinct candidates, never normalized", () => {
  const texts = ["careeros/private-beta", "careos/private-beta", "careeros/Private-beta"].map((shortName) => createCandidateText({ ...input, branch: { shortName }, provider: { ...input.provider, services: [{ ...service, branch: shortName }] } }));
  assert.equal(new Set(texts).size, 3);
  assert.equal(new Set(texts.map((text) => parseCandidate(text).candidatePayloadSha256)).size, 3);
});

// ---------------------------------------------------------------------------
// Database policy
// ---------------------------------------------------------------------------

test("database policy: required demands at least one database and exact evidence", async () => {
  const withRequired = (databases) => createCandidateText({ ...input, provider: { ...input.provider, databasePolicy: "required", databases } });
  throwsCode(() => withRequired([]), "database_policy_required_empty");
  const { certificate } = await attest();
  assert.equal(certificate.candidate.provider.databasePolicy, "required");
  assert.equal(certificate.status, STATUS.PASS);
  await rejects(() => attest({ provider: providerEvidence({ databases: [] }) }), "provider_evidence_databases_incomplete");
  await rejects(() => attest({ provider: providerEvidence({ databases: [{ requestedId: database.id, ...database }, { requestedId: "dpg-extra", id: "dpg-extra", region: "oregon" }] }) }), "provider_evidence_databases_incomplete");
  await rejects(() => attest({ provider: providerEvidence({ databases: [{ requestedId: "dpg-other", ...database }] }) }), "provider_evidence_database_not_requested");
});

test("database policy: none demands empty expectations and rejects unexpected database evidence", async () => {
  throwsCode(() => createCandidateText({ ...freeInput, provider: { ...freeInput.provider, databases: [{ id: "pg-1", region: "iad" }] } }), "database_policy_none_with_databases");
  const { certificate, certificateText } = await attestFree();
  assert.equal(certificate.status, STATUS.PASS);
  assert.equal(certificate.candidate.provider.databasePolicy, "none");
  assert.deepEqual(certificate.candidate.provider.databases, []);
  assert.deepEqual(certificate.providerEvidence.databases, []);
  assert.equal(assertPass(certificateText, freePolicy()).status, STATUS.PASS);
  throwsCode(() => assertPass(certificateText, policy()), "audience_mismatch");
  await rejects(() => attestFree({ provider: freeProvider({ databases: [{ requestedId: "pg-1", id: "pg-1", region: "iad" }] }) }), "provider_evidence_databases_unexpected");
});

test("database policy: missing, unknown, or contradictory values are rejected", () => {
  const c = candidateObject();
  const withPolicy = (value) => { const copy = JSON.parse(JSON.stringify(c)); if (value === undefined) delete copy.provider.databasePolicy; else copy.provider.databasePolicy = value; return JSON.stringify(copy); };
  throwsCode(() => parseCandidate(withPolicy(undefined)), "schema_required_missing");
  throwsCode(() => parseCandidate(withPolicy("optional")), "schema_enum_mismatch");
  const { provider, ...rest } = input;
  throwsCode(() => createCandidateText({ ...rest, provider: { ...provider, databasePolicy: "optional" } }), "schema_enum_mismatch");
  throwsCode(() => createCandidateText({ ...rest, provider: { ...provider, databasePolicy: "REQUIRED" } }), "schema_enum_mismatch");
  throwsCode(() => createCandidateText({ ...rest, provider: { ...provider, databasePolicy: null } }), "schema_type_mismatch");
  throwsCode(() => createCandidateText({ ...rest, provider: { ...provider, databasePolicy: "none" } }), "database_policy_none_with_databases");
});

// ---------------------------------------------------------------------------
// Forge identity
// ---------------------------------------------------------------------------

test("forge identity normalization follows one deterministic rule and rejects unsafe remotes", () => {
  const expected = { forgeHost: "github.com", owner: "RStaff", name: "cart-agent" };
  for (const url of ["https://github.com/RStaff/cart-agent", "https://GitHub.COM/RStaff/cart-agent.git", "https://github.com/RStaff/cart-agent/", "ssh://git@github.com/RStaff/cart-agent.git", "ssh://github.com/RStaff/cart-agent", "git@github.com:RStaff/cart-agent.git", "git@GITHUB.com:RStaff/cart-agent"]) {
    assert.deepEqual(repositoryIdentityFromRemoteUrl(url), expected, url);
    assert.ok(Object.isFrozen(repositoryIdentityFromRemoteUrl(url)));
  }
  assert.notDeepEqual(repositoryIdentityFromRemoteUrl("https://github.com/rstaff/cart-agent"), expected, "owner case is byte-exact");
  const cases = [
    ["https://user:pass@github.com/RStaff/cart-agent", "remote_url_credentials_rejected"], ["https://token@github.com/RStaff/cart-agent", "remote_url_credentials_rejected"],
    ["ssh://deploy@github.com/RStaff/cart-agent", "remote_url_credentials_rejected"], ["https://github.com/RStaff/cart-agent?ref=x", "remote_url_scheme_unsupported"],
    ["https://github.com/RStaff/cart-agent#frag", "remote_url_scheme_unsupported"], ["https://github.com:443/RStaff/cart-agent", "remote_url_port_rejected"],
    ["ssh://git@github.com:22/RStaff/cart-agent", "remote_url_port_rejected"], ["http://github.com/RStaff/cart-agent", "remote_url_scheme_unsupported"],
    ["git://github.com/RStaff/cart-agent", "remote_url_scheme_unsupported"], ["file:///tmp/repo", "remote_url_scheme_unsupported"],
    ["https://[::1]/RStaff/cart-agent", "remote_url_ip_literal"], ["https://10.0.0.1/RStaff/cart-agent", "forge_host_ip_literal"],
    ["https://xn--gthub-9za.com/RStaff/cart-agent", "forge_host_punycode_rejected"], ["https://gíthub.com/RStaff/cart-agent", "remote_url_non_ascii"],
    ["https://github/RStaff/cart-agent", "forge_host_invalid"], ["https://github.com./RStaff/cart-agent", "forge_host_invalid"], ["https://-github.com/RStaff/cart-agent", "forge_host_invalid"],
    ["https://github.com/RStaff", "remote_url_path_invalid"], ["https://github.com/RStaff/cart-agent/extra", "remote_url_path_invalid"], ["https://github.com/../cart-agent", "remote_url_path_invalid"],
    [`https://github.com/RStaff/${GH_PREFIX}abcdefghijklmnop`, "credential_shaped_value"], ["", "remote_url_invalid"], [42, "remote_url_invalid"],
  ];
  for (const [url, code] of cases) throwsCode(() => repositoryIdentityFromRemoteUrl(url), code, url);
  assert.equal(normalizeForgeHost("GitLab.Example.ORG"), "gitlab.example.org");
  for (const [host, code] of [["github.com:443", "forge_host_invalid"], ["github", "forge_host_invalid"], ["gіthub.com", "forge_host_non_ascii"], ["xn--80ak6aa92e.com", "forge_host_punycode_rejected"], ["192.168.0.1", "forge_host_ip_literal"], ["", "forge_host_invalid"]]) {
    throwsCode(() => normalizeForgeHost(host), code, host);
  }
  throwsCode(() => createCandidateText({ ...input, repository: { ...input.repository, forgeHost: "GitHub.com" } }), "schema_pattern_mismatch");
});

test("same owner and repository on a different forge host is a mismatch, not an equivalent", async () => {
  const onOtherForge = await attest({ git: gitEvidence({ repository: { ...repoIdentity, forgeHost: "gitlab.com" } }) });
  assert.equal(onOtherForge.certificate.status, STATUS.MISMATCH);
  assert.deepEqual(onOtherForge.certificate.mismatches, [{ field: "gitEvidence.repository.forgeHost", expected: "github.com", observed: "gitlab.com" }]);
  throwsCode(() => assertPass(onOtherForge.certificateText, policy()), "not_pass");
  const providerForge = await attest({ provider: providerEvidence({ services: [{ requestedId: service.id, ...service, repository: { ...repoIdentity, forgeHost: "codeberg.org" } }] }) });
  assert.equal(providerForge.certificate.status, STATUS.MISMATCH);
  assert.deepEqual(providerForge.certificate.mismatches.map((m) => m.field), ["providerEvidence.services[0].repository.forgeHost"]);
  throwsCode(() => createCandidateText({ ...input, provider: { ...input.provider, services: [{ ...service, repository: { ...repoIdentity, forgeHost: "gitlab.com" } }] } }), "service_repository_inconsistent");
  const a = createCandidateText(input);
  const b = createCandidateText({ ...input, repository: { ...input.repository, forgeHost: "gitlab.com" }, provider: { ...input.provider, services: [{ ...service, repository: { ...repoIdentity, forgeHost: "gitlab.com" } }] } });
  assert.notEqual(parseCandidate(a).candidatePayloadSha256, parseCandidate(b).candidatePayloadSha256);
});

// ---------------------------------------------------------------------------
// Authenticity
// ---------------------------------------------------------------------------

test("valid database-backed certificate is signed by the trusted key and independently verifiable", async () => {
  const { certificate, certificateText } = await attest();
  assert.equal(certificate.status, STATUS.PASS);
  assert.equal(certificate.certificateVersion, CERTIFICATE_VERSION);
  assert.deepEqual(Object.keys(certificate.signature).sort(), ["algorithm", "keyId", "value"]);
  assert.equal(certificate.signature.algorithm, "Ed25519");
  assert.equal(certificate.signature.keyId, GATE_KEY_ID);
  assert.match(certificate.signature.value, /^[A-Za-z0-9_-]{86}$/);
  assert.equal(certificate.certificatePayloadSha256, computeCertificateDigest(certificate));
  assert.equal(canonicalize(certificate), certificateText);
  assert.deepEqual(verifyCertificate(certificateText, policy()), certificate);
  assert.equal(assertPass(certificateText, policy()).status, STATUS.PASS);
  // A second gate holding only the other trusted key must not accept it.
  const otherGate = createTrustedKeys({ [SECOND_KEY_ID]: secondGateKeys.publicKey });
  throwsCode(() => verifyCertificate(certificateText, policy({ trustedKeys: otherGate })), "signature_key_untrusted");
  // Deterministic: Ed25519 signatures are deterministic, so identical inputs yield identical text.
  assert.equal((await attest()).certificateText, certificateText);
});

test("no key material is serialized and the signer is required to be trusted by the attesting gate", async () => {
  const { certificateText } = await attest();
  const privateJwk = gateKeys.privateKey.export({ format: "jwk" });
  const publicJwk = gateKeys.publicKey.export({ format: "jwk" });
  assert.ok(!certificateText.includes(privateJwk.d));
  assert.ok(!certificateText.includes(publicJwk.x));
  assert.doesNotMatch(certificateText, /BEGIN|PRIVATE|publicKey|privateKey/);
  assert.deepEqual(Object.keys(signer), ["algorithm", "keyId", "sign"]);
  assert.ok(Object.isFrozen(signer));
  await rejects(() => attest({ sign: attackerSigner }), "signer_key_not_trusted");
  await rejects(() => attest({ sign: null }), "signer_invalid");
  await rejects(() => attestCertificate({ candidateText: candidateText(), trustedKeys, expectedAudience: AUDIENCE, clock, collectGitEvidence: async () => gitEvidence(), collectProviderEvidence: async () => providerEvidence() }), "signer_invalid");
  await rejects(() => attest({ sign: { algorithm: "RSA-PSS", keyId: GATE_KEY_ID, sign: () => new Uint8Array(64) } }), "signer_algorithm_unsupported");
  await rejects(() => attest({ sign: { algorithm: "Ed25519", keyId: GATE_KEY_ID, sign: () => new Uint8Array(63) } }), "signer_output_invalid");
  await rejects(() => attest({ sign: { algorithm: "Ed25519", keyId: GATE_KEY_ID, sign: () => { throw new Error(`hsm down: ${shaped("tok", "en")} ${GH_PREFIX}SYNTHETIC`); } } }), "signing_failed");
  await rejects(() => attest({ sign: { algorithm: "Ed25519", keyId: GATE_KEY_ID, sign: () => new Uint8Array(64) } }), "signature_invalid");
  throwsCode(() => createEd25519Signer({ privateKey: gateKeys.publicKey, keyId: GATE_KEY_ID }), "signer_key_invalid");
  throwsCode(() => createEd25519Signer({ privateKey: crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey, keyId: GATE_KEY_ID }), "signer_key_invalid");
  throwsCode(() => createEd25519Signer({ privateKey: gateKeys.privateKey, keyId: "bad key id!" }), "schema_pattern_mismatch");
  throwsCode(() => createTrustedKeys({}), "trusted_keys_invalid");
  throwsCode(() => createTrustedKeys({ [GATE_KEY_ID]: gateKeys.privateKey }), "trusted_key_private_rejected");
  throwsCode(() => createTrustedKeys({ [GATE_KEY_ID]: "not a key" }), "trusted_key_invalid");
  throwsCode(() => createTrustedKeys({ "bad id!": gateKeys.publicKey }), "schema_pattern_mismatch");
  assert.deepEqual(trustedKeys.keyIds, [GATE_KEY_ID, SECOND_KEY_ID]);
  assert.ok(Object.isFrozen(trustedKeys));
});

test("fabricated PASS certificate with recomputed digest but no trusted signature fails", async () => {
  const cand = candidateObject();
  const fake = { certificateVersion: CERTIFICATE_VERSION, generatedAtUtc: new Date(NOW_MS).toISOString(), candidate: cand, gitEvidence: gitEvidence(), providerEvidence: providerEvidence(), mismatches: [], status: "PASS" };
  fake.certificatePayloadSha256 = computeCertificateDigest(fake);
  throwsCode(() => verifyCertificate(JSON.stringify(fake), policy()), "schema_required_missing");
  throwsCode(() => verifyCertificate(JSON.stringify({ ...fake, signature: { algorithm: "Ed25519", keyId: GATE_KEY_ID, value: "A".repeat(86) } }), policy()), "signature_invalid");
  throwsCode(() => verifyCertificate(JSON.stringify({ ...fake, signature: { algorithm: "Ed25519", keyId: GATE_KEY_ID, value: "" } }), policy()), "schema_pattern_mismatch");
  throwsCode(() => assertPass(JSON.stringify({ ...fake, signature: { algorithm: "Ed25519", keyId: GATE_KEY_ID, value: "A".repeat(86) } }), policy()), "signature_invalid");
});

test("credential-shaped opaque signature values reach cryptographic verification", async () => {
  const { certificateText } = await attest();
  assert.equal(verifyCertificate(certificateText, policy()).status, STATUS.PASS);
  for (const prefix of CREDENTIAL_PREFIXES) {
    const value = credentialShapedSignatureValue(prefix);
    const edited = JSON.parse(certificateText);
    edited.signature.value = value;
    let caught;
    try {
      verifyCertificate(JSON.stringify(edited), policy());
    } catch (error) {
      caught = error;
    }
    assert.ok(caught instanceof DeploymentAuthorityError);
    assert.equal(caught.code, "signature_invalid");
    assert.doesNotMatch(JSON.stringify({ message: caught.message, code: caught.code, path: caught.path, stack: caught.stack }), new RegExp(value));
  }
});

test("credential-shaped signature exemption is not available to human-controlled fields", async () => {
  const credentialShaped = CREDENTIAL_PREFIXES.map(credentialShapedString);
  assert.ok(credentialShaped[0].startsWith(GH_PREFIX) && credentialShaped[2].startsWith(GL_PREFIX), "assembled fixtures must reproduce the blocked prefixes at runtime");
  const { certificateText } = await attest();
  for (const value of credentialShaped) {
    throwsCode(() => createCandidateText({ ...input, audience: value }), "credential_shaped_value");
    throwsCode(() => createEd25519Signer({ privateKey: gateKeys.privateKey, keyId: value }), "credential_shaped_value");
    throwsCode(() => createTrustedKeys({ [value]: gateKeys.publicKey }), "credential_shaped_value");
    throwsCode(() => createCandidateText({ ...input, repository: { ...input.repository, owner: value } }), "credential_shaped_value");
    throwsCode(() => createCandidateText({ ...input, provider: { ...input.provider, accountId: value } }), "credential_shaped_value");
    await rejects(() => attest({ git: gitEvidence({ remoteName: value }) }), "credential_shaped_value");
    await rejects(() => attest({ git: { ...gitEvidence(), [value]: "x" } }), "schema_additional_property");
    await rejects(() => attest({ provider: providerEvidence({ accountId: value }) }), "credential_shaped_value");
    const edited = JSON.parse(certificateText);
    edited.signature.keyId = value;
    throwsCode(() => verifyCertificate(JSON.stringify(edited), policy()), "credential_shaped_value");
  }
  const signatureValue = credentialShapedSignatureValue(GH_PREFIX);
  const nestedSignature = JSON.parse(certificateText);
  nestedSignature.candidate.signature = { value: signatureValue };
  throwsCode(() => verifyCertificate(JSON.stringify(nestedSignature), policy()), "schema_additional_property");
  await rejects(() => attest({ provider: { ...providerEvidence(), signature: { value: signatureValue } } }), "schema_additional_property");
});

test("fabricated certificate signed by an attacker-controlled key fails, even with the trusted key id or an embedded key", async () => {
  const { certificateText } = await attest();
  const legit = JSON.parse(certificateText);
  const forged = { ...legit, providerEvidence: providerEvidence({ accountId: "tea-attacker" }) };
  forged.candidate = JSON.parse(createCandidateText({ ...input, provider: { ...input.provider, accountId: "tea-attacker" } }));
  throwsCode(() => verifyCertificate(resign(forged, attackerSigner), policy()), "signature_key_untrusted");
  throwsCode(() => verifyCertificate(resign(forged, attackerAsGate), policy()), "signature_invalid");
  throwsCode(() => verifyCertificate(resign(legit, attackerAsGate), policy()), "signature_invalid");
  const attackerJwk = attackerKeys.publicKey.export({ format: "jwk" });
  const attackerPem = attackerKeys.publicKey.export({ type: "spki", format: "pem" });
  const withEmbedded = JSON.parse(resign(forged, attackerSigner));
  throwsCode(() => verifyCertificate(JSON.stringify({ ...withEmbedded, signature: { ...withEmbedded.signature, publicKey: attackerJwk.x } }), policy()), "schema_additional_property");
  throwsCode(() => verifyCertificate(JSON.stringify({ ...withEmbedded, trustedKeys: { "attacker-key": attackerPem } }), policy()), "schema_additional_property");
  throwsCode(() => verifyCertificate(JSON.stringify({ ...withEmbedded, signature: { ...withEmbedded.signature, jwk: attackerJwk } }), policy()), "schema_additional_property");
  // An attacker-supplied "policy" object is not a trusted-key set created by the gate.
  const fakeTrusted = { keyIds: ["attacker-key"], has: () => true, get: () => attackerKeys.publicKey };
  throwsCode(() => verifyCertificate(resign(forged, attackerSigner), policy({ trustedKeys: fakeTrusted })), "verification_policy_trusted_keys_missing");
});

test("unknown key id, substituted trusted key id, modified payload, modified signature, and modified algorithm all fail", async () => {
  const { certificateText, certificate } = await attest();
  const edit = (fn) => { const c = JSON.parse(certificateText); fn(c); return JSON.stringify(c); };
  throwsCode(() => verifyCertificate(edit((c) => { c.signature.keyId = "unknown-key"; }), policy()), "signature_key_untrusted");
  throwsCode(() => verifyCertificate(edit((c) => { c.signature.keyId = SECOND_KEY_ID; }), policy()), "signature_invalid");
  throwsCode(() => verifyCertificate(edit((c) => { c.status = "STALE"; }), policy()), "certificate_digest_mismatch");
  throwsCode(() => verifyCertificate(edit((c) => { c.status = "STALE"; c.certificatePayloadSha256 = computeCertificateDigest(c); }), policy()), "signature_invalid");
  throwsCode(() => verifyCertificate(edit((c) => { c.providerEvidence.accountId = "tea-other"; c.certificatePayloadSha256 = computeCertificateDigest(c); }), policy()), "signature_invalid");
  throwsCode(() => verifyCertificate(edit((c) => { c.generatedAtUtc = "2026-09-08T12:00:00.001Z"; c.certificatePayloadSha256 = computeCertificateDigest(c); }), policy()), "signature_invalid");
  const flipped = certificate.signature.value[0] === "A" ? "B" : "A";
  throwsCode(() => verifyCertificate(edit((c) => { c.signature.value = flipped + c.signature.value.slice(1); }), policy()), "signature_invalid");
  throwsCode(() => verifyCertificate(edit((c) => { c.signature.value = c.signature.value.slice(0, 85); }), policy()), "schema_pattern_mismatch");
  throwsCode(() => verifyCertificate(edit((c) => { c.signature.value = `${c.signature.value}=`; }), policy()), "schema_max_length");
  const last = certificate.signature.value.slice(-1);
  const altLast = last === "A" ? "B" : "A";
  // Altering the final character either changes the signature bytes (signature_invalid) or only the
  // unused padding bits (non-canonical encoding); both must fail closed.
  assert.throws(() => verifyCertificate(edit((c) => { c.signature.value = c.signature.value.slice(0, 85) + altLast; }), policy()), (error) => ["signature_invalid", "signature_encoding_invalid"].includes(error.code) || assert.fail(error.message));
  const nonCanonical = certificate.signature.value.slice(0, 85) + String.fromCharCode(certificate.signature.value.charCodeAt(85) ^ 0);
  assert.equal(nonCanonical, certificate.signature.value);
  throwsCode(() => verifyCertificate(edit((c) => { c.signature.algorithm = "RSA-PSS"; }), policy()), "schema_enum_mismatch");
  throwsCode(() => verifyCertificate(edit((c) => { c.signature.algorithm = "ed25519"; }), policy()), "schema_enum_mismatch");
  throwsCode(() => verifyCertificate(edit((c) => { c.signature.algorithm = "none"; }), policy()), "schema_enum_mismatch");
  throwsCode(() => verifyCertificate(edit((c) => { delete c.signature; }), policy()), "schema_required_missing");
  throwsCode(() => verifyCertificate(edit((c) => { delete c.signature.keyId; }), policy()), "schema_required_missing");
  // Lowercasing changes the signature bytes or, for some final characters, only the unused padding bits; both fail closed.
  assert.throws(() => verifyCertificate(edit((c) => { c.signature.value = c.signature.value.toLowerCase(); }), policy()), (error) => ["signature_invalid", "signature_encoding_invalid"].includes(error.code) || assert.fail(error.message));
});

test("verification requires a gate policy and fails closed on invalid policy", async () => {
  const { certificateText } = await attest();
  throwsCode(() => verifyCertificate(certificateText), "verification_policy_invalid");
  throwsCode(() => verifyCertificate(certificateText, {}), "verification_policy_trusted_keys_missing");
  throwsCode(() => verifyCertificate(certificateText, { trustedKeys }), "verification_policy_clock_missing");
  throwsCode(() => verifyCertificate(certificateText, { trustedKeys, clock, expectedAudience: AUDIENCE, extra: true }), "verification_policy_invalid");
  throwsCode(() => verifyCertificate(certificateText, { trustedKeys, clock }), "verification_policy_audience_missing");
  for (const bad of ["", "gate with space", "gate?x=1", "gate#frag", "user:pw@gate", "a".repeat(129), `${GH_PREFIX}abcdefghijklmnop`, 42, null]) {
    throwsCode(() => verifyCertificate(certificateText, policy({ expectedAudience: bad })), typeof bad === "string" ? "verification_policy_audience_invalid" : "verification_policy_audience_missing");
  }
  throwsCode(() => verifyCertificate(certificateText, policy({ maxCertificateAgeMs: 0 })), "verification_policy_max_age_invalid");
  throwsCode(() => verifyCertificate(certificateText, policy({ maxCertificateAgeMs: MAX_CERTIFICATE_AGE_LIMIT_MS + 1 })), "verification_policy_max_age_invalid");
  throwsCode(() => verifyCertificate(certificateText, policy({ maxCertificateAgeMs: 1.5 })), "verification_policy_max_age_invalid");
  throwsCode(() => verifyCertificate(certificateText, policy({ clockSkewMs: -1 })), "verification_policy_skew_invalid");
  throwsCode(() => verifyCertificate(certificateText, policy({ clockSkewMs: 5 * 60 * 1000 + 1 })), "verification_policy_skew_invalid");
  throwsCode(() => verifyCertificate(certificateText, policy({ clock: () => Number.NaN })), "clock_invalid");
  throwsCode(() => assertPass(certificateText), "verification_policy_invalid");
  throwsCode(() => assertNoDownstreamOverrides(certificateText, {}), "verification_policy_invalid");
  throwsCode(() => renderReport(certificateText), "verification_policy_invalid");
  assert.equal(verifyCertificate(certificateText, policy({ maxCertificateAgeMs: MAX_CERTIFICATE_AGE_LIMIT_MS, clockSkewMs: 0 })).status, STATUS.PASS);
  await rejects(() => attest({ keys: null }), "verification_policy_trusted_keys_missing");
  await rejects(() => attestCertificate({ candidateText: candidateText(), signer, clock, collectGitEvidence: async () => gitEvidence(), collectProviderEvidence: async () => providerEvidence() }), "verification_policy_trusted_keys_missing");
  await rejects(() => attest({ maxCertificateAgeMs: 0 }), "verification_policy_max_age_invalid");
});

// ---------------------------------------------------------------------------
// Consumption expiry
// ---------------------------------------------------------------------------

test("consumption-time expiry: exact age and skew boundaries", async () => {
  const { certificateText } = await attest();
  const at = (offsetMs, overrides = {}) => policy({ clock: () => NOW_MS + offsetMs, ...overrides });
  assert.equal(DEFAULT_MAX_CERTIFICATE_AGE_MS, 15 * 60 * 1000);
  assert.equal(DEFAULT_CERTIFICATE_CLOCK_SKEW_MS, 60 * 1000);
  assert.equal(verifyCertificate(certificateText, at(DEFAULT_MAX_CERTIFICATE_AGE_MS)).status, STATUS.PASS);
  throwsCode(() => verifyCertificate(certificateText, at(DEFAULT_MAX_CERTIFICATE_AGE_MS + 1)), "certificate_expired");
  assert.equal(verifyCertificate(certificateText, at(-DEFAULT_CERTIFICATE_CLOCK_SKEW_MS)).status, STATUS.PASS);
  throwsCode(() => verifyCertificate(certificateText, at(-DEFAULT_CERTIFICATE_CLOCK_SKEW_MS - 1)), "certificate_from_future");
  assert.equal(verifyCertificate(certificateText, at(120_000, { maxCertificateAgeMs: 120_000 })).status, STATUS.PASS);
  throwsCode(() => verifyCertificate(certificateText, at(120_001, { maxCertificateAgeMs: 120_000 })), "certificate_expired");
  assert.equal(verifyCertificate(certificateText, at(0, { clockSkewMs: 0 })).status, STATUS.PASS);
  throwsCode(() => verifyCertificate(certificateText, at(-1, { clockSkewMs: 0 })), "certificate_from_future");
  throwsCode(() => assertPass(certificateText, at(DEFAULT_MAX_CERTIFICATE_AGE_MS + 1)), "certificate_expired");
  throwsCode(() => renderReport(certificateText, at(DEFAULT_MAX_CERTIFICATE_AGE_MS + 1)), "certificate_expired");
  throwsCode(() => assertNoDownstreamOverrides(certificateText, {}, at(DEFAULT_MAX_CERTIFICATE_AGE_MS + 1)), "certificate_expired");
  // The certificate cannot carry or select its own policy.
  const edit = (fn) => { const c = JSON.parse(certificateText); fn(c); return JSON.stringify(c); };
  throwsCode(() => verifyCertificate(edit((c) => { c.maxCertificateAgeMs = 10 ** 9; }), at(0)), "schema_additional_property");
  throwsCode(() => verifyCertificate(edit((c) => { c.verificationPolicy = { maxCertificateAgeMs: 10 ** 9 }; }), at(0)), "schema_additional_property");
  // Attestation itself refuses to issue a certificate that its own gate would consider expired.
  await rejects(() => attest({ now: () => NOW_MS, maxCertificateAgeMs: 1, git: gitEvidence({ observedAtUtc: new Date(NOW_MS - 5).toISOString() }) }).then(() => { throw new DeploymentAuthorityError("unexpected_pass"); }), "unexpected_pass");
});

test("evidence freshness at generation is enforced independently of consumption expiry", async () => {
  const tooOld = new Date(NOW_MS - EVIDENCE_MAX_AGE_MS - 1).toISOString();
  await rejects(() => attest({ git: gitEvidence({ observedAtUtc: tooOld }) }), "evidence_not_fresh");
  await rejects(() => attest({ provider: providerEvidence({ observedAtUtc: new Date(NOW_MS + 61_000).toISOString() }) }), "evidence_observed_in_future");
  await rejects(() => attest({ git: gitEvidence({ observedAtUtc: "2026-02-30T00:00:00.000Z" }) }), "timestamp_invalid");
  await rejects(() => attest({ git: gitEvidence({ observedAtUtc: "2026-09-08T11:59:30Z" }) }), "schema_pattern_mismatch");
  await rejects(() => attest({ now: () => Number.NaN }), "clock_invalid");
  const ok = await attest({ git: gitEvidence({ observedAtUtc: new Date(NOW_MS - EVIDENCE_MAX_AGE_MS).toISOString() }) });
  assert.equal(ok.certificate.status, STATUS.PASS);
});

// ---------------------------------------------------------------------------
// Evidence completeness and derivation
// ---------------------------------------------------------------------------

test("collectors receive frozen requests describing exactly what to observe", async () => {
  const seen = {};
  await attestCertificate({
    candidateText: candidateText(), signer, trustedKeys, expectedAudience: AUDIENCE, clock,
    collectGitEvidence: async (request) => { seen.git = request; return gitEvidence(); },
    collectProviderEvidence: async (request) => { seen.provider = request; return providerEvidence(); },
  });
  assert.deepEqual(seen.git, { repository: repoIdentity, remoteName: "origin", fullRef: "refs/heads/careeros/private-beta", commitSha: COMMIT, treeSha: TREE, rootPaths: roots.map((r) => r.path) });
  assert.deepEqual(seen.provider, { name: "render", accountId: "tea-staffordos", databasePolicy: "required", serviceIds: [service.id], databaseIds: [database.id] });
  assert.ok(Object.isFrozen(seen.git) && Object.isFrozen(seen.git.rootPaths) && Object.isFrozen(seen.provider.serviceIds));
});

test("Git evidence mismatches fail closed: remote SHA, tree, root object, mode, type, remote, repository", async () => {
  const stale = await attest({ git: gitEvidence({ ref: { fullRef: "refs/heads/careeros/private-beta", sha: OTHER_SHA } }) });
  assert.equal(stale.certificate.status, STATUS.STALE);
  assert.deepEqual(stale.certificate.mismatches, [{ field: "gitEvidence.ref.sha", expected: COMMIT, observed: OTHER_SHA }]);
  throwsCode(() => assertPass(stale.certificateText, policy()), "not_pass");
  const treeMoved = await attest({ git: gitEvidence({ commit: { sha: COMMIT, treeSha: OTHER_SHA } }) });
  assert.equal(treeMoved.certificate.status, STATUS.MISMATCH);
  assert.deepEqual(treeMoved.certificate.mismatches.map((m) => m.field), ["gitEvidence.commit.treeSha"]);
  const rootsBad = gitEvidence().roots.map((entry, i) => (i === 0 ? { ...entry, mode: "120000", type: "blob" } : i === 1 ? { ...entry, mode: "160000", type: "commit" } : { ...entry, objectSha: OTHER_SHA }));
  const badRoots = await attest({ git: gitEvidence({ roots: rootsBad }) });
  assert.equal(badRoots.certificate.status, STATUS.MISMATCH);
  assert.deepEqual(badRoots.certificate.mismatches.map((m) => m.field), ["gitEvidence.roots[0].mode", "gitEvidence.roots[0].type", "gitEvidence.roots[1].mode", "gitEvidence.roots[1].type", "gitEvidence.roots[2].objectSha"]);
  const wrongRemote = await attest({ git: gitEvidence({ remoteName: "upstream", repository: { ...repoIdentity, owner: "Other" } }) });
  assert.deepEqual(wrongRemote.certificate.mismatches.map((m) => m.field), ["gitEvidence.repository.owner", "gitEvidence.remoteName"]);
  const staleAndBroken = await attest({ git: gitEvidence({ ref: { fullRef: "refs/heads/careeros/private-beta", sha: OTHER_SHA }, commit: { sha: COMMIT, treeSha: OTHER_SHA } }) });
  assert.equal(staleAndBroken.certificate.status, STATUS.MISMATCH);
});

test("provider evidence mismatches fail closed without normalization", async () => {
  const drifted = { requestedId: service.id, ...service, id: "srv-other", branch: "careos/private-beta", rootDirectory: "staffordos/ui/operator-frontend/careos-beta", region: "frankfurt", type: "static_site", repository: { ...repoIdentity, name: "cart-agent-fork" } };
  const result = await attest({ provider: providerEvidence({ name: "fly", accountId: "tea-other", services: [drifted], databases: [{ requestedId: database.id, id: database.id, region: "frankfurt" }] }) });
  assert.equal(result.certificate.status, STATUS.MISMATCH);
  assert.deepEqual(result.certificate.mismatches.map((m) => m.field), [
    "providerEvidence.name", "providerEvidence.accountId",
    "providerEvidence.services[0].id", "providerEvidence.services[0].type", "providerEvidence.services[0].repository.name", "providerEvidence.services[0].branch", "providerEvidence.services[0].rootDirectory", "providerEvidence.services[0].region",
    "providerEvidence.databases[0].region",
  ]);
  assert.deepEqual(result.certificate.mismatches[5], { field: "providerEvidence.services[0].branch", expected: "careeros/private-beta", observed: "careos/private-beta" });
  throwsCode(() => assertPass(result.certificateText, policy()), "not_pass");
  assert.match(renderReport(result.certificateText, policy()), /^Status: MISMATCH\n/);
});

test("incomplete, partial, unavailable, or unshaped evidence throws instead of issuing a certificate", async () => {
  await rejects(() => attestCertificate({ candidateText: candidateText(), signer, trustedKeys, expectedAudience: AUDIENCE, clock, collectProviderEvidence: async () => providerEvidence() }), "git_evidence_collector_missing");
  await rejects(() => attestCertificate({ candidateText: candidateText(), signer, trustedKeys, expectedAudience: AUDIENCE, clock, collectGitEvidence: async () => gitEvidence() }), "provider_evidence_collector_missing");
  await rejects(() => attest({ git: null }), "git_evidence_unavailable");
  await rejects(() => attestCertificate({ candidateText: candidateText(), signer, trustedKeys, expectedAudience: AUDIENCE, clock, collectGitEvidence: async () => gitEvidence(), collectProviderEvidence: async () => undefined }), "provider_evidence_unavailable");
  await rejects(() => attest({ provider: "ok" }), "schema_type_mismatch");
  await rejects(() => attest({ git: gitEvidence({ roots: gitEvidence().roots.slice(0, 2) }) }), "git_evidence_roots_incomplete");
  await rejects(() => attest({ git: gitEvidence({ roots: gitEvidence().roots.map((r, i) => (i === 1 ? { ...r, path: "staffordos/ui/other" } : r)) }) }), "git_evidence_root_not_requested");
  await rejects(() => attest({ git: gitEvidence({ ref: { fullRef: "refs/heads/main", sha: COMMIT } }) }), "git_evidence_ref_not_requested");
  await rejects(() => attest({ git: gitEvidence({ commit: { sha: OTHER_SHA, treeSha: TREE } }) }), "git_evidence_commit_not_requested");
  await rejects(() => attest({ git: { ...gitEvidence(), commit: { sha: COMMIT } } }), "schema_required_missing");
  await rejects(() => attest({ git: { ...gitEvidence(), roots: [] } }), "schema_min_items");
  await rejects(() => attest({ git: gitEvidence({ repository: { owner: "RStaff", name: "cart-agent" } }) }), "schema_required_missing");
  await rejects(() => attest({ provider: providerEvidence({ services: [] }) }), "schema_min_items");
  await rejects(() => attest({ provider: providerEvidence({ services: [{ requestedId: "srv-other", ...service }] }) }), "provider_evidence_service_not_requested");
  await rejects(() => attest({ provider: providerEvidence({ services: [{ requestedId: service.id, ...service }, { requestedId: "srv-2", ...service, id: "srv-2" }] }) }), "provider_evidence_services_incomplete");
  const partialService = { requestedId: service.id, ...service }; delete partialService.region;
  await rejects(() => attest({ provider: providerEvidence({ services: [partialService] }) }), "schema_required_missing");
  await rejects(() => attest({ provider: providerEvidence({ accountId: "" }) }), "schema_pattern_mismatch");
});

// ---------------------------------------------------------------------------
// Secret exclusion and error safety
// ---------------------------------------------------------------------------

test("evidence shapes are allowlisted: raw output, headers, env, tokens, bodies and metadata are rejected at every level", async () => {
  const extras = {
    stdout: "38e9bd60\trefs/heads/careeros/private-beta", stderr: "warning", headers: { authorization: "Bearer x" }, env: { RENDER_API_KEY: "x" }, token: "x", cookie: "x",
    assertion: "x", password: "x", privateKey: "x", responseBody: "{}", metadata: { anything: true }, command: "git ls-remote", note: "harmless", publicKey: "x",
  };
  for (const [key, value] of Object.entries(extras)) {
    await rejects(() => attest({ git: { ...gitEvidence(), [key]: value } }), "schema_additional_property");
    await rejects(() => attest({ git: gitEvidence({ repository: { ...repoIdentity, [key]: value } }) }), "schema_additional_property");
    await rejects(() => attest({ git: gitEvidence({ roots: [{ ...gitEvidence().roots[0], [key]: value }, ...gitEvidence().roots.slice(1)] }) }), "schema_additional_property");
    await rejects(() => attest({ provider: { ...providerEvidence(), [key]: value } }), "schema_additional_property");
    await rejects(() => attest({ provider: providerEvidence({ services: [{ requestedId: service.id, ...service, [key]: value }] }) }), "schema_additional_property");
    await rejects(() => attest({ provider: providerEvidence({ databases: [{ requestedId: database.id, ...database, [key]: value }] }) }), "schema_additional_property");
  }
  await rejects(() => attest({ git: gitEvidence({ remoteName: "origin\nauthorization: Bearer x" }) }), "schema_pattern_mismatch");
  await rejects(() => attest({ git: gitEvidence({ remoteName: `https://user:${GH_PREFIX}secret@host/x` }) }), "schema_pattern_mismatch");
  await rejects(() => attest({ git: gitEvidence({ remoteName: "user:pass@host" }) }), "schema_pattern_mismatch");
  const credentialShaped = CREDENTIAL_PREFIXES.map(credentialShapedString);
  assert.ok(credentialShaped[0].startsWith(GH_PREFIX) && credentialShaped[2].startsWith(GL_PREFIX), "assembled fixtures must reproduce the real prefixes at runtime");
  for (const value of credentialShaped) {
    await rejects(() => attest({ provider: providerEvidence({ accountId: value }) }), "credential_shaped_value");
  }
  const { certificateText } = await attest();
  for (const literal of ["stdout", "stderr", "header", "authorization", "token", "cookie", "password", "privateKey", "metadata", "Bearer", "BEGIN"]) assert.doesNotMatch(certificateText, new RegExp(literal, "i"));
});

test("collector failures and rejected values never reach errors, reports, or serialized output", async () => {
  const PLANTED = shaped(GH_PREFIX, "SYNTHETIC_", "PLANTED_", "0123456789abcdef");
  const failing = async () => { const error = new Error(`fatal: Authentication failed for 'https://x:${PLANTED}@github.com/RStaff/cart-agent' stderr: remote: Invalid username or password`); error.stdout = PLANTED; error.stderr = PLANTED; error.response = { body: PLANTED, headers: { authorization: `Bearer ${PLANTED}` } }; throw error; };
  const inspect = (error) => JSON.stringify({ message: error.message, code: error.code, path: error.path, cause: error.cause, keys: Object.getOwnPropertyNames(error), stack: error.stack });
  let caught;
  try { await attestCertificate({ candidateText: candidateText(), signer, trustedKeys, expectedAudience: AUDIENCE, clock, collectGitEvidence: failing, collectProviderEvidence: async () => providerEvidence() }); } catch (error) { caught = error; }
  assert.equal(caught.code, "git_evidence_collection_failed");
  assert.equal(caught.cause, undefined);
  assert.doesNotMatch(inspect(caught), new RegExp(PLANTED));
  assert.doesNotMatch(inspect(caught), /Authentication|stderr|Bearer/);
  try { await attestCertificate({ candidateText: candidateText(), signer, trustedKeys, expectedAudience: AUDIENCE, clock, collectGitEvidence: async () => gitEvidence(), collectProviderEvidence: failing }); } catch (error) { caught = error; }
  assert.equal(caught.code, "provider_evidence_collection_failed");
  assert.doesNotMatch(inspect(caught), new RegExp(PLANTED));
  // Rejected values and rejected property names are not echoed.
  try { await attest({ git: gitEvidence({ remoteName: `origin ${PLANTED}` }) }); } catch (error) { caught = error; }
  assert.equal(caught.code, "schema_pattern_mismatch");
  assert.doesNotMatch(inspect(caught), new RegExp(PLANTED));
  try { await attest({ git: { ...gitEvidence(), [PLANTED]: "x" } }); } catch (error) { caught = error; }
  assert.equal(caught.code, "schema_additional_property");
  assert.equal(caught.path, "");
  assert.doesNotMatch(inspect(caught), new RegExp(PLANTED));
  try { toPlainData({ a: { [PLANTED]: () => 1 } }); } catch (error) { caught = error; }
  assert.doesNotMatch(inspect(caught), new RegExp(PLANTED));
  const { certificateText } = await attest();
  try { assertNoDownstreamOverrides(certificateText, { [PLANTED]: "x" }, policy()); } catch (error) { caught = error; }
  assert.equal(caught.code, "override_unknown_field");
  assert.doesNotMatch(inspect(caught), new RegExp(PLANTED));
  // Signer failure carrying a secret is reduced to a stable code.
  try { await attest({ sign: { algorithm: "Ed25519", keyId: GATE_KEY_ID, sign: () => { throw new Error(PLANTED); } } }); } catch (error) { caught = error; }
  assert.equal(caught.code, "signing_failed");
  assert.doesNotMatch(inspect(caught), new RegExp(PLANTED));
  assert.doesNotMatch(certificateText, new RegExp(PLANTED));
  assert.doesNotMatch(renderReport(certificateText, policy()), new RegExp(PLANTED));
});

// ---------------------------------------------------------------------------
// Re-derivation, immutability, canonicalization
// ---------------------------------------------------------------------------

test("certificates are re-derived on every verification; forged status or mismatches are rejected even when re-signed by the trusted key", async () => {
  const mismatch = await attest({ provider: providerEvidence({ services: [{ requestedId: service.id, ...service, branch: "careos/private-beta" }] }) });
  const forge = (fn) => { const c = JSON.parse(mismatch.certificateText); fn(c); return resign(c, signer); };
  throwsCode(() => verifyCertificate(forge((c) => { c.status = "PASS"; }), policy()), "status_not_derived");
  throwsCode(() => verifyCertificate(forge((c) => { c.status = "PASS"; c.mismatches = []; }), policy()), "mismatches_not_derived");
  throwsCode(() => verifyCertificate(forge((c) => { c.providerEvidence.services[0].branch = "careeros/private-beta"; }), policy()), "mismatches_not_derived");
  throwsCode(() => verifyCertificate(forge((c) => { c.candidate.commit.sha = OTHER_SHA; }), policy()), "candidate_digest_mismatch");
  throwsCode(() => verifyCertificate(forge((c) => { c.status = "BLOCKED"; }), policy()), "schema_enum_mismatch");
  throwsCode(() => verifyCertificate(forge((c) => { c.approvedBy = "operator"; }), policy()), "schema_additional_property");
  throwsCode(() => verifyCertificate(forge((c) => { c.generatedAtUtc = "2026-09-08T12:06:00.000Z"; }), policy({ clock: () => NOW_MS + 6 * 60 * 1000 })), "evidence_not_fresh");
  throwsCode(() => verifyCertificate(forge((c) => { c.candidate.roots.reverse(); }), policy()), "candidate_digest_mismatch");
  throwsCode(() => verifyCertificate(forge((c) => { c.gitEvidence.roots.reverse(); }), policy()), "git_evidence_root_not_requested");
  throwsCode(() => verifyCertificate(forge((c) => { c.candidate.branch.nameByteLength = "21"; }), policy()), "schema_type_mismatch");
  throwsCode(() => verifyCertificate(mismatch.certificateText.replace(/}$/, "}\n{}"), policy()), "json_trailing_tokens");
  throwsCode(() => verifyCertificate(mismatch.certificateText.replace('"status":"MISMATCH"', '"status":"MISMATCH","status":"PASS"'), policy()), "json_duplicate_key");
  throwsCode(() => verifyCertificate(JSON.parse(mismatch.certificateText), policy()), "json_text_not_string");
  throwsCode(() => assertPass(mismatch.certificateText, policy()), "not_pass");
  // Pretty-printed and escaped-unicode forms of the same certificate still verify (canonical form is signed).
  const pretty = JSON.stringify(JSON.parse(mismatch.certificateText), null, 2);
  assert.deepEqual(verifyCertificate(pretty, policy()), mismatch.certificate);
  const escaped = mismatch.certificateText.replace('"status":"MISMATCH"', '"status":"\\u004dISMATCH"');
  assert.deepEqual(verifyCertificate(escaped, policy()), mismatch.certificate);
});

test("verified certificates and every derived structure are recursively frozen; post-verification mutation fails", async () => {
  const { certificate, certificateText } = await attest();
  const verified = verifyCertificate(certificateText, policy());
  for (const target of [verified, verified.candidate, verified.candidate.provider.services[0].repository, verified.gitEvidence.roots[0], verified.signature, verified.mismatches]) assert.ok(Object.isFrozen(target));
  assert.throws(() => { verified.status = "MISMATCH"; }, TypeError);
  assert.throws(() => { verified.signature.keyId = "attacker-key"; }, TypeError);
  assert.throws(() => { verified.candidate.roots.push({}); }, TypeError);
  assert.throws(() => { verified.mismatches.push({ field: "x", expected: "a", observed: "b" }); }, TypeError);
  assert.throws(() => { delete verified.certificatePayloadSha256; }, TypeError);
  assert.throws(() => { Object.defineProperty(verified, "extra", { value: 1 }); }, TypeError);
  assert.deepEqual(verified, certificate);
  assert.ok(Object.isFrozen(certificate) && Object.isFrozen(parseCandidate(candidateText())));
  const g = gitEvidence();
  const fromMutable = await attestCertificate({ candidateText: candidateText(), signer, trustedKeys, expectedAudience: AUDIENCE, clock, collectGitEvidence: async () => g, collectProviderEvidence: async () => providerEvidence() });
  g.remoteName = "evil"; g.roots[0].mode = "120000";
  assert.equal(fromMutable.certificate.gitEvidence.remoteName, "origin");
  assert.equal(fromMutable.certificate.gitEvidence.roots[0].mode, REQUIRED_TREE_MODE);
});

// ---------------------------------------------------------------------------
// Downstream override protection
// ---------------------------------------------------------------------------

test("downstream proposals must be complete exact restatements; every node is compared, not only scalar leaves", async () => {
  const { certificate, certificateText } = await attest();
  const full = () => JSON.parse(JSON.stringify(certificate.candidate));
  const ok = assertNoDownstreamOverrides(certificateText, full(), policy());
  assert.equal(ok.status, STATUS.PASS);
  assert.deepEqual(ok, certificate);
  assert.ok(Object.isFrozen(ok) && Object.isFrozen(ok.candidate.commit) && Object.isFrozen(ok.candidate.provider.services[0].repository));
  assert.throws(() => { ok.candidate.audience = "x"; }, TypeError);
  assert.throws(() => { ok.candidate.roots.push({}); }, TypeError);
  assert.deepEqual(assertNoDownstreamOverrides(certificateText, certificate.candidate, policy()), certificate);
  const expect = (proposed, code, path) => assert.throws(() => assertNoDownstreamOverrides(certificateText, proposed, policy()), (error) => (error.code === code && error.path === path) || assert.fail(`${JSON.stringify(proposed).slice(0, 140)} -> ${error.message}`));
  const changed = (fn) => { const c = full(); fn(c); return c; };

  // Reproduced finding: leafless or empty containers must never escape comparison.
  expect({ roots: [] }, "override_shape_mismatch", "roots");
  expect({ provider: { services: [] } }, "override_shape_mismatch", "provider.services");
  expect({ provider: { databases: [] } }, "override_shape_mismatch", "provider.databases");
  expect({ provider: { services: [{}] } }, "override_incomplete", "provider.services[0]");
  expect({ deployHook: {} }, "override_unknown_field", "");
  expect({ deployHook: [] }, "override_unknown_field", "");
  expect({}, "override_incomplete", "");
  expect({ provider: {} }, "override_incomplete", "provider");
  expect({ provider: { services: [{ repository: {} }] } }, "override_incomplete", "provider.services[0].repository");
  expect(changed((c) => { c.roots = []; }), "override_shape_mismatch", "roots");
  expect(changed((c) => { c.provider.databases = []; }), "override_shape_mismatch", "provider.databases");
  expect(changed((c) => { c.provider.services[0].repository = {}; }), "override_incomplete", "provider.services[0].repository");
  expect(changed((c) => { c.provider.services[0].nested = {}; }), "override_unknown_field", "provider.services[0]");
  expect(changed((c) => { c.roots[0].extra = []; }), "override_unknown_field", "roots[0]");

  // Array truncation, expansion, and reordering.
  expect(changed((c) => { c.roots.pop(); }), "override_shape_mismatch", "roots");
  expect(changed((c) => { c.roots.push(c.roots[0]); }), "override_shape_mismatch", "roots");
  expect(changed((c) => { c.roots.reverse(); }), "override_rejected", "roots[0].path");
  expect(changed((c) => { c.provider.services.push({ ...c.provider.services[0], id: "srv-2" }); }), "override_shape_mismatch", "provider.services");
  expect(changed((c) => { c.provider.databases.push(c.provider.databases[0]); }), "override_shape_mismatch", "provider.databases");
  expect(changed((c) => { c.provider.services = [null, c.provider.services[0]]; }), "override_shape_mismatch", "provider.services");

  // Object key removal, addition, and type substitution.
  expect(changed((c) => { delete c.commit.treeSha; }), "override_incomplete", "commit");
  expect(changed((c) => { delete c.audience; }), "override_incomplete", "");
  expect(changed((c) => { delete c.provider.databasePolicy; }), "override_incomplete", "provider");
  expect(changed((c) => { c.commit.extra = "x"; }), "override_unknown_field", "commit");
  expect(changed((c) => { c.provider.services[0].envVars = { A: "1" }; }), "override_unknown_field", "provider.services[0]");
  expect(changed((c) => { c.commit = c.commit.sha; }), "override_type_mismatch", "commit");
  expect(changed((c) => { c.roots = { ...c.roots[0] }; }), "override_type_mismatch", "roots");
  expect(changed((c) => { c.provider.services[0].repository = "github.com/RStaff/cart-agent"; }), "override_type_mismatch", "provider.services[0].repository");
  expect(changed((c) => { c.audience = { value: c.audience }; }), "override_type_mismatch", "audience");
  expect(changed((c) => { c.roots[0].treeObjectSha = [c.roots[0].treeObjectSha]; }), "override_type_mismatch", "roots[0].treeObjectSha");
  expect(changed((c) => { c.branch.nameByteLength = String(c.branch.nameByteLength); }), "override_rejected", "branch.nameByteLength");
  expect(changed((c) => { c.audience = null; }), "override_rejected", "audience");
  expect(changed((c) => { c.provider.databasePolicy = true; }), "override_rejected", "provider.databasePolicy");

  // Differing values on every authority leaf.
  const leafCases = [
    [(c) => { c.audience = "other-gate"; }, "audience"],
    [(c) => { c.repository.forgeHost = "gitlab.com"; }, "repository.forgeHost"],
    [(c) => { c.repository.owner = "Other"; }, "repository.owner"],
    [(c) => { c.repository.name = "cart-agent-fork"; }, "repository.name"],
    [(c) => { c.repository.remoteName = "upstream"; }, "repository.remoteName"],
    [(c) => { c.branch.shortName = "careos/private-beta"; }, "branch.shortName"],
    [(c) => { c.branch.fullRef = "refs/heads/main"; }, "branch.fullRef"],
    [(c) => { c.commit.sha = OTHER_SHA; }, "commit.sha"],
    [(c) => { c.commit.treeSha = OTHER_SHA; }, "commit.treeSha"],
    [(c) => { c.roots[0].path = "staffordos/operator-issuer/"; }, "roots[0].path"],
    [(c) => { c.roots[2].treeObjectSha = OTHER_SHA; }, "roots[2].treeObjectSha"],
    [(c) => { c.provider.name = "fly"; }, "provider.name"],
    [(c) => { c.provider.accountId = "tea-other"; }, "provider.accountId"],
    [(c) => { c.provider.databasePolicy = "none"; }, "provider.databasePolicy"],
    [(c) => { c.provider.services[0].id = "srv-other"; }, "provider.services[0].id"],
    [(c) => { c.provider.services[0].branch = "careos/private-beta"; }, "provider.services[0].branch"],
    [(c) => { c.provider.services[0].rootDirectory = "staffordos/ui/operator-frontend/careos-beta"; }, "provider.services[0].rootDirectory"],
    [(c) => { c.provider.services[0].region = "frankfurt"; }, "provider.services[0].region"],
    [(c) => { c.provider.services[0].type = "static_site"; }, "provider.services[0].type"],
    [(c) => { c.provider.services[0].repository.forgeHost = "gitlab.com"; }, "provider.services[0].repository.forgeHost"],
    [(c) => { c.provider.services[0].repository.owner = "Other"; }, "provider.services[0].repository.owner"],
    [(c) => { c.provider.databases[0].id = "dpg-other"; }, "provider.databases[0].id"],
    [(c) => { c.provider.databases[0].region = "frankfurt"; }, "provider.databases[0].region"],
    [(c) => { c.candidatePayloadSha256 = "0".repeat(64); }, "candidatePayloadSha256"],
    [(c) => { c.candidateVersion = "staffordos.deployment_authority_candidate.v2"; }, "candidateVersion"],
  ];
  for (const [mutate, path] of leafCases) expect(changed(mutate), "override_rejected", path);

  // Unknown proposal names are never echoed; reported paths use only authenticated names.
  const unknownName = "zz_SHOULD_NOT_APPEAR_IN_ERRORS";
  let caught;
  try { assertNoDownstreamOverrides(certificateText, changed((c) => { c.provider.services[0][unknownName] = "x"; }), policy()); } catch (error) { caught = error; }
  assert.equal(caught.code, "override_unknown_field");
  assert.equal(caught.path, "provider.services[0]");
  assert.doesNotMatch(`${caught.message} ${caught.stack}`, new RegExp(unknownName));

  // Non-plain proposals remain rejected before comparison.
  throwsCode(() => assertNoDownstreamOverrides(certificateText, { get x() { return 1; } }, policy()), "data_accessor_forbidden");
  throwsCode(() => assertNoDownstreamOverrides(certificateText, changed((c) => { c.roots = [c.roots[0], , c.roots[2]]; }), policy()), "data_sparse_array");
  throwsCode(() => assertNoDownstreamOverrides(certificateText, changed((c) => { c.roots.extra = 1; }), policy()), "data_array_extra_properties");
  throwsCode(() => assertNoDownstreamOverrides(certificateText, changed((c) => { c.commit = Object.assign(Object.create({ inherited: 1 }), c.commit); }), policy()), "data_custom_prototype");
  throwsCode(() => assertNoDownstreamOverrides(certificateText, changed((c) => { c.commit.self = c; }), policy()), "data_cycle");
  throwsCode(() => assertNoDownstreamOverrides(certificateText, changed((c) => { c.commit.sha = undefined; }), policy()), "data_undefined_forbidden");
  throwsCode(() => assertNoDownstreamOverrides(certificateText, "branch", policy()), "override_proposal_invalid");
  throwsCode(() => assertNoDownstreamOverrides(certificateText, null, policy()), "override_proposal_invalid");
  throwsCode(() => assertNoDownstreamOverrides(certificateText, [], policy()), "override_proposal_invalid");
  // A proxy that behaves as plain data is cloned once; later trap changes cannot affect the comparison.
  let descriptorReads = 0;
  const proxied = new Proxy(full(), { getOwnPropertyDescriptor(target, key) { descriptorReads += 1; return Reflect.getOwnPropertyDescriptor(target, key); } });
  assert.deepEqual(assertNoDownstreamOverrides(certificateText, proxied, policy()), certificate);
  assert.ok(descriptorReads > 0);
  const lying = new Proxy(full(), { getOwnPropertyDescriptor(target, key) { const d = Reflect.getOwnPropertyDescriptor(target, key); if (key === "audience" && d) d.value = "other-gate"; return d; } });
  throwsCode(() => assertNoDownstreamOverrides(certificateText, lying, policy()), "override_rejected");
});

// ---------------------------------------------------------------------------
// Audience binding
// ---------------------------------------------------------------------------

test("audience is bound into the signed candidate and must equal the gate's expectedAudience", async () => {
  const { certificate, certificateText } = await attest();
  assert.equal(certificate.candidate.audience, AUDIENCE);
  assert.equal(verifyCertificate(certificateText, policy()).candidate.audience, AUDIENCE);
  assert.equal(assertPass(certificateText, policy()).candidate.audience, AUDIENCE);
  // Missing expectedAudience is rejected at every authority-conferring entry point.
  const noAudience = { trustedKeys, clock };
  for (const fn of [() => verifyCertificate(certificateText, noAudience), () => assertPass(certificateText, noAudience), () => assertNoDownstreamOverrides(certificateText, {}, noAudience), () => renderReport(certificateText, noAudience), () => reportPayload(certificateText, noAudience)]) {
    throwsCode(fn, "verification_policy_audience_missing");
  }
  // Mismatched expectedAudience is rejected at every authority-conferring entry point.
  const other = policy({ expectedAudience: "other-gate" });
  for (const fn of [() => verifyCertificate(certificateText, other), () => assertPass(certificateText, other), () => assertNoDownstreamOverrides(certificateText, {}, other), () => renderReport(certificateText, other), () => reportPayload(certificateText, other)]) {
    throwsCode(fn, "audience_mismatch");
  }
  // Missing certificate audience: a candidate without audience cannot be created or parsed.
  const { audience: _dropped, ...withoutAudience } = input;
  throwsCode(() => createCandidateText(withoutAudience), "candidate_input_keys_invalid");
  const c = candidateObject(); delete c.audience;
  throwsCode(() => parseCandidate(JSON.stringify(c)), "schema_required_missing");
  const stripped = JSON.parse(certificateText); delete stripped.candidate.audience;
  throwsCode(() => verifyCertificate(JSON.stringify(stripped), policy()), "schema_required_missing");
  throwsCode(() => verifyCertificate(resign({ ...JSON.parse(certificateText), candidate: (() => { const k = JSON.parse(certificateText).candidate; delete k.audience; return k; })() }, signer), policy()), "schema_required_missing");
  // Malformed audiences never enter a candidate.
  for (const [bad, code] of [["", "schema_pattern_mismatch"], [" gate", "schema_pattern_mismatch"], ["gate?x", "schema_pattern_mismatch"], ["gate#f", "schema_pattern_mismatch"], ["user:pw@gate", "schema_pattern_mismatch"], ["a".repeat(129), "schema_max_length"], [`${GH_PREFIX}abcdefghijklmnop`, "credential_shaped_value"], [42, "schema_type_mismatch"]]) {
    throwsCode(() => createCandidateText({ ...input, audience: bad }), code);
  }
  // The attesting gate refuses to issue for a foreign audience.
  await rejects(() => attest({ audience: "other-gate" }), "audience_mismatch");
  await rejects(() => attest({ text: createCandidateText({ ...input, audience: "other-gate" }) }), "audience_mismatch");
});

test("a certificate issued for gate A is rejected by gate B although both trust the same signing key", async () => {
  const gateA = policy({ expectedAudience: "gate-a" });
  const gateB = policy({ expectedAudience: "gate-b" });
  const forA = await attest({ text: createCandidateText({ ...input, audience: "gate-a" }), audience: "gate-a" });
  const forB = await attest({ text: createCandidateText({ ...input, audience: "gate-b" }), audience: "gate-b" });
  assert.equal(verifyCertificate(forA.certificateText, gateA).status, STATUS.PASS);
  assert.equal(verifyCertificate(forB.certificateText, gateB).status, STATUS.PASS);
  throwsCode(() => verifyCertificate(forA.certificateText, gateB), "audience_mismatch");
  throwsCode(() => verifyCertificate(forB.certificateText, gateA), "audience_mismatch");
  throwsCode(() => assertPass(forA.certificateText, gateB), "audience_mismatch");
  throwsCode(() => renderReport(forA.certificateText, gateB), "audience_mismatch");
  throwsCode(() => assertNoDownstreamOverrides(forA.certificateText, {}, gateB), "audience_mismatch");
  assert.notEqual(forA.certificateText, forB.certificateText);
  assert.notEqual(forA.certificate.candidate.candidatePayloadSha256, forB.certificate.candidate.candidatePayloadSha256);
  // Rewriting the audience on gate A's certificate cannot make gate B accept it.
  const edit = (fn) => { const c = JSON.parse(forA.certificateText); fn(c); return c; };
  throwsCode(() => verifyCertificate(JSON.stringify(edit((c) => { c.candidate.audience = "gate-b"; })), gateB), "certificate_digest_mismatch");
  throwsCode(() => verifyCertificate(JSON.stringify(edit((c) => { c.candidate.audience = "gate-b"; c.certificatePayloadSha256 = computeCertificateDigest(c); })), gateB), "signature_invalid");
  throwsCode(() => verifyCertificate(JSON.stringify(edit((c) => { c.candidate.audience = "gate-b"; c.candidate.candidatePayloadSha256 = Module.computeCandidateDigest(c.candidate); c.certificatePayloadSha256 = computeCertificateDigest(c); })), gateB), "signature_invalid");
  throwsCode(() => verifyCertificate(resign(edit((c) => { c.candidate.audience = "gate-b"; }), attackerAsGate), gateB), "signature_invalid");
  throwsCode(() => verifyCertificate(resign(edit((c) => { c.candidate.audience = "gate-b"; }), signer), gateB), "candidate_digest_mismatch");
  // Audience is a protected downstream field.
  throwsCode(() => assertNoDownstreamOverrides(forA.certificateText, { audience: "gate-b" }, gateA), "override_rejected");
  assert.equal(assertNoDownstreamOverrides(forA.certificateText, JSON.parse(forA.certificateText).candidate, gateA).candidate.audience, "gate-a");
  throwsCode(() => assertNoDownstreamOverrides(forA.certificateText, { audience: "gate-a" }, gateA), "override_incomplete");
  assert.match(renderReport(forA.certificateText, gateA), /^Status: PASS\n(?:.*\n)*?Audience: gate-a\n/);
});

// ---------------------------------------------------------------------------
// Trusted verification material
// ---------------------------------------------------------------------------

test("createTrustedKeys accepts only public Ed25519 material and never derives a public key from private input", () => {
  const publicPem = gateKeys.publicKey.export({ type: "spki", format: "pem" });
  const privatePem = gateKeys.privateKey.export({ type: "pkcs8", format: "pem" });
  const privateJwk = gateKeys.privateKey.export({ format: "jwk" });
  const accepted = createTrustedKeys({ a: gateKeys.publicKey, b: publicPem, c: publicPem.replace(/\n/g, "\r\n") });
  assert.deepEqual(accepted.keyIds, ["a", "b", "c"]);
  assert.ok(accepted.get("b").equals(gateKeys.publicKey));
  const inspect = (error) => JSON.stringify({ message: error.message, code: error.code, path: error.path, own: Object.getOwnPropertyNames(error).map((k) => String(error[k])), stack: error.stack });
  const rejectsKey = (material, code) => {
    let caught;
    try { createTrustedKeys({ k: material }); } catch (error) { caught = error; }
    assert.ok(caught instanceof DeploymentAuthorityError, `expected rejection for ${code}`);
    assert.equal(caught.code, code);
    const text = inspect(caught);
    assert.doesNotMatch(text, /BEGIN|PRIVATE|MC4CAQ|MCowBQ/);
    assert.ok(!text.includes(privateJwk.d) && !text.includes(privateJwk.x));
  };
  rejectsKey(gateKeys.privateKey, "trusted_key_private_rejected");
  rejectsKey(privatePem, "trusted_key_private_rejected");
  rejectsKey(privatePem.replace("PRIVATE KEY", "ENCRYPTED PRIVATE KEY"), "trusted_key_private_rejected");
  rejectsKey(shaped("-----", "BEGIN OPENSSH PRIVATE KEY-----\nAAAA\n-----END OPENSSH PRIVATE KEY-----\n"), "trusted_key_private_rejected");
  rejectsKey(privatePem.replace(/PRIVATE KEY/g, "PUBLIC KEY"), "trusted_key_invalid");
  rejectsKey(crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }).publicKey, "trusted_key_invalid");
  rejectsKey(crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }).publicKey.export({ type: "spki", format: "pem" }), "trusted_key_invalid");
  rejectsKey(crypto.generateKeyPairSync("ec", { namedCurve: "P-256" }).publicKey, "trusted_key_invalid");
  rejectsKey(crypto.generateKeyPairSync("ec", { namedCurve: "P-256" }).publicKey.export({ type: "spki", format: "pem" }), "trusted_key_invalid");
  rejectsKey(crypto.generateKeyPairSync("x25519").publicKey, "trusted_key_invalid");
  rejectsKey(gateKeys.publicKey.export({ type: "spki", format: "der" }), "trusted_key_invalid");
  rejectsKey(gateKeys.publicKey.export({ format: "jwk" }), "trusted_key_invalid");
  rejectsKey(crypto.createSecretKey(Buffer.alloc(32)), "trusted_key_private_rejected");
  rejectsKey("not a key", "trusted_key_invalid");
  rejectsKey(publicPem.replace("MCowBQ", "MCowBz"), "trusted_key_invalid");
  rejectsKey(`${publicPem}${publicPem}`, "trusted_key_invalid");
  rejectsKey(`${publicPem}\n${privatePem}`, "trusted_key_private_rejected");
  rejectsKey(publicPem.padEnd(5000, " "), "trusted_key_invalid");
  rejectsKey(null, "trusted_key_invalid");
  rejectsKey(undefined, "trusted_key_invalid");
  rejectsKey(42, "trusted_key_invalid");
  // The attacker's public key is accepted only if the gate chooses to trust it; nothing in a certificate can.
  const attackerTrusted = createTrustedKeys({ [GATE_KEY_ID]: attackerKeys.publicKey });
  assert.deepEqual(attackerTrusted.keyIds, [GATE_KEY_ID]);
});

// ---------------------------------------------------------------------------
// Multiple instances and human report
// ---------------------------------------------------------------------------

test("two unrelated certificate instances verify with no source change and reject each other's configuration", async () => {
  const a = await attest();
  const b = await attestFree();
  assert.equal(a.certificate.status, STATUS.PASS);
  assert.equal(b.certificate.status, STATUS.PASS);
  assert.notEqual(a.certificateText, b.certificateText);
  assert.equal(b.certificate.candidate.roots.length, 2);
  assert.equal(b.certificate.candidate.provider.services.length, 2);
  assert.equal(verifyCertificate(b.certificateText, freePolicy()).candidate.repository.forgeHost, FREE_FORGE);
  assert.equal(b.certificate.candidate.audience, FREE_AUDIENCE);
  throwsCode(() => verifyCertificate(b.certificateText, policy()), "audience_mismatch");
  throwsCode(() => verifyCertificate(a.certificateText, freePolicy()), "audience_mismatch");
  throwsCode(() => assertNoDownstreamOverrides(a.certificateText, { repository: { owner: "acme" } }, policy()), "override_rejected");
  throwsCode(() => assertNoDownstreamOverrides(b.certificateText, { provider: { databasePolicy: "required" } }, freePolicy()), "override_rejected");
  const reportB = renderReport(b.certificateText, freePolicy());
  assert.match(reportB, /Audience: acme-release-gate:eu\n/);
  assert.match(reportB, /Repository: git\.example\.org\/acme\/widgets \(remote upstream\)/);
  assert.match(reportB, /Database policy: none\n/);
  assert.doesNotMatch(reportB, /^Database (?!policy: )/m);
  assert.match(reportB, /Service app-web: type machine; repository git\.example\.org\/acme\/widgets; branch release\/2026\.09; root apps\/web; region iad/);
});

test("human report is derived from verified certificate text and never claims PASS for non-PASS certificates", async () => {
  const pass = await attest();
  const report = renderReport(pass.certificateText, policy());
  assert.match(report, /^Status: PASS\n/);
  assert.match(report, new RegExp(`Signed by: Ed25519 key ${GATE_KEY_ID}\n`));
  assert.match(report, /Audience: deploy-gate\.production\n/);
  throwsCode(() => renderReport(pass.certificateText, policy({ expectedAudience: "other-gate" })), "audience_mismatch");
  assert.match(report, /Repository: github\.com\/RStaff\/cart-agent \(remote origin\)/);
  assert.match(report, /Branch: careeros\/private-beta \(refs\/heads\/careeros\/private-beta; 21 UTF-8 bytes; hex 636172656572/);
  assert.match(report, /Root nested_careeros: staffordos\/ui\/operator-frontend\/careeros-beta/);
  assert.match(report, /Database policy: required\n/);
  assert.match(report, /Service srv-da16c39t0dsc73b434ig: type web_service; repository github\.com\/RStaff\/cart-agent; branch careeros\/private-beta/);
  assert.match(report, /Mismatches: 0\n/);
  assert.equal(reportPayload(pass.certificateText, policy()), pass.certificateText);
  const stale = await attest({ git: gitEvidence({ ref: { fullRef: "refs/heads/careeros/private-beta", sha: OTHER_SHA } }) });
  const staleReport = renderReport(stale.certificateText, policy());
  assert.match(staleReport, /^Status: STALE\n/);
  assert.doesNotMatch(staleReport, /Status: PASS/);
  assert.match(staleReport, /gitEvidence\.ref\.sha: expected 38e9bd60/);
  throwsCode(() => renderReport(resign({ ...JSON.parse(stale.certificateText), status: "PASS", mismatches: [] }, signer), policy()), "mismatches_not_derived");
  throwsCode(() => renderReport(resign(JSON.parse(stale.certificateText), attackerAsGate), policy()), "signature_invalid");
  throwsCode(() => renderReport(stale.certificate, policy()), "json_text_not_string");
  throwsCode(() => renderReport(stale.certificateText, policy({ trustedKeys: createTrustedKeys({ other: attackerKeys.publicKey }) })), "signature_key_untrusted");
});
