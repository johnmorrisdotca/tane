import { useEffect, useState } from "react";

import { dailySeed, dayKey, nextDayStart, type DayKey } from "./daily.ts";
import { mulberry32, type Random } from "./random.ts";

/** Today, as `useDailySeed` hands it back: the day written `YYYY-MM-DD`, and its seed.
 *
 * @example
 * ```ts
 * import type { DailySeed } from "@johnmorrisdotca/tane/react";
 * import { dailySeed, dayKey } from "@johnmorrisdotca/tane";
 *
 * const at = new Date("2026-10-11T12:00:00Z");
 * const value: DailySeed = { day: dayKey(at), seed: dailySeed(at) };
 * console.log(value.day);
 * ```
 */
export type DailySeed = { readonly day: DayKey; readonly seed: number };

function today(timeZone: string): DailySeed {
  const now = new Date();
  return { day: dayKey(now, timeZone), seed: dailySeed(now, timeZone) };
}

/**
 * Today's day and seed, which change on their own at midnight in `timeZone`
 * (UTC unless named): a page left open overnight moves to the new day's
 * puzzle without a reload.
 *
 * On the server this reads the server's clock; a page rendered just before
 * midnight and hydrated just after will show the new day once it hydrates.
 *
 * @param timeZone - The IANA time-zone name; UTC when omitted.
 * @returns The current calendar day and its seed for the named zone.
 * @example
 * ```ts no-run
 * import { useDailySeed } from "@johnmorrisdotca/tane/react";
 *
 * import { createElement } from "react";
 * function DailyPuzzle() {
 *   const today = useDailySeed("UTC");
 *   return createElement("p", null, `${today.day}: ${today.seed}`);
 * }
 * console.log(createElement(DailyPuzzle));
 * ```
 */
export function useDailySeed(timeZone = "UTC"): DailySeed {
  const [value, setValue] = useState<DailySeed>(() => today(timeZone));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      setValue((previous) => {
        const next = today(timeZone);
        return next.day === previous.day ? previous : next;
      });
      const wait = nextDayStart(new Date(), timeZone).getTime() - Date.now();
      timer = setTimeout(schedule, Math.min(Math.max(wait, 0) + 50, 2 ** 31 - 1));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [timeZone]);
  return value;
}

/**
 * Something made once from a seeded stream, and made again only when the seed
 * changes: `useSeeded(seed, (random) => shuffled(random, deck))`. The stream
 * is fresh each time, so the result depends on the seed alone, never on how
 * many times the component rendered. `make` is read when the seed changes;
 * for anything else it depends on, give the component a `key`.
 *
 * @param seed - The numeric seed, read as an unsigned 32-bit integer by the stream.
 * @param make - A callback that builds a value from the fresh seeded stream.
 * @returns The value built from the seeded stream, retained until the seed changes.
 * @example
 * ```ts no-run
 * import { useSeeded } from "@johnmorrisdotca/tane/react";
 * import { pick } from "@johnmorrisdotca/tane";
 *
 * import { createElement } from "react";
 * function Choice() {
 *   const choice = useSeeded(42, (random) => pick(random, ["A", "B", "C"]));
 *   return createElement("p", null, choice);
 * }
 * console.log(createElement(Choice));
 * ```
 */
export function useSeeded<T>(seed: number, make: (random: Random) => T): T {
  const [held, setHeld] = useState(() => ({ seed, value: make(mulberry32(seed)) }));
  if (held.seed !== seed) {
    const next = { seed, value: make(mulberry32(seed)) };
    setHeld(next);
    return next.value;
  }
  return held.value;
}
