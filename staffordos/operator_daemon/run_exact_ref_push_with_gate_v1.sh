#!/bin/bash -p
set -euo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin

if [ "$#" -eq 1 ]; then
  MANIFEST="$1"; TEST_MODE=0
elif [ "$#" -eq 2 ] && [ "$2" = "--synthetic-test-mode" ]; then
  MANIFEST="$1"; TEST_MODE=1
else
  printf '%s\n' PUSH_BLOCKED_INVOCATION; exit 1
fi
RUNNER_TMP="$(mktemp -d /tmp/staffordos-exact-ref-push.XXXXXX)"
chmod 700 "$RUNNER_TMP"
cleanup() {
  if [ "${TEST_MODE:-0}" = 1 ] && [ -f "${TEST_CONTROL:-/nonexistent}" ] && grep -Fxq 'wait:cleanup' "$TEST_CONTROL"; then
    : > "$TEST_CONTROL.cleanup.started"
    while [ ! -e "$TEST_CONTROL.cleanup.release" ]; do sleep 0.01; done
  fi
  rm -rf -- "$RUNNER_TMP"
}
trap cleanup EXIT
trap 'exit 130' INT HUP
trap 'exit 143' TERM

GIT_BIN="$(command -v git)"; PYTHON_BIN="/usr/bin/python3"
case "$GIT_BIN" in /usr/bin/git|/bin/git) ;; *) printf '%s\n' PUSH_BLOCKED_UNTRUSTED_GIT; exit 1 ;; esac
[ -f "$GIT_BIN" ] && [ ! -L "$GIT_BIN" ] || { printf '%s\n' PUSH_BLOCKED_UNTRUSTED_GIT; exit 1; }
[ "$(stat -f '%Su' "$(dirname "$GIT_BIN")")" = root ] && [ ! -w "$(dirname "$GIT_BIN")" ] || { printf '%s\n' PUSH_BLOCKED_UNTRUSTED_GIT; exit 1; }
[ -f "$PYTHON_BIN" ] && [ ! -L "$PYTHON_BIN" ] || { printf '%s\n' PUSH_BLOCKED_UNTRUSTED_MANIFEST_PARSER; exit 1; }
[ "$(stat -f '%Su' "$PYTHON_BIN")" = root ] || { printf '%s\n' PUSH_BLOCKED_UNTRUSTED_MANIFEST_PARSER; exit 1; }
[ ! -w "$(dirname "$PYTHON_BIN")" ] || { printf '%s\n' PUSH_BLOCKED_UNTRUSTED_MANIFEST_PARSER; exit 1; }
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES
unset GIT_PUSH_OPTION_COUNT GIT_PUSH_OPTION_0 GIT_SSH_COMMAND GIT_SSH GIT_PROXY_COMMAND
unset GIT_CONFIG_COUNT GIT_CONFIG_KEY_0 GIT_CONFIG_VALUE_0 GIT_CONFIG_PARAMETERS
unset GIT_ASKPASS SSH_ASKPASS GIT_TRACE GIT_TRACE_PACKET GIT_TRACE_PERFORMANCE
unset GIT_TRACE2 GIT_TRACE2_EVENT GIT_TRACE2_EVENT_NESTING GIT_TRACE2_PERF GIT_TRACE2_CONFIG_PARAMS
unset GIT_TRACE_CURL GIT_TRACE_CURL_NO_DATA GIT_TRACE_REDACT
unset GIT_PROTOCOL GIT_SSH_VARIANT GIT_ALLOW_PROTOCOL GIT_EXEC_PATH GIT_REPLACE_REF_BASE GIT_TEMPLATE_DIR
unset GIT_SSL_NO_VERIFY GIT_SSL_CAINFO GIT_SSL_CAPATH GIT_HTTP_PROXY_AUTHMETHOD
unset http_proxy https_proxy all_proxy no_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY NO_PROXY
unset CURL_CA_BUNDLE SSL_CERT_FILE SSL_CERT_DIR
unset GH_TOKEN GITHUB_TOKEN GH_ENTERPRISE_TOKEN GITHUB_ENTERPRISE_TOKEN GH_HOST GH_CONFIG_DIR XDG_CONFIG_HOME
export GIT_TERMINAL_PROMPT=0 GIT_NO_REPLACE_OBJECTS=1

mkdir -m 700 "$RUNNER_TMP/hooks"

"$GIT_BIN" -c core.hooksPath="$RUNNER_TMP/hooks" -C "$(pwd)" rev-parse --show-toplevel >/dev/null

if ! "$PYTHON_BIN" -I - "$MANIFEST" "$RUNNER_TMP/validated.json" "$TEST_MODE" 2>"$RUNNER_TMP/manifest.err" <<'PY'
import json, os, re, stat, sys
from pathlib import Path

class Reject(Exception): pass
def reject(code): raise Reject(code)
def pairs(items):
    out = {}
    for key, value in items:
        if key in out: reject("PUSH_BLOCKED_MANIFEST_DUPLICATE_KEY")
        out[key] = value
    return out
def text(value, code, limit=512):
    if not isinstance(value, str) or not value or len(value) > limit or any(ord(c) < 32 or 127 <= ord(c) <= 159 for c in value) or any(0xD800 <= ord(c) <= 0xDFFF for c in value): reject(code)
def sha40(value, code):
    text(value, code, 40)
    if not re.fullmatch(r"[a-f0-9]{40}", value): reject(code)
manifest_fd = -1
try:
    manifest_fd = os.open(sys.argv[1], os.O_RDONLY | os.O_NONBLOCK | getattr(os, "O_CLOEXEC", 0))
    if not stat.S_ISREG(os.fstat(manifest_fd).st_mode): reject("PUSH_BLOCKED_MANIFEST_TYPE")
    raw = os.read(manifest_fd, 128 * 1024 + 1)
except Reject:
    raise
except OSError:
    reject("PUSH_BLOCKED_MANIFEST_FILE")
finally:
    if manifest_fd >= 0: os.close(manifest_fd)
if len(raw) > 128 * 1024: reject("PUSH_BLOCKED_MANIFEST_SIZE")
try: source = raw.decode("ascii")
except UnicodeDecodeError: reject("PUSH_BLOCKED_MANIFEST_ENCODING")
if any(ord(c) < 32 and c not in "\t\n\r" for c in source): reject("PUSH_BLOCKED_MANIFEST_ENCODING")
try: value = json.loads(source, object_pairs_hook=pairs, parse_constant=lambda _: reject("PUSH_BLOCKED_MANIFEST_NUMBER"))
except Reject: raise
except Exception: reject("PUSH_BLOCKED_MANIFEST_JSON")
def keys(obj, required, code):
    if type(obj) is not dict or set(obj) != set(required): reject(code)
keys(value, ["schemaVersion","repositoryRoot","remoteName","canonicalRemoteIdentity","sourceCommitSha","sourceTreeSha","expectedParentSha","destinationRef","destinationPrecondition","expectedDestinationSha","approvedFiles","authorizationRef","noForce"], "PUSH_BLOCKED_MANIFEST_SHAPE")
if value["schemaVersion"] != "staffordos.exact_ref_push.v1": reject("PUSH_BLOCKED_SCHEMA")
for item in [("repositoryRoot","ROOT",4096),("remoteName","REMOTE",128),("canonicalRemoteIdentity","REMOTE_IDENTITY",4096),("destinationRef","DESTINATION",512),("authorizationRef","AUTHORIZATION",1024)]: text(value[item[0]], "PUSH_BLOCKED_" + item[1], item[2])
if not re.fullmatch(r"[A-Za-z0-9._-]+", value["remoteName"]) or ".." in value["remoteName"]: reject("PUSH_BLOCKED_REMOTE")
for field, code in [("sourceCommitSha","PUSH_BLOCKED_SOURCE_SHA"),("sourceTreeSha","PUSH_BLOCKED_TREE_SHA"),("expectedParentSha","PUSH_BLOCKED_PARENT_SHA")]: sha40(value[field], code)
if value["noForce"] is not True: reject("PUSH_BLOCKED_FORCE_POLICY")
destination = value["destinationRef"]
test_mode = sys.argv[3] == "1"
cart_agent_remote = value["canonicalRemoteIdentity"] == "https://github.com/RStaff/cart-agent.git"
staffordos_core_remote = value["canonicalRemoteIdentity"] == "https://github.com/RStaff/staffordos-core.git"
pr133_legacy_destination = destination == "refs/heads/careos/migration-runner-v1" and cart_agent_remote
scanner_repair_destination = destination == "refs/heads/careos/secret-scan-scope-20261027" and cart_agent_remote
security_release_destination = destination == "refs/heads/careos/staffordnext-security-release-20261027" and cart_agent_remote
staffordnext_node24_destination = destination == "refs/heads/careos/staffordnext-node24-20261027" and cart_agent_remote
db_cart_destination = destination == "refs/heads/careos/db-security-cart-agent-20261028" and cart_agent_remote
db_staffordnext_destination = destination == "refs/heads/careos/db-security-staffordnext-20261028" and cart_agent_remote
db_staffordos_core_destination = destination == "refs/heads/security/db-tls-staffordos-core-20261028" and staffordos_core_remote
synthetic_db_tls_destination = test_mode and destination in (
    "refs/heads/careos/db-security-cart-agent-20261028",
    "refs/heads/careos/db-security-staffordnext-20261028",
    "refs/heads/security/db-tls-staffordos-core-20261028",
)
if cart_agent_remote or staffordos_core_remote:
    if not (pr133_legacy_destination or scanner_repair_destination or security_release_destination or staffordnext_node24_destination or db_cart_destination or db_staffordnext_destination or db_staffordos_core_destination): reject("PUSH_BLOCKED_DESTINATION_REF")
