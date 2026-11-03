// Takes the pictures the README shows, from the built demo in `site/`: `pnpm screenshots:readme` (builds the demo, then runs this).
// The family's standard is in johnmorrisdotca/.github (README-STANDARD.md); the shared part is readme-pictures-lib.mjs.
// The page is served to a browser without a port and never fetched from the live site. The seed in the address is `table-7`,
// the page's clock is fixed at 2026-10-01 03:30 UTC (the same as the demo's own tests), and motion is reduced.
// Output: docs/images/<subject>-<desk|phone>-<light|dark>.webp.
import { takePictures } from "./readme-pictures-lib.mjs";

/** A clock that stands still at 2026-10-01 03:30 UTC, for the day's seed and the time left in it. */
const fixedClock = () => {
  const fixed = new Date("2026-10-01T03:30:00Z").getTime();
  const RealDate = Date;
  globalThis.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(fixed);
      else super(...args);
    }
    static now() {
      return fixed;
    }
  };
};

const ready = '[data-testid="seed-number"]:not(:empty)';
const url = (lang = "en") => `/?lang=${lang}&seed=table-7`;
const section = (id) => `section[aria-labelledby="${id}-title"]`;

/** One section of the page, cropped. */
const part = (subject, id, prepare) => ({
  subject,
  views: ["desk"],
  scale: 1,
  url: url(),
  init: fixedClock,
  ready,
  target: section(id),
  prepare,
});

await takePictures({
  shots: [
    // The seed explorer from the top of the page, on a desk and, in Japanese, on a phone.
    {
      subject: "hero",
      views: ["desk", "phone"],
      height: 900,
      url: url(),
      init: fixedClock,
      ready,
      async prepare(page, { view }) {
        if (view === "phone") {
          await page.goto(`http://tane.test${url("ja")}`);
          await page.waitForSelector(ready);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
      },
    },
    part("numbers", "numbers"),
    part("shuffle", "shuffle"),
    part("today-utc", "utc"),
    part("today-in-a-zone", "zone"),
    part("parts", "parts"),
    part("keep-as-json", "keep", async (page) => {
      await page.locator('[data-testid="as-json"]').click();
      await page.waitForFunction(() => document.querySelector('[data-testid="kept"]').textContent.includes('"format"'));
    }),
  ],
  // The family's thumbnail, dark thumbnail and icon (scripts/family-thumbnail.mjs): a field of seeds, each one placed,
  // turned, sized, coloured and given a sprout by mulberry32 from the seed `table-7`, drawn in the page from the built
  // library; the icon is nine of them from the same stream.
  thumbnail: {
    url: url(),
    init: fixedClock,
    ready,
    target: "#thumbnail-field",
    icon: { target: "#thumbnail-icon" },
    label: "Tane 種",
    async prepare(page, { scheme }) {
      await page.evaluate(async (scheme) => {
        const { chance, float, int, mulberry32, pick, seedFrom } = await import("./dist/index.js");
        // The family's felt, sage, rust, gold and teal; on the black cloth the felt is lifted so it does not sink.
        const COLOURS = [scheme === "dark" ? "#3f7a5f" : "#2f5d4a", "#6b9a6f", "#b5452c", "#e0b43b", "#3f7f8c"];
        // A seed: pointed at the top, round at the bottom, as the page's own icon draws it.
        const body = (s) =>
          `M0 ${-1.35 * s} C ${0.7 * s} ${-1.05 * s}, ${s} ${-0.25 * s}, ${s} ${0.3 * s} C ${s} ${0.95 * s}, ${0.55 * s} ${1.3 * s}, 0 ${1.3 * s} C ${-0.55 * s} ${1.3 * s}, ${-s} ${0.95 * s}, ${-s} ${0.3 * s} C ${-s} ${-0.25 * s}, ${-0.7 * s} ${-1.05 * s}, 0 ${-1.35 * s} Z`;
        const seed = (random, x, y, size) => {
          const fill = pick(random, COLOURS);
          const turn = int(random, -50, 50);
          const sprout = chance(random, 0.3)
            ? `<path d="M0 ${-size * 1.3} C 0 ${-size * 1.9}, ${size * 0.7} ${-size * 2.05}, ${size} ${-size * 1.85} C ${size * 0.85} ${-size * 1.45}, ${size * 0.45} ${-size * 1.3}, 0 ${-size * 1.3} Z" fill="#6b9a6f"/>`
            : "";
          return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${turn})"><path d="${body(size)}" fill="${fill}"/>${sprout}</g>`;
        };
        const field = (random, columns, rows, cell, small, large) => {
          const parts = [];
          for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
              const size = float(random, small, large);
              const x = cell * (column + 0.5) + float(random, -cell * 0.18, cell * 0.18);
              const y = cell * (row + 0.62) + float(random, -cell * 0.12, cell * 0.12);
              parts.push(seed(random, x, y, size));
            }
          }
          return `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * cell}" height="${rows * cell}" viewBox="0 0 ${columns * cell} ${rows * cell}">${parts.join("")}</svg>`;
        };
        const stage = `<div id="thumbnail-field" style="width:max-content;padding:8px">${field(mulberry32(seedFrom("table-7")), 14, 6, 80, 15, 25)}</div>`;
        const icon = `<div id="thumbnail-icon" style="width:max-content;padding:8px">${field(mulberry32(seedFrom("table-7")), 3, 3, 120, 30, 38)}</div>`;
        document.body.replaceChildren();
        document.body.insertAdjacentHTML("beforeend", stage + icon);
      }, scheme);
    },
  },
});
