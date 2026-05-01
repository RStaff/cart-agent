import json
from pathlib import Path
from datetime import datetime, timezone
import sys

registry_path = Path("staffordos/slices/slice_registry.json")
truth_path = Path("staffordos/system_inventory/output/system_map_slice_truth_v1.json")

if not registry_path.exists():
    raise SystemExit("❌ Missing slice registry")

if not truth_path.exists():
    raise SystemExit("❌ Missing system map slice truth")

registry = json.loads(registry_path.read_text())
truth = json.loads(truth_path.read_text())

# Determine active slice candidates
failed = [s for s in truth.get("slices", []) if s.get("verification_status") == "failed"]
unverified = [s for s in truth.get("slices", []) if s.get("verification_status") not in ["verified", "failed"]]

decision = None
reason = None

if failed:
    decision = failed[0]["slice_id"]
    reason = "FAILED_SLICE_REQUIRES_REPAIR"
elif unverified:
    decision = unverified[0]["slice_id"]
    reason = "UNVERIFIED_SLICE_REQUIRES_VERIFICATION"
else:
    decision = None
    reason = "NO_BLOCKERS_ALL_VERIFIED"

result = {
    "ok": True,
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "active_slice": decision,
    "reason": reason,
    "rules": [
        "Operator may only act on active_slice",
        "No new slice creation if failed slice exists",
        "All slices must produce proof < 1MB",
        "System Map truth is source of authority"
    ]
}

out_path = Path("staffordos/slices/operator_lock_state.json")
out_path.write_text(json.dumps(result, indent=2) + "\n")

print(json.dumps(result, indent=2))

# HARD LOCK: prevent arbitrary execution
if decision:
    print("\n🔒 OPERATOR LOCK ACTIVE")
    print(f"→ Only allowed slice: {decision}")
else:
    print("\n✅ SYSTEM CLEAR — NO ACTIVE BLOCKER")