elif not test_mode:
    reject("PUSH_BLOCKED_DESTINATION_REF")
elif "://" in value["canonicalRemoteIdentity"] or value["canonicalRemoteIdentity"].startswith("git@"):
    reject("PUSH_BLOCKED_DESTINATION_REF")
elif not synthetic_db_tls_destination and not re.fullmatch(r"refs/heads/(?:careeros|staffordos)/.+", destination):
    reject("PUSH_BLOCKED_DESTINATION_REF")
segments = destination.split("/")
if len(segments) < 4 or any(not re.fullmatch(r"[A-Za-z0-9_][A-Za-z0-9._-]*", segment) or segment.endswith(".") or segment.endswith(".lock") or segment in (".", "..") for segment in segments[2:]): reject("PUSH_BLOCKED_DESTINATION_REF")
if value["destinationPrecondition"] not in ["ABSENT","EXACT_SHA"]: reject("PUSH_BLOCKED_DESTINATION_STATE")
if value["destinationPrecondition"] == "ABSENT":
    if value["expectedDestinationSha"] is not None: reject("PUSH_BLOCKED_DESTINATION_SHA")
else: sha40(value["expectedDestinationSha"], "PUSH_BLOCKED_DESTINATION_SHA")
files = value["approvedFiles"]
if type(files) is not list or not files or len(files) > 256: reject("PUSH_BLOCKED_FILE_MANIFEST")
seen = set()
for file in files:
    keys(file, ["path","mode","sha256"], "PUSH_BLOCKED_FILE_ENTRY")
    text(file["path"], "PUSH_BLOCKED_FILE_PATH", 4096)
    if file["path"].startswith("/") or ".." in file["path"] or "\\" in file["path"]: reject("PUSH_BLOCKED_FILE_PATH")
    if file["mode"] not in ("100644", "100755"): reject("PUSH_BLOCKED_FILE_MODE")
    text(file["sha256"], "PUSH_BLOCKED_FILE_SHA", 64)
    if not re.fullmatch(r"[a-f0-9]{64}", file["sha256"]): reject("PUSH_BLOCKED_FILE_SHA")
    if file["path"] in seen: reject("PUSH_BLOCKED_FILE_DUPLICATE")
    seen.add(file["path"])
value["approvedFiles"].sort(key=lambda x: x["path"])
if pr133_legacy_destination:
    authorized = {
        "remoteName": "origin",
        "sourceCommitSha": "c902c6abadb5200b4892a6dd10420b5ab1b1e04e",
        "sourceTreeSha": "e11150c96f3975293837b202080490c7d316ac29",
        "expectedParentSha": "8998391cde4772f99eb11aa0e9c3845c0df301a9",
        "destinationPrecondition": "EXACT_SHA",
        "authorizationRef": "pr133.owner-authorized-role-mapping-correction.2026-10-26",
        "approvedFiles": [
            {"path":"staffordos/ui/operator-frontend/careeros-beta/scripts/careeros-schema-adoption.test.mjs","mode":"100644","sha256":"808ab64dc0d2fd27d207aa2edb761f4876c590c20a749e2a59894a93954be602"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/scripts/reconcile-careeros-story-status.mjs","mode":"100644","sha256":"7d324d11ab76f91528be72c4485f130b652f56a9d6978848d7dcdf52c81a63af"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/scripts/reconcile-careeros-story-status.pg17.test.mjs","mode":"100644","sha256":"b7073a0f95054ac63d34d0646d4892937cc0ec3e8950c11259e426c029f01083"},
        ],
    }
    if any(value[key] != expected for key, expected in authorized.items()): reject("PUSH_BLOCKED_AUTHORIZATION")
    if value["expectedDestinationSha"] not in (
        "8998391cde4772f99eb11aa0e9c3845c0df301a9",
        "c902c6abadb5200b4892a6dd10420b5ab1b1e04e",
    ): reject("PUSH_BLOCKED_AUTHORIZATION")
if scanner_repair_destination:
    initial = {
        "remoteName": "origin",
        "sourceCommitSha": "a0548f316630f99c5b69c80fd8861559743cad8d",
        "sourceTreeSha": "d77993c72def9d590c1e5f3a0ae439c6f488f1a8",
        "expectedParentSha": "17b07030ce0dc8289b6efbd92ef60de8151e2976",
        "destinationPrecondition": "ABSENT",
        "expectedDestinationSha": None,
        "authorizationRef": "scanner-repair.owner-authorized-publication.2026-10-27",
        "approvedFiles": [
            {"path":".github/workflows/security-ci.yml","mode":"100644","sha256":"8315dcc5d636d641cd3a09ad3d33b5e7664fca91d82543315e5c4b7f2699aaec"},
            {"path":".gitleaksignore","mode":"100644","sha256":"999a1bbf7116925245e2c0d9a0ef5251c821665f379110af6ed221e85e364547"},
            {"path":"scripts/ci/test-secret-scan-control.sh","mode":"100644","sha256":"462265464b38fd8383f951e7b6477aff72630d30a29f9f297136505191b3e9ac"},
            {"path":"scripts/ci/verify-secret-scan-history.sh","mode":"100644","sha256":"2b6449cae7ac9a2fb83be23864f5b736702e593430ea856692bda2b9873cb7c7"},
        ],
    }
    review_followup = {
        "remoteName": "origin",
        "sourceCommitSha": "7476d832041a3ef86cfcfea9fc38e83940e3b8cf",
        "sourceTreeSha": "0f439cae226cb6bdacfa8e32eb88bd236d3c8bf1",
        "expectedParentSha": "a0548f316630f99c5b69c80fd8861559743cad8d",
        "destinationPrecondition": "EXACT_SHA",
        "expectedDestinationSha": "a0548f316630f99c5b69c80fd8861559743cad8d",
        "authorizationRef": "scanner-repair.review-followup-publication.2026-10-27",
        "approvedFiles": [
            {"path":".github/workflows/security-ci.yml","mode":"100644","sha256":"abc8aaba500355c5fe2e65e8ecd9fbf2be5aec0ba6a99147a606919ad411f0df"},
            {"path":"scripts/ci/run-secret-scan.sh","mode":"100644","sha256":"8d502f6cf33c07ce806fcd7125c231f2edcd28d5dc828fa1261c63069d1edaf5"},
            {"path":"scripts/ci/test-secret-scan-control.sh","mode":"100644","sha256":"3fd93a4ec54dc55f2f75c34c871c2041325eb20b749261670aca6db2d1aaccd4"},
        ],
    }
    second_review_followup = {
        "remoteName": "origin",
        "sourceCommitSha": "549164f5bfd346244c6e704709390d7c8b2bacf4",
        "sourceTreeSha": "7ea5ed6549305ab51b3236d7014a49d24e984ff7",
        "expectedParentSha": "7476d832041a3ef86cfcfea9fc38e83940e3b8cf",
        "destinationPrecondition": "EXACT_SHA",
        "expectedDestinationSha": "7476d832041a3ef86cfcfea9fc38e83940e3b8cf",
        "authorizationRef": "scanner-repair.second-review-followup-publication.2026-10-27",
        "approvedFiles": [
            {"path":"scripts/ci/run-secret-scan.sh","mode":"100644","sha256":"0a76efd67aec803c73fb7eeccfd916acde55132e0b80b4408f7a435edeac630e"},
            {"path":"scripts/ci/test-secret-scan-control.sh","mode":"100644","sha256":"7440b3d6efc058fe8e7ae9ab97a62dfd3543be2f27e71abfc66066d69e337ad7"},
        ],
    }
    third_review_followup = {
        "remoteName": "origin",
        "sourceCommitSha": "7615ebbcc1e2b9a88865b561aae390987ce53ae5",
        "sourceTreeSha": "d7051136d0bbf2e2cf50142e282e5360392bc70d",
        "expectedParentSha": "549164f5bfd346244c6e704709390d7c8b2bacf4",
        "destinationPrecondition": "EXACT_SHA",
        "expectedDestinationSha": "549164f5bfd346244c6e704709390d7c8b2bacf4",
        "authorizationRef": "scanner-repair.third-review-followup-publication.2026-10-27",
        "approvedFiles": [
            {"path":".github/workflows/security-ci.yml","mode":"100644","sha256":"b350e3bc0e87295e27ff2a5029bb5c949e76780fced5d6735011d4bebfef4e9c"},
            {"path":"scripts/ci/run-secret-scan.sh","mode":"100644","sha256":"ce9326ac72742cd4322dda959c34785c0667a933848c12a40abb551901f83215"},
            {"path":"scripts/ci/test-secret-scan-control.sh","mode":"100644","sha256":"19d9cde193d846da6f2ccf335a1ebfcaf11126bb4fd02e8b1713a5fbddbe5d16"},
        ],
    }
    if not any(all(value[key] == expected for key, expected in authorized.items()) for authorized in (initial, review_followup, second_review_followup, third_review_followup)):
        reject("PUSH_BLOCKED_AUTHORIZATION")
