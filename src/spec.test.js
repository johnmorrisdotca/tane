// The specification's test vectors: made from the code, written into
// docs/spec-vectors.json and docs/spec.md by `pnpm docs:make`, and held to the
// code here. The vectors already written down are also checked one by one
// against a second implementation in this file, written from the words of the
// specification and sharing no code with the package.
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

import { describe, expect, it } from "vitest";

import { dailySeed, dayKey } from "./daily.ts";
import { below, distinctBelow, int, sample, shuffled, weightedIndex } from "./draws.ts";
import { deriveSeed, fork, hashSeed, mulberry32, step } from "./random.ts";
import { fromText, stateAt, toText } from "./save.ts";
import { drawSeed, seedFrom } from "./seeds.ts";

const TWO_32 = 4294967296;
const take = (random, count) => Array.from({ length: count }, () => random());
const range = (n) => Array.from({ length: n }, (_, i) => i);
const units = (text) => Array.from({ length: text.length }, (_, i) => text.charCodeAt(i));

const SEEDS = [0, 1, 42, 20260930, 2147483647, 4294967295];
const TEXTS = ["", "a", "b", "table", "room-7", "2026-09-30", "種", "🎲"];
const DAILY = { from: 1_000_000_000, size: 100_000_000 };

/** Every vector, from the package's own code. */
function vectors() {
  return {
    spec: "tane",
    format: 1,
    note: "Made from the code by `pnpm docs:make`; see docs/spec.md. `integers` are the draws before the division by 2^32.",
    mulberry32: SEEDS.map((seed) => {
      const numbers = take(mulberry32(seed), 5);
      return { seed, integers: numbers.map((n) => n * TWO_32), numbers, states: range(5).map((i) => stateAt(seed, i + 1)) };
    }),
    hashSeed: TEXTS.map((text) => ({ text, codeUnits: units(text), seed: hashSeed(text) })),
    deriveSeed: [
      { seed: 42, labels: [], derived: deriveSeed(42) },
      { seed: 42, labels: ["deck"], derived: deriveSeed(42, "deck") },
      { seed: 42, labels: ["dice"], derived: deriveSeed(42, "dice") },
      { seed: 42, labels: ["round", 3], derived: deriveSeed(42, "round", 3) },
      { seed: 42, labels: ["round", "3"], derived: deriveSeed(42, "round", "3") },
      { seed: 0, labels: ["deck"], derived: deriveSeed(0, "deck") },
    ],
    fork: [42, 20260930].map((seed) => {
      const parent = mulberry32(seed);
      const child = fork(parent);
      return { seed, child: take(child, 3), parentNext: parent() };
    }),
    seedFrom: ["42", " 42 ", "0", "4294967295", "4294967296", "table", "-1"].map((input) => ({ input, seed: seedFrom(input) })),
    below: [{ seed: 42, n: 6, values: ((r) => range(8).map(() => below(r, 6)))(mulberry32(42)) }],
    int: [
      { seed: 42, min: 1, max: 6, values: ((r) => range(8).map(() => int(r, 1, 6)))(mulberry32(42)) },
      { seed: 1, min: -3, max: 3, values: ((r) => range(8).map(() => int(r, -3, 3)))(mulberry32(1)) },
    ],
    shuffle: [
      { seed: 42, items: range(10), shuffled: shuffled(mulberry32(42), range(10)) },
      { seed: 1, items: range(10), shuffled: shuffled(mulberry32(1), range(10)) },
      { seed: 20260930, items: range(52), shuffled: shuffled(mulberry32(20260930), range(52)) },
      { seed: 42, items: [0], shuffled: shuffled(mulberry32(42), [0]) },
    ],
    sample: [
      { seed: 42, items: range(10), count: 4, sampled: sample(mulberry32(42), range(10), 4) },
      { seed: 42, items: range(3), count: 5, sampled: sample(mulberry32(42), range(3), 5) },
    ],
    distinctBelow: [
      { seed: 42, count: 5, limit: 10, drawn: distinctBelow(mulberry32(42), 5, 10) },
      { seed: 1, count: 8, limit: 8, drawn: distinctBelow(mulberry32(1), 8, 8) },
      { seed: 20260930, count: 4, limit: 225, drawn: distinctBelow(mulberry32(20260930), 4, 225) },
    ],
    weightedIndex: [{ seed: 42, weights: [1, 2, 3, 4], values: ((r) => range(8).map(() => weightedIndex(r, [1, 2, 3, 4])))(mulberry32(42)) }],
    drawSeed: [
      { seed: 42, reserved: [], drawn: drawSeed(mulberry32(42)) },
      { seed: 42, reserved: [DAILY], drawn: drawSeed(mulberry32(42), { reserved: [DAILY] }) },
    ],
    dailySeed: [
      ["2026-09-30T12:00:00Z", "UTC"],
      ["2026-10-01T03:30:00Z", "UTC"],
      ["2026-10-01T03:30:00Z", "America/Toronto"],
      ["2026-12-31T15:00:00Z", "Asia/Tokyo"],
      ["2024-02-29T23:59:59Z", "UTC"],
    ].map(([at, zone]) => ({ at, zone, day: dayKey(new Date(at), zone), seed: dailySeed(new Date(at), zone) })),
    position: [
      { seed: 42, draws: 7, text: toText({ seed: 42, draws: 7 }), state: stateAt(42, 7) },
      { seed: 4294967295, draws: 0, text: toText({ seed: 4294967295, draws: 0 }), state: stateAt(4294967295, 0) },
    ],
  };
}

