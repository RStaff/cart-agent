#!/usr/bin/env bash
set -euo pipefail
VERSION="2.0"
STAFFORD_DOMAIN="${STAFFORD_DOMAIN:-staffordmedia.ai}"
ABANDO_DOMAIN="${ABANDO_DOMAIN:-abando.ai}"
STAFFORD_STATUS_PATH="${STAFFORD_STATUS_PATH:-/api/status}"
ABANDO_STATUS_PATH="${ABANDO_STATUS_PATH:-/api/status}"
TIMEOUT="${TIMEOUT:-15}"; RETRIES="${RETRIES:-2}"; BACKOFF_SECS="${BACKOFF_SECS:-2}"
JSON_OUT=""; QUICK=0; VERBOSE=0; SOFT=0; NO_COLOR=0
usage(){ cat <<EOF
SMC ↔ Abando Diagnostics v$VERSION
Usage: $(basename "$0") [--quick] [--verbose] [--soft] [--no-color] [--json report.json]
                        [--stafford-domain d] [--abando-domain d]
                        [--stafford-status /path] [--abando-status /path]
                        [--timeout sec] [--retries n] [--backoff sec]
EOF
}
while [[ $# -gt 0 ]]; do case "$1" in
  --quick) QUICK=1;; --verbose) VERBOSE=1;; --soft) SOFT=1;; --no-color) NO_COLOR=1;;
  --json) JSON_OUT="${2:-}"; shift;;
  --stafford-domain) STAFFORD_DOMAIN="${2}"; shift;;
  --abando-domain) ABANDO_DOMAIN="${2}"; shift;;
  --stafford-status) STAFFORD_STATUS_PATH="${2}"; shift;;
  --abando-status) ABANDO_STATUS_PATH="${2}"; shift;;
  --timeout) TIMEOUT="${2}"; shift;; --retries) RETRIES="${2}"; shift;;
  --backoff) BACKOFF_SECS="${2}"; shift;; -h|--help) usage; exit 0;;
  *) echo "Unknown flag: $1"; usage; exit 2;; esac; shift; done
if [[ "$NO_COLOR" = "1" || -n "${NO_COLOR:-}" ]]; then C_RESET=''; C_GREEN=''; C_RED=''; C_YEL=''; C_BLUE='';
else C_RESET=$'\033[0m'; C_GREEN=$'\033[0;32m'; C_RED=$'\033[0;31m'; C_YEL=$'\033[0;33m'; C_BLUE=$'\033[0;34m'; fi
ok(){ printf "${C_GREEN}✓ %s${C_RESET}\n" "$*"; }
warn(){ printf "${C_YEL}⚠ %s${C_RESET}\n" "$*"; }
err(){ printf "${C_RED}✗ %s${C_RESET}\n" "$*"; }
info(){ printf "${C_BLUE}→ %s${C_RESET}\n" "$*"; }
dash(){ printf "%0.s─" $(seq 1 72); echo; }
have(){ command -v "$1" >/dev/null 2>&1; }
need_tools(){ local need=(curl grep awk sed tr dig openssl); local miss=0; for t in "${need[@]}"; do have "$t" || { err "Missing tool: $t"; miss=1; }; done; [[ $miss -eq 0 ]] || exit 1; }
curl_head(){ curl -sSIL --retry "$RETRIES" --retry-delay "$BACKOFF_SECS" --max-time "$TIMEOUT" -H "User-Agent: smc-diagnose/$VERSION" "$1" | tr -d '\r'; }
curl_get(){  curl -sS   --retry "$RETRIES" --retry-delay "$BACKOFF_SECS" --max-time "$TIMEOUT" -H "User-Agent: smc-diagnose/$VERSION" "$1"; }
curl_options(){ curl -sSIL -X OPTIONS --retry "$RETRIES" --retry-delay "$BACKOFF_SECS" --max-time "$TIMEOUT" -H "Origin: https://$2" -H "Access-Control-Request-Method: GET" "$1" | tr -d '\r'; }
dns_report(){ local d="$1"; local out; out="$(dig +short A "$d"; dig +short AAAA "$d"; dig +short CNAME "$d" )" || true
  [[ -n "$out" ]] && ok "DNS resolves for $d" || warn "No DNS records for $d"
  [[ "$out" =~ vercel|vercel-dns ]] && ok "$d likely on Vercel"; }