if security_release_destination:
    initial = {
        "remoteName": "origin",
        "sourceCommitSha": "2c00db0535ce47272b6ebff63921aefea61407d4",
        "sourceTreeSha": "2ce9bb631fdec1e3b1ad9c22e69bd6842849a77d",
        "expectedParentSha": "d9a071f40c4b79d246dd03e894b88f001fb31416",
        "destinationPrecondition": "ABSENT",
        "expectedDestinationSha": None,
        "authorizationRef": "staffordnext-security-release.owner-authorized-integration.2026-10-27",
        "approvedFiles": [
            {"path":"staffordos/ui/operator-frontend/careeros-beta/package-lock.json","mode":"100644","sha256":"6c3d2a44fb7f0097a2bf347c5d20dec4187ee9181c3f531c62553e696edde323"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/package.json","mode":"100644","sha256":"121550bab16186a82cc0e7d04f0c8cd5331784d48ea8065138610ef1cfcc2556"},
        ],
    }
    merge_binding = {
        "remoteName": "origin",
        "sourceCommitSha": "c485ec013041df8bd9aed5432b22f47c302db6d9",
        "sourceTreeSha": "2ce9bb631fdec1e3b1ad9c22e69bd6842849a77d",
        "expectedParentSha": "d9a071f40c4b79d246dd03e894b88f001fb31416",
        "destinationPrecondition": "EXACT_SHA",
        "expectedDestinationSha": "2c00db0535ce47272b6ebff63921aefea61407d4",
        "authorizationRef": "staffordnext-security-release.owner-authorized-merge-binding.2026-10-27",
        "approvedFiles": [
            {"path":"staffordos/ui/operator-frontend/careeros-beta/package-lock.json","mode":"100644","sha256":"6c3d2a44fb7f0097a2bf347c5d20dec4187ee9181c3f531c62553e696edde323"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/package.json","mode":"100644","sha256":"121550bab16186a82cc0e7d04f0c8cd5331784d48ea8065138610ef1cfcc2556"},
        ],
    }
    if not any(all(value[key] == expected for key, expected in authorized.items()) for authorized in (initial, merge_binding)):
        reject("PUSH_BLOCKED_AUTHORIZATION")
if staffordnext_node24_destination:
    initial = {
        "remoteName": "origin",
        "sourceCommitSha": "0908c5d98614f1542e41e10124c924051c768069",
        "sourceTreeSha": "1e1b360633146eb0e7308379c44996c82d5d4c86",
        "expectedParentSha": "c485ec013041df8bd9aed5432b22f47c302db6d9",
        "destinationPrecondition": "ABSENT",
        "expectedDestinationSha": None,
        "authorizationRef": "staffordnext-node24.owner-authorized-publication.2026-10-27",
        "approvedFiles": [
            {"path":".github/workflows/staffordnext-node-runtime.yml","mode":"100644","sha256":"e963ab832dd20db5e4bd1f1f9b7100cade29a53b78f5c6ce3bc74bbbc13becb6"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/.node-version","mode":"100644","sha256":"d9f318747a126ce2247661af67852b185def7789492eabfad7bba322be087c33"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/package-lock.json","mode":"100644","sha256":"ee92fa5925c8b15a76420831d3be29516c530bdda2ab09460c225643910e7c91"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/package.json","mode":"100644","sha256":"264eb5ffafbd12bdb3d534ad399040e5521fa187079bbeeecbfcab3a957823ad"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/scripts/assert-node-version.mjs","mode":"100644","sha256":"c3275520fed23b0d792df2c5c3c0e462f76b9b9b25d75671828b5cccbeebedb8"},
        ],
    }
    review_followup = {
        "remoteName": "origin",
        "sourceCommitSha": "db177287456f42d3706f39da5d24d629fd916989",
        "sourceTreeSha": "5068283d545217ec7311f0b31a2258a92683d608",
        "expectedParentSha": "0908c5d98614f1542e41e10124c924051c768069",
        "destinationPrecondition": "EXACT_SHA",
        "expectedDestinationSha": "0908c5d98614f1542e41e10124c924051c768069",
        "authorizationRef": "staffordnext-node24.review-followup-publication.2026-10-27",
        "approvedFiles": [
            {"path":"staffordos/ui/operator-frontend/careeros-beta/scripts/promote_remote_beta_branch_v1.sh","mode":"100755","sha256":"00d546612f313919dd5d63aea81bb796a5b4b0ec505ccb6044846e030251215e"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/scripts/promote_remote_beta_branch_v1.test.mjs","mode":"100644","sha256":"ed055c4ce15d25bffebc59b9c7563f87e4ae6f6de209678478c611d6731142f0"},
        ],
    }
    if not any(all(value[key] == expected for key, expected in authorized.items()) for authorized in (initial, review_followup)):
        reject("PUSH_BLOCKED_AUTHORIZATION")
if db_cart_destination:
    initial = {
        "remoteName": "origin",
        "sourceCommitSha": "e4b34c38b2db7f3346950e2e8a2ac08cc7a6ef92",
        "sourceTreeSha": "e0ecd9ebcaf5f5fda47e825d5227ac871ae3c896",
        "expectedParentSha": "3fe5438b8eb43d2b8ebd19ab0e4725927b49737d",
        "destinationPrecondition": "ABSENT",
        "expectedDestinationSha": None,
        "authorizationRef": "db-security-cart-agent.owner-authorized-publication.2026-10-28",
        "approvedFiles": [
            {"path":"web/src/lib/packetRepository.js","mode":"100644","sha256":"1366b6247eac50bce3a1e03a08ae9ed5745557bc67eb2c61db08e54a5e461216"},
            {"path":"web/src/lib/postgresConnection.js","mode":"100644","sha256":"944e49f62f98f2edf97f17bc1686e042d2a7b3a57900de82f4148c9d6aa5ec63"},
            {"path":"web/src/lib/postgresConnection.test.js","mode":"100644","sha256":"82498387c0aaa648b693337fbdfe87263bbfdfa81f6fbb3fb94e291a2afba47f"},
            {"path":"web/src/routes/checkoutEventProof.esm.js","mode":"100644","sha256":"42ff4ec412a536a0d8e5d83766ad938a92a9bd006d71ccb795fd7b570cf687a2"},
            {"path":"web/src/routes/merchantSummary.esm.js","mode":"100644","sha256":"b127c931cf61e37f136ba3ffb6169c666a391322ede02e13c5c58281e6c603b8"},
            {"path":"web/src/routes/recoveryTrigger.esm.js","mode":"100644","sha256":"0dba64365ec56eb66431bf6b6fdc041ff4671c08446e2b6224eb08efa40bae5e"},
        ],
    }
    review_followup = {
        "remoteName": "origin",
        "sourceCommitSha": "4bda3c7530f9bffb3a7dba92dcf4243c578078b7",
        "sourceTreeSha": "63f50bba956cb12220a554f18b8650445d7d3b47",
        "expectedParentSha": "e4b34c38b2db7f3346950e2e8a2ac08cc7a6ef92",
        "destinationPrecondition": "EXACT_SHA",
        "expectedDestinationSha": "e4b34c38b2db7f3346950e2e8a2ac08cc7a6ef92",
        "authorizationRef": "db-security-cart-agent.review-followup-publication.2026-10-28",
        "approvedFiles": [
            {"path":"web/src/lib/postgresConnection.js","mode":"100644","sha256":"24c9f007b99547030584718366328df2dc19011455036a6e0364659a896e7643"},
            {"path":"web/src/lib/postgresConnection.test.js","mode":"100644","sha256":"490e0c64965d0ae27fcb67f0d9522dbfe31c5327e1e9d203becbc107d3a902d6"},
        ],
    }
    loopback_followup = {
        "remoteName": "origin",
        "sourceCommitSha": "c86582f774be8fbe551ebc2c5028e72f93a0ba81",
        "sourceTreeSha": "0545f66373f68d08618be9efd5d8961d01a6d563",
        "expectedParentSha": "4bda3c7530f9bffb3a7dba92dcf4243c578078b7",
        "destinationPrecondition": "EXACT_SHA",
        "expectedDestinationSha": "4bda3c7530f9bffb3a7dba92dcf4243c578078b7",
        "authorizationRef": "db-security-cart-agent.loopback-followup-publication.2026-10-29",
        "approvedFiles": [
            {"path":"web/src/lib/postgresConnection.js","mode":"100644","sha256":"c2dd2cb3b9b163858fdf48b828a8b237fcac7a4d59ed76e20094be43692e8d80"},
            {"path":"web/src/lib/postgresConnection.test.js","mode":"100644","sha256":"ca5cbb525037f73c5298b7fa0facd228df0e43c6f9adefc840748a62b02aabdc"},
        ],
    }
    if not any(all(value[key] == expected for key, expected in authorized.items()) for authorized in (initial, review_followup, loopback_followup)):
        reject("PUSH_BLOCKED_AUTHORIZATION")
if db_staffordnext_destination:
    initial = {
        "remoteName": "origin",
        "sourceCommitSha": "b93f1465b8c603bd8fc347d5360b3b645b853d5e",
        "sourceTreeSha": "474f21527883bcdf6279c8a0ebbf55e6f74ee53e",
        "expectedParentSha": "6e7323f3f19dcd0788f320c9d53def50c6dfef9d",
        "destinationPrecondition": "ABSENT",
        "expectedDestinationSha": None,
        "authorizationRef": "db-security-staffordnext.owner-authorized-publication.2026-10-28",
        "approvedFiles": [
            {"path":"staffordos/ui/operator-frontend/careeros-beta/lib/career/careerP0Postgres.mjs","mode":"100644","sha256":"ba002076e1e62c75758de105ec7c32748fd70dcfad1bb388667fbe8354078049"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/lib/career/postgresConnection.mjs","mode":"100644","sha256":"d9363a312df53d5f7461b94832f4c7b9432682f44743abab8ce3620c60faca41"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/lib/career/postgresConnection.test.mjs","mode":"100644","sha256":"9cacccddbdccb67860034278ee859ab80a0ac66c9302298277b00c66ab740f2a"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/scripts/start-careeros.mjs","mode":"100644","sha256":"c89dbdd031bd90cdbe82317dc8e58340256c777fa8edbcb94c7ea2d8c527bac0"},
        ],
    }
    review_followup = {
        "remoteName": "origin",
        "sourceCommitSha": "7e74f6c8ec15b8976910e81bdc48458ab27980b0",
        "sourceTreeSha": "2bab8e5b0fb576cc6364c7919661522ba55930f9",
        "expectedParentSha": "b93f1465b8c603bd8fc347d5360b3b645b853d5e",
        "destinationPrecondition": "EXACT_SHA",
        "expectedDestinationSha": "b93f1465b8c603bd8fc347d5360b3b645b853d5e",
        "authorizationRef": "db-security-staffordnext.review-followup-publication.2026-10-28",
        "approvedFiles": [
            {"path":"staffordos/ui/operator-frontend/careeros-beta/lib/career/postgresConnection.mjs","mode":"100644","sha256":"7e09a6a24587d0a2ff985141a81857fb2e1d5911fd4b4ecaff4f308217f1f749"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/lib/career/postgresConnection.test.mjs","mode":"100644","sha256":"698ea8334847a8cc3e0de413122a9f0397956b9c60d77c947264c50b731b908a"},
        ],
    }
    loopback_followup = {
        "remoteName": "origin",
        "sourceCommitSha": "3f659a8ef8064608c5c3d0f6cd19da7527016332",
        "sourceTreeSha": "03dd5afc7c8da7bccede6c9dd9857b7d4d2f1927",
        "expectedParentSha": "7e74f6c8ec15b8976910e81bdc48458ab27980b0",
        "destinationPrecondition": "EXACT_SHA",
        "expectedDestinationSha": "7e74f6c8ec15b8976910e81bdc48458ab27980b0",
        "authorizationRef": "db-security-staffordnext.loopback-followup-publication.2026-10-29",
        "approvedFiles": [
            {"path":"staffordos/ui/operator-frontend/careeros-beta/lib/career/postgresConnection.mjs","mode":"100644","sha256":"cb75920530d734cc79144f1d3091a8c51136be8c48ae5281895efa62842b52af"},
            {"path":"staffordos/ui/operator-frontend/careeros-beta/lib/career/postgresConnection.test.mjs","mode":"100644","sha256":"28bae8393ba6526c1dd5479c47e6d0d7bf2cc55fe14f09bf4123d184acb8690b"},
        ],
    }
    if not any(all(value[key] == expected for key, expected in authorized.items()) for authorized in (initial, review_followup, loopback_followup)):
        reject("PUSH_BLOCKED_AUTHORIZATION")
if db_staffordos_core_destination:
    initial = {
        "remoteName": "origin",
        "sourceCommitSha": "c534f903627a8c98920db34d4800af60b9211823",
        "sourceTreeSha": "66aa7b6e656a94e9231354e94df4518d3ae7dc76",
        "expectedParentSha": "b21c91bf0214d02d4b6c257560c5d1e3b2fd19bc",
        "destinationPrecondition": "ABSENT",
        "expectedDestinationSha": None,
        "authorizationRef": "db-security-staffordos-core.owner-authorized-publication.2026-10-28",
        "approvedFiles": [
            {"path":"package.json","mode":"100644","sha256":"d33ed5e9563088e93b78621042284d5e94881f6aae000893d6174483411bd173"},
            {"path":"src/postgresConnection.test.ts","mode":"100644","sha256":"3a097b9a1189c9dab21641524193e0ed6a766e59cd9e1d20f1e67cccbc486bb5"},
            {"path":"src/postgresConnection.ts","mode":"100644","sha256":"4bcdd0f2cd675fb53acd868d0aef4ab397f69b4c15419e0217a54ed174b11a9e"},
            {"path":"src/server.ts","mode":"100644","sha256":"54342820f98b34f20660508303ea91f3ed7b0ce01ec2d94683fed63b6b6211d9"},
        ],
    }
    review_followup = {
        "remoteName": "origin",
        "sourceCommitSha": "8b3790e1dd23147e0e1a8a3d611dcc075f0dd6a9",
        "sourceTreeSha": "972fbfa70a58d664cf3027add1ba2c7ce76a6fc0",
        "expectedParentSha": "c534f903627a8c98920db34d4800af60b9211823",
        "destinationPrecondition": "EXACT_SHA",
        "expectedDestinationSha": "c534f903627a8c98920db34d4800af60b9211823",
        "authorizationRef": "db-security-staffordos-core.review-followup-publication.2026-10-28",
        "approvedFiles": [
            {"path":".github/workflows/database-tls.yml","mode":"100644","sha256":"caf71082cd098cad0c1736f1414ff24b96a1c9300085d14135707348debb009d"},
            {"path":"src/postgresConnection.test.ts","mode":"100644","sha256":"a8f7c6fe3b55dfe8b63aedae7ad155f1dd55dca750a353b3aadb2d978ee7244a"},
            {"path":"src/postgresConnection.ts","mode":"100644","sha256":"d6756ff1e00e2786b0685466f85e382ef1677b55ebeeea162df9c25aa8f287cf"},
        ],
    }
    loopback_followup = {
        "remoteName": "origin",
        "sourceCommitSha": "e64e440d429c4b6003f83ca8bf5e05ef1288f578",
        "sourceTreeSha": "0c9f0b2aa32617b5e00d04514e5b2732b46b3dfb",
        "expectedParentSha": "8b3790e1dd23147e0e1a8a3d611dcc075f0dd6a9",
        "destinationPrecondition": "EXACT_SHA",
        "expectedDestinationSha": "8b3790e1dd23147e0e1a8a3d611dcc075f0dd6a9",
        "authorizationRef": "db-security-staffordos-core.loopback-followup-publication.2026-10-29",
        "approvedFiles": [
            {"path":"src/postgresConnection.test.ts","mode":"100644","sha256":"fe167ae4e4a2e2be7e1d32c03d4c68441a4fffe879f3ba5873bfb440ec5bb475"},
            {"path":"src/postgresConnection.ts","mode":"100644","sha256":"ab00048c2aa45be571490b2fdf6078757b50d306b28293d5c8e019151395500e"},
        ],
    }
    if not any(all(value[key] == expected for key, expected in authorized.items()) for authorized in (initial, review_followup, loopback_followup)):
        reject("PUSH_BLOCKED_AUTHORIZATION")
Path(sys.argv[2]).write_text(json.dumps(value, ensure_ascii=True, separators=(",", ":")), encoding="ascii")
PY
then
  CODE="$(sed -n 's/.*\(PUSH_BLOCKED_[A-Z_]*\).*/\1/p' "$RUNNER_TMP/manifest.err" | head -1)"
  printf '%s\n' "${CODE:-PUSH_BLOCKED_MANIFEST}"; exit 1
fi

REPO_ROOT="$("$PYTHON_BIN" -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["repositoryRoot"])' "$RUNNER_TMP/validated.json")"
REMOTE_NAME="$("$PYTHON_BIN" -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["remoteName"])' "$RUNNER_TMP/validated.json")"
REMOTE_ID="$("$PYTHON_BIN" -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["canonicalRemoteIdentity"])' "$RUNNER_TMP/validated.json")"
SOURCE="$("$PYTHON_BIN" -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["sourceCommitSha"])' "$RUNNER_TMP/validated.json")"
TREE="$("$PYTHON_BIN" -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["sourceTreeSha"])' "$RUNNER_TMP/validated.json")"
PARENT="$("$PYTHON_BIN" -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["expectedParentSha"])' "$RUNNER_TMP/validated.json")"
DEST="$("$PYTHON_BIN" -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["destinationRef"])' "$RUNNER_TMP/validated.json")"
STATE="$("$PYTHON_BIN" -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["destinationPrecondition"])' "$RUNNER_TMP/validated.json")"
EXPECTED_DEST="$("$PYTHON_BIN" -I -c 'import json,sys; print(json.load(open(sys.argv[1]))["expectedDestinationSha"] or "")' "$RUNNER_TMP/validated.json")"
PR133_LEGACY_DESTINATION=0
if [ "$DEST" = "refs/heads/careos/migration-runner-v1" ] && [ "$REMOTE_ID" = "https://github.com/RStaff/cart-agent.git" ]; then
  PR133_LEGACY_DESTINATION=1
fi
SCANNER_REPAIR_DESTINATION=0
if [ "$DEST" = "refs/heads/careos/secret-scan-scope-20261027" ] && [ "$REMOTE_ID" = "https://github.com/RStaff/cart-agent.git" ]; then
  SCANNER_REPAIR_DESTINATION=1
fi
SECURITY_RELEASE_DESTINATION=0
if [ "$DEST" = "refs/heads/careos/staffordnext-security-release-20261027" ] && [ "$REMOTE_ID" = "https://github.com/RStaff/cart-agent.git" ]; then
  SECURITY_RELEASE_DESTINATION=1
fi
STAFFORDNEXT_NODE24_DESTINATION=0
if [ "$DEST" = "refs/heads/careos/staffordnext-node24-20261027" ] && [ "$REMOTE_ID" = "https://github.com/RStaff/cart-agent.git" ]; then
  STAFFORDNEXT_NODE24_DESTINATION=1
fi
DB_CART_DESTINATION=0
if [ "$DEST" = "refs/heads/careos/db-security-cart-agent-20261028" ] && [ "$REMOTE_ID" = "https://github.com/RStaff/cart-agent.git" ]; then
  DB_CART_DESTINATION=1
fi
DB_STAFFORDNEXT_DESTINATION=0
if [ "$DEST" = "refs/heads/careos/db-security-staffordnext-20261028" ] && [ "$REMOTE_ID" = "https://github.com/RStaff/cart-agent.git" ]; then
  DB_STAFFORDNEXT_DESTINATION=1
fi
DB_STAFFORDOS_CORE_DESTINATION=0
if [ "$DEST" = "refs/heads/security/db-tls-staffordos-core-20261028" ] && [ "$REMOTE_ID" = "https://github.com/RStaff/staffordos-core.git" ]; then
  DB_STAFFORDOS_CORE_DESTINATION=1
fi
DB_TLS_TEST_PRODUCTION_BASE=""

TEST_LOCAL_FAILURE=0
if [ "$TEST_MODE" = 1 ]; then
  if ! SYNTHETIC_PATHS="$("$PYTHON_BIN" -I - "$REPO_ROOT" "$REMOTE_ID" 2>/dev/null <<'PY'
import os, stat, sys
from pathlib import Path

def canonical(raw):
    path = Path(raw)
    if not path.is_absolute() or ".." in path.parts:
        raise SystemExit(1)
    current = Path(path.anchor)
    for part in path.parts[1:]:
        current = current / part
        if stat.S_ISLNK(current.lstat().st_mode):
            raise SystemExit(1)
    resolved = path.resolve(strict=True)
    if resolved != path or not resolved.is_dir():
        raise SystemExit(1)
    return resolved

repo = canonical(sys.argv[1])
remote = canonical(sys.argv[2])
allowed_roots = (Path("/tmp"), Path("/private/tmp"), Path("/var/folders"), Path("/private/var/folders"))
if not any(root == repo or root in repo.parents for root in allowed_roots):
    raise SystemExit(1)
if repo.name != "repo" or remote.name != "remote.git" or repo.parent != remote.parent:
    raise SystemExit(1)
print(repo)
print(remote)
PY
)"; then printf '%s\n' PUSH_BLOCKED_SYNTHETIC_BOUNDARY; exit 1; fi
  REPO_ROOT="$(printf '%s\n' "$SYNTHETIC_PATHS" | sed -n '1p')"
  REMOTE_ID="$(printf '%s\n' "$SYNTHETIC_PATHS" | sed -n '2p')"
  TEST_CONTROL="$REPO_ROOT/.staffordos-exact-ref-test-control"
  [ -f "$TEST_CONTROL" ] && [ ! -L "$TEST_CONTROL" ] || { printf '%s\n' PUSH_BLOCKED_SYNTHETIC_BOUNDARY; exit 1; }
  DB_TLS_TEST_PROFILE="$(sed -n 's/^db-tls-profile=//p' "$TEST_CONTROL")"
  DB_TLS_TEST_PRODUCTION_BASE="$(sed -n 's/^db-tls-production-base=//p' "$TEST_CONTROL")"
  if [ -n "$DB_TLS_TEST_PROFILE" ] || [ -n "$DB_TLS_TEST_PRODUCTION_BASE" ]; then
    [ "$(grep -c '^db-tls-profile=' "$TEST_CONTROL")" = 1 ] &&
      [ "$(grep -c '^db-tls-production-base=' "$TEST_CONTROL")" = 1 ] &&
      printf '%s' "$DB_TLS_TEST_PRODUCTION_BASE" | grep -Eq '^[a-f0-9]{40}$' || { printf '%s\n' PUSH_BLOCKED_SYNTHETIC_BOUNDARY; exit 1; }
    case "$DB_TLS_TEST_PROFILE:$DEST" in
      cart:refs/heads/careos/db-security-cart-agent-20261028) DB_CART_DESTINATION=1 ;;
      staffordnext:refs/heads/careos/db-security-staffordnext-20261028) DB_STAFFORDNEXT_DESTINATION=1 ;;
      staffordos-core:refs/heads/security/db-tls-staffordos-core-20261028) DB_STAFFORDOS_CORE_DESTINATION=1 ;;
      *) printf '%s\n' PUSH_BLOCKED_SYNTHETIC_BOUNDARY; exit 1 ;;
    esac
  fi
  printf '%s\n' "$RUNNER_TMP" > "$TEST_CONTROL.tmp-path"
  TRACE_FILE="$RUNNER_TMP/trace2.json"
  (set -C; : > "$TRACE_FILE") 2>/dev/null || { printf '%s\n' PUSH_BLOCKED_SYNTHETIC_BOUNDARY; exit 1; }
  chmod 600 "$TRACE_FILE"
  printf '%s\n' "$TRACE_FILE" > "$TEST_CONTROL.trace-path"
  export GIT_TRACE2_EVENT="$TRACE_FILE"
  export GIT_TRACE2_EVENT_NESTING=8
