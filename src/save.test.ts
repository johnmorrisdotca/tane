import { describe, expect, it } from "vitest";

import { shuffled } from "./draws.ts";
import { hashSeed, mulberry32, step } from "./random.ts";
import { CSV_COLUMNS, MAX_CSV_ROWS, SAVE_FORMAT, counted, fromJSON, fromText, randomAt, savedStream, stateAt, toCSV, toJSON, toText } from "./save.ts";
import { seedFrom } from "./seeds.ts";
import { VERSION } from "./version.ts";

const take = (random: () => number, count: number) => Array.from({ length: count }, () => random());

describe("stateAt and randomAt", () => {
  it("is the state step hands back after that many steps", () => {
    for (const seed of [0, 1, 42, 20260930, 2 ** 31 - 1, 2 ** 32 - 1]) {
      let state = seed;
      for (let draws = 0; draws <= 50; draws += 1) {
        expect(stateAt(seed, draws)).toBe(state >>> 0);
        state = step(state).state;
      }
    }
  });

  it("carries on from any draw, without drawing the ones before", () => {
    const all = take(mulberry32(42), 40);
    for (const draws of [0, 1, 7, 39]) expect(take(randomAt(42, draws), 40 - draws)).toEqual(all.slice(draws));
  });

  it("is right a long way in, where draws times the step is past 2^53", () => {
    const far = 5_000_000;
    const random = mulberry32(7);
    for (let i = 0; i < far; i += 1) random();
    expect(randomAt(7, far)()).toBe(random());
    // 2^32 draws bring the state back to the seed, and one more is one draw in.
    expect(stateAt(42, 2 ** 32)).toBe(42);
    expect(stateAt(42, 2 ** 32 + 1)).toBe(stateAt(42, 1));
    expect(stateAt(42, 2 ** 40 + 3)).toBe(stateAt(42, 3));
  });

  it("reads the seed as an unsigned 32-bit integer, as mulberry32 does", () => {
    expect(stateAt(-1)).toBe(2 ** 32 - 1);
    expect(stateAt(2 ** 32 + 7)).toBe(7);
  });

  it("refuses what is not a position", () => {
    expect(() => stateAt(1.5)).toThrow(RangeError);
    expect(() => stateAt(1, -1)).toThrow(RangeError);
    expect(() => randomAt(1, 0.5)).toThrow(RangeError);
    expect(() => stateAt(Number.NaN)).toThrow(RangeError);
  });
});

describe("counted", () => {
  it("draws mulberry32's numbers and counts them", () => {
    const random = counted(42);
    expect(random.seed).toBe(42);
    expect(random.draws).toBe(0);
    expect(take(random, 5)).toEqual(take(mulberry32(42), 5));
    expect(random.draws).toBe(5);
    expect(random.position()).toEqual({ seed: 42, draws: 5 });
  });

  it("is a Random: a shuffle takes one draw for each item but the first", () => {
    const random = counted(42);
    expect(shuffled(random, [1, 2, 3, 4, 5])).toEqual(shuffled(mulberry32(42), [1, 2, 3, 4, 5]));
    expect(random.draws).toBe(4);
  });

  it("picks up where a kept position left off", () => {
    const first = counted(20260930);
    take(first, 3);
    const kept = first.position();
    const second = counted(kept.seed, kept.draws);
    expect(second()).toBe(first());
    expect(second.draws).toBe(4);
  });
});

describe("JSON", () => {
  it("writes the format first, and what wrote it", () => {
    expect(toJSON({ seed: 42, draws: 7 })).toBe(`{\n  "format": 1,\n  "generator": "tane ${VERSION}",\n  "algorithm": "mulberry32",\n  "seed": 42,\n  "draws": 7,\n  "state": ${stateAt(42, 7)}\n}\n`);
    expect(savedStream({ seed: 42, draws: 7 }).format).toBe(SAVE_FORMAT);
  });

  it("reads back what it wrote", () => {
    for (const position of [{ seed: 0, draws: 0 }, { seed: 42, draws: 7 }, { seed: 2 ** 32 - 1, draws: 123_456_789_012 }, { seed: 20260930, draws: 1 }]) {
      expect(fromJSON(toJSON(position))).toEqual(position);
    }
  });

  it("reads a seed alone as a stream nothing has been drawn from", () => {
    expect(fromJSON('{"seed": 42}')).toEqual({ seed: 42, draws: 0 });
  });

  it("trusts nothing: a state that does not add up is refused", () => {
    const saved = savedStream({ seed: 42, draws: 7 });
    expect(fromJSON(JSON.stringify({ ...saved, state: saved.state + 1 }))).toBeNull();
    expect(fromJSON(JSON.stringify({ ...saved, draws: 8 }))).toBeNull();
    expect(fromJSON(JSON.stringify({ ...saved, seed: 43 }))).toBeNull();
  });

  it("refuses what is not a position", () => {
    for (const text of ["", "not json", "null", "[]", "42", '"tane"', "{}", '{"seed":"42"}', '{"seed":1.5}', '{"seed":-1}', `{"seed":${2 ** 32}}`, '{"seed":1,"draws":-1}', '{"seed":1,"draws":1.5}', '{"seed":1,"draws":"2"}', '{"seed":1,"algorithm":"sfc32"}', '{"seed":1,"state":"x"}']) {
      expect(fromJSON(text), text).toBeNull();
    }
  });

  it("refuses a later format, and a format that is not a number", () => {
    expect(fromJSON('{"format":2,"seed":1}')).toBeNull();
    expect(fromJSON('{"format":"1","seed":1}')).toBeNull();
    expect(fromJSON('{"format":0,"seed":1}')).toBeNull();
    expect(fromJSON('{"format":1,"seed":1}')).toEqual({ seed: 1, draws: 0 });
  });
});

