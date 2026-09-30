// English and Japanese: the chooser, what is remembered, the browser's own language, and ?lang=.
import { expect, test } from "@playwright/test";

import { STRINGS } from "../dist/index.js";
import { at, open, sound, state, tap, type } from "./demo.mjs";

test("the chooser switches every word, and the device remembers", async ({ page }) => {
  const errors = await open(page, "?seed=table");
  let s = await sound(page, errors);
  expect(s.lang).toBe("en");
  expect(s.pitch).toBe(STRINGS.en.pagePitch);
  expect(s.unreviewed).toBe(false);

  await tap(page, '[data-lang="ja"]');
  s = await sound(page, errors);
  expect(s.lang).toBe("ja");
  expect(s.pitch).toBe(STRINGS.ja.pagePitch);
  expect(s.says).toBe("「table」はシード 115308040 です");
  expect(s.position).toBe("5 個引きました");
  expect(s.unreviewed).toBe(true);
  await expect(page.locator(at("seed"))).toHaveAttribute("placeholder", STRINGS.ja.pageSeedHint);
  await expect(page.locator(at("today"))).toHaveText(STRINGS.ja.pageUseToday);
  await expect(page.locator('[data-lang="ja"]')).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(page.locator(at("seed-number"))).not.toBeEmpty();
  expect((await sound(page, errors)).lang).toBe("ja");

  await tap(page, '[data-lang="en"]');
  s = await sound(page, errors);
  expect(s.lang).toBe("en");
  expect(s.says).toBe("“table” is seed 115308040");
  expect(s.unreviewed).toBe(false);
});

test("the address says which language, over what the device remembers", async ({ page }) => {
  const errors = await open(page, "?lang=ja&seed=42");
  let s = await sound(page, errors);
  expect(s.lang).toBe("ja");
  // The link keeps the language it was opened in.
  await type(page, at("seed"), "7");
  expect((await state(page)).address).toBe("?lang=ja&seed=7");
  await page.goto("http://tane.test/?lang=en&seed=42");
  await expect(page.locator(at("seed-number"))).toHaveText("42");
  s = await sound(page, errors);
  expect(s.lang).toBe("en");
});

test.describe("in a browser set to Japanese", () => {
  test.use({ locale: "ja-JP" });

  test("a first visit is in Japanese", async ({ page }) => {
    const errors = await open(page);
    const s = await sound(page, errors);
    expect(s.lang).toBe("ja");
    expect(s.pitch).toBe(STRINGS.ja.pagePitch);
    await tap(page, at("as-json"));
    await type(page, at("paste"), "nope");
    await tap(page, at("read"));
    expect((await sound(page, errors)).error).toBe(STRINGS.ja.pageReadBad);
  });
});

test("changing language moves nothing below the header", async ({ page }) => {
  const errors = await open(page, "?seed=42");
  const top = () => page.evaluate(() => Math.round(document.querySelector(".seed-box").getBoundingClientRect().top + window.scrollY));
  const english = await top();
  await tap(page, '[data-lang="ja"]');
  expect(await top()).toBe(english);
  await sound(page, errors);
});

test("every word on the page comes from the table: nothing is left empty in either language", async ({ page }) => {
  const errors = await open(page, "?seed=42");
  for (const lang of ["en", "ja"]) {
    await tap(page, `[data-lang="${lang}"]`);
    const empty = await page.evaluate(() => [...document.querySelectorAll("[data-say]")].filter((el) => el.textContent.trim() === "").map((el) => el.dataset.say));
    expect(empty, lang).toEqual([]);
    await sound(page, errors);
  }
});
