/**
 * Seeds as numbers people pass around: in an address, a form, a database row.
 *
 * A seed here is a whole number from 1 to `SEED_MOST` (2^31 − 1), which every
 * language and every JSON parser reads exactly. Ranges of those numbers can be
 * kept aside as SEED BLOCKS, each meaning something of its own (the daily
 * puzzles, a weekly challenge), so that a seed drawn at random never lands on
 * one somebody would recognise.
 */
import { hashSeed, type Random } from "./random.ts";

/** The largest seed: it travels as a plain integer, so it stays a positive 32-bit signed one.
 *
 * @example
 * ```ts
 * import { SEED_MOST } from "@johnmorrisdotca/tane";
 * console.log(SEED_MOST);
 * ```
 */
export const SEED_MOST = 2 ** 31 - 1;

/** A range of seeds kept aside: `from` up to, not including, `from + size`.
 *
 * @example
 * ```ts
 * import type { SeedBlock } from "@johnmorrisdotca/tane";
 *
 * const value: SeedBlock = { from: 1000, size: 100 };
 * console.log(value.from);
 * ```
 */
export type SeedBlock = { readonly from: number; readonly size: number };

/** Where a drawn seed may land.
 *
 * @example
 * ```ts
 * import type { DrawSeedOptions } from "@johnmorrisdotca/tane";
 *
 * const value: DrawSeedOptions = { most: 100, reserved: [{ from: 10, size: 5 }] };
 * console.log(value.most);
 * ```
 */
export type DrawSeedOptions = {
  /** The largest seed to draw. `SEED_MOST` unless said. */
  readonly most?: number;
  /** Blocks a drawn seed never lands in. They must not overlap. */
  readonly reserved?: readonly SeedBlock[];
};

/** Whether a value read from outside (an address, a request body) is a seed: an integer from 1 to `most`.
 *
 * @param value - The unknown seed value to check.
 * @param most - The largest seed admitted by the host.
 * @returns Whether a value read from outside (an address, a request body) is a seed: an integer from 1 to `most`.
 * @example
 * ```ts
 * import { isSeed } from "@johnmorrisdotca/tane";
 *
 * console.log(isSeed(42));
 * ```
 */
export function isSeed(value: unknown, most: number = SEED_MOST): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= most;
}

/** Whether a seed falls inside a block.
 *
 * @param seed - The numeric seed, read as an unsigned 32-bit integer by the stream.
 * @param block - The reserved seed block: its starting seed and length.
 * @returns Whether a seed falls inside a block.
 * @example
 * ```ts
 * import { inBlock } from "@johnmorrisdotca/tane";
 *
 * console.log(inBlock(1005, { from: 1000, size: 100 }));
 * ```
 */
export function inBlock(seed: number, block: SeedBlock): boolean {
  return seed >= block.from && seed < block.from + block.size;
}

/**
 * The blocks in ascending order, checked: whole numbers, inside 1 to `most`,
 * none overlapping another. Throws a `RangeError` naming the first fault.
 *
 * @param blocks - The reserved blocks to validate and sort.
 * @param most - The largest seed admitted by the host.
 * @returns The blocks in ascending order, checked: whole numbers, inside 1 to `most`, none overlapping another. Throws a `RangeError` naming the first fault.
 * @example
 * ```ts
 * import { checkBlocks } from "@johnmorrisdotca/tane";
 *
 * console.log(checkBlocks([{ from: 1000, size: 100 }, { from: 10, size: 5 }]));
 * ```
 */
export function checkBlocks(blocks: readonly SeedBlock[], most: number = SEED_MOST): SeedBlock[] {
  const sorted = [...blocks].sort((a, b) => a.from - b.from);
  let end = 1;
  for (const block of sorted) {
    if (!Number.isSafeInteger(block.from) || !Number.isSafeInteger(block.size) || block.size < 1) {
      throw new RangeError(`tane: seed block ${block.from}+${block.size} is not a range of whole numbers`);
    }
    if (block.from < end) throw new RangeError(`tane: seed block from ${block.from} overlaps the one before it`);
    if (block.from + block.size - 1 > most) throw new RangeError(`tane: seed block from ${block.from} runs past ${most}`);
    end = block.from + block.size;
  }
  return sorted;
}

/**
 * A seed from 1 to `most`, any of them as likely as another, skipping every
 * reserved block: one draw. The draw is spread over the seeds that are left
 * and then stepped over each block below it, so no seed is ever likelier than
 * another and no draw is wasted.
 *
 * @param random - A random source returning values in [0, 1).
 * @param options - Seed-range options, including the upper bound and reserved blocks.
 * @returns A seed from 1 to `most`, any of them as likely as another, skipping every reserved block: one draw. The draw is spread over the seeds that are left and then stepped over each block below it, so no seed is ever likelier than another and no draw is wasted.
 * @example
 * ```ts
 * import { drawSeed, mulberry32 } from "@johnmorrisdotca/tane";
 *
 * const random = mulberry32(42);
 * console.log(drawSeed(random, { most: 100, reserved: [{ from: 10, size: 5 }] }));
 * ```
 */
export function drawSeed(random: Random, options: DrawSeedOptions = {}): number {
  const most = options.most ?? SEED_MOST;
  const blocks = checkBlocks(options.reserved ?? [], most);
  const kept = blocks.reduce((sum, block) => sum + block.size, 0);
  if (kept >= most) throw new RangeError("tane: every seed is reserved");
  let seed = Math.floor(random() * (most - kept)) + 1;
  for (const block of blocks) {
    if (seed >= block.from) seed += block.size;
  }
  return seed;
}

/** A new seed for something nobody asked for by number, drawn from `Math.random`.
 *
 * @param options - Seed-range options, including the upper bound and reserved blocks.
 * @returns A new seed for something nobody asked for by number, drawn from `Math.random`.
 * @example
 * ```ts
 * import { freshSeed, isSeed } from "@johnmorrisdotca/tane";
 *
 * console.log(isSeed(freshSeed()));
 * ```
 */
export function freshSeed(options: DrawSeedOptions = {}): number {
  return drawSeed(Math.random, options);
}

/**
 * A seed from whatever a person typed or a link carried. A whole number from
 * 0 to 2^32 − 1, as a number or as its digits, is that seed; any other text
 * is hashed with `hashSeed`, so "table-7" is a seed as good as 42. Space
 * around text is dropped first. Note that the text "42" and the number 42 are
 * the same seed, and that `hashSeed("42")` is a different one.
 *
 * @param input - A numeric seed or text to normalize as a seed.
 * @returns A seed from whatever a person typed or a link carried. A whole number from 0 to 2^32 − 1, as a number or as its digits, is that seed; any other text is hashed with `hashSeed`, so "table-7" is a seed as good as 42. Space around text is dropped first. Note that the text "42" and the number 42 are the same seed, and that `hashSeed("42")` is a different one.
 * @example
 * ```ts
 * import { seedFrom } from "@johnmorrisdotca/tane";
 *
 * console.log([seedFrom("42"), seedFrom(42), seedFrom("room-7")]);
 * ```
 */
export function seedFrom(input: string | number): number {
  if (typeof input === "number") {
    if (!Number.isSafeInteger(input)) throw new RangeError(`tane: a seed must be a whole number or text, not ${input}`);
    return input >>> 0;
  }
  const text = input.trim();
  if (/^\d{1,10}$/.test(text) && Number(text) <= 4_294_967_295) return Number(text);
  return hashSeed(text);
}
