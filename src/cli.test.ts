import { describe, expect, it } from "vitest";

import { CLI_MAX_COUNT, cliLanguage, runCli } from "./cli.ts";
import { int, pick, sample, shuffled } from "./draws.ts";
import { deriveSeed, hashSeed, mulberry32 } from "./random.ts";
import { randomAt, toCSV } from "./save.ts";
import { STRINGS } from "./strings.ts";
import { VERSION } from "./version.ts";

const NOW = Date.parse("2026-10-01T03:30:00Z");
const run = (line: string, around = {}) => runCli(line === "" ? [] : line.split(" "), { now: NOW, random: () => 0.5, ...around });
const lines = (text: string) => text.trimEnd().split("\n");
const take = (random: () => number, count: number) => Array.from({ length: count }, () => random());

describe("the help and the version", () => {
  it("prints the version", () => {
    expect(run("--version")).toEqual({ code: 0, out: `${VERSION}\n`, err: "" });
    expect(run("-v").out).toBe(`${VERSION}\n`);
  });

  it("prints help in English and in Japanese", () => {
    expect(run("--help").out).toMatch(/^Usage: tane/);
    expect(run("-h --lang ja").out).toMatch(/^使い方: tane/);
    expect(run("--help").out).toBe(STRINGS.en.cliUsage);
  });

  it("help names every option the command line reads", () => {
    for (const language of ["en", "ja"] as const) {
      for (const option of ["--seed", "--count", "--skip", "--int", "--shuffle", "--pick", "--sample", "--derive", "--today", "--zone", "--at", "--stdin", "--json", "--csv", "--lang", "--no-color", "--help", "--version"]) {
        expect(STRINGS[language].cliUsage, `${language} ${option}`).toContain(option);
      }
      for (const line of STRINGS[language].cliUsage.split("\n")) expect([...line].length, line).toBeLessThanOrEqual(80);
    }
  });
});

describe("numbers", () => {
  it("prints the first numbers of a seed, one to a line", () => {
    const ran = run("--seed 42 --count 3");
    expect(ran).toEqual({ code: 0, out: "0.6011037519201636\n0.44829055899754167\n0.8524657934904099\n", err: "" });
    expect(lines(run("-s 42").out)).toHaveLength(5);
    expect(lines(run("-s 42 -n 10").out).map(Number)).toEqual(take(mulberry32(42), 10));
  });

  it("hashes a seed that is not a whole number", () => {
    expect(lines(run("--seed table -n 3").out).map(Number)).toEqual(take(mulberry32(hashSeed("table")), 3));
    expect(run("--seed=table -n 1").out).toBe(run("--seed table -n 1").out);
  });

  it("starts after the draws skipped, or at a position", () => {
    expect(lines(run("--seed 42 --skip 3 -n 2").out).map(Number)).toEqual(take(randomAt(42, 3), 2));
    expect(run("--at tane:1:42:3 -n 2").out).toBe(run("--seed 42 --skip 3 -n 2").out);
  });

  it("draws a seed when none is given, and says which on standard error", () => {
    const ran = run("-n 2");
    expect(ran.code).toBe(0);
    expect(ran.err).toBe("tane: seed 1073741824 (pass --seed 1073741824 to repeat this)\n");
    expect(ran.out).toBe(run("--seed 1073741824 -n 2").out);
    expect(run("-n 2 --lang ja").err).toBe("tane: シード 1073741824（--seed 1073741824 で同じ結果を再現できます）\n");
  });

  it("whole numbers in a range", () => {
    const random = mulberry32(42);
    expect(lines(run("--seed 42 --int 1..6 -n 5").out).map(Number)).toEqual(Array.from({ length: 5 }, () => int(random, 1, 6)));
    expect(lines(run("--seed 42 --int -3..3 -n 50").out).every((n) => Number(n) >= -3 && Number(n) <= 3)).toBe(true);
    expect(run("--seed 42 --int=7..7 -n 2").out).toBe("7\n7\n");
  });
});

