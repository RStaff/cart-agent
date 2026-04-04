import { REPORT_PATH, runHygieneAgentCheck, writeHygieneReport } from "./hygiene_agent_v1.js";

function printList(title, items) {
  if (!items.length) return;
  console.log(`${title}:`);
  for (const item of items) {
    console.log(`- ${item}`);
  }
  console.log("");
}

const report = runHygieneAgentCheck();
writeHygieneReport(report);

const topIssues = [];
if (report.deploy_blockers.length > 0) {
  topIssues.push(...report.deploy_blockers);
}
if (report.staged.length > 0) {
  topIssues.push(`${report.staged.length} staged path(s) present`);
}
if (report.unstaged.length > 0) {
  topIssues.push(`${report.unstaged.length} unstaged path(s) present`);
}
if (report.untracked.length > 0) {
  topIssues.push(`${report.untracked.length} untracked path(s) present`);
}
if (report.generated_noise.length > 0) {
  topIssues.push(`${report.generated_noise.length} generated noise path(s) detected`);
}

console.log("=== HYGIENE AGENT REPORT ===");
console.log("");
console.log(`STATUS: ${report.status}`);
console.log(`BRANCH: ${report.branch}`);
console.log("");

printList("TOP ISSUES", topIssues);
printList("NEXT ACTIONS", report.recommended_actions);

console.log(`REPORT: ${REPORT_PATH}`);