const list = (values) => values.join(", ");
const code = (value) => `\`${value}\``;

/** The vectors as the tables docs/spec.md shows. */
function tables(v) {
  return [
    "### mulberry32",
    "",
    "The first five draws of each seed, as integers before the division by 2³².",
    "",
    "| Seed | Draws, as integers |",
    "| --- | --- |",
    ...v.mulberry32.map((row) => `| ${row.seed} | ${list(row.integers)} |`),
    "",
    "The same draws as the numbers handed back, and the state after each.",
    "",
    "| Seed | Numbers | States |",
    "| --- | --- | --- |",
    ...v.mulberry32.map((row) => `| ${row.seed} | ${list(row.numbers)} | ${list(row.states)} |`),
    "",
    "### hashSeed",
    "",
    "| Text | UTF-16 code units | Seed |",
    "| --- | --- | --- |",
    ...v.hashSeed.map((row) => `| ${row.text === "" ? "(empty)" : code(row.text)} | ${row.codeUnits.length === 0 ? "none" : list(row.codeUnits)} | ${row.seed} |`),
    "",
    "### deriveSeed",
    "",
    "| Seed | Labels | Derived |",
    "| --- | --- | --- |",
    ...v.deriveSeed.map((row) => `| ${row.seed} | ${row.labels.length === 0 ? "none" : row.labels.map((label) => code(JSON.stringify(label))).join(", ")} | ${row.derived} |`),
    "",
    "### fork",
    "",
    "| Seed of the parent | The child's first three numbers | The parent's next number |",
    "| --- | --- | --- |",
    ...v.fork.map((row) => `| ${row.seed} | ${list(row.child)} | ${row.parentNext} |`),
    "",
    "### seedFrom",
    "",
    "| Input | Seed |",
    "| --- | --- |",
    ...v.seedFrom.map((row) => `| ${code(JSON.stringify(row.input))} | ${row.seed} |`),
    "",
    "### below and int",
    "",
    "Eight draws each.",
    "",
    "| Seed | Call | Values |",
    "| --- | --- | --- |",
    ...v.below.map((row) => `| ${row.seed} | \`below(${row.n})\` | ${list(row.values)} |`),
    ...v.int.map((row) => `| ${row.seed} | \`int(${row.min}, ${row.max})\` | ${list(row.values)} |`),
    "",
    "### shuffle",
    "",
    "The items are the whole numbers from 0 in order.",
    "",
    "| Seed | Items | Shuffled |",
    "| --- | --- | --- |",
    ...v.shuffle.map((row) => `| ${row.seed} | 0 to ${row.items.length - 1} | ${list(row.shuffled)} |`),
    "",
    "### sample",
    "",
    "| Seed | Items | Count | Sampled |",
    "| --- | --- | --- | --- |",
    ...v.sample.map((row) => `| ${row.seed} | 0 to ${row.items.length - 1} | ${row.count} | ${list(row.sampled)} |`),
    "",
    "### distinctBelow",
    "",
    "| Seed | Count | Limit | Drawn |",
    "| --- | --- | --- | --- |",
    ...v.distinctBelow.map((row) => `| ${row.seed} | ${row.count} | ${row.limit} | ${list(row.drawn)} |`),
    "",
    "### weightedIndex",
    "",
    "Eight draws.",
    "",
    "| Seed | Weights | Values |",
    "| --- | --- | --- |",
    ...v.weightedIndex.map((row) => `| ${row.seed} | ${list(row.weights)} | ${list(row.values)} |`),
    "",
    "### drawSeed",
    "",
    "| Seed of the stream | Reserved | Drawn |",
    "| --- | --- | --- |",
    ...v.drawSeed.map((row) => `| ${row.seed} | ${row.reserved.length === 0 ? "nothing" : row.reserved.map((b) => `${b.size} from ${b.from}`).join("; ")} | ${row.drawn} |`),
    "",
    "### dailySeed",
    "",
    "| The moment | Zone | Day | Seed |",
    "| --- | --- | --- | --- |",
    ...v.dailySeed.map((row) => `| ${row.at} | ${row.zone} | ${row.day} | ${row.seed} |`),
    "",
    "### A position",
    "",
    "| Seed | Draws | As text | State |",
    "| --- | --- | --- | --- |",
    ...v.position.map((row) => `| ${row.seed} | ${row.draws} | ${code(row.text)} | ${row.state} |`),
  ].join("\n");
}