tls_check(){ local d="$1" out issuer end raw now days; out="$(echo | openssl s_client -servername "$d" -connect "$d:443" 2>/dev/null | openssl x509 -noout -issuer -enddate 2>/dev/null)" || true
  if [[ -n "$out" ]]; then issuer="$(printf "%s" "$out" | awk -F'issuer=' 'NF>1{print $2}')" ; end="$(printf "%s" "$out" | awk -F'notAfter=' 'NF>1{print $2}')"
    if [[ "$(uname -s)" == "Darwin" ]]; then raw="$(date -j -f "%b %e %T %Y %Z" "$end" +%s 2>/dev/null || true)"; else raw="$(date -d "$end" +%s 2>/dev/null || true)"; fi
    now="$(date +%s)"; [[ -n "$raw" ]] && days="$(( (raw - now)/86400 ))" || days="?"; ok "TLS OK for https://$d (issuer:${issuer:-?}; expires in ${days}d)"
  else warn "Could not inspect TLS for $d"; fi; }
http_overview(){ local d="$1" hdr code vx; hdr="$(curl_head "https://${d}" || true)"; code="$(printf "%s" "$hdr" | sed -n '1s/^HTTP[^ ]* //p' | awk '{print $1}')"
  [[ "$code" =~ ^2|3 ]] && ok "HTTPS reachable for $d (HTTP $code)" || err "Non-2xx/3xx for $d (HTTP ${code:-?})"
  vx="$(printf "%s" "$hdr" | awk -F': ' 'BEGIN{IGNORECASE=1}/^x-vercel-id/{print $2}' | tail -n1)"; [[ -n "$vx" ]] && ok "x-vercel-id: $vx"; }
fetch_robots_sitemap(){ local d="$1" robots_url="https://${d}/robots.txt" robots sm_url sm
  robots="$(curl_get "$robots_url" || true)"; [[ -n "$robots" ]] && ok "$d robots.txt present" || warn "$d robots.txt missing"
  sm_url="$(printf "%s" "$robots" | awk '/(?i)^sitemap:/ {print $2}' | head -n1 | tr -d '[:space:]')"; [[ -n "$sm_url" ]] || sm_url="https://${d}/sitemap.xml"
  sm="$(curl_get "$sm_url" || true)"; [[ -z "$sm" ]] && sm="$(curl -sS "$sm_url" | gunzip -c 2>/dev/null || true)"
  [[ -n "$sm" ]] && ok "$d sitemap present ($sm_url)" || warn "$d sitemap missing ($sm_url)"; SITEMAP_CONTENT="$sm"; }
sitemap_crosslink(){ local from="$1" to="$2" xml="$3"
  [[ -z "$xml" ]] && { warn "No sitemap from $from"; return; }
  printf "%s" "$xml" | grep -oE '<loc>[^<]+' | grep -q "$to" && { ok "Sitemap($from) references $to"; return; }
  printf "%s" "$xml" | grep -qE "https?://[^\"'<>]*${to}" && ok "Sitemap($from) references $to (non-<loc>)" || warn "Sitemap($from) does NOT reference $to"; }
status_probe(){ local d="$1" primary="$2" base="https://${d}" code content path tries=("$primary" "/api/health" "/health" "/healthz")
  for path in "${tries[@]}"; do content="$(curl -sS -w '\n%{http_code}' --max-time 10 "$base$path" 2>/dev/null || true)"; code="$(printf "%s" "$content" | tail -n1)"
    if [[ "$code" =~ ^2 ]]; then ok "Status OK $d$path (HTTP $code)"; echo "$path"; return 0; fi; done; warn "No status responded on $d"; echo ""; return 1; }
