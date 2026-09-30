/**
 * A stream written down and read back: where a seeded stream has got to, as
 * JSON, as one line of text a person can paste, and its numbers as CSV.
 *
 * mulberry32's whole state is one 32-bit integer that moves by the same
 * amount every draw, so "seed 42, 7 draws in" is a complete description of a
 * stream: `randomAt(42, 7)` is there in one step, without drawing the seven.
 * Everything here is pure: a position in, a string out, and back.
 */
import { mulberry32, type Random } from "./random.ts";
import { VERSION } from "./version.ts";

const GOLDEN = 0x6d2b79f5;
const UINT32_MOST = 4_294_967_295;

/** The shape of the JSON and the text this package writes. It goes up only when a reader of the old shape would be wrong about the new one. */
export const SAVE_FORMAT = 1;

/** Where a stream is: the seed it started from, and how many numbers have been drawn from it. */
export type StreamPosition = {
  /** The seed the stream was made from, as an unsigned 32-bit integer. */
  readonly seed: number;
  /** How many numbers have been drawn: 0 for a stream nothing has been taken from. */
  readonly draws: number;
};

/** A stream's position as `toJSON` writes it. */
export type SavedStream = {
  /** The shape of this object: `SAVE_FORMAT`. */
  format: typeof SAVE_FORMAT;
  /** What wrote it, such as `"tane 1.1.0"`. For people; nothing reads it back. */
  generator: string;
  /** The algorithm. Always `"mulberry32"`. */
  algorithm: "mulberry32";
  seed: number;
  draws: number;
  /** The generator's state at that position: `stateAt(seed, draws)`. Checked on the way back in. */
  state: number;
};

/** A stream that knows where it is: call it for the next number, as any `Random`; read `seed` and `draws`, or take its `position()`. */
export type CountedRandom = Random & {
  /** The seed it was made from, as an unsigned 32-bit integer. */
  readonly seed: number;
  /** How many numbers have been drawn from the seed so far, counting any it started after. */
  readonly draws: number;
  /** Where it is now, as plain data to keep. */
  position(): StreamPosition;
};

function isPosition(seed: unknown, draws: unknown): boolean {
  return typeof seed === "number" && Number.isInteger(seed) && seed >= 0 && seed <= UINT32_MOST && typeof draws === "number" && Number.isSafeInteger(draws) && draws >= 0;
}

function checkPosition(seed: number, draws: number): void {
  if (!Number.isSafeInteger(seed)) throw new RangeError(`tane: a seed must be a whole number, not ${seed}`);
  if (!Number.isSafeInteger(draws) || draws < 0) throw new RangeError(`tane: draws must be a whole number from 0, not ${draws}`);
}

/**
 * The generator's state after `draws` numbers have been taken from `seed`: an
 * unsigned 32-bit integer. It is what `step` hands back as `state` after that
 * many steps, worked out in one go. `mulberry32(stateAt(seed, n))` carries on
 * from the n-th draw.
 */
export function stateAt(seed: number, draws = 0): number {
  checkPosition(seed, draws);
  // draws × GOLDEN modulo 2^32, without leaving whole numbers: the low and the high half of `draws` separately.
  const low = draws % 4_294_967_296;
  return ((seed >>> 0) + Math.imul(low, GOLDEN)) >>> 0;
}

/**
 * A stream that starts `draws` numbers into `seed`'s: `randomAt(42, 7)()` is
 * the eighth number of `mulberry32(42)`, reached without drawing the first
 * seven. Use it to pick a stream up from a stored position.
 */
export function randomAt(seed: number, draws = 0): Random {
  return mulberry32(stateAt(seed, draws));
}

/**
 * A seeded stream that counts its own draws, so that it can be written down
 * at any moment and picked up later: `const random = counted(42)`, draw from
 * it as from any stream, then keep `random.position()`. The numbers are those
 * of `mulberry32(seed)`, draw for draw.
 */
