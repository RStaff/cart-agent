import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const extractorPath = path.join(root, "staffordos/ui/operator-frontend/lib/staffordos/jobRequirementExtractor.ts");
const requireFromFrontend = createRequire(path.join(root, "staffordos/ui/operator-frontend/package.json"));
const ts = requireFromFrontend("typescript");
const extractorSource = readFileSync(extractorPath, "utf8");

function requireTypeScriptModule(modulePath) {
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

  try {
    return requireFromFrontend(modulePath);
  } finally {
    if (originalTsExtension) {
      Module._extensions[".ts"] = originalTsExtension;
    } else {
      delete Module._extensions[".ts"];
    }
  }
}

const { extractPrivateJobRequirements } = requireTypeScriptModule(extractorPath);

function baseInput(overrides = {}) {
  return {
    workspaceId: "professional",
    jobOpportunityId: "privjobopp_synthetic001",
    sourceId: "privjobsrc_synthetic001",
    listingText: `
Requirements
- Must have 5+ years of product experience with AI automation workflows.
- Experience with stakeholders and roadmap decisions.
Preferred
- Nice to have SQL analytics.
Responsibilities
- You will partner with engineering to define agent workflows.
- Lead cross-functional launch planning.
Location
- Remote in the United States.
Compensation
- Salary range provided in source.
    `,
    sourceSummary: null,
    locationText: "Remote",
    workArrangement: "Remote",
    compensationText: "Salary range provided in source",
    employmentType: "Full time",
    createdAt: "2026-08-04T12:00:00Z",
    ...overrides,
  };
}

test("required and preferred requirements remain distinct", () => {
  const requirements = extractPrivateJobRequirements(baseInput());
  const required = requirements.find((requirement) => /5\+ years/.test(requirement.requirementText));
  const preferred = requirements.find((requirement) => /SQL analytics/.test(requirement.requirementText));

  assert.equal(required.requirementLevel, "REQUIRED");
  assert.equal(required.importanceClassification, "Required");
  assert.equal(preferred.requirementLevel, "PREFERRED");
  assert.equal(preferred.importanceClassification, "Preferred");
});

test("responsibilities and informational requirements are not upgraded to required", () => {
  const requirements = extractPrivateJobRequirements(baseInput());
  const responsibility = requirements.find((requirement) => /partner with engineering/.test(requirement.requirementText));
  const location = requirements.find((requirement) => /^Location:/.test(requirement.requirementText));
  const compensation = requirements.find((requirement) => /^Compensation:/.test(requirement.requirementText));

  assert.equal(responsibility.requirementLevel, "RESPONSIBILITY");
  assert.equal(responsibility.requirementCategory, "Responsibility");
  assert.equal(location.requirementLevel, "INFORMATIONAL");
  assert.equal(location.requirementCategory, "Location or work arrangement");
  assert.equal(compensation.requirementCategory, "Compensation");
});

test("explicit years are preserved and unstated years are not invented", () => {
  const requirements = extractPrivateJobRequirements(baseInput());
  const withYears = requirements.find((requirement) => /5\+ years/.test(requirement.requirementText));
  const withoutYears = requirements.find((requirement) => /roadmap decisions/.test(requirement.requirementText));

  assert.equal(withYears.yearsMentioned, 5);
  assert.equal(withoutYears.yearsMentioned, null);
});

test("ambiguous requirements remain ambiguous", () => {
  const requirements = extractPrivateJobRequirements(
    baseInput({
      listingText: "Qualifications\nComfortable with product analytics and automation tooling.",
      locationText: null,
      workArrangement: null,
      compensationText: null,
      employmentType: null,
    }),
  );

  assert.equal(requirements.length, 1);
  assert.equal(requirements[0].requirementLevel, "REQUIRED");
  assert.match(requirements[0].ambiguity, /qualitative proficiency wording/i);
});

test("source trace and source authority are preserved", () => {
  const requirements = extractPrivateJobRequirements(baseInput());

  assert.ok(requirements.every((requirement) => requirement.sourceAuthority === "SOURCE_EXPLICIT"));
  assert.ok(requirements.every((requirement) => requirement.sourceExcerptReference));
  assert.ok(requirements.some((requirement) => /^listingText:line:/.test(requirement.sourceExcerptReference)));
  assert.ok(requirements.some((requirement) => /^opportunityMetadata:/.test(requirement.sourceExcerptReference)));
});

test("extractor source has no provider, API, database, AI, application, message, or resume mutation behavior", () => {
  assert.doesNotMatch(extractorSource, /fetch\(|XMLHttpRequest|\/api\/|from ["']@prisma\/client|prisma\.|database\.|dbClient|sql`/i);
  assert.doesNotMatch(extractorSource, /ollama|openai|anthropic|gemini|modelAdapter/i);
  assert.doesNotMatch(extractorSource, /submitApplication|sendMessage|mutateResume|writeFile|appendFile|unlink|spawn\(|exec\(/i);
});