cors_probe_pair(){ local origin="$1" target_d="$2" status="$3" target="https://${target_d}${status:-/}"
  dash; info "CORS: Origin https://${origin} → ${target}"
  local opt allow_o allow_m; opt="$(curl_options "$target" "$origin" || true)"
  allow_o="$(printf "%s" "$opt" | awk -F': ' 'BEGIN{IGNORECASE=1}/^Access-Control-Allow-Origin/{print $2}' | tail -n1)"
  allow_m="$(printf "%s" "$opt" | awk -F': ' 'BEGIN{IGNORECASE=1}/^Access-Control-Allow-Methods/{print $2}' | tail -n1)"
  [[ -n "$allow_o" ]] && ok "Preflight ACAO: $allow_o" || warn "No ACAO on preflight (may still be set on GET/POST routes)"; [[ -n "$allow_m" ]] && ok "ACAM: $allow_m" || true; }
need_tools; echo; dash; echo "SMC ↔ Abando Diagnostics v$VERSION"; dash
printf "Stafford: %s\nAbando:  %s\n" "$STAFFORD_DOMAIN" "$ABANDO_DOMAIN"; [[ $QUICK -eq 1 ]] && info "Quick mode"
for D in "$STAFFORD_DOMAIN" "$ABANDO_DOMAIN"; do dash; info "DNS/TLS/HTTPS for $D"; dns_report "$D"; tls_check "$D"; http_overview "$D"; done
dash; info "robots/sitemap for $STAFFORD_DOMAIN"; fetch_robots_sitemap "$STAFFORD_DOMAIN"; SM_S="$SITEMAP_CONTENT"
dash; info "robots/sitemap for $ABANDO_DOMAIN";    fetch_robots_sitemap "$ABANDO_DOMAIN"; SM_A="$SITEMAP_CONTENT"
dash; info "Cross-link check"; sitemap_crosslink "$STAFFORD_DOMAIN" "$ABANDO_DOMAIN" "$SM_S"; sitemap_crosslink "$ABANDO_DOMAIN" "$STAFFORD_DOMAIN" "$SM_A"
[[ $QUICK -eq 1 ]] || { dash; info "Status endpoints"; }
USED_S="$(status_probe "$STAFFORD_DOMAIN" "$STAFFORD_STATUS_PATH" || true)"
USED_A="$(status_probe "$ABANDO_DOMAIN" "$ABANDO_STATUS_PATH" || true)"
[[ -n "$USED_S" ]] && ok "Stafford status path: $USED_S" || warn "Stafford status missing"
[[ -n "$USED_A" ]] && ok "Abando status path:   $USED_A" || warn "Abando status missing"
cors_probe_pair "$STAFFORD_DOMAIN" "$ABANDO_DOMAIN" "$USED_A"
cors_probe_pair "$ABANDO_DOMAIN" "$STAFFORD_DOMAIN" "$USED_S"
dash; info "Summary"
printf "  Stafford domain:  %s\n  Abando domain:    %s\n  Stafford status:  %s\n  Abando status:    %s\n" "$STAFFORD_DOMAIN" "$ABANDO_DOMAIN" "${USED_S:-none}" "${USED_A:-none}"
[[ -z "$USED_S" ]] && warn "Add GET ${STAFFORD_STATUS_PATH} (or /api/health) JSON: {service:'staffordmedia', connected_to:'abando.ai'}"
[[ -z "$USED_A" ]] && warn "Add GET ${ABANDO_STATUS_PATH} (or /api/health) JSON: {service:'abando', connected_to:'staffordmedia.ai'}"
[[ -n "$JSON_OUT" ]] && printf '{"stafford_domain":"%s","abando_domain":"%s","stafford_status":"%s","abando_status":"%s"}\n' "$STAFFORD_DOMAIN" "$ABANDO_DOMAIN" "${USED_S:-}" "${USED_A:-}" > "$JSON_OUT" && ok "Wrote JSON report → $JSON_OUT"
if [[ ${SOFT:-0} -eq 0 ]]; then [[ -z "${USED_S:-}" || -z "${USED_A:-}" ]] && { err "Critical: one or both status endpoints missing"; exit 10; } fi
ok "Diagnostics complete."
