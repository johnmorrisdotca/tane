/**
 * Tane 種: seeded random numbers and daily seeds.
 *
 * One seed, the same numbers everywhere: a small generator, the draws a game
 * needs from it, seeds that travel in an address with ranges kept aside, one
 * seed a day, and a stream's position written down and read back. No
 * dependencies and no DOM; `@johnmorrisdotca/tane/react` adds two hooks, and
 * `tane` is the same thing from a terminal.
 */
export * from "./random.ts";
export * from "./draws.ts";
export * from "./seeds.ts";
export * from "./daily.ts";
export * from "./save.ts";
export * from "./strings.ts";
export { runCli, cliLanguage, CLI_MAX_COUNT, type CliResult, type CliSurroundings } from "./cli.ts";
export { VERSION } from "./version.ts";
