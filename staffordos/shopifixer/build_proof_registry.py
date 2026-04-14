import json
from pathlib import Path
from datetime import datetime, timezone
import re

ROOT = Path("/Users/rossstafford/projects/cart-agent")
SCORECARDS = ROOT / "staffordos/scorecards/scorecards_output.json"
OUTREACH = ROOT / "staffordos/outreach/send_queue.json"
SCREENSHOT_DIR = ROOT / "abando-frontend/public/shopifixer-proof"
OUTPUT = ROOT / "staffordos/shopifixer/proof_registry.json"

def clean_store_domain(value):
    value = str(value or "").strip().lower()
    value = re.sub(r"^https?://", "", value)
    value = re.sub(r"^www\.", "", value)
    value = re.sub(r"/.*$", "", value)
    return value.strip()

def to_store_slug(value):
    return re.sub(r"[^a-z0-9]+", "-", clean_store_domain(value)).strip("-")

def is_generic_issue(value):
    v = str(value or "").strip().lower()
    return v in {
        "",
        "checkout friction",
        "friction",
        "conversion friction",
        "friction in the buying flow",
        "buying flow friction",
        "not detected",
        "unknown",
    }

def parse_score_to_100(value):
    try:
        n = float(value)
    except Exception:
        return None
    if 0 <= n <= 1:
        return int(round(n * 100))
    if 0 <= n <= 100:
        return int(round(n))
    return None

def get_top_issue(scorecard):
    findings = scorecard.get("topFindings") or []
    if isinstance(findings, list) and findings:
        first = str(findings[0]).strip()
        if first:
            return first
    leak = str(scorecard.get("top_leak") or "").strip()
    if leak:
        return leak
    return "checkout friction"

def get_recommended_action(issue):
    x = str(issue or "").strip().lower()
    if "email capture" in x:
        return "Add or strengthen email capture before purchase drop-off"
    if "returns" in x:
        return "Make returns and reassurance clearer before checkout"
    if "shipping" in x:
        return "Reduce shipping-step friction first"
    if "mobile" in x or "load" in x or "speed" in x:
        return "Reduce mobile load delay on the path to purchase"
    if "trust" in x:
        return "Strengthen trust signals near purchase"
    return "Fix the strongest checkout friction point first"

def build_evidence_summary(outreach):
    if not outreach:
        return "No performance evidence captured yet."
    score = parse_score_to_100(outreach.get("pageSpeedScore"))
    fcp = str(outreach.get("pageSpeedFcp") or "").strip()
    lcp = str(outreach.get("pageSpeedLcp") or "").strip()
    tbt = str(outreach.get("pageSpeedTbt") or "").strip()

    parts = []
    if score is not None:
        parts.append(f"Mobile score {score}/100")
    if fcp:
        parts.append(f"FCP {fcp}")
    if lcp:
        parts.append(f"LCP {lcp}")
    if tbt:
        parts.append(f"TBT {tbt}")

    return ", ".join(parts) if parts else "No performance evidence captured yet."

def derive_from_outreach(outreach):
    if not outreach:
        return {}

    top_issue = str(outreach.get("primaryIssue") or outreach.get("topFriction") or "").strip()
    if not top_issue:
        top_issue = "checkout friction"

    est_high = outreach.get("estimatedLossHigh")
    est_display = None
    try:
        if est_high is not None and str(est_high).strip() != "":
            est_display = f"Up to ${int(float(est_high)):,} estimated monthly opportunity"
    except Exception:
        est_display = None

    score = parse_score_to_100(outreach.get("pageSpeedScore"))
    confidence = "Moderate confidence" if score is not None else "Early confidence"

    benchmark = "This store may be underperforming relative to similar Shopify stores on checkout completion and recovery readiness."

    return {
        "top_issue": top_issue,
        "recommended_action": get_recommended_action(top_issue),
        "estimated_revenue_leak": est_display,
        "confidence": confidence,
        "benchmark_summary": benchmark,
        "audit_score": score,
        "evidence_summary": build_evidence_summary(outreach),
    }

scorecards = json.loads(SCORECARDS.read_text()) if SCORECARDS.exists() else []
outreach_rows = json.loads(OUTREACH.read_text()) if OUTREACH.exists() else []

outreach_by_store = {}
for row in outreach_rows:
    store = clean_store_domain(row.get("storeUrl"))
    if store:
        outreach_by_store[store] = row

registry = {}

for row in scorecards:
    store = clean_store_domain(row.get("domain") or row.get("store"))
    if not store:
        continue

    base_issue = get_top_issue(row)
    outreach = outreach_by_store.get(store)
    derived = derive_from_outreach(outreach)

    use_derived = (
        is_generic_issue(base_issue)
        or str(row.get("revenueOpportunityDisplay") or "").strip().lower() == "an estimated revenue opportunity"
        or not row.get("checkoutScore")
        or not row.get("confidence")
    )

    slug = to_store_slug(store)
    screenshot_file = SCREENSHOT_DIR / f"{slug}.png"
    screenshot_url = f"/shopifixer-proof/{slug}.png" if screenshot_file.exists() else None

    top_issue = derived.get("top_issue") if use_derived and derived.get("top_issue") else base_issue
    recommended_action = derived.get("recommended_action") if use_derived and derived.get("recommended_action") else get_recommended_action(top_issue)
    estimated_revenue_leak = derived.get("estimated_revenue_leak") if use_derived and derived.get("estimated_revenue_leak") else str(row.get("revenueOpportunityDisplay") or "Meaningful estimated conversion opportunity")
    confidence = derived.get("confidence") if use_derived and derived.get("confidence") else str(row.get("confidence") or "Early confidence")
    audit_score = derived.get("audit_score") if use_derived and derived.get("audit_score") is not None else row.get("checkoutScore") or 0
    benchmark_summary = derived.get("benchmark_summary") if use_derived and derived.get("benchmark_summary") else str(row.get("benchmarkSummary") or "This store may be underperforming relative to similar Shopify stores on checkout completion and recovery readiness.")
    evidence_summary = derived.get("evidence_summary") or "No performance evidence captured yet."

    registry[store] = {
        "store_domain": store,
        "audit_score": audit_score,
        "estimated_revenue_leak": estimated_revenue_leak,
        "confidence": confidence,
        "top_issue": top_issue,
        "benchmark_summary": benchmark_summary,
        "recommended_action": recommended_action,
        "updated_at": str(row.get("createdAt") or datetime.now(timezone.utc).isoformat()),
        "evidence_summary": evidence_summary,
        "screenshot_url": screenshot_url,
        "source": "shopifixer_proof_registry_v1",
    }

OUTPUT.write_text(json.dumps(registry, indent=2) + "\n")
print(f"WROTE: {OUTPUT}")
print(f"COUNT: {len(registry)}")
