console.log(JSON.stringify({
  ok: false,
  agent: "send_execution_agent_v1",
  status: "blocked_by_design",
  reason: "Compatibility wrapper exists, but sending remains disabled until approval/send path is explicitly proven.",
  sends_attempted: 0
}, null, 2));
process.exit(0);
