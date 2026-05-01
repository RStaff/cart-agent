import json
from pathlib import Path
from datetime import datetime, timezone

registry_path = Path("staffordos/slices/slice_registry.json")
report_path = Path("staffordos/slices/slice_verification_report.json")

if not registry_path.exists():
    raise SystemExit("❌ Missing registry")

if not report_path.exists():
    raise SystemExit("❌ Missing verification report")

registry = json.loads(registry_path.read_text())
report = json.loads(report_path.read_text())

results_by_id = {
    item.get("slice_id"): item
    for item in report.get("results", [])
    if item.get("slice_id")
}

updated = 0

for s in registry.get("slices", []):
    sid = s.get("slice_id")
    result = results_by_id.get(sid)

    if result:
        s["last_verified"] = datetime.now(timezone.utc).isoformat()
        s["verification_status"] = result.get("status")
        s["verification_reason"] = result.get("reason")
        updated += 1

registry_path.write_text(json.dumps(registry, indent=2) + "\n")

print(json.dumps({
    "ok": True,
    "updated_slices": updated,
    "source": str(report_path)
}, indent=2))