export function counted(seed: number, draws = 0): CountedRandom {
  const inner = randomAt(seed, draws);
  const start = seed >>> 0;
  let taken = draws;
  const random = (() => {
    taken += 1;
    return inner();
  }) as CountedRandom;
  Object.defineProperties(random, {
    seed: { value: start, enumerable: true },
    draws: { get: () => taken, enumerable: true },
    position: { value: (): StreamPosition => ({ seed: start, draws: taken }) },
  });
  return random;
}

/** A position as the object `toJSON` writes: the format, the seed, the draws and the state they come to. */
export function savedStream(position: StreamPosition): SavedStream {
  const seed = position.seed >>> 0;
  return { format: SAVE_FORMAT, generator: `tane ${VERSION}`, algorithm: "mulberry32", seed, draws: position.draws, state: stateAt(seed, position.draws) };
}

/** A position as JSON, two spaces deep, with the format's number first. `fromJSON` reads it back. */
export function toJSON(position: StreamPosition): string {
  return `${JSON.stringify(savedStream(position), null, 2)}\n`;
}

/**
 * A position from JSON that `toJSON` wrote. Nothing in it is trusted: the
 * seed and the draws must be whole numbers in range, the algorithm (when
 * named) must be mulberry32, and the state (when given) must be the one that
 * seed and those draws come to. Null when the text is not JSON, is not a
 * position, does not add up, or is of a later format than this version reads.
 */
export function fromJSON(text: string): StreamPosition | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  const { format, algorithm, seed, draws, state } = data as Record<string, unknown>;
  if (format !== undefined && (typeof format !== "number" || !Number.isInteger(format) || format < 1 || format > SAVE_FORMAT)) return null;
  if (algorithm !== undefined && algorithm !== "mulberry32") return null;
  const taken = draws === undefined ? 0 : draws;
  if (!isPosition(seed, taken)) return null;
  if (state !== undefined && state !== stateAt(seed as number, taken as number)) return null;
  return { seed: seed as number, draws: taken as number };
}

/** A position as one line to paste into a chat or a bug report: `tane:1:42:7` is format 1, seed 42, 7 draws in. */
export function toText(position: StreamPosition): string {
  checkPosition(position.seed, position.draws);
  return `tane:${SAVE_FORMAT}:${position.seed >>> 0}:${position.draws}`;
}

/** A position from a line `toText` wrote, with any space around it. Null for anything else, or for a later format. */
export function fromText(text: string): StreamPosition | null {
  const read = /^tane:(\d{1,3}):(\d{1,10}):(\d{1,16})$/.exec(text.trim());
  if (read === null) return null;
  const [format, seed, draws] = [Number(read[1]), Number(read[2]), Number(read[3])];
  if (format < 1 || format > SAVE_FORMAT || !isPosition(seed, draws)) return null;
  return { seed, draws };
}

/** The columns of the CSV, in order. */
export const CSV_COLUMNS = ["draw", "value", "state"] as const;

/** The most rows `toCSV` writes at once. */
export const MAX_CSV_ROWS = 100_000;

/**
 * The next `count` numbers from a position as CSV for a spreadsheet: a header,
 * then one row a draw, with the draw's number counted from 1, its value, and
 * the generator's state after it. Lines end CRLF, as RFC 4180 has it.
 */
export function toCSV(position: StreamPosition, count: number): string {
  if (!Number.isSafeInteger(count) || count < 0 || count > MAX_CSV_ROWS) throw new RangeError(`tane: toCSV writes 0 to ${MAX_CSV_ROWS} rows, not ${count}`);
  const random = randomAt(position.seed, position.draws);
  const rows = [CSV_COLUMNS.join(",")];
  for (let i = 1; i <= count; i += 1) rows.push(`${position.draws + i},${random()},${stateAt(position.seed, position.draws + i)}`);
  return `${rows.join("\r\n")}\r\n`;
}
