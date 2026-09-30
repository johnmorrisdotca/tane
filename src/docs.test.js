// The documents that are made from the source, or that quote it, checked against it.
// Plain JavaScript, so that reading files needs no Node types. `pnpm docs:make` rewrites what is made.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import process from "node:process";

import { describe, expect, it } from "vitest";

import * as tane from "./index.ts";
import * as hooks from "./react.ts";

const { CLI_MAX_COUNT, MAX_CSV_ROWS, SEED_MOST, STRINGS, VERSION } = tane;
const { addDays, below, chance, checkBlocks, counted, dailySeed, dayKey, dayOfSeed, daySeed, daysBetween, deriveSeed, drawSeed, float, fork, freshSeed, fromJSON, fromText, hashSeed, inBlock, int, isDayKey, isSeed, mulberry32, nextDayStart, randomAt, runCli, sample, seedFrom, shuffled, step, toCSV, toJSON, toText, weightedPick } = tane;

const readme = readFileSync("README.md", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const cell = (text) => text.replace(/\\\|/g, "|").trim();

/** The rows of the table under a heading: each row's cells. */
function table(heading, doc = readme) {
  const from = doc.indexOf(heading);
  if (from < 0) throw new Error(`no “${heading}”`);
  const rows = [];
  for (const line of doc.slice(from).split("\n").slice(1)) {
    if (line.startsWith("|")) rows.push(line.split(/(?<!\\)\|/).slice(1, -1).map(cell));
    else if (rows.length > 0) break;
  }
  return rows.slice(2);
}

/** A line of a README example: the code, and what its comment says it comes to. */
const says = (code, comment) => expect(readme, code).toContain(`${code}${comment === undefined ? "" : comment}`);

describe("the README in 30 seconds", () => {
  it("the seeded lines come to what they say", () => {
    const random = mulberry32(seedFrom("table-7"));
    says("int(random, 1, 6);                                // 1: the same on every machine");
    expect(int(random, 1, 6)).toBe(1);
    says('shuffled(random, ["♠", "♥", "♦", "♣"]);           // ["♦", "♣", "♥", "♠"]');
    expect(shuffled(random, ["♠", "♥", "♦", "♣"])).toEqual(["♦", "♣", "♥", "♠"]);
    says("dailySeed(new Date());                            // 20260930 on 30 September 2026, worldwide");
    expect(dailySeed(new Date("2026-09-30T12:00:00Z"))).toBe(20260930);
  });

  it("the terminal line shuffles", () => {
    says("npx @johnmorrisdotca/tane --seed table-7 --shuffle a b c");
    const ran = runCli(["--seed", "table-7", "--shuffle", "a", "b", "c"]);
    expect(ran.code).toBe(0);
    expect(ran.out.trim().split("\n").sort()).toEqual(["a", "b", "c"]);
  });
});

describe("the README on the API alone", () => {
  it("parts, samples and weights", () => {
    const seed = 42;
    const deck = shuffled(mulberry32(deriveSeed(seed, "deck")), ["A", "K", "Q", "J"]);
    expect([...deck].sort()).toEqual(["A", "J", "K", "Q"]);
    says("int(dice, 1, 6);                                                                      // 5");
    expect(int(mulberry32(deriveSeed(seed, "dice")), 1, 6)).toBe(5);
    says('sample(mulberry32(seed), ["a", "b", "c", "d", "e"], 2);                // ["d", "c"]: two, none twice');
    expect(sample(mulberry32(seed), ["a", "b", "c", "d", "e"], 2)).toEqual(["d", "c"]);
    says('weightedPick(mulberry32(seed), ["common", "rare", "epic"], [90, 9, 1]); // "common"');
    expect(weightedPick(mulberry32(seed), ["common", "rare", "epic"], [90, 9, 1])).toBe("common");
    says('toText(random.position());               // "tane:1:42:4": seed 42, four draws in');
    const random = counted(seed);
    shuffled(random, [1, 2, 3, 4, 5]);
    expect(toText(random.position())).toBe("tane:1:42:4");
  });
});

describe("the README on streams, draws and parts", () => {
  it("streams", () => {
    const random = mulberry32(42);
    says("random();                     // 0.6011037519201636");
    says("random();                     // 0.44829055899754167");
    expect([random(), random()]).toEqual([0.6011037519201636, 0.44829055899754167]);
    says('hashSeed("room-7");           // 948657874: any text as a seed');
    expect(hashSeed("room-7")).toBe(948657874);
    says('seedFrom("42");               // 42: digits are the number itself');
    expect(seedFrom("42")).toBe(42);
    says('seedFrom("table");            // 115308040: anything else is hashed');
    expect(seedFrom("table")).toBe(115308040);
    says("first.value;                  // 0.6011037519201636, the same as mulberry32(42)()");
    says("first.state;                  // 1831565855: keep it, and step(first.state) is the next draw");
    expect(step(42)).toEqual({ value: 0.6011037519201636, state: 1831565855 });
    expect(step(1831565855).value).toBe(0.44829055899754167);
    const before = mulberry32(42);
    const side = fork(before);
    expect(side()).not.toBe(before());
    expect(mulberry32(2 ** 32 + 1)()).toBe(mulberry32(1)());
    expect(tane.seededRandom).toBe(mulberry32);
  });

  it("draws", () => {
    says("below(mulberry32(42), 10);      // 6");
    expect(below(mulberry32(42), 10)).toBe(6);
    says("float(mulberry32(42), 0, 10);   // 6.011037519201636");
    expect(float(mulberry32(42), 0, 10)).toBe(6.011037519201636);
    says("chance(mulberry32(42), 0.5);    // false: the draw was 0.601…");
    expect(chance(mulberry32(42), 0.5)).toBe(false);
  });

  it("every draw in the table takes the draws it says", () => {
    const rows = table("## Draws");
    expect(rows.map((row) => row[0].match(/`(\w+)\(/)[1])).toEqual(["below", "int", "float", "chance", "pick", "shuffle", "shuffled", "sample", "distinctBelow", "weightedIndex", "weightedPick", "normal"]);
    const items = ["a", "b", "c", "d", "e", "f", "g"];
    const calls = {
      below: [(r) => tane.below(r, 9), 1],
      int: [(r) => tane.int(r, 1, 6), 1],
      float: [(r) => tane.float(r, 0, 1), 1],
      chance: [(r) => tane.chance(r, 0.5), 1],
      pick: [(r) => tane.pick(r, items), 1],
      shuffle: [(r) => tane.shuffle(r, [...items]), items.length - 1],
      shuffled: [(r) => tane.shuffled(r, items), items.length - 1],
      sample: [(r) => tane.sample(r, items, 3), 3],
      weightedIndex: [(r) => tane.weightedIndex(r, [1, 2, 3]), 1],
      weightedPick: [(r) => tane.weightedPick(r, items, [1, 1, 1, 1, 1, 1, 1]), 1],
      normal: [(r) => tane.normal(r), 2],
    };
    for (const [name, [call, draws]] of Object.entries(calls)) {
      const random = counted(7);
      call(random);
      expect(random.draws, name).toBe(draws);
    }
    const none = counted(7);
    tane.weightedIndex(none, [0, 0]);
    expect(none.draws).toBe(0);
    expect(rows.find((row) => row[0].includes("weightedIndex"))[2]).toBe("1, or 0 when the weights sum to nothing");
    for (const call of [() => below(mulberry32(1), 0), () => int(mulberry32(1), 2, 1), () => tane.pick(mulberry32(1), []), () => weightedPick(mulberry32(1), [], [])]) expect(call).toThrow(RangeError);
  });

  it("parts", () => {
    says('deriveSeed(42, "deck");        // 3104557420');
    says('deriveSeed(42, "dice");        // 217474656');
    expect([deriveSeed(42, "deck"), deriveSeed(42, "dice")]).toEqual([3104557420, 217474656]);
    expect(deriveSeed(42, "round", 3)).not.toBe(deriveSeed(42, "round", "3"));
  });
});

describe("the README on seeds and days", () => {
  const DAILY = { from: 1_000_000_000, size: 100_000_000 };

  it("seeds that travel", () => {
    says("SEED_MOST;                          // 2147483647: the largest seed, 2³¹ − 1");
    expect(SEED_MOST).toBe(2147483647);
    expect(isSeed(Number("20260930"))).toBe(true);
    expect(isSeed(Number("abc"))).toBe(false);
    for (let i = 0; i < 200; i += 1) expect(inBlock(freshSeed({ reserved: [DAILY] }), DAILY)).toBe(false);
    says("drawSeed(mulberry32(42));           // 1290860478: the same, from a stream of your own");
    expect(drawSeed(mulberry32(42))).toBe(1290860478);
    expect(inBlock(1_020_261_003, DAILY)).toBe(true);
    expect(checkBlocks([DAILY])).toEqual([DAILY]);
    expect(() => checkBlocks([DAILY, { from: 1_050_000_000, size: 10 }])).toThrow(RangeError);
  });

  it("a seed a day", () => {
    const at = new Date("2026-10-01T03:30:00Z");
    says('dayKey(at);                                  // "2026-10-01"');
    expect(dayKey(at)).toBe("2026-10-01");
    says("dailySeed(at);                               // 20261001");
    expect(dailySeed(at)).toBe(20261001);
    says('dailySeed(at, "America/Toronto");            // 20260930: still the evening before there');
    expect(dailySeed(at, "America/Toronto")).toBe(20260930);
    says('nextDayStart(at, "America/Toronto");         // 2026-10-01T04:00:00.000Z: when that seed changes');
    expect(nextDayStart(at, "America/Toronto").toISOString()).toBe("2026-10-01T04:00:00.000Z");
    says('isDayKey("2026-02-30");                      // false: not a real date');
    expect(isDayKey("2026-02-30")).toBe(false);
    says('addDays("2026-02-27", 3);                    // "2026-03-02"');
    expect(addDays("2026-02-27", 3)).toBe("2026-03-02");
    says('daysBetween("2026-01-01", "2026-12-31");     // 364');
    expect(daysBetween("2026-01-01", "2026-12-31")).toBe(364);
    says('daySeed("2026-10-03", DAILY);                // 1020261003: a day\'s seed inside a block kept for it');
    expect(daySeed("2026-10-03", DAILY)).toBe(1020261003);
    says('dayOfSeed(1_020_261_003, DAILY);             // "2026-10-03", or null for a seed that names no day');
    expect(dayOfSeed(1_020_261_003, DAILY)).toBe("2026-10-03");
    expect(dayOfSeed(1_020_261_341, DAILY)).toBeNull();
  });
});

describe("the README on export and import", () => {
  it("the three forms, and back", () => {
    const random = counted(42);
    shuffled(random, [1, 2, 3, 4, 5]);
    const kept = random.position();
    says("const kept = random.position();              // { seed: 42, draws: 4 }");
    expect(kept).toEqual({ seed: 42, draws: 4 });
    says('toText(kept);                                // "tane:1:42:4": one line to paste');
    expect(toText(kept)).toBe("tane:1:42:4");
    expect(fromText("tane:1:42:4")).toEqual(kept);
    expect(fromJSON(toJSON(kept))).toEqual(kept);
    expect(readme).toContain(`\`\`\`json\n${toJSON(kept)}\`\`\``);
    says("randomAt(kept.seed, kept.draws)();           // 0.17481389874592423: the fifth number, in one step");
    expect(randomAt(kept.seed, kept.draws)()).toBe(0.17481389874592423);
    expect(readme).toContain(`\`\`\`csv\n${toCSV({ seed: 42, draws: 0 }, 2).replaceAll("\r\n", "\n")}\`\`\``);
  });

  it("the table names every field the JSON has, in order", () => {
    const rows = table("**Nothing read is trusted.**", readme.slice(readme.indexOf("| Field of the JSON") - 1).replace("| Field of the JSON", "**Nothing read is trusted.**\n| Field of the JSON")).map((row) => row[0].replaceAll("`", ""));
    expect(rows).toEqual(Object.keys(JSON.parse(toJSON({ seed: 1, draws: 0 }))));
  });
});

describe("the README on the command line", () => {
  it("prints the help as it is", () => {
    expect(readme).toContain(`\`\`\`\n${STRINGS.en.cliUsage}\`\`\``);
  });

  it("the runs it shows come out as shown", () => {
    expect(readme).toContain("$ tane --seed 42 --shuffle a b c\nc\na\nb\n");
    expect(runCli(["--seed", "42", "--shuffle", "a", "b", "c"]).out).toBe("c\na\nb\n");
    const data = JSON.parse(runCli(["--seed", "42", "--int", "1..6", "-n", "5", "--json"]).out);
    expect(data).toEqual({ format: 1, generator: `tane ${VERSION}`, seed: 42, skipped: 0, min: 1, max: 6, integers: [4, 3, 6, 5, 2], position: "tane:1:42:5" });
    expect(readme).toContain(`"generator": "tane ${VERSION}",\n  "seed": 42,\n  "skipped": 0,\n  "min": 1,\n  "max": 6,\n  "integers": [4, 3, 6, 5, 2],\n  "position": "tane:1:42:5"`);
    says('runCli(["--seed", "42", "--pick", "a", "b", "c"]);   // { code: 0, out: "b\\n", err: "" }');
    expect(runCli(["--seed", "42", "--pick", "a", "b", "c"])).toEqual({ code: 0, out: "b\n", err: "" });
  });
});

describe("the README's reference", () => {
  const api = readme.slice(readme.indexOf("## API"), readme.indexOf("## Theming"));

  it("names every export, and nothing that is not one", () => {
    const source = readdirSync("src").filter((name) => name.endsWith(".ts") && !name.includes(".test.")).map((name) => readFileSync(`src/${name}`, "utf8")).join("\n");
    const types = [...source.matchAll(/^export type (\w+)/gm)].map((m) => m[1]);
    const values = [...Object.keys(tane), ...Object.keys(hooks)];
    expect(values.length).toBeGreaterThan(50);
    for (const name of [...values, ...types]) expect(api.includes(`\`${name}\``) || api.includes(`\`${name}(`) || api.includes(`type ${name}\``), name).toBe(true);
    const firstCells = api.split("\n").filter((line) => line.startsWith("| `")).map((line) => line.split("|")[1]);
    const named = new Set(firstCells.flatMap((text) => [...text.matchAll(/`(?:type )?([A-Za-z_]\w*)[`(]/g)].map((m) => m[1])));
    expect(named.size).toBeGreaterThan(40);
    const known = new Set([...values, ...types]);
    for (const name of named) expect(known.has(name), `the README names ${name}`).toBe(true);
  });

  it("every export has a doc comment", () => {
    for (const name of readdirSync("src").filter((file) => file.endsWith(".ts") && !file.includes(".test."))) {
      const lines = readFileSync(`src/${name}`, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (!/^export (function|const|type) /.test(line)) return;
        expect(lines[i - 1].trimEnd().endsWith("*/"), `${name}: ${line}`).toBe(true);
      });
    }
  });

  it("the limits are the constants", () => {
    const rows = Object.fromEntries(table("## Limits").map((row) => [row[0], row]));
    expect(rows["A seed that travels"][1]).toBe(`1 to ${SEED_MOST.toLocaleString("en-US")}`);
    expect(rows["Rows of CSV at once"][1]).toBe(MAX_CSV_ROWS.toLocaleString("en-US"));
    expect(rows["Numbers from one run of the command line"][1]).toBe(CLI_MAX_COUNT.toLocaleString("en-US"));
    expect(api).toContain(`| \`CLI_MAX_COUNT\` | ${CLI_MAX_COUNT} |`);
    expect(api).toContain(`| \`SEED_MOST\` | ${SEED_MOST}, `);
    expect(isDayKey("0000-01-01") && isDayKey("9999-12-31")).toBe(true);
    expect(seedFrom("4294967295")).toBe(4294967295);
    expect(seedFrom("4294967296")).toBe(hashSeed("4294967296"));
    expect(randomAt(42, 2 ** 32)()).toBe(mulberry32(42)());
  });
});

describe("the version", () => {
  it("is package.json's, and the changelog has it", () => {
    expect(VERSION).toBe(pkg.version);
    expect(readFileSync("CHANGELOG.md", "utf8")).toContain(`## [${VERSION}]`);
    expect(readme).toContain(`"generator": "tane ${VERSION}"`);
  });
});

describe("package.json", () => {
  it("names built files directly, and ships what it names", () => {
    const pointed = [pkg.main, pkg.module, pkg.types, ...Object.values(pkg.bin), ...Object.values(pkg.exports).flatMap((entry) => Object.values(entry))];
    for (const file of pointed) expect(/^\.?\/?(dist|bin)\//.test(file), file).toBe(true);
    expect(pkg.publishConfig.exports).toBeUndefined();
    expect(pkg.dependencies).toBeUndefined();
  });

  it("has keywords that are many, lower case and not repeated, and a description that fits", () => {
    expect(pkg.keywords.length).toBeGreaterThan(30);
    expect(new Set(pkg.keywords).size).toBe(pkg.keywords.length);
    for (const word of pkg.keywords) expect(word).toBe(word.toLowerCase());
    expect(pkg.description.length).toBeGreaterThan(200);
    expect(pkg.description.length).toBeLessThanOrEqual(350);
  });
});

describe("docs/strings-ja.md", () => {
  const escape = (text) => text.replaceAll("|", "\\|").replaceAll("\n", "<br>");
  const lines = [
    "# Tane's words, in English and Japanese",
    "",
    "Made from `src/strings.ts` by `pnpm docs:make`; a test fails if the two differ, so this list is never out of date.",
    "",
    "**The Japanese has not yet been reviewed by a native reader.** If a line reads wrongly or unnaturally, please",
    "open a *Fix a translation* issue with the string's name. `{seed}` and the other braces are filled in when shown.",
    "Names that begin `cli` are the command line's; names that begin `page` are the seed explorer's on the demo page.",
    "",
    "| Name | English | Japanese |",
    "| --- | --- | --- |",
    ...Object.keys(STRINGS.en).filter((key) => key !== "cliUsage").map((key) => `| \`${key}\` | ${escape(STRINGS.en[key])} | ${escape(STRINGS.ja[key])} |`),
    "",
    "## The command line's help",
    "",
    "`cliUsage`, in English:",
    "",
    "```",
    STRINGS.en.cliUsage.trimEnd(),
    "```",
    "",
    "and in Japanese:",
    "",
    "```",
    STRINGS.ja.cliUsage.trimEnd(),
    "```",
    "",
  ];
  const made = lines.join("\n");

  it("is what the source makes: run `pnpm docs:make` after changing a string", () => {
    if (process.env.UPDATE_DOCS === "1") writeFileSync("docs/strings-ja.md", made);
    expect(readFileSync("docs/strings-ja.md", "utf8")).toBe(made);
  });

  it("has a Japanese line for every English one, and keeps every place to fill in", () => {
    expect(Object.keys(STRINGS.ja)).toEqual(Object.keys(STRINGS.en));
    for (const key of Object.keys(STRINGS.en)) {
      const places = (text) => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
      expect(places(STRINGS.ja[key]), key).toEqual(places(STRINGS.en[key]));
      expect(STRINGS.ja[key].trim(), key).not.toBe("");
      if (!/^(pageAsJson|pageAsCsv)$/.test(key)) expect(STRINGS.ja[key], key).not.toBe(STRINGS.en[key]);
    }
  });

  it("the two helps list the same options, in the same order", () => {
    const options = (text) => [...text.matchAll(/^\s+(?:-\w, )?(--[\w-]+)/gm)].map((m) => m[1]);
    expect(options(STRINGS.ja.cliUsage)).toEqual(options(STRINGS.en.cliUsage));
    const examples = (text) => text.split("\n").filter((line) => line.startsWith("  tane ")).map((line) => line.slice(0, 36).trimEnd());
    expect(examples(STRINGS.ja.cliUsage)).toEqual(examples(STRINGS.en.cliUsage));
  });
});

describe("the README's framework examples", () => {
  const proof = readFileSync("scripts/check-frameworks.mjs", "utf8").replaceAll("\\`", "`");
  const blocks = (language) => [...readme.matchAll(new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\`\`\``, "g"))].map((m) => m[1]);

  it("the Vue, Svelte and Angular components are the ones the framework check builds, to the letter", () => {
    const [vue] = blocks("vue");
    const [svelte] = blocks("svelte");
    const angular = blocks("ts").find((block) => block.startsWith("// Angular"));
    expect(proof).toContain(vue);
    expect(proof).toContain(svelte);
    expect(proof).toContain(angular.split("\n").slice(1).join("\n"));
  });

  it("the React component is the one built, but for its types", () => {
    const [react] = blocks("tsx");
    const untyped = react.replace("{ names }: { names: string[] }", "{ names }").replace(/ +\/\/ moves to tomorrow.*$/m, "");
    expect(proof).toContain(untyped.replace("export function", "export function"));
  });

  it("the plain page's script is the one opened", () => {
    const [html] = blocks("html");
    const script = html.slice(html.indexOf("<script"), html.indexOf("</script>"));
    const lines = script.split("\n").map((line) => line.trim()).filter((line) => line !== "");
    for (const line of lines.filter((text) => !text.startsWith("const order"))) expect(proof, line).toContain(line);
  });
});

describe("the family's look", () => {
  const css = readFileSync("demo/family.css", "utf8");
  const FAMILY_CSS = "c1e392564a7fd94d0bb5cfaefb6d4fedfd147fc3e27f3a7afd8d8dac8c94a227";

  it("demo/family.css is the family's file, byte for byte: never edit it here", () => {
    const [first, ...rest] = css.split("\n");
    const hash = createHash("sha256").update(rest.join("\n")).digest("hex");
    expect(first).toBe(`/* sha256 of every line after this one: ${hash} */`);
    expect(hash).toBe(FAMILY_CSS);
  });

  it("the README's theming table gives the stylesheets' own values", () => {
    const own = readFileSync("demo/site.css", "utf8");
    const light = css.slice(css.indexOf(":root {"), css.indexOf("@media (prefers-color-scheme: dark)"));
    const dark = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"), css.indexOf(':root[data-theme="dark"]'));
    const value = (block, name) => new RegExp(`${name}: ([^;]+);`).exec(block)?.[1];
    const lines = readme.slice(readme.indexOf("| Property | What it colours")).split("\n").slice(2);
    let seen = 0;
    for (const line of lines) {
      if (!line.startsWith("|")) break;
      const [names, , lightCell, darkCell] = line.split("|").slice(1, -1).map((text) => text.trim());
      const properties = [...names.matchAll(/`(--[\w-]+)`/g)].map((m) => m[1]);
      const lights = [...lightCell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
      const darks = [...darkCell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
      properties.forEach((property, i) => {
        seen += 1;
        expect(css.includes(`${property}:`), property).toBe(true);
        if (lights[i] !== undefined) expect(value(property.startsWith("--intro") ? own : light, property), property).toBe(lights[i]);
        if (darks[i] !== undefined) expect(value(dark, property), `${property} in the dark`).toBe(darks[i]);
        if (darkCell === "the same") expect(value(dark, property), `${property} in the dark`).toBeUndefined();
      });
    }
    expect(seen).toBe(19);
  });

  it("the site script uses the family's header and footer", () => {
    const site = readFileSync("scripts/site.mjs", "utf8");
    for (const part of ["familyHead(", "familyHeader(", "familyUnreviewed(", "familyFooter(", "FAMILY_SCRIPT", 'href="family.css"', 'href="site.css"']) expect(site).toContain(part);
    expect(site.indexOf('href="family.css"')).toBeLessThan(site.indexOf('href="site.css"'));
  });
});
