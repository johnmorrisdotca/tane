---
title: Embed a picker and use hooks
section: how-to
order: 6
description: Put the picker element on a page, decide what a shared link reveals, and use the React hooks.
---

## Mount the native picker

Import the definition entry before using `tane-picker`. The builder previews the native picker, shuffle and balanced grouping modes and copies the corresponding module, element, frame, framework or plain-HTML code.

```ts no-run
import "@johnmorrisdotca/tane/element/define";

const picker = document.createElement("tane-picker");
picker.setAttribute("items", `Aki
Ben
Cy
Dev`);
picker.setAttribute("seed", "42");
picker.setAttribute("mode", "groups");
picker.setAttribute("groups", "2");
document.body.append(picker);
console.log(picker.getAttribute("seed"));
```

## Share deliberately

The setup URL includes item text. Public composed events and frame messages use indices and groups rather than those labels; the local selection getter returns labels, while host callbacks can interpret indices using their own item list. Host-only custom random sources and weights are options rather than frame parameters. [The embed guide](../embeds.md) preserves all attributes, events, limits and privacy distinctions.

## Use React inside a component

`useSeeded` creates a value again when the seed changes; it does not advance a shared stream on every render. Its make callback is read when the seed changes, so use a new component key for other dependencies. `useDailySeed` follows the named zone’s midnight and cleans up its timer on unmount.

```ts no-run
import { createElement } from "react";
import { shuffled } from "@johnmorrisdotca/tane";
import { useSeeded } from "@johnmorrisdotca/tane/react";

export function Order({ seed }: { seed: number }) {
  const names = useSeeded(seed, (random) => shuffled(random, ["Aki", "Ben", "Cy"]));
  return createElement("p", null, names.join(", "));
}
```
