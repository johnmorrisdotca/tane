/**
 * Everything drawn from a stream: integers, floats, coin flips, picks,
 * shuffles, weighted choices and a bell curve. Each takes the `Random` first,
 * so the same code runs on `Math.random` or on a seeded stream, and each takes
 * exactly the draws its documentation says, so a seeded result never moves
 * between versions.
 */
import type { Random } from "./random.ts";

function checkInteger(name: string, value: number): void {
  if (!Number.isSafeInteger(value)) throw new RangeError(`tane: ${name} must be a safe integer, not ${value}`);
}

/** An integer in [0, n): one draw.
 *
 * @param random - A random source returning values in [0, 1).
 * @param n - The exclusive upper bound for an integer draw.
 * @returns An integer in [0, n): one draw.
 * @example
 * ```ts
 * import { below, mulberry32 } from "@johnmorrisdotca/tane";
 *
 * const random = mulberry32(42);
 * console.log(below(random, 6));
 * ```
 */
export function below(random: Random, n: number): number {
  checkInteger("n", n);
  if (n < 1) throw new RangeError(`tane: cannot draw below ${n}`);
  return Math.floor(random() * n);
}

/** An integer from `min` to `max`, both included: one draw.
 *
 * @param random - A random source returning values in [0, 1).
 * @param min - The included lower bound.
 * @param max - The upper bound; included for int and excluded for float.
 * @returns An integer from `min` to `max`, both included: one draw.
 * @example
 * ```ts
 * import { int, mulberry32 } from "@johnmorrisdotca/tane";
 *
 * const random = mulberry32(42);
 * console.log(int(random, 1, 6));
 * ```
 */
export function int(random: Random, min: number, max: number): number {
  checkInteger("min", min);
  checkInteger("max", max);
  if (max < min) throw new RangeError(`tane: int(${min}, ${max}) has no integers`);
  return Math.floor(min + random() * (max - min + 1));
}

/** A number in [min, max): one draw.
 *
 * @param random - A random source returning values in [0, 1).
 * @param min - The included lower bound.
 * @param max - The upper bound; included for int and excluded for float.
 * @returns A number in [min, max): one draw.
 * @example
 * ```ts
 * import { float, mulberry32 } from "@johnmorrisdotca/tane";
 *
 * const random = mulberry32(42);
 * console.log(float(random, -1, 1));
 * ```
 */
export function float(random: Random, min: number, max: number): number {
  return min + random() * (max - min);
}

/** True with probability `p`, from 0 (never) to 1 (always): one draw.
 *
 * @param random - A random source returning values in [0, 1).
 * @param p - The probability, from 0 to 1.
 * @returns True with probability `p`, from 0 (never) to 1 (always): one draw.
 * @example
 * ```ts
 * import { chance, mulberry32 } from "@johnmorrisdotca/tane";
 *
 * const random = mulberry32(42);
 * console.log(chance(random, 0.5));
 * ```
 */
export function chance(random: Random, p: number): boolean {
  return random() < p;
}

/** One item of a list, each as likely as the next: one draw. Throws on an empty list.
 *
 * @param random - A random source returning values in [0, 1).
 * @param items - The items to choose or shuffle; shuffle mutates this array, while shuffled copies it.
 * @returns One item of a list, each as likely as the next: one draw. Throws on an empty list.
 * @example
 * ```ts
 * import { mulberry32, pick } from "@johnmorrisdotca/tane";
 *
 * const random = mulberry32(42);
 * console.log(pick(random, ["A", "B", "C"]));
 * ```
 */
export function pick<T>(random: Random, items: readonly T[]): T {
  if (items.length === 0) throw new RangeError("tane: cannot pick from an empty list");
  return items[Math.floor(random() * items.length)] as T;
}

/**
 * The list in place, in a random order (Fisher–Yates, from the end): one draw
 * for each item but the first. Returns the same array.
 *
 * @param random - A random source returning values in [0, 1).
 * @param items - The items to choose or shuffle; shuffle mutates this array, while shuffled copies it.
 * @returns The list in place, in a random order (Fisher–Yates, from the end): one draw for each item but the first. Returns the same array.
 * @example
 * ```ts
 * import { mulberry32, shuffle } from "@johnmorrisdotca/tane";
 *
 * const random = mulberry32(42);
 * console.log(shuffle(random, ["A", "B", "C"]));
 * ```
 */
export function shuffle<T>(random: Random, items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const kept = items[i] as T;
    items[i] = items[j] as T;
    items[j] = kept;
  }
  return items;
}

/** A shuffled copy; the list given is left alone. The same order `shuffle` would make.
 *
 * @param random - A random source returning values in [0, 1).
 * @param items - The items to choose or shuffle; shuffle mutates this array, while shuffled copies it.
 * @returns A shuffled copy; the list given is left alone. The same order `shuffle` would make.
 * @example
 * ```ts
 * import { mulberry32, shuffled } from "@johnmorrisdotca/tane";
 *
 * const random = mulberry32(42);
 * console.log(shuffled(random, ["A", "B", "C"]));
 * ```
 */
