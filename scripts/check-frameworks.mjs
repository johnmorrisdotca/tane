// Proves the claim in the README: the packed package works in React, Vue, Svelte, Angular and a
// plain page, with nothing for the consumer to configure. It packs the package, makes a small
// project for each in a scratch folder, installs the tarball and each framework's own tools
// there (never here: the package has no dependencies), and builds it. Then it opens each built
// page in Chromium and WebKit with the clock set, and checks that the page shows the order
// that day's seed must give. The components are the ones the README shows.
//
//   pnpm test:frameworks [scratch folder]        (TANE_FRAMEWORKS=vue,react for some of them)
//
// Run it before a release that names a framework. It needs the network and a few minutes.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import process from "node:process";

import { chromium, webkit } from "@playwright/test";

import { dailySeed, mulberry32, shuffled } from "../dist/index.js";

const root = resolve(process.argv[2] ?? mkdtempSync(join(tmpdir(), "tane-frameworks-")));
rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });
const run = (cwd, command, args) => execFileSync(command, args, { cwd, stdio: "pipe", shell: process.platform === "win32", env: { ...process.env, NG_CLI_ANALYTICS: "false" } }).toString();
const write = (dir, files) => {
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(join(dir, name, ".."), { recursive: true });
    writeFileSync(join(dir, name), typeof text === "string" ? text : JSON.stringify(text, null, 2));
  }
};

run(process.cwd(), "npm", ["pack", "--ignore-scripts", "--pack-destination", root]);
const tarball = join(root, readdirSync(root).find((name) => name.endsWith(".tgz")));
const tane = `file:${tarball}`;
const NAMES = ["Ada", "Grace", "Alan", "Edsger", "Barbara", "Donald"];
const page = (script) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>tane</title></head><body><div id="app"></div>${script}</body></html>`;

const projects = {
  vue: {
    out: "dist",
    files: {
      "package.json": { name: "check-vue", private: true, type: "module", dependencies: { "@johnmorrisdotca/tane": tane, vue: "^3.5.0" }, devDependencies: { vite: "^7.0.0", "@vitejs/plugin-vue": "^6.0.0" } },
      "vite.config.js": `import vue from "@vitejs/plugin-vue";\nexport default { base: "./", plugins: [vue()] };\n`,
      "index.html": page(`<script type="module" src="/src/main.js"></script>`),
      "src/main.js": `import { createApp } from "vue";\nimport TodaysOrder from "./TodaysOrder.vue";\ncreateApp(TodaysOrder, { names: ${JSON.stringify(NAMES)} }).mount("#app");\n`,
      "src/TodaysOrder.vue": `<script setup>
import { computed } from "vue";
import { dailySeed, mulberry32, shuffled } from "@johnmorrisdotca/tane";

const props = defineProps({ names: Array });
const order = computed(() => shuffled(mulberry32(dailySeed(new Date())), props.names));
</script>

<template>
  <ol><li v-for="name in order" :key="name">{{ name }}</li></ol>
</template>
`,
    },
  },
  svelte: {
    out: "dist",
    files: {
      "package.json": { name: "check-svelte", private: true, type: "module", dependencies: { "@johnmorrisdotca/tane": tane, svelte: "^5.0.0" }, devDependencies: { vite: "^7.0.0", "@sveltejs/vite-plugin-svelte": "^6.0.0" } },
      "vite.config.js": `import { svelte } from "@sveltejs/vite-plugin-svelte";\nexport default { base: "./", plugins: [svelte()] };\n`,
      "index.html": page(`<script type="module" src="/src/main.js"></script>`),
      "src/main.js": `import { mount } from "svelte";\nimport TodaysOrder from "./TodaysOrder.svelte";\nmount(TodaysOrder, { target: document.getElementById("app"), props: { names: ${JSON.stringify(NAMES)} } });\n`,
      "src/TodaysOrder.svelte": `<script>
  import { dailySeed, mulberry32, shuffled } from "@johnmorrisdotca/tane";
  let { names } = $props();
  const order = $derived(shuffled(mulberry32(dailySeed(new Date())), names));
</script>

