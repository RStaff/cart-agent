import test from "node:test";
import assert from "node:assert/strict";
import { calculateBlueprintDeliveryDeadline } from "./blueprintOnboardingCalendar.js";

const cases = [
  {
    name: "spring daylight-saving boundary keeps the fifth business-day deadline at 5 p.m. New York",
    startAt: "2026-03-06T20:00:00.000Z",
    dayZero: "2026-03-06",
    dueDate: "2026-03-13",
    dueAt: "2026-03-13T21:00:00.000Z",
  },
  {
    name: "observed Independence Day and weekend are excluded",
    startAt: "2026-07-02T16:00:00.000Z",
    dayZero: "2026-07-02",
    dueDate: "2026-07-10",
    dueAt: "2026-07-10T21:00:00.000Z",
  },
  {
    name: "year boundary excludes New Year's Day",
    startAt: "2026-12-30T17:00:00.000Z",
    dayZero: "2026-12-30",
    dueDate: "2027-01-07",
    dueAt: "2027-01-07T22:00:00.000Z",
  },
  {
    name: "fall daylight-saving boundary keeps the fifth business-day deadline at 5 p.m. New York",
    startAt: "2026-10-30T19:00:00.000Z",
    dayZero: "2026-10-30",
    dueDate: "2026-11-06",
    dueAt: "2026-11-06T22:00:00.000Z",
  },
];

for (const value of cases) {
  test(value.name, () => {
    const result = calculateBlueprintDeliveryDeadline({ startAt: value.startAt });
    assert.equal(result.dayZero, value.dayZero);
    assert.equal(result.dueDate, value.dueDate);
    assert.equal(result.dueAt.toISOString(), value.dueAt);
    assert.match(result.calendarVersion, /^OPM_US_FEDERAL_HOLIDAYS_V1:/);
  });
}

test("an approved closure is excluded without changing the base calendar authority", () => {
  const result = calculateBlueprintDeliveryDeadline({
    startAt: "2026-03-06T20:00:00.000Z",
    approvedClosures: ["2026-03-10"],
  });
  assert.equal(result.dueDate, "2026-03-16");
  assert.equal(result.dueAt.toISOString(), "2026-03-16T21:00:00.000Z");
});