export function shuffled<T>(random: Random, items: readonly T[]): T[] {
  return shuffle(random, [...items]);
}

/**
 * `count` items of a list, no item twice, in the order drawn: a partial
 * Fisher–Yates, one draw each. Asking for more than the list holds gives the
 * whole list, shuffled.
 *
 * @param random - A random source returning values in [0, 1).
 * @param items - The items to choose or shuffle; shuffle mutates this array, while shuffled copies it.
 * @param count - The number of items or draws requested.
 * @returns `count` items of a list, no item twice, in the order drawn: a partial Fisher–Yates, one draw each. Asking for more than the list holds gives the whole list, shuffled.
 * @example
 * ```ts
 * import { mulberry32, sample } from "@johnmorrisdotca/tane";
 *
 * const random = mulberry32(42);
 * console.log(sample(random, ["A", "B", "C", "D"], 3));
 * ```
 */
export function sample<T>(random: Random, items: readonly T[], count: number): T[] {
  checkInteger("count", count);
  const pool = [...items];
  const take = Math.max(0, Math.min(count, pool.length));
  for (let i = 0; i < take; i += 1) {
    const j = i + Math.floor(random() * (pool.length - i));
    const kept = pool[i] as T;
    pool[i] = pool[j] as T;
    pool[j] = kept;
  }
  return pool.slice(0, take);
}

/**
 * `count` different integers below `limit`, in the order drawn, by drawing
 * again whenever a number comes up twice. The draw count therefore depends on
 * the luck of the stream; prefer `sample` for new code, and keep this where a
 * stored seed already depends on it.
 *
 * @param random - A random source returning values in [0, 1).
 * @param count - The number of items or draws requested.
 * @param limit - The exclusive upper bound for distinct integer draws.
 * @returns `count` different integers below `limit`, in the order drawn, by drawing again whenever a number comes up twice. The draw count therefore depends on the luck of the stream; prefer `sample` for new code, and keep this where a stored seed already depends on it.
 * @example
 * ```ts
 * import { distinctBelow, mulberry32 } from "@johnmorrisdotca/tane";
 *
 * const random = mulberry32(42);
 * console.log(distinctBelow(random, 3, 10));
 * ```
 */
export function distinctBelow(random: Random, count: number, limit: number): number[] {
  const drawn: number[] = [];
  while (drawn.length < Math.min(count, limit)) {
    const candidate = Math.floor(random() * limit);
    if (!drawn.includes(candidate)) drawn.push(candidate);
  }
  return drawn;
}

/**
 * An index into `weights`, each chosen in proportion to its weight: one draw.
 * Weights must not be negative; a list whose weights sum to nothing gives 0.
 *
 * @param random - A random source returning values in [0, 1).
 * @param weights - Nonnegative weights in the same order as the corresponding items.
 * @returns An index into `weights`, each chosen in proportion to its weight: one draw. Weights must not be negative; a list whose weights sum to nothing gives 0.
 * @example
 * ```ts
 * import { mulberry32, weightedIndex } from "@johnmorrisdotca/tane";
 *
 * const random = mulberry32(42);
 * console.log(weightedIndex(random, [1, 3]));
 * ```
 */
export function weightedIndex(random: Random, weights: readonly number[]): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return 0;
  let roll = random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i] as number;
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

/** One item, chosen by the matching weight: one draw.
 *
 * @param random - A random source returning values in [0, 1).
 * @param items - The items to choose or shuffle; shuffle mutates this array, while shuffled copies it.
 * @param weights - Nonnegative weights in the same order as the corresponding items.
 * @returns One item, chosen by the matching weight: one draw.
 * @example
 * ```ts
 * import { mulberry32, weightedPick } from "@johnmorrisdotca/tane";
 *
 * const random = mulberry32(42);
 * console.log(weightedPick(random, ["low", "high"], [1, 3]));
 * ```
 */
export function weightedPick<T>(random: Random, items: readonly T[], weights: readonly number[]): T {
  if (items.length === 0) throw new RangeError("tane: cannot pick from an empty list");
  return items[weightedIndex(random, weights)] as T;
}

/** A number from a normal distribution (Box–Muller): two draws.
 *
 * @param random - A random source returning values in [0, 1).
 * @param mean - The normal distribution’s mean.
 * @param spread - The normal distribution’s standard deviation.
 * @returns A number from a normal distribution (Box–Muller): two draws.
 * @example
 * ```ts
 * import { mulberry32, normal } from "@johnmorrisdotca/tane";
 *
 * const random = mulberry32(42);
 * console.log(normal(random, 10, 2));
 * ```
 */
export function normal(random: Random, mean = 0, spread = 1): number {
  const u1 = Math.max(random(), Number.EPSILON);
  const u2 = random();
  return mean + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * spread;
}