fi

USE_CREDENTIAL_HELPER=0
case "$REMOTE_ID" in https://github.com/*) USE_CREDENTIAL_HELPER=1 ;; esac
if [ "$TEST_MODE" = 1 ] && grep -Fxq 'credential-helper=synthetic' "$TEST_CONTROL"; then USE_CREDENTIAL_HELPER=1; fi
verify_gh_identity() {
  "$PYTHON_BIN" -I - "$1" "$2" "$3" "${4:-0}" 2>/dev/null <<'PY'
import os, stat, subprocess, sys
from pathlib import Path

def fail():
    raise SystemExit(1)

try:
    entry = Path(sys.argv[1])
    prefix = Path(sys.argv[2]).resolve(strict=True)
    namespace = Path(sys.argv[3]).resolve(strict=True)
    require_entry_symlink = sys.argv[4] == "1"
    entry_info = entry.lstat()
    if require_entry_symlink and not stat.S_ISLNK(entry_info.st_mode):
        fail()
    if not require_entry_symlink and not (stat.S_ISLNK(entry_info.st_mode) or stat.S_ISREG(entry_info.st_mode)):
        fail()
    entry_parent = entry.parent
    entry_device = entry_parent.stat().st_dev
    if entry_info.st_dev != entry_device or entry_info.st_uid not in (0, os.getuid()) or entry_info.st_mode & 0o002:
        fail()
    current = entry_parent
    while True:
        item = current.lstat()
        if stat.S_ISLNK(item.st_mode) or item.st_dev != entry_device:
            fail()
        if item.st_uid not in (0, os.getuid()) or item.st_mode & 0o002:
            fail()
        if item.st_mode & 0o020 and prefix not in current.parents and current != prefix:
            fail()
        if current == Path("/"):
            break
        current = current.parent
    first = entry.resolve(strict=True)
    second = entry.resolve(strict=True)
    entry_after = entry.lstat()
    if (entry_info.st_dev, entry_info.st_ino, entry_info.st_mode, entry_info.st_uid) != (entry_after.st_dev, entry_after.st_ino, entry_after.st_mode, entry_after.st_uid):
        fail()
    if first != second or namespace not in first.parents:
        fail()
    target_stat = first.stat()
    if not stat.S_ISREG(target_stat.st_mode) or not os.access(first, os.X_OK):
        fail()
    uid = os.getuid()
    if target_stat.st_uid not in (0, uid) or target_stat.st_mode & 0o222:
        fail()
    device = prefix.stat().st_dev
    current = first
    while True:
        item = current.lstat()
        if stat.S_ISLNK(item.st_mode) or item.st_dev != device:
            fail()
        if item.st_uid not in (0, uid) or item.st_mode & 0o002:
            fail()
        if item.st_mode & 0o020 and prefix not in current.parents and current != prefix:
            fail()
        if current == prefix:
            break
        if prefix not in current.parents:
            fail()
        current = current.parent
    first_stat = first.stat()
    second_stat = second.stat()
    if (first_stat.st_dev, first_stat.st_ino, first_stat.st_mode, first_stat.st_uid) != (second_stat.st_dev, second_stat.st_ino, second_stat.st_mode, second_stat.st_uid):
        fail()
    for component in [first, *first.parents]:
        listing = subprocess.run(['/bin/ls', '-lde', str(component)], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, check=True).stdout.split()
        if not listing or listing[0].endswith('+'):
            fail()
    print(first)
except Exception:
    raise SystemExit(1)
PY
}
verify_os_home() {
  "$PYTHON_BIN" -I - 2>/dev/null <<'PY'
import os, pwd, stat
from pathlib import Path
try:
    home = Path(pwd.getpwuid(os.geteuid()).pw_dir)
    if not home.is_absolute(): raise SystemExit(1)
    first = home.resolve(strict=True)
    second = home.resolve(strict=True)
    if first != second: raise SystemExit(1)
    uid = os.getuid()
    device = first.stat().st_dev
    current = first
    while True:
        item = current.lstat()
        if stat.S_ISLNK(item.st_mode) or item.st_dev != device or item.st_uid not in (0, uid) or item.st_mode & 0o002:
            raise SystemExit(1)
        if current == Path("/"): break
        current = current.parent
    print(first)
except Exception:
    raise SystemExit(1)
PY
}
verify_gh_config() {
  "$PYTHON_BIN" -I - "$1" "$2" 2>/dev/null <<'PY'
import os, stat, sys
from pathlib import Path
try:
    config, home = Path(sys.argv[1]), Path(sys.argv[2]).resolve(strict=True)
    if config != home / ".config" / "gh": raise SystemExit(1)
    if not config.exists(): raise SystemExit(0)
    info = config.lstat()
    if not stat.S_ISDIR(info.st_mode) or stat.S_ISLNK(info.st_mode): raise SystemExit(1)
    uid = os.getuid()
    if info.st_uid not in (0, uid) or info.st_mode & 0o022: raise SystemExit(1)
    for item in config.iterdir():
        child = item.lstat()
        if stat.S_ISLNK(child.st_mode) or not stat.S_ISREG(child.st_mode): raise SystemExit(1)
        if child.st_uid not in (0, uid) or child.st_mode & 0o022: raise SystemExit(1)
except Exception:
    raise SystemExit(1)
PY
}
if [ "$USE_CREDENTIAL_HELPER" = 1 ]; then
  GH_EXPECTED='/opt/homebrew/bin/gh'
  GH_TRUST_ROOT='/opt/homebrew'
  GH_NAMESPACE='/opt/homebrew/Cellar/gh'
  if [ "$TEST_MODE" = 1 ]; then
    GH_EXPECTED="$REPO_ROOT/.staffordos-exact-ref-test-gh"
    GH_TRUST_ROOT="$REPO_ROOT"
    GH_NAMESPACE="$REPO_ROOT"
  fi
  if [ "$TEST_MODE" = 0 ] && [ "$GH_EXPECTED" != '/opt/homebrew/bin/gh' ]; then
    printf '%s\n' PUSH_BLOCKED_CREDENTIAL_HELPER
    exit 1
  fi
  ENTRY_SYMLINK=0; [ "$TEST_MODE" = 0 ] && ENTRY_SYMLINK=1
  if ! GH_REAL="$(verify_gh_identity "$GH_EXPECTED" "$GH_TRUST_ROOT" "$GH_NAMESPACE" "$ENTRY_SYMLINK")"; then
    printf '%s\n' PUSH_BLOCKED_CREDENTIAL_HELPER
    exit 1
  fi
  if ! OS_HOME="$(verify_os_home)" || ! verify_gh_config "$OS_HOME/.config/gh" "$OS_HOME"; then
    printf '%s\n' PUSH_BLOCKED_CREDENTIAL_HELPER
    exit 1
  fi
  export HOME="$OS_HOME"
  export GH_CONFIG_DIR="$OS_HOME/.config/gh"
  GIT_CONFIG_FILE="$RUNNER_TMP/gitconfig"
  (umask 077; : > "$GIT_CONFIG_FILE") || { printf '%s\n' PUSH_BLOCKED_CREDENTIAL_CONFIG; exit 1; }
  chmod 600 "$GIT_CONFIG_FILE"
  export GIT_CONFIG_GLOBAL="$GIT_CONFIG_FILE"
  verify_gh_identity "$GH_EXPECTED" "$GH_TRUST_ROOT" "$GH_NAMESPACE" "$ENTRY_SYMLINK" >/dev/null || { printf '%s\n' PUSH_BLOCKED_CREDENTIAL_HELPER; exit 1; }
  "$GIT_BIN" config --file "$GIT_CONFIG_FILE" credential.https://github.com.helper "!$GH_REAL auth git-credential"
  "$GIT_BIN" config --file "$GIT_CONFIG_FILE" credential.https://github.com.useHttpPath false
  chmod 400 "$GIT_CONFIG_FILE"
  verify_gh_identity "$GH_EXPECTED" "$GH_TRUST_ROOT" "$GH_NAMESPACE" "$ENTRY_SYMLINK" >/dev/null || { printf '%s\n' PUSH_BLOCKED_CREDENTIAL_HELPER; exit 1; }
  "$GH_REAL" auth status --hostname github.com >/dev/null 2>&1 || { printf '%s\n' PUSH_BLOCKED_CREDENTIAL_HELPER; exit 1; }
