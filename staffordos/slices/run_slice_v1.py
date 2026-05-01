import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime, timezone

SLICE_COMMANDS = {
    "verify_slices": ["python3", "staffordos/slices/verify_slices_v1.py"]
}

if len(sys.argv) < 2:
    raise SystemExit("Usage: python3 staffordos/slices/run_slice_v1.py <slice_command>")

slice_command = sys.argv[1]
out_dir = Path("staffordos/slices/executions")
out_dir.mkdir(parents=True, exist_ok=True)

run_id = f"{slice_command}_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
out_path = out_dir / f"{run_id}.json"

if slice_command not in SLICE_COMMANDS:
    result = {
        "ok": False,
        "status": "BLOCKED_UNKNOWN_SLICE_COMMAND",
        "slice_command": slice_command,
        "allowed_commands": sorted(SLICE_COMMANDS.keys()),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
    out_path.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))
    raise SystemExit(1)

cmd = SLICE_COMMANDS[slice_command]

started_at = datetime.now(timezone.utc).isoformat()
proc = subprocess.run(cmd, capture_output=True, text=True)
completed_at = datetime.now(timezone.utc).isoformat()

result = {
    "ok": proc.returncode == 0,
    "status": "EXECUTED" if proc.returncode == 0 else "FAILED",
    "slice_command": slice_command,
    "command": cmd,
    "returncode": proc.returncode,
    "started_at": started_at,
    "completed_at": completed_at,
    "stdout": proc.stdout[-5000:],
    "stderr": proc.stderr[-5000:],
    "proof": str(out_path)
}

out_path.write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result, indent=2))
