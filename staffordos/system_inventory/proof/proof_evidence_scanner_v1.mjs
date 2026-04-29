import fs from "fs";
import path from "path";

const now = new Date().toISOString();

const searchRoots = [
  "staffordos",
  "web/src",
  "web",
  "abando-frontend",
  "scripts"
].filter(fs.existsSync);

const proofPatterns = {
  proof_abando_recovery_loop: [
    /checkout[_-]?event/i,
    /checkout_started/i,
    /recovery[_-]?action/i,
    /recovery_email/i,
    /recoveryMessageEngine/i,
    /recoveryAttribution/i,
    /merchant-summary/i,
    /return[_-]?tracking/i,
    /attribution/i
  ],
  proof_real_email_send: [
    /nodemailer/i,
    /resend/i,
    /send_ledger/i,
    /recovery_email/i,
    /email delivered/i,
    /messageId/i,
    /SMTP/i
  ],
  proof_real_sms_send: [
    /twilio/i,
    /send_ledger/i,
    /sms/i,
    /messageSid/i,
    /TWILIO/i
  ],
  proof_shopifixer_paid_path: [
    /shopifixer/i,
    /guidedAudit/i,
    /runAudit/i,
    /audit-result/i,
    /pricing/i,
    /stripe/i,
    /checkout session/i
  ],
  proof_revenue_truth_reconciliation: [
    /revenue_truth/i,
    /stripe/i,
    /payment/i,
    /paid/i,
    /reconc/i
  ],
  proof_agent_loop_runtime: [
    /agent_registry/i,
    /loop/i,
    /runtime/i,
    /decision/i,
    /output/i,
    /timestamp/i
  ]
};

const maxBytes = 500000;
const ignored = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage"
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);

    if (ignored.some(part => full.includes(`${path.sep}${part}${path.sep}`))) {
      continue;
    }

    let stat;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      walk(full, files);
    } else if (stat.isFile() && stat.size <= maxBytes) {
      files.push(full);
    }
  }

  return files;
}

const files = searchRoots.flatMap(root => walk(root));
const evidence = {};

for (const [proofId, patterns] of Object.entries(proofPatterns)) {
  evidence[proofId] = {
    proof_id: proofId,
    matches: [],
    inferred_status: "UNPROVEN",
    reason: "No evidence found yet."
  };

  for (const file of files) {
    let text = "";

    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const matchedPatterns = patterns
      .filter(pattern => pattern.test(text))
      .map(pattern => pattern.toString());

    if (matchedPatterns.length > 0) {
      evidence[proofId].matches.push({
        file,
        matched_patterns: matchedPatterns
      });
    }
  }

  const matchCount = evidence[proofId].matches.length;

  if (matchCount >= 5) {
    evidence[proofId].inferred_status = "PARTIALLY_PROVEN_REQUIRES_RUNTIME_CONFIRMATION";
    evidence[proofId].reason = "Multiple source/log artifacts found, but live runtime confirmation still required.";
  } else if (matchCount > 0) {
    evidence[proofId].inferred_status = "EVIDENCE_FOUND_REQUIRES_REVIEW";
    evidence[proofId].reason = "Some evidence found, but not enough to mark proven.";
  }
}

const result = {
  generated_at: now,
  scanner: "proof_evidence_scanner_v1",
  search_roots: searchRoots,
  files_scanned: files.length,
  proof_evidence: evidence,
  rule: "Scanner may upgrade UNPROVEN to evidence-found or partially-proven, but only controlled runtime proof can mark PROVEN."
};

const outJson = "staffordos/system_inventory/output/proof_evidence_scan_v1.json";
const outMd = "staffordos/system_inventory/output/proof_evidence_scan_v1.md";

fs.writeFileSync(outJson, JSON.stringify(result, null, 2));

let md = `# Proof Evidence Scan v1

Generated: ${now}

Files scanned: ${files.length}

## Rule

${result.rule}

## Evidence Summary

| Proof ID | Inferred Status | Match Count | Reason |
|---|---|---:|---|
`;

for (const item of Object.values(evidence)) {
  md += `| ${item.proof_id} | ${item.inferred_status} | ${item.matches.length} | ${item.reason} |\n`;
}

md += `

## Next Step

Review proof_evidence_scan_v1.json for matched files.

If Abando recovery evidence is strong, create a proof review artifact and update execution_proof_register_v1.json from UNPROVEN to PARTIALLY_PROVEN_REQUIRES_RUNTIME_CONFIRMATION or PROVEN only if runtime evidence exists.
`;

fs.writeFileSync(outMd, md);

console.log("Proof evidence scanner complete.");
console.log("JSON:", outJson);
console.log("MD:", outMd);
console.log("Files scanned:", files.length);

for (const item of Object.values(evidence)) {
  console.log(item.proof_id, "=>", item.inferred_status, "| matches:", item.matches.length);
}
