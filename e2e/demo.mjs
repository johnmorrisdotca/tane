// What every demo test starts from: the built demo in `site/`, served to the
// page without a port, with the clock set, and the explorer's state read off the page.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const site = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };

/** The moment every test runs at: 1 October 2026 in UTC, still 30 September in Toronto. */
export const NOW = new Date("2026-10-01T03:30:00Z");

/** Serve `site/` to a page at http://tane.test/. */
export async function serve(page) {
  if (!existsSync(join(site, "index.html"))) throw new Error("site/ is not built: run `pnpm site` first (`pnpm test:demo` does)");
  await page.route("http://tane.test/**", (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(site, pathname === "/" ? "index.html" : pathname);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ body: readFileSync(file), contentType: TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream" });
  });
}

/** Open the demo with a query, and collect anything the page complains of. */
export async function open(page, query = "") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.clock.setFixedTime(NOW);
  await page.goto(`http://tane.test/${query}`);
  await expect(page.locator('[data-testid="seed-number"]')).not.toBeEmpty();
  return errors;
}

export const at = (id) => `[data-testid="${id}"]`;

/** Tap, as a finger would where the page is touched and as a mouse where it is not. */
export async function tap(page, selector) {
  const target = page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();
  if (test.info().project.use.hasTouch === true) await target.tap();
  else await target.click();
}

/** Type into a field as a person does: tap it, clear it, type. */
export async function type(page, selector, text) {
  await tap(page, selector);
  await page.locator(selector).fill(text);
}

/** The explorer as the page shows it. */
export function state(page) {
  return page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const all = (s) => [...document.querySelectorAll(s)];
    const box = (e) => e.getBoundingClientRect();
    const text = (id) => q(`[data-testid="${id}"]`).textContent;
    return {
      lang: document.documentElement.lang,
      typed: q('[data-testid="seed"]').value,
      seed: Number(text("seed-number")),
      says: text("seed-says"),
      rows: all('[data-testid="numbers"] tbody tr').map((row) => [...row.children].map((c) => Number(c.textContent))),
      position: text("position"),
      shuffled: all('[data-testid="shuffled"] li').map((li) => li.textContent),
      picked: text("picked"),
      dice: all('[data-testid="dice"] .die').map((die) => Number(die.textContent)),
      utc: Number(text("utc-seed")),
      utcLeft: text("utc-left"),
      here: Number(text("zone-seed")),
      kept: text("kept"),
      error: text("read-error"),
      pitch: q('[data-say="pitch"]').textContent,
      unreviewed: !q("#unreviewed").hidden,
      address: location.search,
      pageWidth: document.documentElement.scrollWidth,
      windowWidth: window.innerWidth,
      // Anything to be tapped that is smaller than a fingertip. Links in running text are words, not targets.
      small: all("main button, main input, main summary, nav a, footer .family a")
        .filter((e) => box(e).width > 0 && !e.hidden && (box(e).height < 43.5 || box(e).width < 43.5))
        .map((e) => `${e.dataset.testid ?? e.textContent}: ${Math.round(box(e).width)}×${Math.round(box(e).height)}`),
      // Anything that pokes out of the page sideways.
      wide: all("main *")
        .filter((e) => box(e).width > 0 && box(e).right > window.innerWidth + 0.5 && !e.closest(".fam-table-box, pre"))
        .map((e) => `${e.tagName} ${e.className}`),
    };
  });
}

/** What holds in every state the page can be in: nothing wider than the screen, nothing too small to tap, nothing complained of. */
export async function sound(page, errors) {
  const s = await state(page);
  expect(s.pageWidth, "the page is no wider than the window").toBe(s.windowWidth);
  expect(s.wide, "nothing pokes out sideways").toEqual([]);
  expect(s.small, "every target is at least 44px").toEqual([]);
  expect(errors, "the page complained of nothing").toEqual([]);
  return s;
}
