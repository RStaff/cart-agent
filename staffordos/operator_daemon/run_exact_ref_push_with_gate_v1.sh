#!/bin/bash
set -euo pipefail

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
unset GIT_PROTOCOL GIT_SSH_VARIANT GIT_ALLOW_PROTOCOL
unset GH_TOKEN GITHUB_TOKEN GH_ENTERPRISE_TOKEN GITHUB_ENTERPRISE_TOKEN GH_HOST GH_CONFIG_DIR XDG_CONFIG_HOME
export GIT_TERMINAL_PROMPT=0

mkdir -m 700 "$RUNNER_TMP/hooks"

"$GIT_BIN" -c core.hooksPath="$RUNNER_TMP/hooks" -C "$(pwd)" rev-parse --show-toplevel >/dev/null

if ! "$PYTHON_BIN" - "$MANIFEST" "$RUNNER_TMP/validated.json" 2>"$RUNNER_TMP/manifest.err" <<'PY'
import json, re, sys
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
raw = Path(sys.argv[1]).read_bytes()
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
if not re.fullmatch(r"refs/heads/(?:careeros|staffordos)/.+", destination): reject("PUSH_BLOCKED_DESTINATION_REF")
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
Path(sys.argv[2]).write_text(json.dumps(value, ensure_ascii=True, separators=(",", ":")), encoding="ascii")
PY
then
  CODE="$(sed -n 's/.*\(PUSH_BLOCKED_[A-Z_]*\).*/\1/p' "$RUNNER_TMP/manifest.err" | head -1)"
  printf '%s\n' "${CODE:-PUSH_BLOCKED_MANIFEST}"; exit 1
fi

REPO_ROOT="$("$PYTHON_BIN" -c 'import json,sys; print(json.load(open(sys.argv[1]))["repositoryRoot"])' "$RUNNER_TMP/validated.json")"
REMOTE_NAME="$("$PYTHON_BIN" -c 'import json,sys; print(json.load(open(sys.argv[1]))["remoteName"])' "$RUNNER_TMP/validated.json")"
REMOTE_ID="$("$PYTHON_BIN" -c 'import json,sys; print(json.load(open(sys.argv[1]))["canonicalRemoteIdentity"])' "$RUNNER_TMP/validated.json")"
SOURCE="$("$PYTHON_BIN" -c 'import json,sys; print(json.load(open(sys.argv[1]))["sourceCommitSha"])' "$RUNNER_TMP/validated.json")"
TREE="$("$PYTHON_BIN" -c 'import json,sys; print(json.load(open(sys.argv[1]))["sourceTreeSha"])' "$RUNNER_TMP/validated.json")"
PARENT="$("$PYTHON_BIN" -c 'import json,sys; print(json.load(open(sys.argv[1]))["expectedParentSha"])' "$RUNNER_TMP/validated.json")"
DEST="$("$PYTHON_BIN" -c 'import json,sys; print(json.load(open(sys.argv[1]))["destinationRef"])' "$RUNNER_TMP/validated.json")"
STATE="$("$PYTHON_BIN" -c 'import json,sys; print(json.load(open(sys.argv[1]))["destinationPrecondition"])' "$RUNNER_TMP/validated.json")"
EXPECTED_DEST="$("$PYTHON_BIN" -c 'import json,sys; print(json.load(open(sys.argv[1]))["expectedDestinationSha"] or "")' "$RUNNER_TMP/validated.json")"

