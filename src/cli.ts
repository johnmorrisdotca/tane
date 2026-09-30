import { dailySeed, dayKey, nextDayStart } from "./daily.ts";
import { int, pick, sample, shuffled } from "./draws.ts";
import { deriveSeed } from "./random.ts";
import { counted, fromText, toCSV, toText, SAVE_FORMAT, type CountedRandom } from "./save.ts";
import { drawSeed, seedFrom } from "./seeds.ts";
import { STRINGS, fillIn, type Language } from "./strings.ts";
import { VERSION } from "./version.ts";

/**
 * The command line, as a pure function: arguments and surroundings in, what
 * to print and the exit code out. `bin/tane.mjs` is the few lines that hand it
 * the real process. Nothing here touches a file, a terminal or the network,
 * so every line of it is tested as plain data.
 */

/** What the command line is run in. All of it is optional. */
export type CliSurroundings = {
  /** The environment, for the language (`LC_ALL`, `LC_MESSAGES`, `LANG`) and `NO_COLOR`. */
  env?: Record<string, string | undefined>;
  /** Standard input, when `--stdin` asks for it: one item to a line. */
  stdin?: string;
  /** Whether the output is a terminal that shows colour. `NO_COLOR` and `--no-color` still turn it off. */
  colour?: boolean;
  /** The system's language where the environment names none: what `Intl` says, on Windows. */
  locale?: string;
  /** The time, in epoch milliseconds, for `--today`. Now, unless given. */
  now?: number;
  /** Where a seed comes from when none is given: a function like `Math.random`, which it is unless given. */
  random?: () => number;
};

/** What the command line came to. */
export type CliResult = {
  /** 0 when all went well, 1 when what was asked for could not be done, 2 when the command itself was wrong. */
  code: 0 | 1 | 2;
  /** For standard output. */
  out: string;
  /** For standard error. */
  err: string;
};

/** The most numbers one run prints. */
export const CLI_MAX_COUNT = 10_000;

/** The language the command line speaks: `--lang`, or the environment's, or the system's; Japanese for `ja…`, English for anything else. */
export function cliLanguage(flag: string | undefined, env: Record<string, string | undefined> = {}, locale?: string): Language {
  const named = [flag, env.LC_ALL, env.LC_MESSAGES, env.LANG].find((value) => value !== undefined && value !== "" && value !== "C" && value !== "POSIX" && !value.startsWith("C."));
  return (named ?? locale ?? "en").toLowerCase().startsWith("ja") ? "ja" : "en";
}

const FLAGS_WITH_VALUES: Record<string, string> = { "-s": "seed", "--seed": "seed", "-n": "count", "--count": "count", "--skip": "skip", "--int": "int", "--sample": "sample", "--derive": "derive", "--zone": "zone", "--at": "at", "--lang": "lang" };
const FLAGS: Record<string, string> = { "--shuffle": "shuffle", "--pick": "pick", "--today": "today", "-j": "json", "--json": "json", "--csv": "csv", "--stdin": "stdin", "--no-color": "noColour", "--no-colour": "noColour", "-h": "help", "--help": "help", "-v": "version", "--version": "version" };

type Asked = { values: Record<string, string>; labels: string[]; flags: Set<string>; items: string[]; wrong: { message: "cliUnknown" | "cliNeeds"; part: string } | null };

/** The arguments sorted into options and items. */
function sortArguments(args: readonly string[]): Asked {
  const asked: Asked = { values: {}, labels: [], flags: new Set(), items: [], wrong: null };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] as string;
    const [name, inline] = arg.startsWith("--") && arg.includes("=") ? [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)] : [arg, undefined];
    if (arg === "--") {
      asked.items.push(...args.slice(i + 1));
      break;
    }
    if (name in FLAGS_WITH_VALUES) {
      const value = inline ?? args[++i];
      if (value === undefined) {
        asked.wrong ??= { message: "cliNeeds", part: name };
        break;
      }
      const key = FLAGS_WITH_VALUES[name] as string;
      if (key === "derive") asked.labels.push(value);
      else asked.values[key] = value;
    } else if (name in FLAGS && inline === undefined) asked.flags.add(FLAGS[name] as string);
    // The first wrong option is the one reported; the rest are still read, so that the report comes in the language asked for.
    else if (arg.startsWith("-") && arg !== "-" && !/^-\d/.test(arg)) asked.wrong ??= { message: "cliUnknown", part: arg };
    else asked.items.push(arg);
  }
  return asked;
}