describe("text", () => {
  it("is one line: the format, the seed, the draws", () => {
    expect(toText({ seed: 42, draws: 7 })).toBe("tane:1:42:7");
    expect(toText({ seed: -1, draws: 0 })).toBe("tane:1:4294967295:0");
  });

  it("reads back what it wrote, with space around it", () => {
    for (const position of [{ seed: 0, draws: 0 }, { seed: 42, draws: 7 }, { seed: 2 ** 32 - 1, draws: 9_007_199_254_740_991 }]) {
      expect(fromText(`  ${toText(position)}\n`)).toEqual(position);
    }
  });

  it("refuses anything else", () => {
    for (const text of ["", "42", "tane:1:42", "tane:2:42:7", "tane:0:42:7", "tane:1:-1:0", "tane:1:4294967296:0", "tane:1:42:9007199254740992", "tane:1:42:7:1", "seed:1:42:7", "tane:1:4.2:7", "tane:1:42:7 extra"]) {
      expect(fromText(text), text).toBeNull();
    }
  });

  it("refuses a position that is not one", () => {
    expect(() => toText({ seed: 1.5, draws: 0 })).toThrow(RangeError);
    expect(() => toText({ seed: 1, draws: -1 })).toThrow(RangeError);
  });
});

describe("CSV", () => {
  it("is a header and a row a draw, ended CRLF", () => {
    expect(CSV_COLUMNS).toEqual(["draw", "value", "state"]);
    expect(toCSV({ seed: 42, draws: 0 }, 2)).toBe("draw,value,state\r\n1,0.6011037519201636,1831565855\r\n2,0.44829055899754167,3663131668\r\n");
    expect(toCSV({ seed: 42, draws: 0 }, 0)).toBe("draw,value,state\r\n");
  });

  it("counts on from the position, and every row is the stream's", () => {
    const rows = toCSV({ seed: 42, draws: 3 }, 4).trimEnd().split("\r\n").slice(1).map((row) => row.split(",").map(Number));
    const all = take(mulberry32(42), 7);
    expect(rows.map((row) => row[0])).toEqual([4, 5, 6, 7]);
    expect(rows.map((row) => row[1])).toEqual(all.slice(3));
    expect(rows.map((row) => row[2])).toEqual([4, 5, 6, 7].map((draws) => stateAt(42, draws)));
  });

  it("writes no more than it says", () => {
    expect(() => toCSV({ seed: 1, draws: 0 }, MAX_CSV_ROWS + 1)).toThrow(RangeError);
    expect(() => toCSV({ seed: 1, draws: 0 }, -1)).toThrow(RangeError);
    expect(() => toCSV({ seed: 1, draws: 0 }, 1.5)).toThrow(RangeError);
  });
});

describe("seedFrom", () => {
  it("takes a whole number as itself, as a number or as its digits", () => {
    expect(seedFrom(42)).toBe(42);
    expect(seedFrom("42")).toBe(42);
    expect(seedFrom(" 20260930 ")).toBe(20260930);
    expect(seedFrom("0")).toBe(0);
    expect(seedFrom("4294967295")).toBe(4294967295);
    expect(seedFrom(-1)).toBe(4294967295);
  });

  it("hashes any other text", () => {
    expect(seedFrom("table")).toBe(115308040);
    expect(seedFrom("table")).toBe(hashSeed("table"));
    expect(seedFrom("room-7")).toBe(seedFrom(" room-7 "));
    expect(seedFrom("4294967296")).not.toBe(4294967296);
    expect(seedFrom("-1")).not.toBe(4294967295);
    expect(seedFrom("1.5")).toBeGreaterThanOrEqual(0);
    expect(seedFrom("種")).toBe(seedFrom("種"));
    expect(Number.isInteger(seedFrom(""))).toBe(true);
  });

  it("gives a seed mulberry32 reads as it is", () => {
    for (const input of ["table", "42", "", "種", "a b c"]) {
      const seed = seedFrom(input);
      expect(seed).toBe(seed >>> 0);
    }
  });

  it("refuses a number that is not whole", () => {
    expect(() => seedFrom(1.5)).toThrow(RangeError);
    expect(() => seedFrom(Number.NaN)).toThrow(RangeError);
  });
});
