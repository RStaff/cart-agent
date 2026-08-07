#!/usr/bin/env node
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import readline from "node:readline/promises";

const repositoryRoot = process.cwd();
const frontendPackage = path.join(repositoryRoot, "staffordos/ui/operator-frontend/package.json");
const requireFromFrontend = createRequire(frontendPackage);
const ts = requireFromFrontend("typescript");

const originalTsExtension = Module._extensions[".ts"];
Module._extensions[".ts"] = function compileTypeScriptModule(mod, filename) {
  const source = readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });
  mod._compile(compiled.outputText, filename);
};

const verification = requireFromFrontend(
  path.join(repositoryRoot, "staffordos/ui/operator-frontend/lib/staffordos/highValueCareerFactVerification.ts"),
);

if (originalTsExtension) {
  Module._extensions[".ts"] = originalTsExtension;
} else {
  delete Module._extensions[".ts"];
}

const defaultRoots = {
  analysisRoot: path.join(homedir(), ".staffordos/private/professional/job-search/analysis"),
  opportunityDirectory: path.join(homedir(), ".staffordos/private/professional/job-search/opportunities"),
  careerRoots: [
    path.join(homedir(), ".staffordos/private/professional/career-evidence"),
    path.join(homedir(), ".staffordos/private/professional/career"),
    path.join(homedir(), ".staffordos/private/professional"),
  ],
  decisionRoot: path.join(homedir(), ".staffordos/private/professional/career-evidence/high-value-verification/decisions"),
  outputRoot: path.join(homedir(), ".staffordos/private/professional/career-evidence/high-value-verification"),
  positioningOutputRoot: path.join(homedir(), ".staffordos/private/professional/job-search/positioning"),
};

function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const args = { command };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function roots(args) {
  return {
    analysisRoot: args["analysis-root"] || defaultRoots.analysisRoot,
    opportunityDirectory: args["opportunity-root"] || defaultRoots.opportunityDirectory,
    careerRoots: typeof args["career-root"] === "string" ? [args["career-root"]] : defaultRoots.careerRoots,
    decisionRoot: args["decision-root"] || defaultRoots.decisionRoot,
    outputRoot: args["output-root"] || defaultRoots.outputRoot,
    positioningOutputRoot: args["positioning-output-root"] || defaultRoots.positioningOutputRoot,
    repositoryRoot,
  };
}

function loadContext(args) {
  if (typeof args["analysis-run-id"] !== "string") throw new Error("Missing --analysis-run-id.");
  const currentRoots = roots(args);
  const { analysis, careerStore } = verification.loadHighValueCareerFactVerificationInputs({
    analysisRoot: currentRoots.analysisRoot,
    repositoryRoot,
    opportunityDirectory: currentRoots.opportunityDirectory,
    careerRoots: currentRoots.careerRoots,
    analysisRunId: args["analysis-run-id"],
  });
  const decisions = verification.loadHighValueCareerFactVerificationDecisions({
    decisionRoot: currentRoots.decisionRoot,
    repositoryRoot,
    analysisRunId: analysis.metadata.analysisRunId,
  });
  const maxItems = Number.parseInt(args["max-items"] || "12", 10);
  const candidates = verification.buildHighValueCareerFactCandidates({
    analysis,
    careerStore,
    maxItems: Number.isFinite(maxItems) ? maxItems : 12,
  });
  return { currentRoots, analysis, careerStore, decisions, candidates };
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printLines(lines) {
  process.stdout.write(`${lines.join("\n")}\n`);
}

function commandList(args) {
  const context = loadContext(args);
  printJson({
    surface: "OWNER_PRIVATE_LOCAL_CLI",
    analysisRunId: context.analysis.metadata.analysisRunId,
    opportunityId: context.analysis.metadata.opportunityId,
    coverage: context.analysis.bundle.fitAssessment.coverage,
    ...verification.buildHighValueCliSummary({
      candidates: context.candidates,
      decisions: context.decisions,
    }),
    noApplicationSubmitted: true,
    noMessageSent: true,
    noResumeMutated: true,
    noExternalAi: true,
    noOllama: true,
  });
}

function normalizeOutcome(answer, candidate) {
  const normalized = answer.trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === "STOP" || normalized === "EXIT" || normalized === "QUIT") return "STOP";
  const index = Number.parseInt(normalized, 10);
  if (Number.isFinite(index) && index >= 1 && index <= candidate.allowedOutcomes.length) {
    return candidate.allowedOutcomes[index - 1];
  }
  return candidate.allowedOutcomes.find((outcome) => outcome === normalized) || null;
}

