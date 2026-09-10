// StaffordOS deployment authority certificate v1.
//
// Generic validation policy. This module carries no mission-specific instance data:
// audience, forge host, repository identity, remote, branch, commit, root directories, provider
// account, database policy and service/database bindings all arrive in a candidate document
// and are proven by fresh Git and provider evidence collected during attestation.
//
// Authoritative path (the only way a certificate comes into existence):
//   1. parse and validate candidate instance data (JSON text, strict parser, schema, digest);
//   2. collect complete Git and provider evidence through injected collectors;
//   3. evaluate evidence against the candidate;
//   4. derive status and mismatches;
//   5. construct the canonical payload and its SHA-256 digest;
//   6. sign the canonical payload with the injected signer (Ed25519);
//   7. serialize;
//   8. independently parse and verify the serialized text with the gate's trusted policy;
//   9. enforce consumption-time expiry;
//  10. return an immutable verified certificate.
//
// Trust boundary rules enforced here:
//   * Trust-path input is accepted only as JSON text, parsed by a strict parser, and cloned
//     into deep-frozen plain data. Duplicate keys, prototype-pollution keys, trailing tokens,
//     malformed JSON, non-finite numbers, negative zero and unsafe integers are rejected.
//   * In-process values (collector results, override proposals) are defensively cloned and
//     must be plain JSON data: no custom prototypes, accessors, functions, symbols, BigInt,
//     Date, Buffer, typed arrays, sparse arrays, undefined or cycles.
//   * The JSON schema file is loaded and enforced at runtime. Every object is closed and every
//     evidence field is allowlisted, so raw command output, stderr, headers, environment
//     values, tokens, cookies, assertions, passwords, private keys, provider response bodies
//     and arbitrary metadata can never be serialized into a certificate.
//   * Authenticity: the certificate carries only { algorithm, keyId, value }. Public keys,
//     private keys and trust decisions are never read from the certificate; the consuming gate
//     supplies a trusted-key set and the signer is injected. Unknown, substituted or
//     attacker-controlled keys, and any change to payload, signature, key id or algorithm,
//     fail closed.
//   * Status is never accepted from a caller. PASS, STALE and MISMATCH are derived from the
//     candidate and the embedded evidence, and re-derived every time a certificate is verified.
//   * Consumption expiry: verification requires the gate's clock and a bounded maximum
//     certificate age; the certificate cannot select or weaken that policy.
//   * Audience binding: the signed candidate names the gate audience it was issued for, and the
//     verifying gate supplies its own expectedAudience. A certificate issued for one gate is
//     rejected by any other gate, even when both trust the same signing key.
//   * Collector failures surface only as stable error codes. No cause, output or value is attached.
//   * Incomplete or unavailable evidence throws; a certificate is never issued for it.

import crypto from "node:crypto";
import fs from "node:fs";

export const CERTIFICATE_VERSION = "staffordos.deployment_authority_certificate.v1";
export const CANDIDATE_VERSION = "staffordos.deployment_authority_candidate.v1";
export const SIGNATURE_ALGORITHM = "Ed25519";
export const REQUIRED_TREE_MODE = "040000";
export const REQUIRED_TREE_TYPE = "tree";
export const STATUS = Object.freeze({ PASS: "PASS", STALE: "STALE", MISMATCH: "MISMATCH" });
export const DATABASE_POLICY = Object.freeze({ REQUIRED: "required", NONE: "none" });
export const EVIDENCE_MAX_AGE_MS = 5 * 60 * 1000;
export const EVIDENCE_CLOCK_SKEW_MS = 60 * 1000;
export const DEFAULT_MAX_CERTIFICATE_AGE_MS = 15 * 60 * 1000;
export const DEFAULT_CERTIFICATE_CLOCK_SKEW_MS = 60 * 1000;
export const MAX_CERTIFICATE_AGE_LIMIT_MS = 24 * 60 * 60 * 1000;
export const MAX_CERTIFICATE_CLOCK_SKEW_LIMIT_MS = 5 * 60 * 1000;
export const MAX_JSON_TEXT_BYTES = 1024 * 1024;
export const MAX_DATA_DEPTH = 32;

const ED25519_SIGNATURE_BYTES = 64;
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const SCHEMA_URL = new URL("./deployment_authority_certificate_v1.schema.json", import.meta.url);
const SIGNATURE_FIELD = "signature";
const CERTIFICATE_DIGEST_FIELD = "certificatePayloadSha256";
const CANDIDATE_DIGEST_FIELD = "candidatePayloadSha256";

// Defense in depth for identifier-typed fields: well-known credential prefixes are rejected
// even when they fit the identifier charset. The structural allowlist remains the primary control.
const CREDENTIAL_SHAPED_RE = /^(?:gh[pousr]_|github_pat_|glpat-|xox[abprs]-|[sr]k_(?:live|test)_|AKIA[0-9A-Z]{12}|ASIA[0-9A-Z]{12}|rnd_|AIza|eyJ[A-Za-z0-9_-]{8,}|-----BEGIN)/;

export class DeploymentAuthorityError extends Error {
  constructor(code, path) {
    super(path ? `deployment_authority_${code} at ${path}` : `deployment_authority_${code}`);
    this.name = "DeploymentAuthorityError";
    this.code = code;
    this.path = path ?? null;
  }
}

function fail(code, path) {
  throw new DeploymentAuthorityError(code, path);
}