fi
test_gate() {
  [ "${TEST_MODE:-0}" = 1 ] || return 0
  local phase="$1"
  if grep -Fxq "wait:$phase" "$TEST_CONTROL"; then
    : > "$TEST_CONTROL.$phase.started"
    while [ ! -e "$TEST_CONTROL.$phase.release" ]; do sleep 0.01; done
  fi
  if grep -Fxq "fail:$phase" "$TEST_CONTROL"; then TEST_LOCAL_FAILURE=1; fi
  if grep -Fxq "unavailable:$phase" "$TEST_CONTROL"; then mv -- "$REMOTE_ID" "$REMOTE_ID.unavailable"; fi
}

INVOKED_ROOT="$(pwd -P)"
CANONICAL_ROOT="$($GIT_BIN -C "$REPO_ROOT" rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$CANONICAL_ROOT" ] && [ "$REPO_ROOT" = "$CANONICAL_ROOT" ] && [ "$REPO_ROOT" = "$INVOKED_ROOT" ] || { printf '%s\n' PUSH_BLOCKED_REPOSITORY; exit 1; }
REMOTE_URLS="$("$GIT_BIN" -C "$REPO_ROOT" config --includes --local --get-all "remote.$REMOTE_NAME.url" || true)"
PUSH_URLS="$("$GIT_BIN" -C "$REPO_ROOT" config --includes --local --get-all "remote.$REMOTE_NAME.pushurl" || true)"
REWRITES="$("$GIT_BIN" -C "$REPO_ROOT" config --includes --local --get-regexp '^(url\..*\.(insteadof|pushinsteadof)|include\.|includeif\.)' || true)"
LOCAL_CREDENTIALS="$("$GIT_BIN" -C "$REPO_ROOT" config --includes --local --get-regexp '^credential\.' || true)"
LOCAL_TRANSPORT="$("$GIT_BIN" -C "$REPO_ROOT" config --includes --local --get-regexp '^(http|https)\.' || true)"
LOCAL_FSMONITOR="$("$GIT_BIN" -C "$REPO_ROOT" config --local --get-regexp '^core\.fsmonitor$' || true)"
WORKTREE_OVERRIDES="$("$GIT_BIN" -C "$REPO_ROOT" config --worktree --get-regexp '^(url\..*\.(insteadof|pushinsteadof)|include\.|includeif\.|credential\.|http\.|https\.|core\.fsmonitor$)' 2>/dev/null || true)"
[ "$(printf '%s\n' "$REMOTE_URLS" | awk 'NF{n++} END{print n+0}')" = 1 ] && [ "$REMOTE_URLS" = "$REMOTE_ID" ] && [ -z "$PUSH_URLS" ] && [ -z "$REWRITES" ] || { printf '%s\n' PUSH_BLOCKED_REMOTE_IDENTITY; exit 1; }
[ -z "$LOCAL_CREDENTIALS" ] || { printf '%s\n' PUSH_BLOCKED_CREDENTIAL_CONFIG; exit 1; }
[ -z "$LOCAL_TRANSPORT" ] || { printf '%s\n' PUSH_BLOCKED_TRANSPORT_CONFIG; exit 1; }
[ -z "$LOCAL_FSMONITOR" ] || { printf '%s\n' PUSH_BLOCKED_REPOSITORY_CONFIG; exit 1; }
[ -z "$WORKTREE_OVERRIDES" ] || { printf '%s\n' PUSH_BLOCKED_WORKTREE_CONFIG; exit 1; }
case "$REMOTE_ID" in *://*@*) printf '%s\n' PUSH_BLOCKED_REMOTE_IDENTITY; exit 1 ;; esac
[ "$("$GIT_BIN" -C "$REPO_ROOT" rev-parse --is-inside-work-tree)" = true ] || { printf '%s\n' PUSH_BLOCKED_REPOSITORY; exit 1; }
[ -z "$("$GIT_BIN" -C "$REPO_ROOT" -c core.fsmonitor=false status --porcelain)" ] || { printf '%s\n' PUSH_BLOCKED_DIRTY_WORKTREE; exit 1; }
[ -z "$("$GIT_BIN" -C "$REPO_ROOT" diff --cached --name-only)" ] || { printf '%s\n' PUSH_BLOCKED_INDEX; exit 1; }
[ "$("$GIT_BIN" -C "$REPO_ROOT" cat-file -t "$SOURCE")" = commit ] || { printf '%s\n' PUSH_BLOCKED_SOURCE; exit 1; }
[ "$("$GIT_BIN" -C "$REPO_ROOT" show -s --format=%T "$SOURCE")" = "$TREE" ] || { printf '%s\n' PUSH_BLOCKED_TREE; exit 1; }
[ "$("$GIT_BIN" -C "$REPO_ROOT" show -s --format=%P "$SOURCE")" = "$PARENT" ] || { printf '%s\n' PUSH_BLOCKED_PARENT; exit 1; }
[ "$("$GIT_BIN" -C "$REPO_ROOT" rev-list --count "$PARENT..$SOURCE")" = 1 ] || { printf '%s\n' PUSH_BLOCKED_HISTORY; exit 1; }
[ "$("$GIT_BIN" -C "$REPO_ROOT" show -s --format=%P "$SOURCE" | wc -w | tr -d ' ')" = 1 ] || { printf '%s\n' PUSH_BLOCKED_MERGE; exit 1; }

