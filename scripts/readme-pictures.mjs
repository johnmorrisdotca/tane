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
const part = (subject, id, prepare) => ({ subject, views: ["desk"], scale: 1, url: url(), init: fixedClock, ready, target: section(id), prepare });

await takePictures({
  shots: [
    // The seed explorer from the top of the page, on a desk and, in Japanese, on a phone.
    { subject: "hero", views: ["desk", "phone"], height: 900, url: url(), init: fixedClock, ready, async prepare(page, { view }) {
      if (view === "phone") {
        await page.goto(`http://tane.test${url("ja")}`);
        await page.waitForSelector(ready);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
    } },
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
});
