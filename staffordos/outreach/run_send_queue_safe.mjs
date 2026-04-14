#!/usr/bin/env node

import { getEmailReadiness } from "../../web/src/lib/emailSender.js";

const readiness = getEmailReadiness();

if (!readiness.ready) {
  console.log("\nSEND BLOCKED — EMAIL NOT CONFIGURED\n");
  console.log(JSON.stringify(readiness, null, 2));
  process.exit(1);
}

console.log("\nEMAIL READY — SAFE TO SEND\n");

await import("./run_send_queue.mjs");
