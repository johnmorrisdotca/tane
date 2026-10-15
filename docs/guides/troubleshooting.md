---
title: Troubleshooting & FAQ
section: troubleshooting
order: 9
description: Find out why a sequence changed, a read returns null, a call throws or a React value is stale.
---

## The sequence changed

Check seed normalization, label order, time zone and how many source draws were consumed. A reused source continues; a fresh one restarts. shuffle changes its supplied array. A added draw or changed recipe can shift later results even when the algorithm is unchanged. Compare against the specification vectors before changing compatibility behavior.

## A reader returns null

`fromJSON` and `fromText` refuse malformed, unsupported or inconsistent positions. `dayOfSeed` returns null outside the block or when the encoded digits are no real date. `parsePickerItems` returns null for empty, malformed or oversized lists. Native getter fields may be null before the element mounts or when no seed is selected; the embed guide describes them.

## A call throws

Pick and weightedPick need nonempty items. Integer bounds and counts must satisfy the native function’s range rules. checkBlocks refuses invalid or overlapping reservations; drawSeed refuses a fully reserved range. Invalid calendar days, Dates or IANA zones can raise RangeError. Saved positions require whole seeds and nonnegative safe draw counts; CSV is capped by MAX_CSV_ROWS.

## A React value is stale

useSeeded follows its seed, not arbitrary captured values. Give the component a new key when another make dependency changes. Call hooks inside a component. useDailySeed uses its named zone; a server render and hydration across midnight can legitimately show a newer day.

## Is this suitable for secrets?

Use the [existing limitations](../../README.md#not-for-secrets). Predictability is the feature needed for reproducible fixtures and puzzles; the generator does not provide cryptographic unpredictability.
