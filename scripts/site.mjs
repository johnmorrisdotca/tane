// Builds the static demo for GitHub Pages into ./site: the page, put together from the family's
// shared header and footer and this package's own body, its two stylesheets, and the compiled library.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import { API_CSS, apiPage } from "./api.mjs";
import { FAMILY_SCRIPT, FAMILY_EMBED_BUILDER_WORDS, familyEmbedBuilder, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";

const id = "tane";
const icon = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cellipse cx='50' cy='58' rx='26' ry='34' fill='%232f5d4a'/%3E%3Cpath d='M50 26 C 50 10, 66 6, 74 10 C 70 20, 60 26, 50 26 Z' fill='%236b9a6f'/%3E%3C/svg%3E`;
const body = readFileSync("demo/body.html", "utf8").replace("__UNREVIEWED__", familyUnreviewed({ id }));
const page = `<!doctype html>
<html lang="en">
  <head>
    ${familyHead({ id, title: "Tane 種 — Seeded random numbers for JavaScript", description: "Type a seed and see its first numbers, a shuffle and today's seed: the same on every device and every server. A seeded random number generator for games, daily puzzles and tests. Free and open source.", ogTitle: "Tane 種 — Seeded random numbers for JavaScript", ogDescription: "One seed, the same numbers everywhere." })}
    <link rel="icon" href="${icon}" />
    <link rel="stylesheet" href="family.css" />
    <link rel="stylesheet" href="tane.css" />
  </head>
  <body>
    <main>
      ${familyHeader({ id, links: [{ href: "docs/index.html", say: "pageDocs" }, { href: "api.html", say: "pageApi" }] })}
${body}      ${familyFooter({ id })}
    </main>
    <script>${FAMILY_SCRIPT}</script>
    <script type="module" src="page.js"></script>
  </body>
</html>
`;

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
for (const file of ["family.css", "tane.css", "page.js"]) cpSync(`demo/${file}`, `site/${file}`);
cpSync("dist", "site/dist", { recursive: true });
cpSync("docs/spec-vectors.json", "site/spec-vectors.json");
writeFileSync("site/index.html", page);
// The API reference, made from the source: every export of every entry point.
writeFileSync("site/api.css", API_CSS);
writeFileSync("site/api.html", apiPage({ id, name: "Tane", icon }));
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");

writeFileSync("site/family-embed-builder.js", `export const FAMILY_EMBED_BUILDER_WORDS = ${JSON.stringify(FAMILY_EMBED_BUILDER_WORDS)};\nexport ${familyEmbedBuilder.toString()};\n`);
const builderParts = { builderHead: familyHead({ id, title: "Tane 種 — Seeded random numbers for JavaScript", description: "Choose a list and seed, preview picks or groups and copy the embed code." }), builderHeader: familyHeader({ id, links: [{ href: "./", say: "toGallery" }, { href: "docs/index.html", say: "pageDocs" }, { href: "api.html", say: "pageApi" }] }), unreviewed: familyUnreviewed({ id }), footer: familyFooter({ id }), script: `<script>${FAMILY_SCRIPT}</script>` };
writeFileSync("site/builder.html", readFileSync("demo/builder.html", "utf8").replace(/<!-- family:([A-Za-z]+) -->/g, (_match, key) => builderParts[key]));
cpSync("demo/embed", "site/embed", { recursive: true });
for (const file of ["builder.js", "builder.css"]) cpSync(`demo/${file}`, `site/${file}`);
