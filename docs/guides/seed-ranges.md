---
title: Seed normalization and reserved ranges
section: explanation
order: 8
description: Normalise seeds, tell a sequence seed from a distributable one, and reserve blocks.
---

## Stream seeds and allocated seeds differ

A mulberry32 stream reads an integer as unsigned 32 bits. `seedFrom` preserves numeric text such as 42 and hashes other text; hashSeed("42") is a different operation. `isSeed` checks externally allocated positive seeds from 1 to most, 2³¹−1 by default. A zero stream seed can therefore be valid while isSeed(0) is false.

```ts
import { drawSeed, hashSeed, isSeed, mulberry32, seedFrom } from "@johnmorrisdotca/tane";

console.log(seedFrom("42"), hashSeed("42"));
console.log(isSeed(0), mulberry32(0)());
console.log(drawSeed(mulberry32(42), { most: 100, reserved: [{ from: 10, size: 5 }] }));
```

## Allocate around reservations

A SeedBlock is a half-open range starting at from and containing size seeds. checkBlocks sorts and validates whole, nonoverlapping blocks within the upper bound. drawSeed skips them and refuses a range whose every seed is reserved.

## Calendar blocks

Daily allocation uses the decimal YYYYMMDD offset, not a day count since an epoch. A daily block needs room for that number and can be reserved from random allocation. The [daily guide](daily-seeds.md) shows the inverse and explicit time zone.
