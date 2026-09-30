// Builds the static demo for GitHub Pages into ./site: the page, put together from the family's
// shared header and footer and this package's own body, its two stylesheets, and the compiled library.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";

const id = "tane";
const icon = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cellipse cx='50' cy='58' rx='26' ry='34' fill='%232f5d4a'/%3E%3Cpath d='M50 26 C 50 10, 66 6, 74 10 C 70 20, 60 26, 50 26 Z' fill='%236b9a6f'/%3E%3C/svg%3E`;
const body = readFileSync("demo/body.html", "utf8").replace("__UNREVIEWED__", familyUnreviewed({ id }));
const page = `<!doctype html>
<html lang="en">
  <head>
    ${familyHead({ id, title: "Tane · seeded random numbers and daily seeds", description: "Type a seed and see its first numbers, a shuffle and today's seed: the same on every device and every server. A seeded random number generator for games, daily puzzles and tests. Free and open source.", ogTitle: "Tane 種: seeded random numbers", ogDescription: "One seed, the same numbers everywhere." })}
    <link rel="icon" href="${icon}" />
    <link rel="stylesheet" href="family.css" />
    <link rel="stylesheet" href="site.css" />
  </head>
  <body>
    <main>
      ${familyHeader({ id })}
${body}      ${familyFooter({ id })}
    </main>
    <script>${FAMILY_SCRIPT}</script>
    <script type="module" src="page.js"></script>
  </body>
</html>
`;

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
for (const file of ["family.css", "site.css", "page.js"]) cpSync(`demo/${file}`, `site/${file}`);
cpSync("dist", "site/dist", { recursive: true });
cpSync("docs/spec-vectors.json", "site/spec-vectors.json");
writeFileSync("site/index.html", page);
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");
