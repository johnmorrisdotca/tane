// The seed explorer, used as a person uses it: type a seed, read its numbers, shuffle a list,
// take today's seed, copy a link and open it, keep a position and read it back.
import { expect, test } from "@playwright/test";

import { dailySeed, deriveSeed, hashSeed, int, mulberry32, pick, randomAt, shuffled, stateAt, toCSV, toJSON } from "../dist/index.js";
import { NOW, at, open, sound, state, tap, type } from "./demo.mjs";

const NAMES = ["Ada", "Grace", "Alan", "Edsger", "Barbara", "Donald"];
const first = (seed, count) => {
  const random = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => [i + 1, random(), stateAt(seed, i + 1)]);
};

test("a first visit shows today's seed, worldwide and where you are", async ({ page }) => {
  const errors = await open(page);
  const s = await sound(page, errors);
  expect(s.utc).toBe(20261001);
  expect(s.here).toBe(20260930);
  expect(s.utcLeft).toBe("20:30:00");
  expect(s.seed).toBe(dailySeed(NOW));
  expect(s.typed).toBe("20261001");
  expect(s.says).toBe("Seed 20261001");
  expect(s.rows).toEqual(first(20261001, 5));
  expect(s.shuffled).toEqual(shuffled(mulberry32(20261001), NAMES));
  expect(s.address).toBe("?seed=20261001");
});

test("type a seed in words: its number, its first numbers, its shuffle and its dice follow", async ({ page }) => {
  const errors = await open(page);
  await type(page, at("seed"), "table-7");
  const seed = hashSeed("table-7");
  const s = await sound(page, errors);
  expect(s.seed).toBe(seed);
  expect(s.says).toBe(`“table-7” is seed ${seed}`);
  expect(s.rows).toEqual(first(seed, 5));
  expect(s.shuffled).toEqual(shuffled(mulberry32(seed), NAMES));
  expect(s.picked).toBe(`One picked: ${pick(mulberry32(seed), NAMES)}`);
  const dice = mulberry32(deriveSeed(seed, "dice"));
  expect(s.dice).toEqual(Array.from({ length: 8 }, () => int(dice, 1, 6)));
  expect(s.address).toBe("?seed=table-7");
});

test("a whole number is its own seed, and ten more numbers are a tap away", async ({ page }) => {
  const errors = await open(page, "?seed=42");
  expect((await state(page)).rows[0][1]).toBe(0.6011037519201636);
  await tap(page, at("more"));
  const s = await sound(page, errors);
  expect(s.rows).toEqual(first(42, 15));
  expect(s.position).toBe("15 drawn");
  expect(s.address).toBe("?seed=42&draws=15");
});

test("a list of your own is shuffled by the seed", async ({ page }) => {
  const errors = await open(page, "?seed=42");
  await type(page, at("items"), "a, b c");
  const s = await sound(page, errors);
  expect(s.shuffled).toEqual(shuffled(mulberry32(42), ["a", "b", "c"]));
  expect(s.shuffled).toEqual(["c", "a", "b"]);
  expect(s.address).toBe("?seed=42&items=a%2C+b+c");
  await type(page, at("items"), "");
  expect((await sound(page, errors)).shuffled).toEqual([]);
});

test("today's seed and a new seed are one tap each", async ({ page }) => {
  const errors = await open(page, "?seed=42");
  await tap(page, at("today"));
  expect((await sound(page, errors)).seed).toBe(20261001);
  await tap(page, at("fresh"));
  const s = await sound(page, errors);
  expect(s.seed).not.toBe(20261001);
  expect(s.seed >= 1 && s.seed <= 2 ** 31 - 1).toBe(true);
  expect(s.rows).toEqual(first(s.seed, 5));
  expect(s.address).toBe(`?seed=${s.seed}`);
});

test("the link replays the page: whoever opens it sees the same", async ({ page, context }) => {
  const errors = await open(page);
  await type(page, at("seed"), "room 7");
  await type(page, at("items"), "red green blue");
  await tap(page, at("more"));
  await tap(page, at("share"));
  const before = await sound(page, errors);
  const link = await page.evaluate(() => location.href);
  const other = await context.newPage();
  const otherErrors = await open(other, new URL(link).search);
  const after = await sound(other, otherErrors);
  for (const key of ["typed", "seed", "rows", "shuffled", "picked", "dice", "kept"]) expect(after[key], key).toEqual(before[key]);
  expect(after.seed).toBe(hashSeed("room 7"));
});

test("copy link says so, and then says its name again", async ({ page }) => {
  const errors = await open(page, "?seed=42");
  await page.clock.install({ time: NOW });
  await tap(page, at("share"));
  // Copied where the browser lends its clipboard; where it does not, the address bar is named instead.
  await expect(page.locator(at("share"))).toHaveText(/^(Copied|Copy the address bar)$/);
  await page.clock.runFor(2000);
  await expect(page.locator(at("share"))).toHaveText("Copy link");
  await tap(page, at("copy"));
  await expect(page.locator(at("copy"))).toHaveText(/^(Copied|Copy the address bar)$/);
  await page.clock.runFor(2000);
  await expect(page.locator(at("copy"))).toHaveText("Copy");
  await sound(page, errors);
});

test("a position is kept three ways, and read back", async ({ page }) => {
  const errors = await open(page, "?seed=42");
  expect((await state(page)).kept).toBe("tane:1:42:5");
  await tap(page, at("as-json"));
  expect((await sound(page, errors)).kept).toBe(toJSON({ seed: 42, draws: 5 }));
  await tap(page, at("as-csv"));
  expect((await sound(page, errors)).kept).toBe(toCSV({ seed: 42, draws: 0 }, 5).replaceAll("\r\n", "\n"));
  await tap(page, at("as-text"));

  await type(page, at("paste"), "tane:1:7:12");
  await tap(page, at("read"));
  let s = await sound(page, errors);
  expect(s.seed).toBe(7);
  expect(s.rows).toEqual(first(7, 12));
  expect(s.kept).toBe("tane:1:7:12");
  expect(s.error).toBe("");

  await type(page, at("paste"), toJSON({ seed: 99, draws: 3 }).replaceAll("\n", " "));
  await page.locator(at("paste")).press("Enter");
  s = await sound(page, errors);
  expect(s.seed).toBe(99);
  expect(s.rows).toEqual(first(99, 3));
});

test("a position far into a stream shows its last ten draws", async ({ page }) => {
  const errors = await open(page, "?seed=42");
  await type(page, at("paste"), "tane:1:42:5000000");
  await tap(page, at("read"));
  const s = await sound(page, errors);
  expect(s.rows).toHaveLength(10);
  expect(s.rows[9][0]).toBe(5_000_000);
  expect(s.rows[9][1]).toBe(randomAt(42, 4_999_999)());
  expect(s.rows[9][2]).toBe(stateAt(42, 5_000_000));
  expect(s.kept).toBe("tane:1:42:5000000");
});

test("what is not a position is refused, in words", async ({ page }) => {
  const errors = await open(page, "?seed=42");
  for (const text of ["hello", "tane:2:42:7", '{"seed":42,"draws":7,"state":1}']) {
    await type(page, at("paste"), text);
    await tap(page, at("read"));
    const s = await sound(page, errors);
    expect(s.error, text).toBe("That is not a position Tane wrote.");
    expect(s.seed).toBe(42);
  }
});
