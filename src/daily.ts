/**
 * One seed a day, the same for everybody.
 *
 * A day is written `YYYY-MM-DD` and its seed is that date as a number:
 * 2026-09-30 is 20260930. Readable by eye, sortable, and a valid seed. The day
 * is UTC unless a time zone is named, which is what makes a daily puzzle one
 * puzzle worldwide; name a zone (`"America/Toronto"`) for one that turns at a
 * place's own midnight instead.
 *
 * Days are counted on the calendar, never by adding 86,400,000 ms to a local
 * time, so a day that loses or gains an hour to daylight saving is still one
 * day.
 */
import type { SeedBlock } from "./seeds.ts";

/** A calendar date, `YYYY-MM-DD`.
 *
 * @example
 * ```ts
 * import type { DayKey } from "@johnmorrisdotca/tane";
 *
 * const value: DayKey = "2026-10-11";
 * console.log(value);
 * ```
 */
export type DayKey = string;

const DAY_MS = 86_400_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", calendar: "gregory", numberingSystem: "latn" });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

/** The day a moment falls on, in UTC or in the named IANA time zone.
 *
 * @param at - The moment to read as a calendar day.
 * @param timeZone - The IANA time-zone name; UTC when omitted.
 * @returns The day a moment falls on, in UTC or in the named IANA time zone.
 * @example
 * ```ts
 * import { dayKey } from "@johnmorrisdotca/tane";
 *
 * console.log(dayKey(new Date("2026-10-11T03:00:00Z"), "America/Toronto"));
 * ```
 */
export function dayKey(at: Date, timeZone = "UTC"): DayKey {
  if (Number.isNaN(at.getTime())) throw new RangeError("tane: an invalid Date has no day");
  if (timeZone === "UTC") {
    return `${pad(at.getUTCFullYear(), 4)}-${pad(at.getUTCMonth() + 1, 2)}-${pad(at.getUTCDate(), 2)}`;
  }
  const parts: Record<string, string> = {};
  for (const part of formatterFor(timeZone).formatToParts(at)) parts[part.type] = part.value;
  return `${pad(Number(parts.year), 4)}-${parts.month}-${parts.day}`;
}

/** Today's seed, the date as a number: 2026-09-30 is 20260930. UTC unless a zone is named.
 *
 * @param at - The moment to read as a calendar day.
 * @param timeZone - The IANA time-zone name; UTC when omitted.
 * @returns Today's seed, the date as a number: 2026-09-30 is 20260930. UTC unless a zone is named.
 * @example
 * ```ts
 * import { dailySeed } from "@johnmorrisdotca/tane";
 *
 * console.log(dailySeed(new Date("2026-10-11T12:00:00Z"), "UTC"));
 * ```
 */
export function dailySeed(at: Date, timeZone = "UTC"): number {
  const [year, month, day] = dayKey(at, timeZone).split("-").map(Number) as [number, number, number];
  return year * 10_000 + month * 100 + day;
}

/** Whether a text is a real date written `YYYY-MM-DD`: 2026-02-30 is not.
 *
 * @param text - Text to hash, validate or decode.
 * @returns Whether a text is a real date written `YYYY-MM-DD`: 2026-02-30 is not.
 * @example
 * ```ts
 * import { isDayKey } from "@johnmorrisdotca/tane";
 *
 * console.log(isDayKey("2026-02-30"));
 * ```
 */
export function isDayKey(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const at = Date.parse(`${text}T00:00:00Z`);
  return !Number.isNaN(at) && dayKey(new Date(at)) === text;
}

function dayNumber(day: DayKey): number {
  if (!isDayKey(day)) throw new RangeError(`tane: ${day} is not a date written YYYY-MM-DD`);
  return Date.parse(`${day}T00:00:00Z`) / DAY_MS;
}

/** The day `by` days after (or, negative, before) a day.
 *
 * @param day - A real calendar day in YYYY-MM-DD form.
 * @param by - The signed number of calendar days to add.
 * @returns The day `by` days after (or, negative, before) a day.
 * @example
 * ```ts
 * import { addDays } from "@johnmorrisdotca/tane";
 *
 * console.log(addDays("2026-10-11", 1));
 * ```
 */
