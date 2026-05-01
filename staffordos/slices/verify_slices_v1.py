import json
from pathlib import Path

registry_path = Path("staffordos/slices/slice_registry.json")
out_path = Path("staffordos/slices/slice_verification_report.json")

if not registry_path.exists():
    raise SystemExit("❌ Missing slice_registry.json")

registry = json.loads(registry_path.read_text())

results = []

for s in registry.get("slices", []):
    proof_path = Path(s.get("output_proof", ""))
    status = "unknown"
    reason = ""

    if not proof_path.exists():
        status = "failed"
        reason = "missing_proof_file"
    else:
        try:
            size_kb = proof_path.stat().st_size / 1024

            if size_kb > 1024:
                status = "failed"
                reason = "file_too_large"
            else:
                data = json.loads(proof_path.read_text())

                if isinstance(data, dict) and data.get("ok") is True:
                    status = "verified"
                    reason = "ok_true"
                else:
                    status = "failed"
                    reason = "ok_not_true"

        except Exception as e:
            status = "failed"
            reason = f"read_error: {str(e)}"

    results.append({
        "slice_id": s.get("slice_id"),
        "proof": s.get("output_proof"),
        "status": status,
        "reason": reason
    })

report = {
    "ok": True,
    "total": len(results),
    "verified": len([r for r in results if r["status"] == "verified"]),
    "failed": len([r for r in results if r["status"] == "failed"]),
    "results": results
}

out_path.write_text(json.dumps(report, indent=2) + "\n")

print(json.dumps(report, indent=2))
