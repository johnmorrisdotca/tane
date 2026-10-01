# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/). A change to the numbers any seed
produces is a breaking change, and has never been made.

## [Unreleased]

### Added

- A README Accessibility section, and the family's list of all nineteen packages, each held to its source by a test.
- `SECURITY.md`, and a `CODE_OF_CONDUCT.md` that is the family's shared text, with the copy a test holds them to in `scripts/community`.

### Changed

- **Node 22 or later**: `engines` is `>=22`, as the README, CONTRIBUTING and CI already tested. Node 20 is end-of-life. Nothing that was exported, and no seed's numbers, has changed.
- The GitHub release's notes will be that version's section of this changelog, not a pointer to it (`scripts/release-notes.mjs`).

- **A Help switch in the demo.** Beside the language chooser in the family header, shared by every demo. Off (the default) the page is as it was; on, each option row (the seed, the items to shuffle, the form a seed is kept in, reading one back) says in one plain line what it does, in English or Japanese, and every button in it has the same words as its hover text. Kept on the device. The README's pictures are retaken with it.

## [1.1.1] - 2026-10-01

Nothing that was exported has changed.

### Added

- **An API reference page**, `api.html` on the demo site: every export of every entry point, with its signature and its doc comment, made from the source when the site is built so it cannot fall behind the code. The README and the demo's header link to it.
- **An Architecture section in the README**: how the source is split and what each file is for, held to the real files by a test.

## [1.1.0] - 2026-09-30

Nothing that was exported has changed, and every seed gives the numbers it
always gave.

### Added

- **A specification.** [docs/spec.md](./docs/spec.md) says what every function
  computes, in words a port can follow, with test vectors, also as
  `docs/spec-vectors.json`. The tests run a second implementation, written
  from those words, against the package. Both files ship in the package.
- **A stream's position, kept and read back.** `counted(seed)` is a stream
  that counts its draws; `randomAt(seed, draws)` picks a stream up at any draw
  in one step; `stateAt` is the state there. `toJSON` and `fromJSON`, `toText`
  and `fromText` (`tane:1:42:7`), and `toCSV` for a spreadsheet. What is read
  is never trusted: a position that does not add up is refused.
- `seedFrom`: a seed from whatever a person typed, a whole number as itself
  and any other text hashed.
- **A command line.** `tane --seed table --count 10`, `--int 1..6`,
  `--shuffle`, `--pick`, `--sample`, `--derive`, `--today` with `--zone`,
  `--at` a position, `--stdin`, `--json` and `--csv`, in English and Japanese,
  on Linux, macOS and Windows. `runCli` is the same thing as a pure function.
- **Japanese.** Every string the command line and the explorer show is in
  `STRINGS`, in English and Japanese, listed side by side in
  `docs/strings-ja.md`. Not yet reviewed by a native reader.
- `VERSION`, `fillIn`, `languageOf`, and the types `StreamPosition`,
  `SavedStream`, `CountedRandom`, `TaneStrings`, `Language`, `CliSurroundings`
  and `CliResult`.
- The demo is a seed explorer, in the family's look, in English and Japanese:
  type a seed and see its first numbers, a shuffle, today's seed, and its
  position to copy or read back.
- Checks: the package is packed with npm, installed into an empty project and
  used by `import`, by `require` and as a command, on Linux, macOS and Windows;
  the README's examples are run by the tests; React, Vue, Svelte, Angular and a
  plain page are each built from the packed tarball and opened in Chromium and
  WebKit; and the demo is driven by taps in both.

### Changed

- The README follows the family's order, with a full reference, and the
  package's description and keywords say more of what it does.
- The exports name an `import` condition beside `default`. Both point at the
  same file as before.

## [1.0.1] - 2026-09-30

### Fixed

- The exports use the `default` condition, so a CommonJS loader (such as a
  test runner that compiles to CommonJS) finds the package as well as an ES
  module import does.

## [1.0.0] - 2026-09-30

### Added

- `mulberry32` (also `seededRandom`): a seeded stream shaped like `Math.random`,
  with its numbers pinned by golden-value tests.
- `step`: the generator as a pure function over one stored integer.
- `hashSeed`, `deriveSeed` and `fork`: seeds from text, labelled sub-streams,
  and a stream split off another.
- Draws: `below`, `int`, `float`, `chance`, `pick`, `shuffle`, `shuffled`,
  `sample`, `distinctBelow`, `weightedIndex`, `weightedPick` and `normal`.
- Seeds that travel: `SEED_MOST`, `isSeed`, seed blocks with `inBlock` and
  `checkBlocks`, and `drawSeed` / `freshSeed`, which never land in a reserved
  block.
- Days: `dayKey`, `dailySeed`, `isDayKey`, `addDays`, `daysBetween`,
  `nextDayStart`, `daySeed` and `dayOfSeed`, in UTC or any IANA time zone.
- React hooks `useDailySeed` and `useSeeded`, from `@johnmorrisdotca/tane/react`.
- A static demo, published to GitHub Pages.

[Unreleased]: https://github.com/johnmorrisdotca/tane/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/johnmorrisdotca/tane/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/johnmorrisdotca/tane/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/johnmorrisdotca/tane/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/johnmorrisdotca/tane/releases/tag/v1.0.0