describe("items", () => {
  it("shuffles, the same way for the same seed", () => {
    expect(run("--seed 42 --shuffle a b c").out).toBe(`${shuffled(mulberry32(42), ["a", "b", "c"]).join("\n")}\n`);
    expect(runCli(["--seed", "42", "--shuffle", "a b c"]).out).toBe(run("--seed 42 --shuffle a b c").out);
    expect(runCli(["--seed", "42", "--shuffle", "a,b, c"]).out).toBe(run("--seed 42 --shuffle a b c").out);
  });

  it("picks one, or as many as asked", () => {
    expect(run("--seed 42 --pick a b c").out).toBe(`${pick(mulberry32(42), ["a", "b", "c"])}\n`);
    expect(lines(run("--seed 42 --pick a b c -n 4").out)).toHaveLength(4);
  });

  it("samples without taking one twice", () => {
    expect(run("--seed 42 --sample 2 a b c").out).toBe(`${sample(mulberry32(42), ["a", "b", "c"], 2).join("\n")}\n`);
    expect(lines(run("--seed 42 --sample 9 a b c").out).sort()).toEqual(["a", "b", "c"]);
  });

  it("reads standard input a line to an item, whole", () => {
    const ran = run("--seed 42 --shuffle --stdin", { stdin: "red fish\r\nblue fish\r\n\r\nold fish\r\n" });
    expect(ran.out).toBe(`${shuffled(mulberry32(42), ["red fish", "blue fish", "old fish"]).join("\n")}\n`);
  });

  it("with no items there is nothing to draw from", () => {
    expect(run("--seed 42 --pick")).toEqual({ code: 1, out: "", err: "tane: there are no items to draw from\n" });
    expect(run("--seed 42 --shuffle --stdin", { stdin: "" }).code).toBe(1);
    expect(run("--seed 42 --pick --lang ja").err).toBe("tane: 選ぶ項目がありません\n");
  });

  it("an item may begin with a dash after --", () => {
    expect(lines(runCli(["--seed", "42", "--shuffle", "--", "-a", "-b"]).out).sort()).toEqual(["-a", "-b"]);
  });
});

describe("today and parts", () => {
  it("prints today's seed when nothing is asked for", () => {
    expect(run("")).toEqual({ code: 0, out: "20261001  2026-10-01 (UTC)\nnext at 2026-10-02T00:00:00.000Z\n", err: "" });
    expect(run("--today").out).toBe(run("").out);
    expect(run("--no-color").out).toBe(run("").out);
  });

  it("by a place's own midnight", () => {
    expect(run("--today --zone America/Toronto").out).toBe("20260930  2026-09-30 (America/Toronto)\nnext at 2026-10-01T04:00:00.000Z\n");
    expect(run("--zone Asia/Tokyo").out).toBe("20261001  2026-10-01 (Asia/Tokyo)\nnext at 2026-10-01T15:00:00.000Z\n");
    expect(run("--today --lang ja").out).toBe("20261001  2026-10-01（UTC）\n次の切り替わり: 2026-10-02T00:00:00.000Z\n");
  });

  it("a zone the system does not know is exit code 1", () => {
    expect(run("--today --zone Nowhere/Land")).toEqual({ code: 1, out: "", err: "tane: “Nowhere/Land” is not a time zone this system knows\n" });
  });

  it("today's seed serves a job", () => {
    expect(run("--today --shuffle a b c").out).toBe(run("--seed 20261001 --shuffle a b c").out);
    expect(run("--today -n 2").out).toBe(run("--seed 20261001 -n 2").out);
  });

  it("a part's seed, and the part's numbers", () => {
    expect(run("--seed 42 --derive deck").out).toBe(`${deriveSeed(42, "deck")}\n`);
    expect(run("--seed 42 --derive round --derive 3").out).toBe(`${deriveSeed(42, "round", "3")}\n`);
    expect(lines(run("--seed 42 --derive deck -n 2").out).map(Number)).toEqual(take(mulberry32(deriveSeed(42, "deck")), 2));
  });
});