// A second implementation, from the words of docs/spec.md. BigInt throughout, so that it shares not even the arithmetic.
const M = 1n << 32n;
const u32 = (x) => ((x % M) + M) % M;
function specDraw(state) {
  const next = u32(state + 0x6d2b79f5n);
  let t = next;
  t = u32((t ^ (t >> 15n)) * (t | 1n));
  t = t ^ u32(t + u32((t ^ (t >> 7n)) * (t | 61n)));
  return { out: t ^ (t >> 14n), state: next };
}
function specStream(seed) {
  let state = u32(BigInt(seed));
  return () => {
    const drawn = specDraw(state);
    state = drawn.state;
    return Number(drawn.out) / TWO_32;
  };
}
function specMix(h) {
  h ^= h >> 16n;
  h = u32(h * 0x85ebca6bn);
  h ^= h >> 13n;
  h = u32(h * 0xc2b2ae35n);
  return h ^ (h >> 16n);
}
function specHash(text) {
  let h = 0x811c9dc5n;
  for (const c of units(text)) h = u32((h ^ BigInt(c)) * 0x01000193n);
  return specMix(h);
}
function specDerive(seed, labels) {
  let h = specMix(u32(BigInt(seed)));
  for (const label of labels) h = specMix(u32((h ^ specHash(typeof label === "number" ? `#${label}` : label)) + 0x9e3779b9n));
  return Number(h);
}
function specShuffle(random, items) {
  const out = [...items];
  for (let i = out.length - 1; i >= 1; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const written = JSON.parse(readFileSync("docs/spec-vectors.json", "utf8"));

describe("the specification's vectors", () => {
  const made = vectors();

  it("are what the code makes: run `pnpm docs:make` if the list of vectors changed (the numbers never do)", () => {
    const json = `${JSON.stringify(made, null, 2)}\n`;
    const spec = readFileSync("docs/spec.md", "utf8");
    const [before, rest] = spec.split("<!-- vectors:start -->");
    const after = rest.split("<!-- vectors:end -->")[1];
    const doc = `${before}<!-- vectors:start -->\n${tables(made)}\n<!-- vectors:end -->${after}`;
    if (process.env.UPDATE_DOCS === "1") {
      writeFileSync("docs/spec-vectors.json", json);
      writeFileSync("docs/spec.md", doc);
    }
    expect(readFileSync("docs/spec-vectors.json", "utf8")).toBe(json);
    expect(readFileSync("docs/spec.md", "utf8")).toBe(doc);
  });

  it("the golden values the tests have always pinned are among them", () => {
    expect(made.mulberry32.find((row) => row.seed === 42).numbers).toEqual([0.6011037519201636, 0.44829055899754167, 0.8524657934904099, 0.6697340414393693, 0.17481389874592423]);
    expect(made.mulberry32.find((row) => row.seed === 1).numbers[0]).toBe(0.6270739405881613);
  });

  it("the integers are whole, and the states are what step hands back", () => {
    for (const row of made.mulberry32) {
      let state = row.seed;
      row.integers.forEach((integer, i) => {
        expect(Number.isInteger(integer) && integer >= 0 && integer < TWO_32).toBe(true);
        const stepped = step(state);
        expect(stepped.value).toBe(row.numbers[i]);
        expect(stepped.state).toBe(row.states[i]);
        state = stepped.state;
      });
    }
  });
});

describe("a second implementation, written from the specification's words", () => {
  it("draws the same integers, numbers and states", () => {
    for (const row of written.mulberry32) {
      let state = u32(BigInt(row.seed));
      row.integers.forEach((integer, i) => {
        const drawn = specDraw(state);
        expect(Number(drawn.out)).toBe(integer);
        expect(Number(drawn.out) / TWO_32).toBe(row.numbers[i]);
        expect(Number(drawn.state)).toBe(row.states[i]);
        state = drawn.state;
      });
    }
  });

  it("agrees with the package over ten thousand draws of a thousand seeds' first ten", () => {
    const [mine, theirs] = [specStream(20260930), mulberry32(20260930)];
    for (let i = 0; i < 10_000; i += 1) expect(mine()).toBe(theirs());
    for (let seed = -500; seed < 500; seed += 1) expect(take(specStream(seed), 10)).toEqual(take(mulberry32(seed), 10));
  });

  it("hashes text and derives seeds the same", () => {
    for (const row of written.hashSeed) expect(Number(specHash(row.text)), row.text).toBe(row.seed);
    for (const row of written.deriveSeed) expect(specDerive(row.seed, row.labels)).toBe(row.derived);
    for (const text of ["The quick brown fox", "日本語のシード", "a\u0000b", "😀😀"]) expect(Number(specHash(text))).toBe(hashSeed(text));
  });

  it("shuffles and draws distinct numbers the same", () => {
    for (const row of written.shuffle) expect(specShuffle(specStream(row.seed), row.items)).toEqual(row.shuffled);
    for (const row of written.distinctBelow) {
      const random = specStream(row.seed);
      const drawn = [];
      while (drawn.length < Math.min(row.count, row.limit)) {
        const c = Math.floor(random() * row.limit);
        if (!drawn.includes(c)) drawn.push(c);
      }
      expect(drawn).toEqual(row.drawn);
    }
  });

  it("forks, draws a seed and reads a position the same", () => {
    for (const row of written.fork) {
      const parent = specStream(row.seed);
      const child = specStream(specMix(BigInt(Math.floor(parent() * TWO_32))));
      expect(take(child, 3)).toEqual(row.child);
      expect(parent()).toBe(row.parentNext);
    }
    for (const row of written.drawSeed) {
      const kept = row.reserved.reduce((sum, block) => sum + block.size, 0);
      let seed = Math.floor(specStream(row.seed)() * (2147483647 - kept)) + 1;
      for (const block of row.reserved) if (seed >= block.from) seed += block.size;
      expect(seed).toBe(row.drawn);
    }
    for (const row of written.position) {
      expect(fromText(row.text)).toEqual({ seed: row.seed, draws: row.draws });
      expect(Number(u32(BigInt(row.seed) + BigInt(row.draws) * 0x6d2b79f5n))).toBe(row.state);
    }
  });

  it("the state the specification quotes for seed 42, seven draws in, is right", () => {
    expect(readFileSync("docs/spec.md", "utf8")).toContain(`"draws": 7, "state": ${stateAt(42, 7)} }`);
  });
});
