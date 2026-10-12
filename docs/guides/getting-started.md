---
title: Getting started
section: tutorial
order: 1
description: Learn getting started.
---

Install Tane and reproduce a stream from one seed. The pure engine works in Node 22 or later and in browsers; no DOM or runtime dependency is required.

## Install

```sh
npm install @johnmorrisdotca/tane
```

The package includes its types. React is optional for the separate hooks entry.

## Draw the same sequence

```ts
import { mulberry32, seedFrom } from "@johnmorrisdotca/tane";

const seed = seedFrom("room-7");
const first = mulberry32(seed);
const second = mulberry32(seed);
console.log([first(), first(), first()]);
console.log([second(), second(), second()]);
```

A source returns numbers in [0, 1). Each call advances it. Making a fresh source from the same seed starts that sequence again; reusing one continues it. `seedFrom` reads a numeric seed or hashes text.

## Pick a recipe

[Shuffle and pick](shuffle-and-pick.md), [separate sub-streams](sub-streams.md), [choose daily seeds](daily-seeds.md), [save a position](save-and-resume.md), or [embed and use hooks](embed-and-hooks.md). The [reference](entry:main) contains all native APIs.
