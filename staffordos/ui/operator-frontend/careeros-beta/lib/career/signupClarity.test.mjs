import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url).pathname;
const read = (relative) => fs.readFileSync(`${root}${relative}`, "utf8");
const signup = read("app/career/signup/page.tsx");
const auth = read("app/career/components/AuthForm.tsx");

test("signup presents a compact trust summary before the account form", () => {
  for (const text of ["Private beta", "CareerOS", "Private by default", "You are in control", "CareerOS can be wrong", "Optional AI features", "Read full privacy notice", "Send beta feedback"]) assert.match(signup, new RegExp(text));
  assert.ok(signup.indexOf("careerSignupIntro") < signup.indexOf("<AuthForm mode=\"signup\" />"));
  assert.match(signup, /href="\/career\/privacy"/);
  assert.match(signup, /https:\/\/www\.staffordmedia\.ai\/contact/);
});

test("signup keeps the governed field requirements and request payload", () => {
  assert.ok(auth.indexOf("Display name") < auth.indexOf("<label>Email"));
  assert.ok(auth.indexOf("<label>Email") < auth.indexOf("<label>Password"));
  assert.ok(auth.indexOf("<label>Password") < auth.indexOf("Invite code"));
  assert.match(auth, /<label>Invite code<input required/);
  assert.match(auth, /body: JSON\.stringify\(\{ email, password, displayName, inviteToken \}\)/);
});
