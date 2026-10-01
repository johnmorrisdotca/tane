# Contributing to Tane

Thank you for helping. Bug reports, ideas and pull requests are all welcome.

## Reporting a bug

Open an issue with the seed, the calls you made, what you expected and what
you got, and where it ran (browser and version, or Node). A seed and three
lines of code are usually the whole bug report.

## Making a change

```sh
git clone https://github.com/johnmorrisdotca/tane
cd tane
pnpm install
pnpm check            # lint, types and tests: the same as CI
pnpm test:demo        # the demo in real browsers: builds it, then taps it
pnpm test:cli         # the command line, run as a child process
pnpm test:package     # npm pack, install the tarball, import every entry, run the command
pnpm test:frameworks  # React, Vue, Svelte, Angular and a plain page, built from the tarball
pnpm site             # builds the demo into ./site
pnpm dlx serve site   # or any static server
```

- **Never change a seed's numbers.** People store seeds in links, databases
  and saved games, and expect them to replay. The golden values in
  `src/*.test.ts` and the vectors in `docs/spec.md` pin every generator and
  every draw; a change that moves one is a breaking change and needs a new
  function instead.
- **The specification comes first.** `docs/spec.md` says in words what each
  function computes, and `src/spec.test.js` runs a second implementation
  written from those words. A new function that draws is specified there, with
  vectors; `pnpm docs:make` writes them into the document and into
  `docs/spec-vectors.json`.
- **Say how many draws.** Every function that draws documents how many numbers
  it takes, because a caller's next number depends on it. The README's table
  is checked against the code.
- **Stay small.** No dependencies, no DOM in the package, nothing that is not
  about seeded randomness or days.
- **Test what you change.** Tests sit beside their source as `*.test.ts`.
- **Examples in the README are run by `src/docs.test.js`.** Change a number in
  one and the other has to follow. The framework examples are the components
  `scripts/check-frameworks.mjs` builds, to the letter.
- **Words go in `src/strings.ts`**, in English and Japanese, then
  `pnpm docs:make` to bring `docs/strings-ja.md` up to date. Japanese is plain
  and polite, and uses the words Japanese programmers use: シード, 乱数,
  シャッフル.
- **Every export gets a doc comment**, and a row in the README's API tables. A
  test fails without either.
- **The demo is tested by tapping it.** `e2e/*.demo.mjs` are Playwright tests
  that open the built demo in Chromium and WebKit, at a phone's width by touch
  and at a desktop's by mouse. After every flow they check that nothing is
  wider than the screen, nothing to tap is under 44px, and the page complained
  of nothing. The first time, `pnpm exec playwright install chromium webkit`
  fetches the browsers.
- **`demo/family.css` and `scripts/family-template.mjs` are the family's**, the
  same in every sibling package. Do not edit them here: a test holds the
  stylesheet to its hash. What is Tane's own goes in `demo/site.css`.
- One change per pull request, with a line in `CHANGELOG.md` under
  *Unreleased*.

## House rules, shared by every package of the family

- Open an issue first for anything bigger than a typo, so that we can agree on the shape before you spend time on it.
- No runtime dependencies. Every function that plays or checks a game is pure: it returns new values and never changes what it was given.
- Tests sit beside the code they test. A rule you change has a test that would have caught it.
- Words a player reads come in English and Japanese. If you cannot write the Japanese, say so in the pull request and someone will.
- Option values and names are kebab case.
- Art and sound are CC0 or public domain only, checked at the source, and credited in the README. No GPL or LGPL code.
- Needs Node 22 or later. A change a user would notice gets a line in `CHANGELOG.md`.

`SECURITY.md` and `CODE_OF_CONDUCT.md` are the family's shared text, word for word, from the
[`.github` repository](https://github.com/johnmorrisdotca/.github); `scripts/community/` keeps the copy
a test holds them to. Change them there first, never here alone.

## Releasing

Maintainers bump the version in `package.json` and `src/version.ts`, and move
*Unreleased* to the new version in `CHANGELOG.md`, dated. Pushing the tag
`vX.Y.Z` runs the Release workflow, which checks that the tag matches
`package.json`, runs the checks, builds and packs the package with npm,
installs that tarball into an empty project and uses it, attaches the tarball
to a GitHub release whose notes are that version's section of the changelog
(`scripts/release-notes.mjs`), and publishes it to npm with provenance, through npm's
trusted publishing (no token is kept). A version already on npm is not
published again. The workflow can also be run by hand.