function printCandidate(candidate, index, total) {
  printLines([
    "",
    `High-value Career fact ${index + 1} of ${total}`,
    `Category: ${candidate.category}`,
    `Candidate wording: ${candidate.canonicalStatement}`,
    `Current status: ${candidate.currentVerificationStatus}`,
    `Current authority: ${candidate.currentAuthorityClassification}`,
    `Proposed authority status: ${candidate.proposedAuthorityStatus}`,
    `Supporting evidence records: ${candidate.supportingEvidence.length}`,
    `Conflicts: ${candidate.conflictTypes.length ? candidate.conflictTypes.join(", ") : "none recorded"}`,
    "",
    `Why it matters: ${candidate.whyHighValue}`,
    `What would improve it: ${candidate.whatEvidenceWouldImproveIt}`,
    `Limit: ${candidate.limitation}`,
    "",
    "Allowed outcomes:",
    ...candidate.allowedOutcomes.map((outcome, outcomeIndex) => `  ${outcomeIndex + 1}. ${outcome}`),
    "",
    "Type a number, an outcome, or STOP.",
  ]);
}

function remainingCandidates(context) {
  const answered = new Set(context.decisions.map((decision) => decision.candidateId));
  return context.candidates.filter((candidate) => !answered.has(candidate.candidateId));
}

function finalize(args, context) {
  const generatedAt = new Date().toISOString();
  const finalContext = loadContext(args);
  const result = verification.finalizeHighValueCareerFactVerification({
    analysis: finalContext.analysis,
    careerStore: finalContext.careerStore,
    candidates: finalContext.candidates,
    decisions: finalContext.decisions,
    generatedAt,
  });
  const written = verification.writeHighValueCareerFactVerificationOutputs({
    outputRoot: finalContext.currentRoots.outputRoot,
    analysisOutputRoot: finalContext.currentRoots.analysisRoot,
    positioningOutputRoot: finalContext.currentRoots.positioningOutputRoot,
    repositoryRoot,
    analysis: finalContext.analysis,
    promotedFacts: result.promotedFacts,
    regeneratedBundle: result.regeneratedBundle,
    positioningModel: result.afterModel,
    report: result.report,
  });
  printJson({
    completed: true,
    regenerated: true,
    ...written,
    applicationSubmitted: false,
    messageSent: false,
    resumeMutated: false,
    linkedInMutated: false,
    noExternalAi: true,
    noOllama: true,
    privatePathVisible: false,
  });
}

async function commandReview(args) {
  if (!process.stdin.isTTY) throw new Error("Interactive review requires a terminal.");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    let context = loadContext(args);
    const total = context.candidates.length;
    printLines([
      "S010.02E owner-private high-value Career fact verification",
      `Analysis: ${context.analysis.metadata.analysisRunId}`,
      `Selected candidate facts: ${total}`,
      "No application, message, resume, LinkedIn, provider, /os, /operator, external AI, or Ollama action is available.",
    ]);

    while (true) {
      context = loadContext(args);
      const remaining = remainingCandidates(context);
      const answered = total - remaining.length;
      if (!remaining.length) {
        printLines(["", "High-value Career fact review complete. Regenerating analysis and positioning..."]);
        finalize(args, context);
        return;
      }
      const candidate = remaining[0];
      printCandidate(candidate, answered, total);
      const answer = await rl.question("> ");
      const outcome = normalizeOutcome(answer, candidate);
      if (outcome === "STOP") {
        printJson({
          stopped: true,
          saved: false,
          remainingCandidateCount: remaining.length,
          privatePathVisible: false,
        });
        return;
      }
      if (!outcome) {
        printLines(["Unsupported outcome for this candidate. Choose a listed number, outcome, or STOP."]);
        continue;
      }
      const contextAnswer = (await rl.question("Optional private context, or Enter to skip: ")).trim() || null;
      let decision;
      try {
        decision = verification.createHighValueCareerFactVerificationDecision({
          analysisRunId: context.analysis.metadata.analysisRunId,
          candidate,
          outcome,
          operatorContext: contextAnswer,
          existingDecisions: context.decisions,
          createdAt: new Date().toISOString(),
          operatorConfirmed: true,
        });
      } catch (error) {
        printLines([`Decision rejected: ${error instanceof Error ? error.message : String(error)}`]);
        continue;
      }
      printLines([
        "",
        `Outcome: ${decision.outcome}`,
        "This appends a private S010.02E decision. It does not modify resumes, LinkedIn, applications, /os, or /operator.",
        "Type SAVE to append, BACK to choose again, or STOP.",
      ]);
      const confirmation = (await rl.question("> ")).trim().toUpperCase();
      if (confirmation === "STOP") {
        printJson({
          stopped: true,
          saved: false,
          remainingCandidateCount: remaining.length,
          privatePathVisible: false,
        });
        return;
      }
      if (confirmation !== "SAVE") {
        printLines(["Decision not saved."]);
        continue;
      }
      verification.appendHighValueCareerFactVerificationDecision({
        decisionRoot: context.currentRoots.decisionRoot,
        repositoryRoot,
        decision,
      });
      printJson({
        saved: true,
        decisionId: decision.decisionId,
        outcome: decision.outcome,
        category: decision.category,
        canonicalCareerFactCreated: Boolean(decision.canonicalCareerFactId),
        privatePathVisible: false,
        applicationSubmitted: false,
        messageSent: false,
        resumeMutated: false,
        linkedInMutated: false,
      });
    }
  } finally {
    rl.close();
  }
}

function commandApply(args) {
  const context = loadContext(args);
  finalize(args, context);
}

