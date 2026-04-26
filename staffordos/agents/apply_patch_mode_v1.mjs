import fs from "fs";
import { execSync } from "child_process";

const [, , surface, packetId] = process.argv;

if (!surface || !packetId) {
  console.error("Usage: node staffordos/agents/apply_patch_mode_v1.mjs <surface> <packet_id>");
  process.exit(1);
}

const branch = execSync("git branch --show-current").toString().trim();
const expectedBranch = `surface/${surface}/${packetId}`;

if (branch !== expectedBranch) {
  console.error(JSON.stringify({
    ok: false,
    error: "wrong_branch",
    current_branch: branch,
    expected_branch: expectedBranch
  }, null, 2));
  process.exit(1);
}

const preflightPath = `staffordos/surfaces/${surface}_preflight_v1.json`;

if (!fs.existsSync(preflightPath)) {
  console.error("Missing preflight packet");
  process.exit(1);
}

const preflight = JSON.parse(fs.readFileSync(preflightPath, "utf8"));
const packet = preflight.preflight_packets.find(p => p.id === packetId);

if (!packet) {
  console.error("Preflight packet not found:", packetId);
  process.exit(1);
}

const owner = packet.owner;
let source = fs.readFileSync(owner, "utf8");

if (!source.includes(packet.target)) {
  console.error(JSON.stringify({
    ok: false,
    error: "target_not_found",
    owner,
    packet_id: packetId
  }, null, 2));
  process.exit(1);
}

const backup = `${owner}.bak.apply_patch_mode.${Date.now()}`;
fs.copyFileSync(owner, backup);

source = source.replace(packet.target, packet.replacement);
fs.writeFileSync(owner, source);

const logPath = `staffordos/surfaces/${surface}_apply_patch_log_v1.json`;
const log = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, "utf8")) : [];

log.push({
  generated_at: new Date().toISOString(),
  agent: "apply_patch_mode_v1",
  surface,
  packet_id: packetId,
  branch,
  owner,
  backup,
  status: "applied",
  verification: packet.verification
});

fs.writeFileSync(logPath, JSON.stringify(log, null, 2) + "\n");

console.log(JSON.stringify({
  ok: true,
  agent: "apply_patch_mode_v1",
  surface,
  packet_id: packetId,
  branch,
  owner,
  backup,
  status: "applied"
}, null, 2));
