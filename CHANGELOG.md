# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/). A change to the numbers any seed
produces is a breaking change, and has never been made.

## [Unreleased]

## [1.2.2] - 2026-10-06

Nothing that was exported has changed.

### Changed

- The README takes the family's one layout, fully: a hero picture of the explorer on a desk and on a phone in light and dark, a picture of each part of the explorer (a stream, a shuffle, the day's seed in UTC and in a zone, parts, and a position kept as JSON), an Install section, an Examples section of twelve examples whose output is what they print, and the sections the standard asks for. Its pictures are in `docs/images` (WebP, light and dark) and are retaken with `pnpm screenshots:readme` (it replaces `pnpm pictures`, `docs/desktop.jpg` and `docs/phone.jpg`); they are not in the tarball, and `pnpm test:package` fails if one is.
- `docs/spec.md`, `docs/spec-vectors.json` and `docs/strings-ja.md` are no longer in the tarball: the family's standard keeps `docs/` out of what npm installs, and the README links the specification on GitHub, where it is read. The specification itself is unchanged, and so is every number the package draws.
- The README's CSV and help blocks name their language (`text`), and the API section's sub-headings read "Stream calls" and "Draw calls", so that every heading in the README is its own anchor.
- `pnpm test:readme` type-checks and runs every TypeScript and JavaScript example in the README against the built package, as a CI job of its own, and `pnpm check` holds the README to the family's lint.
- Repository only: the package and everything it exports are unchanged. `CONTRIBUTING.md` is the family's one text with a section of its own for Tane, held to the master in johnmorrisdotca/.github by `src/family.test.js`; `ci.yml` and `pages.yml` are the family's one text (`pnpm check`, the demo, and the package on Linux, macOS and Windows), and any jobs of the package's own after them.
- The demo's own stylesheet is `demo/tane.css`, named for the package like the family's.

### Fixed

- The API reference page wraps a long entry path instead of running about 2 px wider than a 360 px screen. Nothing the package exports has changed.

## [1.2.1] - 2026-10-05

Nothing that was exported has changed.

### Added

- A test holds every `@johnmorrisdotca/tane@N` version pin in the README to this package's major version.

### Changed

- The family's list, in the README and in the demo's footer, names all twenty-four packages, Karakuri and Houseki included.
- The npm description is one sentence of 250 characters or fewer, so npm and its search show it whole; it is also the repository's About text. `homepage` is the demo site and `author` is `"John Morris"`, the same in every package.
- The GitHub Actions workflows use the current versions of the actions (checkout 7, setup-node 7, pnpm/action-setup 6; configure-pages 6, upload-pages-artifact 5 and deploy-pages 5 for Pages), which clears GitHub's Node 20 deprecation warning.

## [1.2.0] - 2026-10-01

### Added

- A README Accessibility section, and the family's list of all nineteen packages, each held to its source by a test.
- `SECURITY.md`, and a `CODE_OF_CONDUCT.md` that is the family's shared text, with the copy a test holds them to in `scripts/community`.

### Changed

- **Needs Node 22 or later; Node 20 is no longer supported.** Nothing else about the package changed: no export and no seed's numbers.
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

[Unreleased]: https://github.com/johnmorrisdotca/tane/compare/v1.2.1...HEAD
[1.2.1]: https://github.com/johnmorrisdotca/tane/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/johnmorrisdotca/tane/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/johnmorrisdotca/tane/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/johnmorrisdotca/tane/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/johnmorrisdotca/tane/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/johnmorrisdotca/tane/releases/tag/v1.0.0
