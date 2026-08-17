import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../../careeros-beta/app/career/components/CareerStoryBuilder.tsx", import.meta.url), "utf8");

test("guided interview renders one stable question with progress and voice/text choices", () => {
  assert.match(source, /Question \{questionIndex \+ 1\} of \{followUps\.length\}/);
  assert.match(source, /role="progressbar"/);
  assert.match(source, /Type instead/);
  assert.match(source, /Answer by voice/);
  assert.match(source, /Keep answer &amp; continue/);
  assert.match(source, /Skip for now/);
});

test("guided interview preserves accepted answers and uses the existing intake path", () => {
  assert.match(source, /setTalkAnswers\(\(current\) => current\.map/);
  assert.match(source, /Your career story draft/);
  assert.match(source, /Submit story for review/);
  assert.match(source, /\/api\/career\/intake\/source/);
  assert.match(source, /VOICE_TRANSCRIPT/);
  assert.doesNotMatch(source, /createCareerFact|createCapability|CareerEvidence/);
});

test("voice failure keeps the current interview usable", () => {
  assert.match(source, /Voice did not work this time\. You can try again or type your answer\./);
  assert.match(source, /setInputMode\("TEXT"\)/);
  assert.match(source, /Skipping is not treated as a negative answer/);
});
