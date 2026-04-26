import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const [, , surface, packetId] = process.argv;

if (!surface) {
  console.error("Missing surface");
  process.exit(1);
}

const proposalsPath = `staffordos/surfaces/${surface}_patch_proposals_v1.json`;

if (!existsSync(proposalsPath)) {
  console.error("Missing patch proposals file");
  process.exit(1);
}

const proposals = JSON.parse(readFileSync(proposalsPath, "utf8"));

const target = proposals.proposals.find(p => p.id === packetId);

if (!target) {
  console.error("Packet not found:", packetId);
  process.exit(1);
}

const branchName = `surface/${surface}/${packetId}`;

try {
  execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
} catch {
  console.error("Branch may already exist. Continuing.");
}

const pipelinePacket = {
  ok: true,
  agent: "change_pipeline_v1",
  surface,
  packet_id: packetId,
  branch: branchName,
  owner: target.owner,
  intent: target.intent,
  reuse_rule: target.reuse_rule,
  status: "branch_created",
  next_steps: [
    "Implement patch in this branch (future apply mode)",
    "Run local verification",
    "Promote to staging (future)",
    "Approve before production"
  ],
  guardrails: [
    "No direct main branch edits",
    "All changes must originate from packet",
    "No system map violations",
    "No rebuilds"
  ]
};

writeFileSync(
  `staffordos/surfaces/${surface}_change_pipeline_v1.json`,
  JSON.stringify(pipelinePacket, null, 2) + "\n"
);

console.log(JSON.stringify(pipelinePacket, null, 2));
