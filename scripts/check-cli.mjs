// Runs the built command line as a person would: as a child process, on
// whatever system this is. `pnpm test:cli` builds first. The rules of the
// command line are tested as plain data in src/cli.test.ts; this is the part
// only a real process can show: the exit code, the two streams, standard
// input, the environment.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "bin", "tane.mjs");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
// An environment with no language of its own, so each case says what it means.
const bare = { ...process.env, LC_ALL: "", LC_MESSAGES: "", LANG: "en_US.UTF-8", NO_COLOR: "" };

let failed = 0;
function check(what, args, want, { input, env } = {}) {
  const ran = spawnSync(process.execPath, [bin, ...args], { input, encoding: "utf8", env: { ...bare, ...env } });
  const got = { code: ran.status, out: ran.stdout, err: ran.stderr };
  const problems = [];
  if (want.code !== undefined && got.code !== want.code) problems.push(`exit code ${got.code}, wanted ${want.code}`);
  for (const stream of ["out", "err"]) {
    const wanted = want[stream];
    if (wanted === undefined) continue;
    const ok = wanted instanceof RegExp ? wanted.test(got[stream]) : typeof wanted === "function" ? wanted(got[stream]) : got[stream] === wanted;
    if (!ok) problems.push(`${stream} was ${JSON.stringify(got[stream])}, wanted ${wanted instanceof RegExp ? wanted : JSON.stringify(wanted)}`);
  }
  if (problems.length > 0) failed += 1;
  console.log(`${problems.length === 0 ? "ok  " : "FAIL"} ${what}${problems.map((p) => `\n       ${p}`).join("")}`);
  return got;
}

check("the version", ["--version"], { code: 0, out: `${version}\n`, err: "" });
check("help", ["--help"], { code: 0, out: /^Usage: tane/, err: "" });
check("the first numbers of a seed", ["--seed", "42", "--count", "3"], { code: 0, out: "0.6011037519201636\n0.44829055899754167\n0.8524657934904099\n", err: "" });
check("a text seed", ["--seed", "table", "-n", "1"], { code: 0, out: "0.12078543892130256\n", err: "" });
check("a seeded shuffle", ["--seed", "42", "--shuffle", "a", "b", "c"], { code: 0, out: "c\na\nb\n", err: "" });
check("whole numbers", ["--seed", "42", "--int", "1..6", "-n", "5"], { code: 0, out: "4\n3\n6\n5\n2\n", err: "" });
check("nothing asked for is today's seed", [], { code: 0, out: /^\d{8} {2}\d{4}-\d{2}-\d{2} \(UTC\)\nnext at \d{4}-\d{2}-\d{2}T00:00:00\.000Z\n$/, err: "" });
check("today by a place's midnight", ["--today", "--zone", "Asia/Tokyo"], { code: 0, out: /^\d{8} {2}\d{4}-\d{2}-\d{2} \(Asia\/Tokyo\)\nnext at \d{4}-\d{2}-\d{2}T15:00:00\.000Z\n$/, err: "" });
check("no seed: one is drawn and named on standard error", ["-n", "1"], { code: 0, out: /^0\.\d+\n$|^\d(\.\d+)?e-\d+\n$/, err: /^tane: seed \d+ \(pass --seed \d+ to repeat this\)\n$/ });
check("what cannot be done goes to standard error, with exit code 1", ["--seed", "42", "--pick"], { code: 1, out: "", err: "tane: there are no items to draw from\n" });
check("a zone nobody knows is exit code 1", ["--today", "--zone", "Nowhere/Land"], { code: 1, out: "", err: "tane: “Nowhere/Land” is not a time zone this system knows\n" });
check("a wrong option is exit code 2", ["--bogus"], { code: 2, out: "", err: /unknown option --bogus/ });
check("standard input, one item to a line", ["--seed", "42", "--shuffle", "--stdin"], { code: 0, out: "old fish\nred fish\nblue fish\n", err: "" }, { input: "red fish\nblue fish\nold fish\n" });
check("standard input with Windows line endings", ["--seed", "42", "--shuffle", "--stdin"], { code: 0, out: "old fish\nred fish\nblue fish\n", err: "" }, { input: "red fish\r\n\r\nblue fish\r\nold fish\r\n" });
check("empty standard input", ["--seed", "42", "--shuffle", "--stdin"], { code: 1, out: "" }, { input: "" });
const json = check("JSON", ["--seed", "42", "--int", "1..6", "-n", "5", "--json"], { code: 0, out: /^\{\n {2}"format": 1,/, err: "" });
try {
  const data = JSON.parse(json.out);
  if (data.seed !== 42 || data.integers.join() !== "4,3,6,5,2" || data.position !== "tane:1:42:5") throw new Error("not what was asked for");
  console.log("ok   the JSON parses, and is what was asked for");
} catch (error) {
  failed += 1;
  console.log(`FAIL the JSON parses: ${error.message}`);
}
check("carrying on from a position", ["--at", "tane:1:42:5", "-n", "1"], { code: 0, out: "0.5265925421845168\n", err: "" });
check("CSV, ended CRLF", ["--seed", "42", "-n", "2", "--csv"], { code: 0, out: "draw,value,state\r\n1,0.6011037519201636,1831565855\r\n2,0.44829055899754167,3663131668\r\n", err: "" });
check("a part's seed", ["--seed", "42", "--derive", "deck"], { code: 0, out: "3104557420\n", err: "" });
check("Japanese by flag", ["--seed", "42", "--pick", "--lang", "ja"], { code: 1, err: "tane: 選ぶ項目がありません\n" });
check("Japanese by LANG", ["--help"], { code: 0, out: /^使い方: tane/ }, { env: { LANG: "ja_JP.UTF-8" } });
check("Japanese by LC_ALL over LANG", ["--bogus"], { code: 2, err: /^tane: 不明なオプションです: --bogus\n/ }, { env: { LC_ALL: "ja_JP.UTF-8", LANG: "en_US.UTF-8" } });
check("English by flag over LANG", ["--help", "--lang", "en"], { code: 0, out: /^Usage: tane/ }, { env: { LANG: "ja_JP.UTF-8" } });
const plain = (text) => !text.includes(String.fromCharCode(27));
check("no colour when piped", ["--today"], { code: 0, out: plain });
check("NO_COLOR is honoured", ["--today"], { code: 0, out: plain }, { env: { NO_COLOR: "1" } });

if (failed > 0) {
  console.log(`${failed} failed`);
  process.exit(1);
}
console.log("the command line does what it says, on", process.platform, process.version);