<ol>{#each order as name (name)}<li>{name}</li>{/each}</ol>
`,
    },
  },
  angular: {
    out: "dist/check-angular/browser",
    files: {
      "package.json": {
        name: "check-angular",
        private: true,
        dependencies: { "@johnmorrisdotca/tane": tane, "@angular/common": "^20.0.0", "@angular/compiler": "^20.0.0", "@angular/core": "^20.0.0", "@angular/platform-browser": "^20.0.0", rxjs: "^7.8.0", tslib: "^2.8.0" },
        devDependencies: { "@angular/build": "^20.0.0", "@angular/cli": "^20.0.0", "@angular/compiler-cli": "^20.0.0", typescript: "~5.8.0" },
      },
      "angular.json": {
        version: 1,
        projects: {
          "check-angular": {
            projectType: "application",
            root: "",
            sourceRoot: "src",
            architect: { build: { builder: "@angular/build:application", options: { outputPath: "dist/check-angular", index: "src/index.html", browser: "src/main.ts", tsConfig: "tsconfig.json", baseHref: "./" }, configurations: { production: {} }, defaultConfiguration: "production" } },
          },
        },
      },
      "tsconfig.json": { compilerOptions: { target: "ES2022", module: "ES2022", moduleResolution: "bundler", strict: true, experimentalDecorators: true, skipLibCheck: true, lib: ["ES2022", "dom"] }, files: ["src/main.ts"] },
      "src/index.html": page(`<check-root></check-root>`),
      "src/todays-order.ts": `import { Component, computed, input } from "@angular/core";
import { dailySeed, mulberry32, shuffled } from "@johnmorrisdotca/tane";

@Component({
  selector: "todays-order",
  template: \`<ol>@for (name of order(); track name) {<li>{{ name }}</li>}</ol>\`,
})
export class TodaysOrder {
  names = input.required<string[]>();
  order = computed(() => shuffled(mulberry32(dailySeed(new Date())), this.names()));
}
`,
      "src/main.ts": `import { Component, provideZonelessChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { TodaysOrder } from "./todays-order";

@Component({
  selector: "check-root",
  imports: [TodaysOrder],
  template: \`<todays-order [names]="names" />\`,
})
class App {
  names = ${JSON.stringify(NAMES)};
}

bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] });
`,
    },
  },
  react: {
    out: "dist",
    files: {
      "package.json": { name: "check-react", private: true, type: "module", dependencies: { "@johnmorrisdotca/tane": tane, react: "^19.0.0", "react-dom": "^19.0.0" }, devDependencies: { vite: "^7.0.0", "@vitejs/plugin-react": "^5.0.0" } },
      "vite.config.js": `import react from "@vitejs/plugin-react";\nexport default { base: "./", plugins: [react()] };\n`,
      "index.html": page(`<script type="module" src="/src/main.jsx"></script>`),
      "src/TodaysOrder.jsx": `import { shuffled } from "@johnmorrisdotca/tane";
import { useDailySeed, useSeeded } from "@johnmorrisdotca/tane/react";

export function TodaysOrder({ names }) {
  const { day, seed } = useDailySeed();
  const order = useSeeded(seed, (random) => shuffled(random, names));
  return (
    <ol aria-label={day}>
      {order.map((name) => <li key={name}>{name}</li>)}
    </ol>
  );
}
`,
      "src/main.jsx": `import { createRoot } from "react-dom/client";
import { TodaysOrder } from "./TodaysOrder.jsx";

createRoot(document.getElementById("app")).render(<TodaysOrder names={${JSON.stringify(NAMES)}} />);
`,
    },
  },
  // No framework and no bundler: a script tag and the files as they are published.
  plain: {
    out: ".",
    build: (dir) => run(dir, "npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts", "--install-links"]),
    files: {
      "package.json": { name: "check-plain", private: true, dependencies: { "@johnmorrisdotca/tane": tane } },
      "index.html": page(`<ol id="order"></ol>
<script type="module">
  import { dailySeed, mulberry32, shuffled } from "./node_modules/@johnmorrisdotca/tane/dist/index.js";

  const order = shuffled(mulberry32(dailySeed(new Date())), ${JSON.stringify(NAMES)});
  document.getElementById("order").append(...order.map((name) => Object.assign(document.createElement("li"), { textContent: name })));
</script>`),
    },
  },
};

const only = process.env.TANE_FRAMEWORKS?.split(",");
const built = [];
for (const [name, project] of Object.entries(projects)) {
  if (only !== undefined && !only.includes(name)) continue;
  const dir = join(root, name);
  write(dir, project.files);
  const started = Date.now();
  try {
    if (project.build !== undefined) project.build(dir);
    else {
      run(dir, "npm", ["install", "--no-audit", "--no-fund"]);
      run(dir, "npx", name === "angular" ? ["ng", "build"] : ["vite", "build"]);
    }
    if (!existsSync(join(dir, project.out, "index.html"))) throw new Error(`no index.html in ${project.out}`);
    built.push([name, join(dir, project.out)]);
    console.log(`built   ${name.padEnd(8)} in ${Math.round((Date.now() - started) / 1000)} s`);
  } catch (error) {
    console.log(`FAILED  ${name}: ${String(error.stderr ?? error.stdout ?? error.message).split("\n").slice(-12).join("\n")}`);
    process.exitCode = 1;
  }
}

// Open each built page with the clock set to a moment, and read the order off it.
const moment = new Date("2026-10-01T03:30:00Z");
const want = shuffled(mulberry32(dailySeed(moment)), NAMES);
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json" };
for (const [engine, launcher] of [["chromium", chromium], ["webkit", webkit]]) {
  const browser = await launcher.launch();
  for (const [name, out] of built) {
    const context = await browser.newContext({ viewport: { width: 390, height: 800 }, timezoneId: "Asia/Tokyo" });
    const tab = await context.newPage();
    const errors = [];
    tab.on("pageerror", (error) => errors.push(String(error)));
    await tab.clock.setFixedTime(moment);
    await tab.route("http://check.test/**", (route) => {
      let file = join(out, decodeURIComponent(new URL(route.request().url()).pathname));
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
      if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ body: readFileSync(file), contentType: types[extname(file)] ?? "application/octet-stream" });
    });
    await tab.goto("http://check.test/");
    let got = [];
    try {
      await tab.waitForFunction((count) => document.querySelectorAll("ol li").length === count, NAMES.length, { timeout: 5000 });
      got = await tab.locator("ol li").allTextContents();
    } catch {
      // Nothing was drawn: reported below.
    }
    const ok = errors.length === 0 && got.map((text) => text.trim()).join() === want.join();
    console.log(`${ok ? "showed " : "FAILED "} ${name.padEnd(8)} in ${engine}: the page shows ${got.join(" ") || "nothing"}; seed ${dailySeed(moment)} gives ${want.join(" ")}${errors.length > 0 ? ` ${errors.join("; ")}` : ""}`);
    if (!ok) process.exitCode = 1;
    await context.close();
  }
  await browser.close();
}
cpSync(tarball, join(root, "packed.tgz"));
console.log(`scratch projects are in ${root}`);
