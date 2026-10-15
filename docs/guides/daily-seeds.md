---
title: Make a daily puzzle
section: how-to
order: 4
description: Make a daily puzzle from a calendar day in UTC or a chosen time zone, and map seeds back to dates.
---

## Choose the calendar explicitly

UTC gives everyone the same date boundary. Name an IANA zone for a puzzle that changes at one place’s midnight. `dayKey`, `dailySeed` and `nextDayStart` use that calendar rather than assuming a day is always 24 hours.

```ts
import { dailySeed, dayKey, dayOfSeed, daySeed, nextDayStart } from "@johnmorrisdotca/tane";

const at = new Date("2026-10-11T03:00:00Z");
console.log(dayKey(at, "UTC"), dayKey(at, "America/Toronto"));
console.log(dailySeed(at, "UTC"));
console.log(nextDayStart(at, "America/Toronto").toISOString());
const block = { from: 1000000000, size: 100000000 };
console.log(dayOfSeed(daySeed("2026-10-11", block), block));
```

## Reserve a daily range

`daySeed` places the YYYYMMDD number inside a SeedBlock; the block must be large enough for that decimal offset. `dayOfSeed` reverses it or returns null when the seed names no real day. Reserve the same block when drawing non-daily seeds so the ranges stay separate.

## Keep a page open

The React daily hook refreshes at the chosen zone’s midnight. For a pure engine host, use nextDayStart to find the boundary and let the host control refresh. The [hooks](entry:react) and [seed ranges](seed-ranges.md) describe those distinct jobs.