validate_commit_contents() {
local validation_repo="${1:-$REPO_ROOT}"
"$PYTHON_BIN" -I - "$validation_repo" "$SOURCE" "$PARENT" "$GIT_BIN" "$RUNNER_TMP/validated.json" <<'PY'
import hashlib, json, subprocess, sys
repo, source, parent, gitbin, manifest = sys.argv[1:]
m = json.load(open(manifest))
def git(*args): return subprocess.check_output([gitbin, "-C", repo, *args], text=True).strip()
actual = sorted(filter(None, git("diff-tree", "--no-commit-id", "--name-only", "-r", "--no-renames", parent, source).splitlines()))
expected = sorted(f["path"] for f in m["approvedFiles"])
if actual != expected: raise SystemExit("PUSH_BLOCKED_FILE_SCOPE")
for f in m["approvedFiles"]:
    line = git("ls-tree", source, "--", f["path"])
    parts = line.split(None, 3)
    if len(parts) != 4 or parts[0] != f["mode"] or parts[1] != "blob": raise SystemExit("PUSH_BLOCKED_FILE_BINDING")
    data = subprocess.check_output([gitbin, "-C", repo, "show", source + ":" + f["path"]])
    if hashlib.sha256(data).hexdigest() != f["sha256"]: raise SystemExit("PUSH_BLOCKED_FILE_BINDING")
PY
}
validate_commit_contents
test_gate after-validation

