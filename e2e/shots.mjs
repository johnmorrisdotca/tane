// Pictures of the demo for a person to look at: `node e2e/shots.mjs <folder> <name>`. Not a test.
// The README's pictures are not made here: `pnpm screenshots:readme` takes them (scripts/readme-pictures.mjs).
import { join } from "node:path";
import process from "node:process";

import { chromium } from "@playwright/test";

import { NOW, serve } from "./demo.mjs";

const [folder = ".", name = "tane"] = process.argv.slice(2);
const browser = await chromium.launch();
async function shot({ width, height = 844, colorScheme, lang, path, fullPage = true }) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme, reducedMotion: "reduce", locale: "en-US", timezoneId: "America/Toronto", deviceScaleFactor: 2 });
  const page = await context.newPage();
  await serve(page);
  await page.clock.setFixedTime(NOW);
  await page.goto(`http://tane.test/?lang=${lang}&seed=table-7`);
  await page.locator('[data-testid="seed-number"]').waitFor();
  await page.screenshot({ path, fullPage, ...(path.endsWith(".jpg") ? { type: "jpeg", quality: 76 } : {}) });
  await context.close();
}
  for (const width of [390, 1280]) for (const colorScheme of ["light", "dark"]) for (const lang of ["en", "ja"]) await shot({ width, colorScheme, lang, path: join(folder, `${name}-${width}-${colorScheme}-${lang}.png`) });
await browser.close();
