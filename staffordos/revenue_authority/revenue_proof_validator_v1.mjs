import fs from "fs";

const result = {
  schema: "staffordos.revenue_proof_validator.v1",
  generated_at: new Date().toISOString(),
  status: "passed",
  checks: {},
  failures: [],
  warnings: [],
  proof: {
    validation_only: true,
    recovery_triggerable: false,
    send_path_exists: false,
    return_path_exists: false,
    ledger_exists: false,
    real_send: false,
    revenue_action: false
  }
};

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

// ---- REQUIRED PATHS (REAL SYSTEM CHECK) ----

const paths = {
  recoveryTrigger: "web/src/routes/recoveryTrigger.esm.js",
  recoveryExecution: "web/src/routes/recoveryExecution.esm.js",
  recoveryLiveTest: "web/src/routes/recoveryLiveTest.esm.js",
  emailSender: "web/src/lib/emailSender.js",
  smsSender: "web/src/lib/smsSender.js",
  recoveryLedger: "web/src/lib/recoveryLedger.js",
  revenueRegister: "web/src/lib/abandoRevenueRegister.js",
  returnAttribution: "web/src/lib/abandoReturnAttribution.js"
};

// ---- CHECK FILE EXISTENCE ----

for (const [k, v] of Object.entries(paths)) {
  const ok = exists(v);
  result.checks[k] = ok;
  if (!ok) {
    result.failures.push(`missing:${k}`);
  }
}

// ---- LOGIC CHECKS ----

if (result.checks.recoveryTrigger && result.checks.recoveryExecution) {
  result.proof.recovery_triggerable = true;
} else {
  result.failures.push("recovery_not_triggerable");
}

if (result.checks.emailSender || result.checks.smsSender) {
  result.proof.send_path_exists = true;
} else {
  result.failures.push("no_send_path");
}

if (result.checks.returnAttribution) {
  result.proof.return_path_exists = true;
} else {
  result.failures.push("no_return_path");
}

if (result.checks.recoveryLedger || result.checks.revenueRegister) {
  result.proof.ledger_exists = true;
} else {
  result.failures.push("no_ledger");
}

// ---- FINAL STATUS ----

if (result.failures.length) {
  result.status = "failed";
} else {
  result.status = "passed";
}

console.log(JSON.stringify(result, null, 2));

if (result.failures.length) process.exit(1);