describe("JSON and CSV", () => {
  it("numbers as JSON, with the position they end at", () => {
    const data = JSON.parse(run("--seed table -n 3 --json").out);
    expect(data).toEqual({ format: 1, generator: `tane ${VERSION}`, seed: hashSeed("table"), text: "table", skipped: 0, numbers: take(mulberry32(hashSeed("table")), 3), position: `tane:1:${hashSeed("table")}:3` });
    expect(run("--seed table -n 3 --json").out).toMatch(/^\{\n {2}"format": 1,/);
  });

  it("each job as JSON", () => {
    expect(JSON.parse(run("--seed 42 --int 1..6 -n 2 -j").out)).toMatchObject({ seed: 42, min: 1, max: 6, integers: [4, 3], position: "tane:1:42:2" });
    expect(JSON.parse(run("--seed 42 --shuffle a b c --json").out)).toMatchObject({ items: ["a", "b", "c"], shuffled: shuffled(mulberry32(42), ["a", "b", "c"]), position: "tane:1:42:2" });
    expect(JSON.parse(run("--seed 42 --pick a b c --json").out)).toMatchObject({ picked: [pick(mulberry32(42), ["a", "b", "c"])], position: "tane:1:42:1" });
    expect(JSON.parse(run("--seed 42 --sample 2 a b c --json").out)).toMatchObject({ sampled: sample(mulberry32(42), ["a", "b", "c"], 2) });
    expect(JSON.parse(run("--today --json").out)).toEqual({ format: 1, generator: `tane ${VERSION}`, seed: 20261001, today: { day: "2026-10-01", seed: 20261001, zone: "UTC", next: "2026-10-02T00:00:00.000Z" } });
    expect(JSON.parse(run("--seed 42 --derive deck --json").out)).toMatchObject({ seed: 42, derived: { labels: ["deck"], from: 42, seed: deriveSeed(42, "deck") } });
  });

  it("a seed drawn is named in the JSON, and standard error stays empty", () => {
    const ran = run("-n 1 --json");
    expect(ran.err).toBe("");
    expect(JSON.parse(ran.out).seed).toBe(1073741824);
  });

  it("CSV, ended CRLF", () => {
    expect(run("--seed 42 -n 2 --csv").out).toBe(toCSV({ seed: 42, draws: 0 }, 2));
    expect(run("--seed 42 --int 1..6 -n 2 --csv").out).toBe("draw,value\r\n1,4\r\n2,3\r\n");
    expect(runCli(["--seed", "42", "--shuffle", "--stdin", "--csv"], { stdin: 'a, b\nsay "hi"\n' }).out).toMatch(/^place,item\r\n1,("a, b"|"say ""hi""")\r\n2,("a, b"|"say ""hi""")\r\n$/);
    expect(run("--today --csv").out).toBe("day,seed,zone,next\r\n2026-10-01,20261001,UTC,2026-10-02T00:00:00.000Z\r\n");
    expect(run("--seed 42 --derive deck --csv").out).toBe(`seed,labels,derived\r\n42,deck,${deriveSeed(42, "deck")}\r\n`);
  });
});

describe("what is refused", () => {
  const wrong = (line: string, message: string) => expect(run(line), line).toEqual({ code: 2, out: "", err: `tane: ${message}\nTry \`tane --help\`.\n` });

  it("a wrong command is exit code 2, with where to look", () => {
    wrong("--bogus", "unknown option --bogus");
    wrong("--seed", "--seed needs a value");
    wrong("--count 0", `--count takes a whole number from 1 to ${CLI_MAX_COUNT}`);
    wrong("--count 10001", `--count takes a whole number from 1 to ${CLI_MAX_COUNT}`);
    wrong("--count x", `--count takes a whole number from 1 to ${CLI_MAX_COUNT}`);
    wrong("--seed 1 --skip -1", "--skip takes a whole number from 0");
    wrong("--seed 1 --int 6..1", "--int takes two whole numbers, the lower first: 1..6");
    wrong("--seed 1 --int 1-6", "--int takes two whole numbers, the lower first: 1..6");
    wrong("--seed 1 --sample 0 a", "--sample takes a whole number from 1");
    wrong("--lang fr", "--lang takes en or ja");
    wrong("--json --csv", "--json and --csv are one or the other");
    wrong("--seed 1 --shuffle --pick a", "--shuffle and --pick are one or the other");
    wrong("--seed 1 --today", "--seed and --today are one or the other");
    wrong("--at tane:1:42:3 --skip 2", "--at and --skip are one or the other");
    wrong("--seed 1 --zone Asia/Tokyo", "--seed and --zone are one or the other");
  });

  it("in Japanese when asked", () => {
    expect(run("--bogus --lang ja").err).toBe("tane: 不明なオプションです: --bogus\n`tane --help` をご覧ください。\n");
  });

  it("a position that is not one is exit code 1", () => {
    expect(run("--at 42")).toEqual({ code: 1, out: "", err: "tane: “42” is not a position. One looks like tane:1:42:7\n" });
  });
});

describe("the language and the colour", () => {
  it("follows --lang, then the environment, then the system", () => {
    expect(cliLanguage(undefined, {}, undefined)).toBe("en");
    expect(cliLanguage(undefined, { LANG: "ja_JP.UTF-8" })).toBe("ja");
    expect(cliLanguage("en", { LANG: "ja_JP.UTF-8" })).toBe("en");
    expect(cliLanguage(undefined, { LC_ALL: "ja_JP.UTF-8", LANG: "en_US.UTF-8" })).toBe("ja");
    expect(cliLanguage(undefined, { LANG: "C.UTF-8" }, "ja-JP")).toBe("ja");
    expect(cliLanguage(undefined, { LANG: "POSIX" }, "fr-FR")).toBe("en");
    expect(run("--help", { env: { LANG: "ja_JP.UTF-8" } }).out).toMatch(/^使い方/);
  });

  it("is bold only on a terminal that shows colour", () => {
    const escape = String.fromCharCode(27);
    expect(run("--today", { colour: true }).out).toContain(`${escape}[1m20261001${escape}[0m`);
    expect(run("--today").out).not.toContain(escape);
    expect(run("--today --no-color", { colour: true }).out).not.toContain(escape);
    expect(run("--today", { colour: true, env: { NO_COLOR: "1" } }).out).not.toContain(escape);
  });
});