function assert(condition, code, path) {
  if (!condition) fail(code, path);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function joinPath(prefix, key) {
  return `${prefix}/${String(key).replace(/~/g, "~0").replace(/\//g, "~1")}`;
}

function deepFreeze(value) {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function omitKeys(object, keys) {
  const out = {};
  for (const key of Object.keys(object)) if (!keys.includes(key)) out[key] = object[key];
  return out;
}

function assertJsonNumber(value, path) {
  assert(typeof value === "number" && Number.isFinite(value), "number_not_finite", path);
  assert(!Object.is(value, -0), "number_negative_zero", path);
  assert(!Number.isInteger(value) || Number.isSafeInteger(value), "number_unsafe_integer", path);
}

// ---------------------------------------------------------------------------
// Strict JSON text parser (RFC 8259 grammar, plus the rejections listed above).
// ---------------------------------------------------------------------------

const JSON_NUMBER_RE = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/;
const JSON_NUMBER_CHAR_RE = /[-+0-9.eE]/;
const LONE_SURROGATE_RE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
const SIMPLE_ESCAPES = Object.freeze({ '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" });

export function parseJsonText(text) {
  assert(typeof text === "string", "json_text_not_string");
  assert(Buffer.byteLength(text, "utf8") <= MAX_JSON_TEXT_BYTES, "json_text_too_large");
  let index = 0;

  const position = () => `#${index}`;
  const isWhitespace = (ch) => ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
  const skipWhitespace = () => { while (index < text.length && isWhitespace(text[index])) index += 1; };
  const expect = (ch) => {
    assert(index < text.length, "json_unexpected_end", position());
    assert(text[index] === ch, "json_malformed", position());
    index += 1;
  };

  function parseString() {
    expect('"');
    let out = "";
    for (;;) {
      assert(index < text.length, "json_unterminated_string", position());
      const ch = text[index++];
      if (ch === '"') break;
      if (ch === "\\") {
        const escape = text[index++];
        if (escape === "u") {
          const hex = text.slice(index, index + 4);
          assert(/^[0-9a-fA-F]{4}$/.test(hex), "json_bad_unicode_escape", position());
          index += 4;
          out += String.fromCharCode(Number.parseInt(hex, 16));
        } else {
          assert(Object.hasOwn(SIMPLE_ESCAPES, escape), "json_bad_escape", position());
          out += SIMPLE_ESCAPES[escape];
        }
      } else {
        assert(ch.charCodeAt(0) >= 0x20, "json_control_character", position());
        out += ch;
      }
    }
    assert(!LONE_SURROGATE_RE.test(out), "json_lone_surrogate", position());
    return out;
  }

  function parseNumber() {
    const start = index;
    while (index < text.length && JSON_NUMBER_CHAR_RE.test(text[index])) index += 1;
    const token = text.slice(start, index);
    assert(JSON_NUMBER_RE.test(token), "json_malformed_number", `#${start}`);
    const value = Number(token);
    assertJsonNumber(value, `#${start}`);
    return value;
  }

  function parseLiteral(word, value) {
    assert(text.startsWith(word, index), "json_malformed", position());
    index += word.length;
    return value;
  }

  function parseObject(depth) {
    expect("{");
    const out = {};
    skipWhitespace();
    if (text[index] === "}") { index += 1; return out; }
    for (;;) {
      skipWhitespace();
      const keyPosition = position();
      const key = parseString();
      assert(!FORBIDDEN_KEYS.has(key), "json_forbidden_key", keyPosition);
      assert(!Object.hasOwn(out, key), "json_duplicate_key", keyPosition);
      skipWhitespace();
      expect(":");
      out[key] = parseValue(depth + 1);
      skipWhitespace();
      if (text[index] === ",") { index += 1; continue; }
      expect("}");
      return out;
    }
  }

  function parseArray(depth) {
    expect("[");
    const out = [];
    skipWhitespace();
    if (text[index] === "]") { index += 1; return out; }
    for (;;) {
      out.push(parseValue(depth + 1));
      skipWhitespace();
      if (text[index] === ",") { index += 1; continue; }
      expect("]");
      return out;
    }
  }

  function parseValue(depth) {
    assert(depth <= MAX_DATA_DEPTH, "json_depth_exceeded", position());
    skipWhitespace();
    assert(index < text.length, "json_unexpected_end", position());
    const ch = text[index];
    if (ch === "{") return parseObject(depth);
    if (ch === "[") return parseArray(depth);
    if (ch === '"') return parseString();
    if (ch === "t") return parseLiteral("true", true);
    if (ch === "f") return parseLiteral("false", false);
    if (ch === "n") return parseLiteral("null", null);
    if (ch === "-" || (ch >= "0" && ch <= "9")) return parseNumber();
    return fail("json_malformed", position());
  }

  const value = parseValue(0);
  skipWhitespace();
  assert(index === text.length, "json_trailing_tokens", position());
  return deepFreeze(value);
}

// ---------------------------------------------------------------------------
// Defensive clone of in-process values into deep-frozen plain JSON data.
// ---------------------------------------------------------------------------

function assertDataDescriptor(descriptor, path) {
  assert(Object.hasOwn(descriptor, "value") && descriptor.get === undefined && descriptor.set === undefined, "data_accessor_forbidden", path);
  assert(descriptor.enumerable === true, "data_non_enumerable_forbidden", path);
}

function clonePlain(value, path, ancestors, depth) {
  assert(depth <= MAX_DATA_DEPTH, "data_depth_exceeded", path);
  switch (typeof value) {
    case "string":
    case "boolean":
      return value;
    case "number":
      assertJsonNumber(value, path);
      return value;
    case "object":
      break;
    default:
      return fail(`data_${typeof value}_forbidden`, path);
  }
  if (value === null) return null;
  assert(!ancestors.includes(value), "data_cycle", path);
  assert(Object.getOwnPropertySymbols(value).length === 0, "data_symbol_key_forbidden", path);
  const prototype = Object.getPrototypeOf(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  ancestors.push(value);
  try {
    if (Array.isArray(value)) {
      assert(prototype === Array.prototype, "data_custom_prototype", path);
      const out = [];
      for (let i = 0; i < value.length; i += 1) {
        const descriptor = descriptors[String(i)];
        assert(descriptor !== undefined, "data_sparse_array", joinPath(path, i));
        assertDataDescriptor(descriptor, joinPath(path, i));
        out.push(clonePlain(descriptor.value, joinPath(path, i), ancestors, depth + 1));
      }
      assert(Object.keys(descriptors).length === value.length + 1, "data_array_extra_properties", path);
      return out;
    }
    assert(prototype === Object.prototype || prototype === null, "data_custom_prototype", path);
    const out = {};
    for (const key of Object.keys(descriptors)) {
      // Property names of not-yet-validated data are untrusted and are never echoed in error
      // paths; only array indices and the parent object path are reported.
      assert(!FORBIDDEN_KEYS.has(key), "data_forbidden_key", path);
      assertDataDescriptor(descriptors[key], path);
      out[key] = clonePlain(descriptors[key].value, path, ancestors, depth + 1);
    }
    return out;
  } finally {
    ancestors.pop();
  }
}

export function toPlainData(value) {
  return deepFreeze(clonePlain(value, "", [], 0));
}

// ---------------------------------------------------------------------------
// Canonical serialization and digests over validated plain data only.
// ---------------------------------------------------------------------------

function serializeCanonical(value) {
  if (Array.isArray(value)) return `[${value.map(serializeCanonical).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${serializeCanonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function canonicalize(value) {
  return serializeCanonical(toPlainData(value));
}

function sha256Hex(text) {
  return crypto.createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
}

function computePayloadDigest(document, excludedFields) {
  const data = toPlainData(document);
  assert(isPlainObject(data), "payload_not_object");
  return sha256Hex(serializeCanonical(omitKeys(data, excludedFields)));
}

// Candidate digest: every candidate field except the digest itself.
export function computeCandidateDigest(candidate) {
  return computePayloadDigest(candidate, [CANDIDATE_DIGEST_FIELD]);
}

// Certificate digest: every certificate field except the digest and the signature envelope.
// The signature is computed over the canonical certificate without the envelope, which
// therefore covers the digest as well as every payload field.
export function computeCertificateDigest(certificate) {
  return computePayloadDigest(certificate, [CERTIFICATE_DIGEST_FIELD, SIGNATURE_FIELD]);
}

function signedMessageBytes(certificate) {
  return Buffer.from(serializeCanonical(omitKeys(certificate, [SIGNATURE_FIELD])), "utf8");
}

// ---------------------------------------------------------------------------
// Runtime enforcement of the JSON schema file (closed subset of draft 2020-12).
// Unsupported keywords and under-constrained schemas are rejected at load time so the
// schema document and the runtime validator can never silently diverge.
// ---------------------------------------------------------------------------

const SCHEMA_ANNOTATION_KEYWORDS = new Set(["$schema", "$id", "$comment", "title", "description"]);
const SCHEMA_KEYWORDS_BY_TYPE = Object.freeze({
  string: new Set(["type", "const", "enum", "pattern", "minLength", "maxLength"]),
  integer: new Set(["type", "const", "minimum", "maximum"]),
  object: new Set(["type", "required", "properties", "additionalProperties"]),
  array: new Set(["type", "items", "minItems", "maxItems", "uniqueItems"]),
});

function resolveRef(root, ref, path) {
  assert(typeof ref === "string" && /^#\/\$defs\/[A-Za-z][A-Za-z0-9]*$/.test(ref), "schema_ref_unsupported", path);
  const name = ref.slice("#/$defs/".length);
  assert(isPlainObject(root.$defs) && Object.hasOwn(root.$defs, name), "schema_ref_unresolved", path);
  return root.$defs[name];
}

function assertSubschemaWellFormed(schema, root, path) {
  assert(isPlainObject(schema), "schema_node_invalid", path);
  const keys = Object.keys(schema).filter((key) => !SCHEMA_ANNOTATION_KEYWORDS.has(key));
  if (Object.hasOwn(schema, "$ref")) {
    assert(keys.length === 1, "schema_ref_with_siblings", path);
    resolveRef(root, schema.$ref, path);
    return;
  }
  const type = schema.type;
  assert(typeof type === "string" && Object.hasOwn(SCHEMA_KEYWORDS_BY_TYPE, type), "schema_type_unsupported", path);
  const allowed = SCHEMA_KEYWORDS_BY_TYPE[type];
  for (const key of keys) assert(allowed.has(key), "schema_keyword_unsupported", joinPath(path, key));
  if (type === "string") {
    const closed = Object.hasOwn(schema, "const") || Object.hasOwn(schema, "enum");
    if (Object.hasOwn(schema, "const")) assert(typeof schema.const === "string", "schema_const_invalid", path);
    if (Object.hasOwn(schema, "enum")) assert(Array.isArray(schema.enum) && schema.enum.length > 0 && schema.enum.every((item) => typeof item === "string"), "schema_enum_invalid", path);
    if (Object.hasOwn(schema, "pattern")) assert(typeof schema.pattern === "string" && schema.pattern.startsWith("^") && schema.pattern.endsWith("$"), "schema_pattern_unanchored", path);
    if (Object.hasOwn(schema, "minLength")) assert(Number.isSafeInteger(schema.minLength) && schema.minLength >= 0, "schema_min_length_invalid", path);
    if (Object.hasOwn(schema, "maxLength")) assert(Number.isSafeInteger(schema.maxLength) && schema.maxLength >= 0, "schema_max_length_invalid", path);
    assert(closed || (Object.hasOwn(schema, "pattern") && Object.hasOwn(schema, "maxLength")), "schema_string_unbounded", path);
  } else if (type === "integer") {
    for (const key of ["const", "minimum", "maximum"]) if (Object.hasOwn(schema, key)) assert(Number.isSafeInteger(schema[key]), `schema_${key}_invalid`, path);
    assert(Object.hasOwn(schema, "const") || (Object.hasOwn(schema, "minimum") && Object.hasOwn(schema, "maximum")), "schema_integer_unbounded", path);
  } else if (type === "object") {
    assert(schema.additionalProperties === false, "schema_object_not_closed", path);
    assert(isPlainObject(schema.properties), "schema_properties_invalid", path);
    const propertyKeys = Object.keys(schema.properties).sort();
    assert(Array.isArray(schema.required) && serializeCanonical([...schema.required].sort()) === serializeCanonical(propertyKeys), "schema_required_not_exhaustive", path);
    for (const key of propertyKeys) {
      assert(!FORBIDDEN_KEYS.has(key), "schema_forbidden_property", joinPath(path, key));
      assertSubschemaWellFormed(schema.properties[key], root, joinPath(joinPath(path, "properties"), key));
    }
  } else if (type === "array") {
    assert(Number.isSafeInteger(schema.maxItems) && schema.maxItems >= 0, "schema_array_unbounded", path);
    if (Object.hasOwn(schema, "minItems")) assert(Number.isSafeInteger(schema.minItems) && schema.minItems >= 0 && schema.minItems <= schema.maxItems, "schema_min_items_invalid", path);
    if (Object.hasOwn(schema, "uniqueItems")) assert(schema.uniqueItems === true, "schema_unique_items_invalid", path);
    assertSubschemaWellFormed(schema.items, root, joinPath(path, "items"));
  }
}

function assertSchemaWellFormed(root) {
  assert(isPlainObject(root) && isPlainObject(root.$defs), "schema_root_invalid", "");
  for (const key of Object.keys(root)) assert(SCHEMA_ANNOTATION_KEYWORDS.has(key) || key === "$ref" || key === "$defs", "schema_keyword_unsupported", joinPath("", key));
  assert(typeof root.$ref === "string", "schema_root_ref_missing", "");
  resolveRef(root, root.$ref, "");
  for (const name of Object.keys(root.$defs)) assertSubschemaWellFormed(root.$defs[name], root, joinPath("/$defs", name));
}

function isAuthenticatedSignatureValue(schema, root, path) {
  return root === CERTIFICATE_SCHEMA && path === "/signature/value" && schema === CERTIFICATE_SCHEMA.$defs.signatureValue;
}

function validateNode(value, schema, root, path) {
  if (Object.hasOwn(schema, "$ref")) schema = resolveRef(root, schema.$ref, path);
  const type = schema.type;
  if (type === "string") {
    assert(typeof value === "string", "schema_type_mismatch", path);
    if (Object.hasOwn(schema, "const")) assert(value === schema.const, "schema_const_mismatch", path);
    if (Object.hasOwn(schema, "enum")) assert(schema.enum.includes(value), "schema_enum_mismatch", path);
    if (Object.hasOwn(schema, "minLength")) assert(value.length >= schema.minLength, "schema_min_length", path);
    if (Object.hasOwn(schema, "maxLength")) assert(value.length <= schema.maxLength, "schema_max_length", path);
    if (Object.hasOwn(schema, "pattern")) assert(new RegExp(schema.pattern, "u").test(value), "schema_pattern_mismatch", path);
    if (!isAuthenticatedSignatureValue(schema, root, path)) assert(!CREDENTIAL_SHAPED_RE.test(value), "credential_shaped_value", path);
    return;
  }
  if (type === "integer") {
    assert(Number.isSafeInteger(value), "schema_type_mismatch", path);
    if (Object.hasOwn(schema, "const")) assert(value === schema.const, "schema_const_mismatch", path);
    if (Object.hasOwn(schema, "minimum")) assert(value >= schema.minimum, "schema_minimum", path);
    if (Object.hasOwn(schema, "maximum")) assert(value <= schema.maximum, "schema_maximum", path);
    return;
  }
  if (type === "object") {
    assert(isPlainObject(value), "schema_type_mismatch", path);
    // Unknown property names are not echoed; only the parent path is reported.
    for (const key of Object.keys(value)) assert(Object.hasOwn(schema.properties, key), "schema_additional_property", path);
    for (const key of schema.required) assert(Object.hasOwn(value, key), "schema_required_missing", joinPath(path, key));
    for (const key of Object.keys(schema.properties)) validateNode(value[key], schema.properties[key], root, joinPath(path, key));
    return;
  }
  if (type === "array") {
    assert(Array.isArray(value), "schema_type_mismatch", path);
    if (Object.hasOwn(schema, "minItems")) assert(value.length >= schema.minItems, "schema_min_items", path);
    assert(value.length <= schema.maxItems, "schema_max_items", path);
    value.forEach((item, i) => validateNode(item, schema.items, root, joinPath(path, i)));
    if (schema.uniqueItems === true) assert(new Set(value.map(serializeCanonical)).size === value.length, "schema_unique_items", path);
    return;
  }
  fail("schema_type_unsupported", path);
}

function loadSchema() {
  const schema = parseJsonText(fs.readFileSync(SCHEMA_URL, "utf8"));
  assertSchemaWellFormed(schema);
  return schema;
}

export const CERTIFICATE_SCHEMA = loadSchema();

function validateAgainstSchema(value, definitionName) {
  assert(typeof definitionName === "string" && Object.hasOwn(CERTIFICATE_SCHEMA.$defs, definitionName), "schema_definition_unknown");
  const data = toPlainData(value);
  validateNode(data, CERTIFICATE_SCHEMA.$defs[definitionName], CERTIFICATE_SCHEMA, "");
  return data;
}

// ---------------------------------------------------------------------------
// Forge identity. One deterministic rule:
//   canonical identity = { forgeHost, owner, name } where forgeHost is the ASCII host name
//   lower-cased, without scheme, userinfo, port, path, query or fragment; owner and name are
//   byte-exact path segments with a trailing ".git" removed from the name.
// Accepted remote forms: https://host/owner/name[.git], ssh://[git@]host/owner/name[.git],
// git@host:owner/name[.git]. Anything else (credentials, ports, query strings, fragments,
// http/git/file schemes, IP literals, non-ASCII or punycode hosts) is rejected.
// ---------------------------------------------------------------------------

const FORGE_HOST_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
const SEGMENT_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const SCP_REMOTE_RE = /^git@([^@:/?#\s]+):([^:?#\s]+)$/;
const URL_REMOTE_RE = /^(https|ssh):\/\/([^/?#\s]*)(\/[^?#\s]*)$/;

export function normalizeForgeHost(host) {
  assert(typeof host === "string" && host.length > 0 && host.length <= 253, "forge_host_invalid");
  assert(/^[\x21-\x7e]+$/.test(host), "forge_host_non_ascii");
  const lower = host.toLowerCase();
  assert(FORGE_HOST_RE.test(lower), "forge_host_invalid");
  assert(!/^[0-9.]+$/.test(lower), "forge_host_ip_literal");
  assert(!lower.split(".").some((label) => label.startsWith("xn--")), "forge_host_punycode_rejected");
  return lower;
}

function repositorySegments(pathText) {
  const trimmed = pathText.replace(/^\/+/, "").replace(/\/+$/, "");
  const segments = trimmed.split("/");
  assert(segments.length === 2, "remote_url_path_invalid");
  const [owner, rawName] = segments;
  const name = rawName.endsWith(".git") ? rawName.slice(0, -4) : rawName;
  assert(SEGMENT_RE.test(owner) && SEGMENT_RE.test(name), "remote_url_path_invalid");
  assert(!CREDENTIAL_SHAPED_RE.test(owner) && !CREDENTIAL_SHAPED_RE.test(name), "credential_shaped_value");
  return { owner, name };
}

export function repositoryIdentityFromRemoteUrl(remoteUrl) {
  assert(typeof remoteUrl === "string" && remoteUrl.length > 0 && remoteUrl.length <= 2048, "remote_url_invalid");
  assert(/^[\x21-\x7e]+$/.test(remoteUrl), "remote_url_non_ascii");
  const scp = SCP_REMOTE_RE.exec(remoteUrl);
  if (scp) {
    const forgeHost = normalizeForgeHost(scp[1]);
    return deepFreeze({ forgeHost, ...repositorySegments(scp[2]) });
  }
  const url = URL_REMOTE_RE.exec(remoteUrl);
  assert(url !== null, "remote_url_scheme_unsupported");
  const [, scheme, authority, pathText] = url;
  assert(!authority.includes("["), "remote_url_ip_literal");
  let host = authority;
  if (authority.includes("@")) {
    assert(scheme === "ssh", "remote_url_credentials_rejected");
    const at = authority.lastIndexOf("@");
    assert(authority.slice(0, at) === "git", "remote_url_credentials_rejected");
    host = authority.slice(at + 1);
  }
  assert(!host.includes(":"), "remote_url_port_rejected");
  const forgeHost = normalizeForgeHost(host);
  return deepFreeze({ forgeHost, ...repositorySegments(pathText) });
}

// ---------------------------------------------------------------------------
// Semantic rules that the schema cannot express.
// ---------------------------------------------------------------------------

function utf8Hex(text) {
  return Buffer.from(text, "utf8").toString("hex");
}

function assertUtf8Metadata(text, hex, byteLength, path) {
  const bytes = Buffer.from(text, "utf8");
  assert(hex === bytes.toString("hex"), "utf8_hex_mismatch", path);
  assert(byteLength === bytes.length, "utf8_byte_length_mismatch", path);
}

function assertPathSegments(value, path) {
  for (const segment of value.split("/")) {
    assert(segment !== "." && segment !== "..", "path_segment_invalid", path);
    assert(!segment.endsWith(".lock"), "path_segment_invalid", path);
  }
  assert(!value.includes(".."), "path_segment_invalid", path);
}

// Git branch shorthand is stricter than the schema's bounded character grammar.
// Keep this deterministic and local so validation never depends on shelling out to Git.
function assertGitBranchName(value, path) {
  assert(typeof value === "string" && value.length > 0 && value.length <= 255, "branch_name_invalid", path);
  assert(value !== "@", "branch_name_invalid", path);
  assert(!value.startsWith("/") && !value.endsWith("/") && !value.includes("//"), "branch_name_invalid", path);
  assert(!value.startsWith("refs/heads/"), "branch_name_invalid", path);
  assert(!value.startsWith("-"), "branch_name_invalid", path);
  assert(!value.includes("@{") && !/[\x00-\x20\x7f~^:?*\x5b\x5d\x5c]/u.test(value), "branch_name_invalid", path);
  assert(!value.includes(".."), "path_segment_invalid", path);
  for (const segment of value.split("/")) {
    assert(segment !== "." && segment !== "..", "path_segment_invalid", path);
    assert(!segment.endsWith(".lock"), "path_segment_invalid", path);
    assert(!segment.startsWith(".") && !segment.endsWith("."), "branch_name_invalid", path);
  }
}

function assertGitBranchRef(value, path) {
  assert(typeof value === "string" && value.startsWith("refs/heads/"), "branch_ref_invalid", path);
  assertGitBranchName(value.slice("refs/heads/".length), path);
}

function assertUnique(values, code, path) {
  assert(new Set(values).size === values.length, code, path);
}

function assertUtcTimestamp(value, path) {
  const parsed = Date.parse(value);
  assert(Number.isFinite(parsed) && new Date(parsed).toISOString() === value, "timestamp_invalid", path);
  return parsed;
}

function sameRepositoryIdentity(a, b) {
  return a.forgeHost === b.forgeHost && a.owner === b.owner && a.name === b.name;
}

function assertCandidateSemantics(candidate) {
  // Integrity first: nothing else about the candidate is trusted until its digest recomputes.
  assert(candidate.candidatePayloadSha256 === computeCandidateDigest(candidate), "candidate_digest_mismatch", "/candidatePayloadSha256");
  const { repository, branch, commit, roots, provider } = candidate;
  assert(normalizeForgeHost(repository.forgeHost) === repository.forgeHost, "forge_host_not_canonical", "/repository/forgeHost");
  assert(branch.fullRef === `refs/heads/${branch.shortName}`, "branch_ref_inconsistent", "/branch/fullRef");
  assertGitBranchName(branch.shortName, "/branch/shortName");
  assertUtf8Metadata(branch.shortName, branch.nameUtf8Hex, branch.nameByteLength, "/branch");
  assert(commit.sha !== commit.treeSha, "commit_tree_identical", "/commit");
  roots.forEach((root, i) => {
    assertPathSegments(root.path, `/roots/${i}/path`);
    assertUtf8Metadata(root.path, root.pathUtf8Hex, root.pathByteLength, `/roots/${i}`);
  });
  assertUnique(roots.map((root) => root.role), "root_role_duplicate", "/roots");
  assertUnique(roots.map((root) => root.path), "root_path_duplicate", "/roots");
  const rootPaths = new Set(roots.map((root) => root.path));
  provider.services.forEach((service, i) => {
    assert(sameRepositoryIdentity(service.repository, repository), "service_repository_inconsistent", `/provider/services/${i}/repository`);
    assert(service.branch === branch.shortName, "service_branch_inconsistent", `/provider/services/${i}/branch`);
    assert(rootPaths.has(service.rootDirectory), "service_root_not_certified", `/provider/services/${i}/rootDirectory`);
  });
  assertUnique(provider.services.map((service) => service.id), "service_id_duplicate", "/provider/services");
  assertUnique(provider.databases.map((database) => database.id), "database_id_duplicate", "/provider/databases");
  if (provider.databasePolicy === DATABASE_POLICY.REQUIRED) {
    assert(provider.databases.length >= 1, "database_policy_required_empty", "/provider/databases");
  } else {
    assert(provider.databasePolicy === DATABASE_POLICY.NONE, "database_policy_invalid", "/provider/databasePolicy");
    assert(provider.databases.length === 0, "database_policy_none_with_databases", "/provider/databases");
  }
}

// Evidence must cover exactly what the candidate asked to be observed. Anything else is not
// evidence about this candidate and is rejected outright rather than reported as a mismatch.
function assertEvidenceCoverage(candidate, gitEvidence, providerEvidence) {
  assertGitBranchRef(gitEvidence.ref.fullRef, "/gitEvidence/ref/fullRef");
  providerEvidence.services.forEach((service, i) => assertGitBranchName(service.branch, `/providerEvidence/services/${i}/branch`));
  assert(gitEvidence.ref.fullRef === candidate.branch.fullRef, "git_evidence_ref_not_requested", "/gitEvidence/ref/fullRef");
  assert(gitEvidence.commit.sha === candidate.commit.sha, "git_evidence_commit_not_requested", "/gitEvidence/commit/sha");
  assert(gitEvidence.roots.length === candidate.roots.length, "git_evidence_roots_incomplete", "/gitEvidence/roots");
  candidate.roots.forEach((root, i) => assert(gitEvidence.roots[i].path === root.path, "git_evidence_root_not_requested", `/gitEvidence/roots/${i}/path`));
  assert(providerEvidence.services.length === candidate.provider.services.length, "provider_evidence_services_incomplete", "/providerEvidence/services");
  candidate.provider.services.forEach((service, i) => assert(providerEvidence.services[i].requestedId === service.id, "provider_evidence_service_not_requested", `/providerEvidence/services/${i}/requestedId`));
  if (candidate.provider.databasePolicy === DATABASE_POLICY.NONE) {
    assert(providerEvidence.databases.length === 0, "provider_evidence_databases_unexpected", "/providerEvidence/databases");
  } else {
    assert(providerEvidence.databases.length === candidate.provider.databases.length, "provider_evidence_databases_incomplete", "/providerEvidence/databases");
  }
  candidate.provider.databases.forEach((database, i) => assert(providerEvidence.databases[i].requestedId === database.id, "provider_evidence_database_not_requested", `/providerEvidence/databases/${i}/requestedId`));
}

function assertEvidenceFresh(generatedAtUtc, observedAtUtc, path) {
  const generatedAt = assertUtcTimestamp(generatedAtUtc, "/generatedAtUtc");
  const observedAt = assertUtcTimestamp(observedAtUtc, path);
  assert(generatedAt - observedAt <= EVIDENCE_MAX_AGE_MS, "evidence_not_fresh", path);
  assert(observedAt - generatedAt <= EVIDENCE_CLOCK_SKEW_MS, "evidence_observed_in_future", path);
}

function evaluateEvidence(candidate, gitEvidence, providerEvidence) {
  const mismatches = [];
  const compare = (field, expected, observed) => { if (expected !== observed) mismatches.push({ field, expected, observed }); };
  compare("gitEvidence.repository.forgeHost", candidate.repository.forgeHost, gitEvidence.repository.forgeHost);
  compare("gitEvidence.repository.owner", candidate.repository.owner, gitEvidence.repository.owner);
  compare("gitEvidence.repository.name", candidate.repository.name, gitEvidence.repository.name);
  compare("gitEvidence.remoteName", candidate.repository.remoteName, gitEvidence.remoteName);
  compare("gitEvidence.ref.sha", candidate.commit.sha, gitEvidence.ref.sha);
  compare("gitEvidence.commit.treeSha", candidate.commit.treeSha, gitEvidence.commit.treeSha);
  candidate.roots.forEach((root, i) => {
    compare(`gitEvidence.roots[${i}].mode`, REQUIRED_TREE_MODE, gitEvidence.roots[i].mode);
    compare(`gitEvidence.roots[${i}].type`, REQUIRED_TREE_TYPE, gitEvidence.roots[i].type);
    compare(`gitEvidence.roots[${i}].objectSha`, root.treeObjectSha, gitEvidence.roots[i].objectSha);
  });
  compare("providerEvidence.name", candidate.provider.name, providerEvidence.name);
  compare("providerEvidence.accountId", candidate.provider.accountId, providerEvidence.accountId);
  candidate.provider.services.forEach((service, i) => {
    const observed = providerEvidence.services[i];
    compare(`providerEvidence.services[${i}].id`, service.id, observed.id);
    compare(`providerEvidence.services[${i}].type`, service.type, observed.type);
    compare(`providerEvidence.services[${i}].repository.forgeHost`, service.repository.forgeHost, observed.repository.forgeHost);
    compare(`providerEvidence.services[${i}].repository.owner`, service.repository.owner, observed.repository.owner);
    compare(`providerEvidence.services[${i}].repository.name`, service.repository.name, observed.repository.name);
    compare(`providerEvidence.services[${i}].branch`, service.branch, observed.branch);
    compare(`providerEvidence.services[${i}].rootDirectory`, service.rootDirectory, observed.rootDirectory);
    compare(`providerEvidence.services[${i}].region`, service.region, observed.region);
  });
  candidate.provider.databases.forEach((database, i) => {
    compare(`providerEvidence.databases[${i}].id`, database.id, providerEvidence.databases[i].id);
    compare(`providerEvidence.databases[${i}].region`, database.region, providerEvidence.databases[i].region);
  });
  const onlyRefMoved = mismatches.length === 1 && mismatches[0].field === "gitEvidence.ref.sha";
  const status = mismatches.length === 0 ? STATUS.PASS : onlyRefMoved ? STATUS.STALE : STATUS.MISMATCH;
  return deepFreeze({ mismatches, status });
}

function assertCertificateSemantics(certificate) {
  assertCandidateSemantics(certificate.candidate);
  assertEvidenceCoverage(certificate.candidate, certificate.gitEvidence, certificate.providerEvidence);
  assertEvidenceFresh(certificate.generatedAtUtc, certificate.gitEvidence.observedAtUtc, "/gitEvidence/observedAtUtc");
  assertEvidenceFresh(certificate.generatedAtUtc, certificate.providerEvidence.observedAtUtc, "/providerEvidence/observedAtUtc");
  const derived = evaluateEvidence(certificate.candidate, certificate.gitEvidence, certificate.providerEvidence);
  assert(serializeCanonical(certificate.mismatches) === serializeCanonical(derived.mismatches), "mismatches_not_derived", "/mismatches");
  assert(certificate.status === derived.status, "status_not_derived", "/status");
}

// ---------------------------------------------------------------------------
// Signing and trusted-key boundary.
// ---------------------------------------------------------------------------

const trustedKeySets = new WeakSet();

// Only explicit public verification material is accepted: a public Ed25519 KeyObject, or SPKI
// PEM text whose header is exactly "PUBLIC KEY". Private KeyObjects and every private PEM form
// (PKCS8, encrypted PKCS8, OpenSSH, legacy) are rejected outright; a public key is never derived
// from private input. Supplied material is never echoed in errors.
const SPKI_PEM_RE = /^-----BEGIN PUBLIC KEY-----\r?\n[A-Za-z0-9+/=\r\n]+-----END PUBLIC KEY-----\r?\n?$/;

function assertPublicEd25519Key(key) {
  let keyObject;
  if (key instanceof crypto.KeyObject) {
    assert(key.type === "public", "trusted_key_private_rejected");
    keyObject = key;
  } else {
    assert(typeof key === "string" && key.length <= 4096, "trusted_key_invalid");
    assert(!/PRIVATE KEY/.test(key), "trusted_key_private_rejected");
    assert(SPKI_PEM_RE.test(key), "trusted_key_invalid");
    try {
      keyObject = crypto.createPublicKey({ key, format: "pem", type: "spki" });
    } catch {
      return fail("trusted_key_invalid");
    }
  }
  assert(keyObject.type === "public" && keyObject.asymmetricKeyType === "ed25519", "trusted_key_invalid");
  return keyObject;
}

// The gate supplies its trusted public keys here. Nothing in a certificate can add to,
// replace or influence this set. Values must be public Ed25519 KeyObjects or SPKI PEM strings.
export function createTrustedKeys(entries) {
  assert(entries !== null && typeof entries === "object", "trusted_keys_invalid");
  const pairs = entries instanceof Map ? [...entries.entries()] : Object.entries(entries);
  assert(pairs.length >= 1 && pairs.length <= 64, "trusted_keys_invalid");
  const keys = new Map();
  for (const [keyId, key] of pairs) {
    validateNode(keyId, CERTIFICATE_SCHEMA.$defs.identifier, CERTIFICATE_SCHEMA, "/trustedKeys");
    assert(!keys.has(keyId), "trusted_keys_invalid");
    keys.set(keyId, assertPublicEd25519Key(key));
  }
  const trusted = Object.freeze({
    keyIds: Object.freeze([...keys.keys()]),
    has: (keyId) => keys.has(keyId),
    get: (keyId) => keys.get(keyId),
  });
  trustedKeySets.add(trusted);
  return trusted;
}

// Signer interface: { algorithm: "Ed25519", keyId, sign(messageBytes) -> Uint8Array }.
// This helper wraps an in-memory private KeyObject and never exposes or serializes it.
export function createEd25519Signer({ privateKey, keyId } = {}) {
  assert(privateKey instanceof crypto.KeyObject && privateKey.type === "private" && privateKey.asymmetricKeyType === "ed25519", "signer_key_invalid");
  validateNode(keyId, CERTIFICATE_SCHEMA.$defs.identifier, CERTIFICATE_SCHEMA, "/signer/keyId");
  return Object.freeze({
    algorithm: SIGNATURE_ALGORITHM,
    keyId,
    sign: (messageBytes) => crypto.sign(null, messageBytes, privateKey),
  });
}

function assertSigner(signer) {
  assert(signer !== null && typeof signer === "object" && typeof signer.sign === "function", "signer_invalid");
  assert(signer.algorithm === SIGNATURE_ALGORITHM, "signer_algorithm_unsupported");
  validateNode(signer.keyId, CERTIFICATE_SCHEMA.$defs.identifier, CERTIFICATE_SCHEMA, "/signer/keyId");
}

async function signCertificatePayload(unsigned, signer) {
  let raw;
  try {
    raw = await signer.sign(signedMessageBytes(unsigned));
  } catch {
    return fail("signing_failed");
  }
  assert(raw instanceof Uint8Array && raw.length === ED25519_SIGNATURE_BYTES, "signer_output_invalid");
  return { algorithm: SIGNATURE_ALGORITHM, keyId: signer.keyId, value: Buffer.from(raw).toString("base64url") };
}

function verifySignature(certificate, trustedKeys) {
  const { signature } = certificate;
  assert(signature.algorithm === SIGNATURE_ALGORITHM, "signature_algorithm_unsupported", "/signature/algorithm");
  const publicKey = trustedKeys.get(signature.keyId);
  assert(publicKey !== undefined, "signature_key_untrusted", "/signature/keyId");
  const bytes = Buffer.from(signature.value, "base64url");
  assert(bytes.length === ED25519_SIGNATURE_BYTES && bytes.toString("base64url") === signature.value, "signature_encoding_invalid", "/signature/value");
  assert(crypto.verify(null, signedMessageBytes(certificate), publicKey, bytes), "signature_invalid", "/signature");
}

// ---------------------------------------------------------------------------
// Verification policy: owned by the consuming gate, never by the certificate.
// ---------------------------------------------------------------------------

const POLICY_KEYS = new Set(["trustedKeys", "clock", "expectedAudience", "maxCertificateAgeMs", "clockSkewMs"]);

function normalizeVerificationPolicy(policy) {
  assert(isPlainObject(policy), "verification_policy_invalid");
  for (const key of Object.keys(policy)) assert(POLICY_KEYS.has(key), "verification_policy_invalid");
  assert(trustedKeySets.has(policy.trustedKeys), "verification_policy_trusted_keys_missing");
  assert(typeof policy.clock === "function", "verification_policy_clock_missing");
  assert(typeof policy.expectedAudience === "string", "verification_policy_audience_missing");
  try {
    validateNode(policy.expectedAudience, CERTIFICATE_SCHEMA.$defs.audience, CERTIFICATE_SCHEMA, "/expectedAudience");
  } catch {
    return fail("verification_policy_audience_invalid");
  }
  const maxCertificateAgeMs = policy.maxCertificateAgeMs ?? DEFAULT_MAX_CERTIFICATE_AGE_MS;
  const clockSkewMs = policy.clockSkewMs ?? DEFAULT_CERTIFICATE_CLOCK_SKEW_MS;
  assert(Number.isSafeInteger(maxCertificateAgeMs) && maxCertificateAgeMs >= 1 && maxCertificateAgeMs <= MAX_CERTIFICATE_AGE_LIMIT_MS, "verification_policy_max_age_invalid");
  assert(Number.isSafeInteger(clockSkewMs) && clockSkewMs >= 0 && clockSkewMs <= MAX_CERTIFICATE_CLOCK_SKEW_LIMIT_MS, "verification_policy_skew_invalid");
  return Object.freeze({ trustedKeys: policy.trustedKeys, clock: policy.clock, expectedAudience: policy.expectedAudience, maxCertificateAgeMs, clockSkewMs });
}

function readClock(clock) {
  const milliseconds = clock();
  assert(Number.isSafeInteger(milliseconds), "clock_invalid");
  return milliseconds;
}

function assertConsumptionFresh(certificate, policy) {
  const generatedAt = assertUtcTimestamp(certificate.generatedAtUtc, "/generatedAtUtc");
  const now = readClock(policy.clock);
  assert(now - generatedAt <= policy.maxCertificateAgeMs, "certificate_expired", "/generatedAtUtc");
  assert(generatedAt - now <= policy.clockSkewMs, "certificate_from_future", "/generatedAtUtc");
}

// ---------------------------------------------------------------------------
// Public trust-path API. Every document enters as JSON text.
// ---------------------------------------------------------------------------

export function parseCandidate(candidateText) {
  const candidate = validateAgainstSchema(parseJsonText(candidateText), "candidate");
  assertCandidateSemantics(candidate);
  return candidate;
}

// The only way to obtain a trusted certificate object from text. Order: schema, digest,
// signature against the gate's trusted keys, audience, consumption expiry, then full re-derivation.
export function verifyCertificate(certificateText, verificationPolicy) {
  const policy = normalizeVerificationPolicy(verificationPolicy);
  const certificate = validateAgainstSchema(parseJsonText(certificateText), "certificate");
  assert(certificate.certificatePayloadSha256 === computeCertificateDigest(certificate), "certificate_digest_mismatch", "/certificatePayloadSha256");
  verifySignature(certificate, policy.trustedKeys);
  assert(certificate.candidate.audience === policy.expectedAudience, "audience_mismatch", "/candidate/audience");
  assertConsumptionFresh(certificate, policy);
  assertCertificateSemantics(certificate);
  return certificate;
}

function assertExactKeys(value, keys, path) {
  assert(isPlainObject(value), "candidate_input_invalid", path);
  assert(serializeCanonical(Object.keys(value).sort()) === serializeCanonical([...keys].sort()), "candidate_input_keys_invalid", path);
}

// Producer helper: derives the redundant fields (full ref, UTF-8 metadata, version, digest)
// from minimal input, then round-trips the text through parseCandidate before returning it.
export function createCandidateText(input) {
  const data = toPlainData(input);
  assertExactKeys(data, ["audience", "repository", "branch", "commit", "roots", "provider"], "");
  assertExactKeys(data.branch, ["shortName"], "/branch");
  assert(typeof data.branch.shortName === "string", "candidate_input_invalid", "/branch/shortName");
  assert(Array.isArray(data.roots), "candidate_input_invalid", "/roots");
  const roots = data.roots.map((root, i) => {
    assertExactKeys(root, ["role", "path", "treeObjectSha"], `/roots/${i}`);
    assert(typeof root.path === "string", "candidate_input_invalid", `/roots/${i}/path`);
    return { role: root.role, path: root.path, pathUtf8Hex: utf8Hex(root.path), pathByteLength: Buffer.byteLength(root.path, "utf8"), treeObjectSha: root.treeObjectSha };
  });
  const unsigned = {
    candidateVersion: CANDIDATE_VERSION,
    audience: data.audience,
    repository: data.repository,
    branch: { shortName: data.branch.shortName, fullRef: `refs/heads/${data.branch.shortName}`, nameUtf8Hex: utf8Hex(data.branch.shortName), nameByteLength: Buffer.byteLength(data.branch.shortName, "utf8") },
    commit: data.commit,
    roots,
    provider: data.provider,
  };
  const candidateText = serializeCanonical({ ...unsigned, candidatePayloadSha256: computeCandidateDigest(unsigned) });
  parseCandidate(candidateText);
  return candidateText;
}

// Collector failures never carry the underlying error: stdout, stderr, response bodies and
// credentials must not be able to reach logs through this module.
async function collectEvidence(collector, request, definitionName, code) {
  try {
    const result = await collector(request);
    assert(result !== undefined && result !== null, `${code}_collection_failed`);
    return validateAgainstSchema(result, definitionName);
  } catch {
    return fail(`${code}_collection_failed`);
  }
}

// Attests a candidate with fresh evidence and signs the result. Collectors are called with a
// frozen request describing exactly what to observe. The signer is injected. The serialized
// certificate is then verified with the gate's trusted policy before anything is returned.
export async function attestCertificate({ candidateText, collectGitEvidence, collectProviderEvidence, signer, trustedKeys, expectedAudience, clock = Date.now, maxCertificateAgeMs, clockSkewMs } = {}) {
  const policyInput = { trustedKeys, clock, expectedAudience };
  if (maxCertificateAgeMs !== undefined) policyInput.maxCertificateAgeMs = maxCertificateAgeMs;
  if (clockSkewMs !== undefined) policyInput.clockSkewMs = clockSkewMs;
  const policy = normalizeVerificationPolicy(policyInput);
  assertSigner(signer);
  assert(policy.trustedKeys.has(signer.keyId), "signer_key_not_trusted");
  const candidate = parseCandidate(candidateText);
  // The attesting gate only issues certificates for its own audience.
  assert(candidate.audience === policy.expectedAudience, "audience_mismatch", "/candidate/audience");
  assert(typeof collectGitEvidence === "function", "git_evidence_collector_missing");
  assert(typeof collectProviderEvidence === "function", "provider_evidence_collector_missing");

  const gitRequest = deepFreeze({
    repository: { forgeHost: candidate.repository.forgeHost, owner: candidate.repository.owner, name: candidate.repository.name },
    remoteName: candidate.repository.remoteName,
    fullRef: candidate.branch.fullRef,
    commitSha: candidate.commit.sha,
    treeSha: candidate.commit.treeSha,
    rootPaths: candidate.roots.map((root) => root.path),
  });
  const providerRequest = deepFreeze({
    name: candidate.provider.name,
    accountId: candidate.provider.accountId,
    databasePolicy: candidate.provider.databasePolicy,
    serviceIds: candidate.provider.services.map((service) => service.id),
    databaseIds: candidate.provider.databases.map((database) => database.id),
  });

  const gitEvidence = await collectEvidence(collectGitEvidence, gitRequest, "gitEvidence", "git");
  const providerEvidence = await collectEvidence(collectProviderEvidence, providerRequest, "providerEvidence", "provider");
  const generatedAtUtc = new Date(readClock(policy.clock)).toISOString();

  assertEvidenceCoverage(candidate, gitEvidence, providerEvidence);
  assertEvidenceFresh(generatedAtUtc, gitEvidence.observedAtUtc, "/gitEvidence/observedAtUtc");
  assertEvidenceFresh(generatedAtUtc, providerEvidence.observedAtUtc, "/providerEvidence/observedAtUtc");
  const { mismatches, status } = evaluateEvidence(candidate, gitEvidence, providerEvidence);

  const payload = { certificateVersion: CERTIFICATE_VERSION, generatedAtUtc, candidate, gitEvidence, providerEvidence, mismatches, status };
  const unsigned = { ...payload, certificatePayloadSha256: computeCertificateDigest(payload) };
  const signature = await signCertificatePayload(unsigned, signer);
  const certificateText = serializeCanonical({ ...unsigned, signature });
  // Independent verification of the serialized artifact: digest, signature, expiry, re-derivation.
  const certificate = verifyCertificate(certificateText, policy);
  return deepFreeze({ certificate, certificateText });
}

export function assertPass(certificateText, verificationPolicy) {
  const certificate = verifyCertificate(certificateText, verificationPolicy);
  assert(certificate.status === STATUS.PASS, "not_pass", "/status");
  assert(certificate.mismatches.length === 0, "mismatches_present", "/mismatches");
  return certificate;
}

// Structural comparison of a downstream proposal against the authenticated candidate.
// Every proposed node is validated, not only scalar leaves: arrays must match in length, order
// and contents; supplied objects must carry exactly the authenticated key set; scalars must be
// identical; node types must agree. Empty containers are therefore never wildcards or no-ops,
// and unknown containers fail closed. Proposal key names are never echoed; reported paths are
// composed only of authenticated key names and array indices.
function assertProposalEqualsAuthority(authority, proposal, path) {
  if (Array.isArray(proposal)) {
    assert(Array.isArray(authority), "override_type_mismatch", path);
    assert(proposal.length === authority.length, "override_shape_mismatch", path);
    proposal.forEach((item, i) => assertProposalEqualsAuthority(authority[i], item, `${path}[${i}]`));
    return;
  }
  if (isPlainObject(proposal)) {
    assert(isPlainObject(authority), "override_type_mismatch", path);
    const proposedKeys = Object.keys(proposal);
    for (const key of proposedKeys) assert(Object.hasOwn(authority, key), "override_unknown_field", path);
    for (const key of proposedKeys) assertProposalEqualsAuthority(authority[key], proposal[key], path ? `${path}.${key}` : key);
    assert(proposedKeys.length === Object.keys(authority).length, "override_incomplete", path);
    return;
  }
  assert(!Array.isArray(authority) && !isPlainObject(authority), "override_type_mismatch", path);
  assert(authority === proposal, "override_rejected", path);
}

// Every authority field in the candidate (audience, forge host, repository identity, remote,
// branch, commit, tree, roots, provider account, database policy and every service/database binding)
// is protected. A downstream proposal must be a complete, exact restatement of the certified
// candidate: any unknown, missing, differing, retyped, truncated, expanded or emptied node rejects.
export function assertNoDownstreamOverrides(certificateText, proposed, verificationPolicy) {
  const certificate = verifyCertificate(certificateText, verificationPolicy);
  assert(certificate.status === STATUS.PASS && certificate.mismatches.length === 0, "not_pass", "/status");
  const proposal = toPlainData(proposed);
  assert(isPlainObject(proposal), "override_proposal_invalid");
  assertProposalEqualsAuthority(certificate.candidate, proposal, "");
  return certificate;
}