/** A field of CSV: quoted when it holds a comma, a quote or a line break. */
function field(text: string): string {
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const wholeNumber = (text: string | undefined, least: number, most: number): number | null => (text !== undefined && /^\d{1,16}$/.test(text) && Number(text) >= least && Number(text) <= most ? Number(text) : null);

/**
 * Run the command line. See `tane --help` for what it takes. One seed serves
 * the whole run, so the same command prints the same lines on every machine.
 */
export function runCli(args: readonly string[], around: CliSurroundings = {}): CliResult {
  const asked = sortArguments(args);
  const env = around.env ?? {};
  const lang = asked.values.lang;
  const language = cliLanguage(lang, env, around.locale);
  const t = STRINGS[language];
  const wrong = (message: string): CliResult => ({ code: 2, out: "", err: `tane: ${message}\n${t.cliTryHelp}\n` });
  const failed = (message: string): CliResult => ({ code: 1, out: "", err: `tane: ${message}\n` });
  if (asked.wrong !== null) return wrong(fillIn(t[asked.wrong.message], { part: asked.wrong.part }));
  if (lang !== undefined && lang !== "en" && lang !== "ja") return wrong(t.cliLangBad);
  if (asked.flags.has("help")) return { code: 0, out: t.cliUsage, err: "" };
  if (asked.flags.has("version")) return { code: 0, out: `${VERSION}\n`, err: "" };
  const json = asked.flags.has("json");
  const csv = asked.flags.has("csv");
  if (json && csv) return wrong(t.cliBoth);
  const colour = around.colour === true && !asked.flags.has("noColour") && (env.NO_COLOR === undefined || env.NO_COLOR === "");
  const bold = (text: string) => (colour ? `\u001b[1m${text}\u001b[0m` : text);

  // The one thing asked for.
  const jobs = [asked.values.int !== undefined ? "--int" : null, asked.flags.has("shuffle") ? "--shuffle" : null, asked.flags.has("pick") ? "--pick" : null, asked.values.sample !== undefined ? "--sample" : null].filter((job) => job !== null);
  if (jobs.length > 1) return wrong(fillIn(t.cliOneJob, { a: jobs[0] as string, b: jobs[1] as string }));
  const job = jobs[0] ?? null;
  const sources = [asked.values.seed !== undefined ? "--seed" : null, asked.flags.has("today") ? "--today" : null, asked.values.at !== undefined ? "--at" : null].filter((source) => source !== null);
  if (sources.length > 1) return wrong(fillIn(t.cliOneJob, { a: sources[0] as string, b: sources[1] as string }));
  if (asked.values.at !== undefined && asked.values.skip !== undefined) return wrong(fillIn(t.cliOneJob, { a: "--at", b: "--skip" }));
  if (asked.values.zone !== undefined && sources.length > 0 && !asked.flags.has("today")) return wrong(fillIn(t.cliOneJob, { a: sources[0] as string, b: "--zone" }));

  let count: number | null = null;
  if (asked.values.count !== undefined) {
    count = wholeNumber(asked.values.count, 1, CLI_MAX_COUNT);
    if (count === null) return wrong(fillIn(t.cliCountBad, { most: CLI_MAX_COUNT }));
  }
  let skip = 0;
  if (asked.values.skip !== undefined) {
    const read = wholeNumber(asked.values.skip, 0, Number.MAX_SAFE_INTEGER);
    if (read === null) return wrong(t.cliSkipBad);
    skip = read;
  }
  let range: [number, number] | null = null;
  if (asked.values.int !== undefined) {
    const read = /^(-?\d{1,15})\.\.(-?\d{1,15})$/.exec(asked.values.int);
    if (read === null || Number(read[1]) > Number(read[2])) return wrong(t.cliIntBad);
    range = [Number(read[1]), Number(read[2])];
  }
  let take = 0;
  if (asked.values.sample !== undefined) {
    const read = wholeNumber(asked.values.sample, 1, CLI_MAX_COUNT);
    if (read === null) return wrong(t.cliSampleBad);
    take = read;
  }

  // Today, when it is asked for or when nothing is.
  const nothing = args.every((arg) => arg === "--no-color" || arg === "--no-colour") || (sources.length === 0 && job === null && count === null && asked.labels.length === 0 && asked.values.skip === undefined && asked.items.length === 0 && !asked.flags.has("stdin"));
  const zone = asked.values.zone ?? "UTC";
  let today: { day: string; seed: number; zone: string; next: string } | null = null;
  if (asked.flags.has("today") || nothing) {
    const now = new Date(around.now ?? Date.now());
    try {
      today = { day: dayKey(now, zone), seed: dailySeed(now, zone), zone, next: nextDayStart(now, zone).toISOString() };
    } catch {
      return failed(fillIn(t.cliZoneBad, { part: zone }));
    }
  }

  // The seed: named, today's, a position's, or a new one.
  let err = "";
  let seed: number;
  let from: string | undefined;
  if (asked.values.at !== undefined) {
    const position = fromText(asked.values.at);
    if (position === null) return failed(fillIn(t.cliPositionBad, { part: asked.values.at }));
    seed = position.seed;
    skip = position.draws;
  } else if (asked.values.seed !== undefined) {
    seed = seedFrom(asked.values.seed);
    if (String(seed) !== asked.values.seed.trim()) from = asked.values.seed;
  } else if (today !== null) seed = today.seed;
  else {
    seed = drawSeed(around.random ?? Math.random);
    if (!json) err = `tane: ${fillIn(t.cliFresh, { seed })}\n`;
  }
  const named = seed;
  if (asked.labels.length > 0) seed = deriveSeed(seed, ...asked.labels);
  const derived = asked.labels.length > 0 ? { labels: asked.labels, from: named, seed } : undefined;
  const head = { format: SAVE_FORMAT, generator: `tane ${VERSION}`, seed: named, ...(from === undefined ? {} : { text: from }), ...(derived === undefined ? {} : { derived }), ...(today === null ? {} : { today }) };
  const print = (body: Record<string, unknown>) => `${JSON.stringify({ ...head, ...body }, null, 2)}\n`;

  // Only the seed was asked for: today's, or a part's.
  if (job === null && count === null && (today !== null || derived !== undefined)) {
    if (json) return { code: 0, out: print({}), err };
    if (derived !== undefined) return { code: 0, out: csv ? `seed,labels,derived\r\n${named},${field(derived.labels.join(" "))},${seed}\r\n` : `${bold(String(seed))}\n`, err };
    const day = today as NonNullable<typeof today>;
    if (csv) return { code: 0, out: `day,seed,zone,next\r\n${day.day},${day.seed},${field(day.zone)},${day.next}\r\n`, err };
    return { code: 0, out: `${fillIn(t.cliToday, { seed: bold(String(day.seed)), day: day.day, zone: day.zone })}\n${fillIn(t.cliNext, { time: day.next })}\n`, err };
  }

  const random: CountedRandom = counted(seed, skip);
  const position = () => toText(random.position());

  if (job === null || range !== null) {
    const many = count ?? 5;
    if (range === null) {
      if (csv) return { code: 0, out: toCSV({ seed, draws: skip }, many), err };
      const numbers = Array.from({ length: many }, () => random());
      return { code: 0, out: json ? print({ skipped: skip, numbers, position: position() }) : numbers.map((value) => `${value}\n`).join(""), err };
    }
    const [min, max] = range;
    const integers = Array.from({ length: many }, () => int(random, min, max));
    if (json) return { code: 0, out: print({ skipped: skip, min, max, integers, position: position() }), err };
    return { code: 0, out: csv ? `draw,value\r\n${integers.map((value, i) => `${skip + i + 1},${value}\r\n`).join("")}` : integers.map((value) => `${value}\n`).join(""), err };
  }

  // The items: the other arguments, split on spaces and commas, and the lines of standard input whole.
  const items = [
    ...asked.items.flatMap((item) => item.split(/[\s,]+/)).filter((item) => item !== ""),
    ...(asked.flags.has("stdin") ? (around.stdin ?? "").split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== "") : []),
  ];
  if (items.length === 0) return { ...failed(t.cliNothing), err: `${err}tane: ${t.cliNothing}\n` };
  const [name, drawn] = job === "--shuffle" ? ["shuffled", shuffled(random, items)] : job === "--sample" ? ["sampled", sample(random, items, take)] : ["picked", Array.from({ length: count ?? 1 }, () => pick(random, items))];
  if (json) return { code: 0, out: print({ skipped: skip, items, [name as string]: drawn, position: position() }), err };
  return { code: 0, out: csv ? `place,item\r\n${(drawn as string[]).map((item, i) => `${i + 1},${field(item)}\r\n`).join("")}` : (drawn as string[]).map((item) => `${item}\n`).join(""), err };
}
