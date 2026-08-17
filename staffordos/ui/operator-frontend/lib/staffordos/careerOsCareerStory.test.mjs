import test from "node:test";
import assert from "node:assert/strict";
import { buildConversationDraft, CAREER_STORY_INPUT_MODES, CAREER_STORY_STATUS, CAREER_STORY_TYPES, documentUploadReadiness, nextStoryStatus, TALK_FOLLOW_UPS, TALK_OPENING } from "../../careeros-beta/lib/career/careerStory.mjs";

test("career story exposes the three bounded input modes and reusable experience types", () => {
  assert.deepEqual(Object.values(CAREER_STORY_INPUT_MODES), ["DOCUMENT", "PASTE_OR_TYPE", "TALK"]);
  assert.ok(CAREER_STORY_TYPES.some(([key]) => key === "EMPLOYMENT"));
  assert.ok(CAREER_STORY_TYPES.some(([key]) => key === "VOLUNTEER_COMMUNITY"));
});

test("document mode remains fail-closed while paste and talk converge on text review", () => {
  assert.equal(documentUploadReadiness().enabled, false);
  assert.equal(documentUploadReadiness().status, "BINARY_UPLOAD_DISABLED");
  assert.match(TALK_OPENING, /experience/i);
  assert.equal(TALK_FOLLOW_UPS.length, 6);
  assert.match(buildConversationDraft({ did: "Led a synthetic project", outcome: "Delivered it" }), /What I did/);
});

test("story completion is explicit and reversible", () => {
  assert.equal(nextStoryStatus("COMPLETE_FOR_NOW"), CAREER_STORY_STATUS.CAREER_STORY_COMPLETE_FOR_NOW);
  assert.equal(nextStoryStatus("REOPEN"), CAREER_STORY_STATUS.CURRENT_FACTS_REVIEWED);
});