async function readStdinJson() {
  if (process.stdin.isTTY) {
    process.stdout.write("Paste private JSON payload; input is hidden. Press Enter when complete.\n");
    const text = await new Promise((resolve, reject) => {
      let buffer = "";
      const wasRaw = process.stdin.isRaw;
      process.stdin.setEncoding("utf8");
      process.stdin.setRawMode(true);
      process.stdin.resume();
      const cleanup = () => {
        process.stdin.setRawMode(Boolean(wasRaw));
        process.stdin.off("data", onData);
      };
      const onData = (chunk) => {
        if (chunk === "\u0003") {
          cleanup();
          reject(new Error("Interrupted."));
          return;
        }
        const lineBreakIndex = chunk.search(/[\r\n]/);
        if (lineBreakIndex >= 0) {
          buffer += chunk.slice(0, lineBreakIndex);
          cleanup();
          process.stdout.write("\n");
          resolve(buffer.trim());
          return;
        }
        buffer += chunk;
      };
      process.stdin.on("data", onData);
    });
    if (!text) throw new Error("Missing JSON payload.");
    return JSON.parse(text);
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks.map((chunk) => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))).toString("utf8").trim();
  if (!text) throw new Error("Missing JSON payload on stdin.");
  return JSON.parse(text);
}

async function commandRecordOfficialCredential(args) {
  const payload = await readStdinJson();
  const context = loadContext(args);
  const reviewedAt = typeof payload.reviewedAt === "string" && payload.reviewedAt ? payload.reviewedAt : new Date().toISOString();
  const decision = verification.createOfficialCredentialVerificationDecision({
    analysisRunId: context.analysis.metadata.analysisRunId,
    credentialName: String(payload.credentialName || ""),
    issuingOrganization: String(payload.issuingOrganization || ""),
    reviewedAt,
    operatorContext: typeof payload.operatorContext === "string" ? payload.operatorContext : null,
    operatorConfirmed: payload.operatorConfirmed === true,
  });
  const records = verification.buildOfficialCredentialVerificationRecords({
    decision,
    holderName: String(payload.holderName || ""),
    credentialName: String(payload.credentialName || ""),
    issuingOrganization: String(payload.issuingOrganization || ""),
    credentialNumber: typeof payload.credentialNumber === "string" ? payload.credentialNumber : null,
    originalGrantDate: typeof payload.originalGrantDate === "string" ? payload.originalGrantDate : null,
    expirationDate: typeof payload.expirationDate === "string" ? payload.expirationDate : null,
    evidenceReviewed:
      typeof payload.evidenceReviewed === "string" && payload.evidenceReviewed
        ? payload.evidenceReviewed
        : "Official credential document reviewed privately by Ross.",
  });
  verification.appendHighValueCareerFactVerificationDecision({
    decisionRoot: context.currentRoots.decisionRoot,
    repositoryRoot,
    decision,
  });
  const generatedAt = new Date().toISOString();
  const result = verification.finalizeHighValueCareerFactVerificationWithPromotedRecords({
    analysis: context.analysis,
    careerStore: context.careerStore,
    promotedFacts: [records.fact],
    canonicalEvidence: [records.evidence],
    decisions: [decision],
    generatedAt,
  });
  const written = verification.writeHighValueCareerFactVerificationOutputs({
    outputRoot: context.currentRoots.outputRoot,
    analysisOutputRoot: context.currentRoots.analysisRoot,
    positioningOutputRoot: context.currentRoots.positioningOutputRoot,
    repositoryRoot,
    analysis: context.analysis,
    promotedFacts: [records.fact],
    canonicalEvidence: [records.evidence],
    regeneratedBundle: result.regeneratedBundle,
    positioningModel: result.afterModel,
    report: result.report,
  });
  printJson({
    recorded: true,
    category: decision.category,
    outcome: decision.outcome,
    officialEvidenceRecorded: true,
    credentialValuesRedacted: true,
    holderRedacted: true,
    ...written,
    privatePathVisible: false,
    applicationSubmitted: false,
    messageSent: false,
    resumeMutated: false,
    linkedInMutated: false,
    noExternalAi: true,
    noOllama: true,
  });
}

function printHelp() {
  printLines([
    "S010.02E owner-private high-value Career fact verification CLI",
    "",
    "Commands:",
    "  list   --analysis-run-id <id> [--max-items 12]",
    "  review --analysis-run-id <id> [--max-items 12]",
    "  apply  --analysis-run-id <id> [--max-items 12]",
    "  record-official-credential --analysis-run-id <id> < private-json-payload",
    "",
    "Safety:",
    "  No /os route, /operator route, API, provider call, AI call, OAuth flow, message, application submission, resume mutation, or LinkedIn mutation is available.",
  ]);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "help" || args.command === "--help") return printHelp();
  if (args.command === "list") return commandList(args);
  if (args.command === "review") return commandReview(args);
  if (args.command === "apply") return commandApply(args);
  if (args.command === "record-official-credential") return commandRecordOfficialCredential(args);
  throw new Error(`Unsupported command: ${args.command}`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