TEST_LOCAL_FAILURE=0
if [ "$TEST_MODE" = 1 ]; then
  case "$REPO_ROOT" in /tmp/*|/private/tmp/*|/var/folders/*|/private/var/folders/*) ;; *) printf '%s\n' PUSH_BLOCKED_SYNTHETIC_BOUNDARY; exit 1 ;; esac
  case "$REMOTE_ID" in /tmp/*|/private/tmp/*|/var/folders/*|/private/var/folders/*) ;; *) printf '%s\n' PUSH_BLOCKED_SYNTHETIC_BOUNDARY; exit 1 ;; esac
  TEST_CONTROL="$REPO_ROOT/.staffordos-exact-ref-test-control"
  [ -f "$TEST_CONTROL" ] && [ ! -L "$TEST_CONTROL" ] || { printf '%s\n' PUSH_BLOCKED_SYNTHETIC_BOUNDARY; exit 1; }
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
  "$PYTHON_BIN" - "$1" "$2" "$3" "${4:-0}" 2>/dev/null <<'PY'
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
  "$PYTHON_BIN" - 2>/dev/null <<'PY'
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
  "$PYTHON_BIN" - "$1" "$2" 2>/dev/null <<'PY'
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
[ "$(printf '%s\n' "$REMOTE_URLS" | awk 'NF{n++} END{print n+0}')" = 1 ] && [ "$REMOTE_URLS" = "$REMOTE_ID" ] && [ -z "$PUSH_URLS" ] && [ -z "$REWRITES" ] || { printf '%s\n' PUSH_BLOCKED_REMOTE_IDENTITY; exit 1; }
case "$REMOTE_ID" in *://*@*) printf '%s\n' PUSH_BLOCKED_REMOTE_IDENTITY; exit 1 ;; esac
[ "$("$GIT_BIN" -C "$REPO_ROOT" rev-parse --is-inside-work-tree)" = true ] || { printf '%s\n' PUSH_BLOCKED_REPOSITORY; exit 1; }
[ -z "$("$GIT_BIN" -C "$REPO_ROOT" status --porcelain)" ] || { printf '%s\n' PUSH_BLOCKED_DIRTY_WORKTREE; exit 1; }
[ -z "$("$GIT_BIN" -C "$REPO_ROOT" diff --cached --name-only)" ] || { printf '%s\n' PUSH_BLOCKED_INDEX; exit 1; }
[ "$("$GIT_BIN" -C "$REPO_ROOT" cat-file -t "$SOURCE")" = commit ] || { printf '%s\n' PUSH_BLOCKED_SOURCE; exit 1; }
[ "$("$GIT_BIN" -C "$REPO_ROOT" show -s --format=%T "$SOURCE")" = "$TREE" ] || { printf '%s\n' PUSH_BLOCKED_TREE; exit 1; }
[ "$("$GIT_BIN" -C "$REPO_ROOT" show -s --format=%P "$SOURCE")" = "$PARENT" ] || { printf '%s\n' PUSH_BLOCKED_PARENT; exit 1; }
[ "$("$GIT_BIN" -C "$REPO_ROOT" rev-list --count "$PARENT..$SOURCE")" = 1 ] || { printf '%s\n' PUSH_BLOCKED_HISTORY; exit 1; }
[ "$("$GIT_BIN" -C "$REPO_ROOT" show -s --format=%P "$SOURCE" | wc -w | tr -d ' ')" = 1 ] || { printf '%s\n' PUSH_BLOCKED_MERGE; exit 1; }

validate_commit_contents() {
"$PYTHON_BIN" - "$REPO_ROOT" "$SOURCE" "$PARENT" "$GIT_BIN" "$RUNNER_TMP/validated.json" <<'PY'
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
[ "$(printf '%s\n' "$REMOTE_URLS" | awk 'NF{n++} END{print n+0}')" = 1 ] && [ "$REMOTE_URLS" = "$REMOTE_ID" ] && [ -z "$PUSH_URLS" ] && [ -z "$REWRITES" ] || { printf '%s\n' PUSH_BLOCKED_REMOTE_IDENTITY; exit 1; }
[ "$REMOTE_URLS" = "$REMOTE_ID" ] || { printf '%s\n' PUSH_BLOCKED_REMOTE_IDENTITY; exit 1; }
[ -z "$($GIT_BIN -C "$REPO_ROOT" status --porcelain)" ] && [ -z "$($GIT_BIN -C "$REPO_ROOT" diff --cached --name-only)" ] || { printf '%s\n' PUSH_BLOCKED_REPOSITORY_STATE; exit 1; }
[ "$($GIT_BIN -C "$REPO_ROOT" cat-file -t "$SOURCE")" = commit ] && [ "$($GIT_BIN -C "$REPO_ROOT" show -s --format=%T "$SOURCE")" = "$TREE" ] && [ "$($GIT_BIN -C "$REPO_ROOT" show -s --format=%P "$SOURCE")" = "$PARENT" ] || { printf '%s\n' PUSH_BLOCKED_SOURCE_REVALIDATION; exit 1; }
validate_commit_contents
snapshot() { "$GIT_BIN" -C "$REPO_ROOT" ls-remote --heads --tags "$REMOTE_ID" 2>/dev/null | LC_ALL=C sort > "$1"; }
remote_ref() { "$GIT_BIN" -C "$REPO_ROOT" ls-remote --refs "$REMOTE_ID" "$1" 2>/dev/null | awk 'NF {print $1; exit}' || true; }
BASE_REF="refs/heads/careeros/private-beta"; BEFORE="$RUNNER_TMP/before"; AFTER="$RUNNER_TMP/after"; if ! snapshot "$BEFORE"; then printf '%s\n' PUSH_BLOCKED_REMOTE_STATE; exit 1; fi
BASE_BEFORE="$(remote_ref "$BASE_REF")"; [ "$BASE_BEFORE" = "$PARENT" ] || { printf '%s\n' PUSH_BLOCKED_BASE; exit 1; }
DEST_BEFORE="$(remote_ref "$DEST")"
if [ "$STATE" = ABSENT ]; then [ -z "$DEST_BEFORE" ] || { printf '%s\n' PUSH_BLOCKED_DESTINATION; exit 1; }; else [ "$DEST_BEFORE" = "$EXPECTED_DEST" ] || { printf '%s\n' PUSH_BLOCKED_DESTINATION; exit 1; }; "$GIT_BIN" -C "$REPO_ROOT" merge-base --is-ancestor "$EXPECTED_DEST" "$SOURCE" || { printf '%s\n' PUSH_BLOCKED_FAST_FORWARD; exit 1; }; fi
DEST_RECHECK="$(remote_ref "$DEST")"; [ "$DEST_RECHECK" = "$DEST_BEFORE" ] || { printf '%s\n' PUSH_BLOCKED_DESTINATION_RACE; exit 1; }
test_gate before-push

if [ "$STATE" = "EXACT_SHA" ] && [ "$DEST_BEFORE" = "$SOURCE" ]; then
  printf '%s\n' PUSH_CONFIRMED
  exit 0
fi

set +e
GIT_BIN="$GIT_BIN" "$GIT_BIN" -C "$REPO_ROOT" -c core.hooksPath="$RUNNER_TMP/hooks" push --porcelain --no-follow-tags "$REMOTE_ID" "$SOURCE:$DEST" >"$RUNNER_TMP/push.out" 2>"$RUNNER_TMP/push.err"
PUSH_CODE=$?
set -e
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
if [ "$DEST_AFTER" = "$SOURCE" ] && [ "$BASE_AFTER" = "$PARENT" ] && cmp -s "$RUNNER_TMP/before-other" "$RUNNER_TMP/after-other"; then printf '%s\n' PUSH_CONFIRMED; exit 0; fi
if [ "$PUSH_CODE" -ne 0 ] && [ -z "$DEST_AFTER" ] && [ "$BASE_AFTER" = "$PARENT" ]; then
  "$PYTHON_BIN" - "$RUNNER_TMP/push.err" "$RUNNER_TMP/push.out" "$PUSH_CODE" <<'PY'
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
if [ "$DEST_AFTER" = "$SOURCE" ] || [ -n "$DEST_AFTER" ] || [ "$BASE_AFTER" != "$PARENT" ]; then printf '%s\n' PUSH_RESULT_UNKNOWN; else printf '%s\n' PUSH_FAILED_UNKNOWN; fi
exit 1