"$GIT_BIN" -C "$REPO_ROOT" check-ref-format "$DEST" >/dev/null 2>&1 || { printf '%s\n' PUSH_BLOCKED_DESTINATION_REF; exit 1; }
REMOTE_URLS="$("$GIT_BIN" -C "$REPO_ROOT" config --includes --local --get-all "remote.$REMOTE_NAME.url" || true)"
PUSH_URLS="$("$GIT_BIN" -C "$REPO_ROOT" config --includes --local --get-all "remote.$REMOTE_NAME.pushurl" || true)"
REWRITES="$("$GIT_BIN" -C "$REPO_ROOT" config --includes --local --get-regexp '^(url\..*\.(insteadof|pushinsteadof)|include\.|includeif\.)' || true)"
LOCAL_CREDENTIALS="$("$GIT_BIN" -C "$REPO_ROOT" config --includes --local --get-regexp '^credential\.' || true)"
LOCAL_TRANSPORT="$("$GIT_BIN" -C "$REPO_ROOT" config --includes --local --get-regexp '^(http|https)\.' || true)"
LOCAL_FSMONITOR="$("$GIT_BIN" -C "$REPO_ROOT" config --local --get-regexp '^core\.fsmonitor$' || true)"
WORKTREE_OVERRIDES="$("$GIT_BIN" -C "$REPO_ROOT" config --worktree --get-regexp '^(url\..*\.(insteadof|pushinsteadof)|include\.|includeif\.|credential\.|http\.|https\.|core\.fsmonitor$)' 2>/dev/null || true)"
[ "$(printf '%s\n' "$REMOTE_URLS" | awk 'NF{n++} END{print n+0}')" = 1 ] && [ "$REMOTE_URLS" = "$REMOTE_ID" ] && [ -z "$PUSH_URLS" ] && [ -z "$REWRITES" ] || { printf '%s\n' PUSH_BLOCKED_REMOTE_IDENTITY; exit 1; }
[ -z "$LOCAL_CREDENTIALS" ] || { printf '%s\n' PUSH_BLOCKED_CREDENTIAL_CONFIG; exit 1; }
[ -z "$LOCAL_TRANSPORT" ] || { printf '%s\n' PUSH_BLOCKED_TRANSPORT_CONFIG; exit 1; }
[ -z "$LOCAL_FSMONITOR" ] || { printf '%s\n' PUSH_BLOCKED_REPOSITORY_CONFIG; exit 1; }
[ -z "$WORKTREE_OVERRIDES" ] || { printf '%s\n' PUSH_BLOCKED_WORKTREE_CONFIG; exit 1; }
[ "$REMOTE_URLS" = "$REMOTE_ID" ] || { printf '%s\n' PUSH_BLOCKED_REMOTE_IDENTITY; exit 1; }
[ -z "$($GIT_BIN -C "$REPO_ROOT" -c core.fsmonitor=false status --porcelain)" ] && [ -z "$($GIT_BIN -C "$REPO_ROOT" diff --cached --name-only)" ] || { printf '%s\n' PUSH_BLOCKED_REPOSITORY_STATE; exit 1; }
[ "$($GIT_BIN -C "$REPO_ROOT" cat-file -t "$SOURCE")" = commit ] && [ "$($GIT_BIN -C "$REPO_ROOT" show -s --format=%T "$SOURCE")" = "$TREE" ] && [ "$($GIT_BIN -C "$REPO_ROOT" show -s --format=%P "$SOURCE")" = "$PARENT" ] || { printf '%s\n' PUSH_BLOCKED_SOURCE_REVALIDATION; exit 1; }
validate_commit_contents
SOURCE_OBJECTS="$($GIT_BIN -C "$REPO_ROOT" rev-parse --git-path objects)"
case "$SOURCE_OBJECTS" in /*) ;; *) SOURCE_OBJECTS="$REPO_ROOT/$SOURCE_OBJECTS" ;; esac
NETWORK_REPO="$RUNNER_TMP/network.git"
TRUSTED_TEMPLATE="$RUNNER_TMP/empty-template"
mkdir -m 700 "$TRUSTED_TEMPLATE"
"$GIT_BIN" init --bare --template="$TRUSTED_TEMPLATE" "$NETWORK_REPO" >/dev/null
/bin/cp -R "$SOURCE_OBJECTS/." "$NETWORK_REPO/objects/"
chmod 400 "$NETWORK_REPO/config"
[ "$($GIT_BIN -C "$NETWORK_REPO" cat-file -t "$SOURCE")" = commit ] && [ "$($GIT_BIN -C "$NETWORK_REPO" show -s --format=%T "$SOURCE")" = "$TREE" ] && [ "$($GIT_BIN -C "$NETWORK_REPO" show -s --format=%P "$SOURCE")" = "$PARENT" ] || { printf '%s\n' PUSH_BLOCKED_SOURCE_REVALIDATION; exit 1; }
validate_commit_contents "$NETWORK_REPO"
snapshot() { "$GIT_BIN" -C "$NETWORK_REPO" ls-remote --heads --tags "$REMOTE_ID" 2>/dev/null | LC_ALL=C sort > "$1"; }
remote_ref() { "$GIT_BIN" -C "$NETWORK_REPO" ls-remote --refs "$REMOTE_ID" "$1" 2>/dev/null | awk 'NF {print $1; exit}' || true; }
BASE_REF="refs/heads/careeros/private-beta"
EXPECTED_BASE_SHA=""
if [ "$SCANNER_REPAIR_DESTINATION" = 1 ] || [ "$SECURITY_RELEASE_DESTINATION" = 1 ]; then BASE_REF="refs/heads/careeros/recovery-17b07030-20261026"; fi
if [ "$STAFFORDNEXT_NODE24_DESTINATION" = 1 ]; then BASE_REF="refs/heads/careos/staffordnext-security-release-20261027"; fi
if [ "$DB_CART_DESTINATION" = 1 ]; then BASE_REF="refs/heads/main"; EXPECTED_BASE_SHA="3fe5438b8eb43d2b8ebd19ab0e4725927b49737d"; fi
if [ "$DB_STAFFORDNEXT_DESTINATION" = 1 ]; then BASE_REF="refs/heads/careos/staffordnext-security-release-20261027"; EXPECTED_BASE_SHA="6e7323f3f19dcd0788f320c9d53def50c6dfef9d"; fi
if [ "$DB_STAFFORDOS_CORE_DESTINATION" = 1 ]; then BASE_REF="refs/heads/main"; EXPECTED_BASE_SHA="b21c91bf0214d02d4b6c257560c5d1e3b2fd19bc"; fi
if [ -n "$DB_TLS_TEST_PRODUCTION_BASE" ]; then EXPECTED_BASE_SHA="$DB_TLS_TEST_PRODUCTION_BASE"; fi
BEFORE="$RUNNER_TMP/before"; AFTER="$RUNNER_TMP/after"; if ! snapshot "$BEFORE"; then printf '%s\n' PUSH_BLOCKED_REMOTE_STATE; exit 1; fi
BASE_BEFORE="$(remote_ref "$BASE_REF")"
if [ "$PR133_LEGACY_DESTINATION" = 1 ]; then
  [ -n "$BASE_BEFORE" ] || { printf '%s\n' PUSH_BLOCKED_BASE; exit 1; }
elif [ -n "$EXPECTED_BASE_SHA" ]; then
  [ "$BASE_BEFORE" = "$EXPECTED_BASE_SHA" ] || { printf '%s\n' PUSH_BLOCKED_BASE; exit 1; }
elif [ "$SCANNER_REPAIR_DESTINATION" = 1 ] && [ "$STATE" = "EXACT_SHA" ]; then
  [ "$BASE_BEFORE" = "17b07030ce0dc8289b6efbd92ef60de8151e2976" ] || { printf '%s\n' PUSH_BLOCKED_BASE; exit 1; }
elif [ "$SECURITY_RELEASE_DESTINATION" = 1 ] && [ "$STATE" = "EXACT_SHA" ]; then
  [ "$BASE_BEFORE" = "$SOURCE" ] || { printf '%s\n' PUSH_BLOCKED_BASE; exit 1; }
elif [ "$STAFFORDNEXT_NODE24_DESTINATION" = 1 ]; then
  [ "$BASE_BEFORE" = "c485ec013041df8bd9aed5432b22f47c302db6d9" ] || { printf '%s\n' PUSH_BLOCKED_BASE; exit 1; }
else
  [ "$BASE_BEFORE" = "$PARENT" ] || { printf '%s\n' PUSH_BLOCKED_BASE; exit 1; }
fi
DEST_BEFORE="$(remote_ref "$DEST")"
if [ "$STATE" = ABSENT ]; then
  [ -z "$DEST_BEFORE" ] || { printf '%s\n' PUSH_BLOCKED_DESTINATION; exit 1; }
else
  [ "$DEST_BEFORE" = "$EXPECTED_DEST" ] || { printf '%s\n' PUSH_BLOCKED_DESTINATION; exit 1; }
  if [ "$SECURITY_RELEASE_DESTINATION" = 1 ]; then
    [ "$($GIT_BIN -C "$NETWORK_REPO" show -s --format=%T "$EXPECTED_DEST" 2>/dev/null)" = "$TREE" ] || { printf '%s\n' PUSH_BLOCKED_TREE_EQUIVALENCE; exit 1; }
  else
    "$GIT_BIN" -C "$NETWORK_REPO" merge-base --is-ancestor "$EXPECTED_DEST" "$SOURCE" || { printf '%s\n' PUSH_BLOCKED_FAST_FORWARD; exit 1; }
  fi
fi
DEST_RECHECK="$(remote_ref "$DEST")"; [ "$DEST_RECHECK" = "$DEST_BEFORE" ] || { printf '%s\n' PUSH_BLOCKED_DESTINATION_RACE; exit 1; }
test_gate before-push

PUSH_CODE=0
: > "$RUNNER_TMP/push.out"
: > "$RUNNER_TMP/push.err"
if ! { [ "$STATE" = "EXACT_SHA" ] && [ "$DEST_BEFORE" = "$SOURCE" ]; }; then
  if [ "$STATE" = ABSENT ]; then
    LEASE_ARG="--force-with-lease=$DEST:"
  else
    LEASE_ARG="--force-with-lease=$DEST:$EXPECTED_DEST"
  fi
  set +e
  GIT_BIN="$GIT_BIN" "$GIT_BIN" -C "$NETWORK_REPO" -c core.hooksPath="$RUNNER_TMP/hooks" push --porcelain --no-follow-tags "$LEASE_ARG" "$REMOTE_ID" "$SOURCE:$DEST" >"$RUNNER_TMP/push.out" 2>"$RUNNER_TMP/push.err"
  PUSH_CODE=$?
  set -e
fi
test_gate after-push
if [ "$TEST_MODE" = 1 ] && grep -Fxq 'inject-push-result' "$TEST_CONTROL"; then
  INJECTED_OUTPUT="$REPO_ROOT/.staffordos-exact-ref-test-control.output"
  [ -f "$INJECTED_OUTPUT" ] && [ ! -L "$INJECTED_OUTPUT" ] || { printf '%s\n' PUSH_BLOCKED_SYNTHETIC_BOUNDARY; exit 1; }
  cat -- "$INJECTED_OUTPUT" > "$RUNNER_TMP/push.err"
  : > "$RUNNER_TMP/push.out"
  PUSH_CODE=1
fi
if [ "$TEST_LOCAL_FAILURE" = 1 ]; then PUSH_CODE=75; fi
BASE_AFTER="$(remote_ref "$BASE_REF")"; DEST_AFTER="$(remote_ref "$DEST")"; if ! snapshot "$AFTER"; then printf '%s\n' PUSH_RESULT_UNKNOWN; exit 1; fi
awk -v ref="$DEST" '$2 != ref' "$BEFORE" > "$RUNNER_TMP/before-other"
awk -v ref="$DEST" '$2 != ref' "$AFTER" > "$RUNNER_TMP/after-other"
if [ "$DEST_AFTER" = "$SOURCE" ] && [ "$BASE_AFTER" = "$BASE_BEFORE" ] && cmp -s "$RUNNER_TMP/before-other" "$RUNNER_TMP/after-other"; then printf '%s\n' PUSH_CONFIRMED; exit 0; fi
if [ "$PUSH_CODE" -ne 0 ] && [ -z "$DEST_AFTER" ] && [ "$BASE_AFTER" = "$BASE_BEFORE" ]; then
  "$PYTHON_BIN" -I - "$RUNNER_TMP/push.err" "$RUNNER_TMP/push.out" "$PUSH_CODE" <<'PY'
import re, sys
from pathlib import Path

err_path, out_path, code = sys.argv[1], sys.argv[2], int(sys.argv[3])
try:
    err = Path(err_path).read_bytes()
    out = Path(out_path).read_bytes()
except Exception:
    print("PUSH_FAILED_UNKNOWN exit_status=%d destination=ABSENT protected_base=UNCHANGED" % code)
    raise SystemExit(0)
raw = err + out
if not raw or len(raw) > 65536 or b"\x00" in raw:
    print("PUSH_FAILED_UNKNOWN exit_status=%d destination=ABSENT protected_base=UNCHANGED" % code)
    raise SystemExit(0)
try:
    text = raw.decode("utf-8")
except UnicodeDecodeError:
    print("PUSH_FAILED_UNKNOWN exit_status=%d destination=ABSENT protected_base=UNCHANGED" % code)
    raise SystemExit(0)
text = text.replace("\r\n", "\n").replace("\r", "\n")
lines = text.split("\n")
if any(len(line) > 4096 or any(ord(ch) < 32 and ch not in "\t" for ch in line) for line in lines):
    print("PUSH_FAILED_UNKNOWN exit_status=%d destination=ABSENT protected_base=UNCHANGED" % code)
    raise SystemExit(0)
patterns = {
    "PUSH_FAILED_DNS": (r"^(?:fatal:\s+)?could not resolve host(?::|$)", r"^(?:fatal:\s+)?name or service not known$", r"^nodename nor servname provided(?:\s+in\s+.*)?$", r"^(?:fatal:\s+)?temporary failure in name resolution$"),
    "PUSH_FAILED_AUTHENTICATION": (r"^(?:fatal:\s+)?authentication failed(?:\b.*)?$", r"^(?:fatal:\s+)?could not read username(?:\b.*)?$"),
    "PUSH_FAILED_AUTHORIZATION": (r"^(?:error:\s+)?permission denied(?:\b.*)?$", r"^write access to repository not granted(?:\b.*)?$", r"^not allowed to push(?:\b.*)?$"),
    "PUSH_FAILED_REPOSITORY_NOT_FOUND_OR_UNDISCLOSED": (r"^(?:remote:\s*)?repository not found\.?$", r"^(?:fatal:\s+)?could not read from remote repository\.?$"),
    "PUSH_FAILED_REF_CREATION_REJECTED": (r"^remote rejected\b.*$", r"^(?:error:\s+)?non-fast-forward\b.*$", r"^(?:error:\s+)?cannot lock ref\b.*$", r"^(?:error:\s+)?failed to push some refs\.?$"),
    "PUSH_FAILED_REMOTE_POLICY": (r"^(?:remote:\s*)?pre-receive hook declined\b.*$", r"^(?:remote:\s*)?protected branch\b.*$", r"^(?:remote:\s*)?hook declined\b.*$"),
    "PUSH_FAILED_TRANSPORT": (r"^(?:fatal:\s+)?connection timed out\b.*$", r"^(?:fatal:\s+)?connection reset\b.*$", r"^(?:fatal:\s*)?couldn't connect\b.*$", r"^(?:fatal:\s*)?early eof$", r"^(?:fatal:\s*)?remote end hung up\b.*$", r"^(?:fatal:\s*)?(?:tls|ssl)\b.*$"),
}
matches = set()
for line in lines:
    lowered = line.lower()
    for category, expressions in patterns.items():
        if any(re.search(expression, lowered) for expression in expressions):
            matches.add(category)
category = next(iter(matches)) if len(matches) == 1 else "PUSH_FAILED_UNKNOWN"
print("%s exit_status=%d destination=ABSENT protected_base=UNCHANGED" % (category, code))
PY
  exit 1
fi
if [ "$DEST_AFTER" = "$SOURCE" ] || [ -n "$DEST_AFTER" ] || [ "$BASE_AFTER" != "$BASE_BEFORE" ]; then printf '%s\n' PUSH_RESULT_UNKNOWN; else printf '%s\n' PUSH_FAILED_UNKNOWN; fi
exit 1
