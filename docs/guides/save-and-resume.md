---
title: Save and resume a stream
section: how-to
order: 5
description: Learn save and resume a stream.
---

## Count source draws

`counted` is a native source with seed, draw count and position. Save its position after the work you want to resume. The count is source draws, not calls to a high-level recipe; for example a normal draw consumes two.

```ts
import { counted, fromJSON, randomAt, toJSON, toText } from "@johnmorrisdotca/tane";

const random = counted(42);
random(); random(); random();
const position = random.position();
const restored = fromJSON(toJSON(position));
if (restored === null) throw new Error("Invalid saved position");
console.log(position.draws, toText(position));
console.log(random(), randomAt(restored.seed, restored.draws)());
```

## Choose a representation

JSON includes format, algorithm, position and derived state; the reader checks their consistency. Text is a compact position line. CSV exports upcoming values and resulting states. `randomAt` resumes and `stateAt` computes the generator state without replaying every prior draw.

## Refuse a bad position

`fromJSON` and `fromText` return null for invalid or unsupported records. Check the result before resuming. The host chooses storage; the package performs no upload. The [specification](../spec.md) preserves the algorithm and format details.
