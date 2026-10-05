export const BLUEPRINT_CALENDAR_TIME_ZONE = "America/New_York";
export const BLUEPRINT_CALENDAR_BASE_VERSION = "OPM_US_FEDERAL_HOLIDAYS_V1";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BLUEPRINT_CALENDAR_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BLUEPRINT_CALENDAR_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function parts(formatter, value) {
  return Object.fromEntries(
    formatter.formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
}

function dateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) throw new Error("BLUEPRINT_CALENDAR_DATE_INVALID");
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function shiftDate(value, amount) {
  const { year, month, day } = parseDateKey(value);
  const shifted = new Date(Date.UTC(year, month - 1, day + amount));
  return dateKey(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

function weekday(value) {
  const { year, month, day } = parseDateKey(value);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function nthWeekday(year, month, targetWeekday, occurrence) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const day = 1 + ((targetWeekday - first.getUTCDay() + 7) % 7) + ((occurrence - 1) * 7);
  return dateKey(year, month, day);
}

function lastWeekday(year, month, targetWeekday) {
  const last = new Date(Date.UTC(year, month, 0));
  const day = last.getUTCDate() - ((last.getUTCDay() - targetWeekday + 7) % 7);
  return dateKey(year, month, day);
}

function observedDate(value) {
  const day = weekday(value);
  if (day === 6) return shiftDate(value, -1);
  if (day === 0) return shiftDate(value, 1);
  return value;
}

function federalHolidaysForYear(year) {
  return [
    observedDate(dateKey(year, 1, 1)),
    nthWeekday(year, 1, 1, 3),
    nthWeekday(year, 2, 1, 3),
    lastWeekday(year, 5, 1),
    observedDate(dateKey(year, 6, 19)),
    observedDate(dateKey(year, 7, 4)),
    nthWeekday(year, 9, 1, 1),
    nthWeekday(year, 10, 1, 2),
    observedDate(dateKey(year, 11, 11)),
    nthWeekday(year, 11, 4, 4),
    observedDate(dateKey(year, 12, 25)),
  ];
}

function localDateKey(instant) {
  const value = parts(dateFormatter, instant);
  return dateKey(value.year, value.month, value.day);
}

function zonedDateTimeToUtc({ year, month, day, hour, minute = 0, second = 0 }) {
  const target = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = target;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const rendered = parts(dateTimeFormatter, new Date(guess));
    const renderedAsUtc = Date.UTC(
      rendered.year,
      rendered.month - 1,
      rendered.day,
      rendered.hour,
      rendered.minute,
      rendered.second,
    );
    const adjustment = target - renderedAsUtc;
    guess += adjustment;
    if (adjustment === 0) break;
  }
  return new Date(guess);
}

export function calculateBlueprintDeliveryDeadline({ startAt, approvedClosures = [] }) {
  const start = startAt instanceof Date ? startAt : new Date(startAt);
  if (Number.isNaN(start.getTime())) throw new Error("BLUEPRINT_DELIVERY_CLOCK_START_INVALID");
  const dayZero = localDateKey(start);
  const startYear = parseDateKey(dayZero).year;
  const holidaySet = new Set();
  for (let year = startYear - 1; year <= startYear + 2; year += 1) {
    for (const holiday of federalHolidaysForYear(year)) holidaySet.add(holiday);
  }
  const closureSet = new Set(approvedClosures.map((value) => {
    parseDateKey(value);
    return value;
  }));

  let candidate = dayZero;
  let counted = 0;
  while (counted < 5) {
    candidate = shiftDate(candidate, 1);
    const day = weekday(candidate);
    if (day === 0 || day === 6 || holidaySet.has(candidate) || closureSet.has(candidate)) continue;
    counted += 1;
  }

  const dueDate = parseDateKey(candidate);
  const dueAt = zonedDateTimeToUtc({ ...dueDate, hour: 17 });
  return {
    timeZone: BLUEPRINT_CALENDAR_TIME_ZONE,
    calendarVersion: `${BLUEPRINT_CALENDAR_BASE_VERSION}:${startYear}-${dueDate.year}`,
    dayZero,
    dueDate: candidate,
    dueAt,
  };
}
