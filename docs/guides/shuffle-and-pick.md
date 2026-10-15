---
title: Shuffle, pick and weight choices
section: how-to
order: 2
description: Shuffle, pick, sample and weight with the right function, and keep draws predictable.
---

## Use the right draw

`below` excludes its upper bound, `int` includes both ends, and `float` excludes the upper end. `pick` chooses one item. `shuffled` copies a list; `shuffle` changes its supplied array in place.

```ts
import { int, mulberry32, sample, shuffled, weightedPick } from "@johnmorrisdotca/tane";

const random = mulberry32(42);
const names = ["Aki", "Ben", "Cy", "Dev"];
console.log(int(random, 1, 6));
console.log(shuffled(random, names));
console.log(sample(random, names, 2));
console.log(weightedPick(random, ["small", "large"], [3, 1]));
console.log(names);
```

## Sample without replacement

`sample` chooses distinct list positions and clamps a request larger than the list to its length. Equal values can still appear if the input itself repeats them. `distinctBelow` uses rejection draws, so its consumed count can vary; prefer sample for new code and retain distinctBelow when an existing seed’s behavior depends on it.

## Match weights to items

Pass one nonnegative weight per item to weightedPick. weightedIndex returns 0 when the weights total nothing. Use the native functions; a change in how many source draws your recipe consumes changes the later stream. The [specification](../spec.md) records those compatibility rules.