export function addDays(day: DayKey, by: number): DayKey {
  return dayKey(new Date((dayNumber(day) + by) * DAY_MS));
}

/** How many days `to` is after `from`: negative when it is before.
 *
 * @param from - The starting calendar day.
 * @param to - The ending calendar day.
 * @returns How many days `to` is after `from`: negative when it is before.
 * @example
 * ```ts
 * import { daysBetween } from "@johnmorrisdotca/tane";
 *
 * console.log(daysBetween("2026-10-11", "2026-10-14"));
 * ```
 */
export function daysBetween(from: DayKey, to: DayKey): number {
  return dayNumber(to) - dayNumber(from);
}

/**
 * The first moment of the day after the one `at` falls on, in that zone: when
 * a daily seed next changes. Found by searching the next 27 hours for the
 * millisecond the date turns, so daylight saving and half-hour zones need no
 * special case.
 *
 * @param at - The moment to read as a calendar day.
 * @param timeZone - The IANA time-zone name; UTC when omitted.
 * @returns The first moment of the day after the one `at` falls on, in that zone: when a daily seed next changes. Found by searching the next 27 hours for the millisecond the date turns, so daylight saving and half-hour zones need no special case.
 * @example
 * ```ts
 * import { nextDayStart } from "@johnmorrisdotca/tane";
 *
 * console.log(nextDayStart(new Date("2026-10-11T12:00:00Z"), "UTC").toISOString());
 * ```
 */
export function nextDayStart(at: Date, timeZone = "UTC"): Date {
  const today = dayKey(at, timeZone);
  let low = at.getTime();
  let high = low + 27 * 3_600_000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (dayKey(new Date(middle), timeZone) === today) low = middle;
    else high = middle;
  }
  return new Date(high);
}

/**
 * A day's seed inside a block kept for it: the block's first seed plus the
 * date as a number. With a block from 1,000,000,000, 2026-10-03 is
 * 1,020,261,003: still readable, and never a seed drawn at random if the block
 * is reserved when drawing (`drawSeed`).
 *
 * @param day - A real calendar day in YYYY-MM-DD form.
 * @param block - The reserved seed block: its starting seed and length.
 * @returns A day's seed inside a block kept for it: the block's first seed plus the date as a number. With a block from 1,000,000,000, 2026-10-03 is 1,020,261,003: still readable, and never a seed drawn at random if the block is reserved when drawing (`drawSeed`).
 * @example
 * ```ts
 * import { daySeed } from "@johnmorrisdotca/tane";
 *
 * const block = { from: 1000000000, size: 100000000 };
 * console.log(daySeed("2026-10-11", block));
 * ```
 */
export function daySeed(day: DayKey, block: SeedBlock): number {
  const offset = Number(day.replaceAll("-", ""));
  if (!isDayKey(day) || offset >= block.size) throw new RangeError(`tane: ${day} has no seed in a block of ${block.size}`);
  return block.from + offset;
}

/** The day a seed names inside a block, or null for a seed that names none. The inverse of `daySeed`.
 *
 * @param seed - The numeric seed, read as an unsigned 32-bit integer by the stream.
 * @param block - The reserved seed block: its starting seed and length.
 * @returns The day a seed names inside a block, or null for a seed that names none. The inverse of `daySeed`.
 * @example
 * ```ts
 * import { dayOfSeed, daySeed } from "@johnmorrisdotca/tane";
 *
 * const block = { from: 1000000000, size: 100000000 };
 * console.log(dayOfSeed(daySeed("2026-10-11", block), block));
 * ```
 */
export function dayOfSeed(seed: number, block: SeedBlock): DayKey | null {
  const offset = seed - block.from;
  if (!Number.isInteger(offset) || offset < 0 || offset >= block.size || offset > 99_999_999) return null;
  const digits = pad(offset, 8);
  const day = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  return isDayKey(day) ? day : null;
}
