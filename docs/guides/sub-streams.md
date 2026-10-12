---
title: Keep features on separate streams
section: how-to
order: 3
description: Learn keep features on separate streams.
---

## Derive by stable names

`deriveSeed` names independent work from a master seed. Adding another label’s stream does not consume or move the earlier ones. Labels are ordered text or integers, so use the same names and order on each host.

```ts
import { deriveSeed, mulberry32 } from "@johnmorrisdotca/tane";

const deckSeed = deriveSeed(42, "deck");
const decoration = mulberry32(deriveSeed(42, "decoration"));
for (let draw = 0; draw < 20; draw += 1) decoration();
console.log(mulberry32(deckSeed)());
console.log(mulberry32(deriveSeed(42, "deck"))());
```

## Fork by order

`fork` consumes one draw of its parent to seed a new source. It is useful when order is intentional; a named deriveSeed is better when features must remain stable as other work is added.

## Keep draw counts deliberate

Sharing one mutable source across unrelated features couples their outputs. Use named sources for decks, terrain, decorations or test fixtures, and save each position you need to resume. [Engine design](engine-design.md) explains the state and compatibility boundary.
