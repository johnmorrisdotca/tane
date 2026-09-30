# The generator, specified

This is what Tane computes, written so that a copy of it, in any language, can
be checked against it number for number. The test vectors at the end are made
from the code by `pnpm docs:make`, and a test fails if they and the code ever
differ. The same vectors are in [spec-vectors.json](./spec-vectors.json) for a
program to read.

Nothing here may change. A seed is kept in links, in database rows and in
saved games, and has to replay as it did. A different generator would be a new
function with a new name, never a new behaviour under an old one.

## Who carries a copy

Three packages of the family are built on these numbers, and two of them carry
their own copy of the generator so that they depend on nothing:

| Package | Its copy | The same as |
| --- | --- | --- |
| [Toranpu](https://github.com/johnmorrisdotca/toranpu) | `seededRandom(seed)` in `src/random.ts` | `mulberry32(seed)` |
| | `shuffled(items, random)` | `shuffled(random, items)`: the arguments are the other way round, the order made is the same |
| [Narabe](https://github.com/johnmorrisdotca/narabe) | `seededRandom(seed)` in `src/rules/random.ts` | `mulberry32(seed)` |
| | `drawDistinct(random, count, limit)` | `distinctBelow(random, count, limit)` |

A copy is right when it gives the vectors under [mulberry32](#mulberry32-1),
[shuffle](#shuffle) and [distinctBelow](#distinctbelow) below.

[Korokoro](https://github.com/johnmorrisdotca/korokoro)'s seeded rolls are
**not** this generator: they come from sfc32 started from a text seed, and its
dice are drawn by rejection sampling. Nothing in this document describes them.

## Arithmetic

Every value is an unsigned 32-bit integer unless said. In the definitions:

- `+` and `×` are taken modulo 2³² (they wrap);
- `^` is exclusive or, `|` is or, `>>>` is a shift right that fills with zeros;
- `u32(x)` is `x` modulo 2³² (for a negative whole number, its two's
  complement: `u32(-1)` is 4294967295).

In JavaScript, `×` is `Math.imul` followed by `>>> 0`; in C, it is a multiply
of two `uint32_t`.

## mulberry32

The state is one unsigned 32-bit integer. A stream made from a seed starts
with `state = u32(seed)`. Each draw does this, in this order:

```
state = state + 0x6D2B79F5
t     = state
t     = (t ^ (t >>> 15)) × (t | 1)
t     = t ^ (t + ((t ^ (t >>> 7)) × (t | 61)))
out   = t ^ (t >>> 14)
```

`out` is the draw as an integer from 0 to 2³² − 1, and the number handed back
is `out / 4294967296`: a double from 0 up to, but not including, 1. The
division is exact in IEEE 754 double precision, so the number is the same on
every machine.

The state after `n` draws is `u32(seed + n × 0x6D2B79F5)`, whatever was drawn,
so a stream can be picked up at any draw without making the ones before it.
After 2³² draws the state is the seed again: the stream repeats.

`step(state)` is one draw as a function: it hands back the number and the new
state. `stateAt(seed, n)` is the state after `n` draws.

mulberry32 is by Tommy Ettinger and is in the public domain. It is a
statistical generator with 32 bits of state, not a cryptographic one.

## A number into a choice

Every draw below takes numbers from the stream in the order written, and no
others. `r` is one number from the stream.

| Function | What it computes | Draws |
| --- | --- | --- |
| `below(n)` | `floor(r × n)` | 1 |
| `int(min, max)` | `floor(min + r × (max − min + 1))` | 1 |
| `float(min, max)` | `min + r × (max − min)` | 1 |
| `chance(p)` | `r < p` | 1 |
| `pick(items)` | `items[floor(r × length)]` | 1 |
| `weightedIndex(weights)` | see below | 1 |
| `normal(mean, spread)` | see below | 2 |

All of it is double-precision arithmetic, done in the order written.

**Shuffle** (Fisher–Yates, from the end). For `i` from `length − 1` down to 1:
draw `r`, let `j = floor(r × (i + 1))`, and swap the items at `i` and `j`. A
list of `length` items takes `length − 1` draws; a list of one or none takes
none.

**Sample** (`count` items, none twice). Copy the list. For `i` from 0 up to
`count − 1`: draw `r`, let `j = i + floor(r × (length − i))`, and swap the
items at `i` and `j`. The answer is the first `count` items. One draw each,
the last included, even when only one item is left.

**distinctBelow** (`count` different integers below `limit`). Until `count`
have been kept (or `limit`, if that is fewer): draw `r`, let
`c = floor(r × limit)`, and keep `c` if it has not been kept already. The
answer is in the order kept. The number of draws depends on the stream.

**weightedIndex**. Let `total` be the sum of the weights, added in order. If
`total ≤ 0` the answer is 0 and **nothing is drawn**. Otherwise draw `r`, let
`roll = r × total`, and for each index in order subtract its weight from
`roll`; the answer is the first index at which `roll ≤ 0`, or the last index
if none is.

**normal** (Box–Muller). Draw `u1` and then `u2`. Replace `u1` by
`max(u1, 2⁻⁵²)`. The answer is
`mean + sqrt(−2 × ln(u1)) × cos(2π × u2) × spread`. It uses the platform's
`ln`, `sqrt` and `cos`, so its last digit may differ between platforms; no
vector is given for it, and nothing stored should depend on it.

## Seeds from text

**mix32** (MurmurHash3's 32-bit finaliser):

```
h = h ^ (h >>> 16)
h = h × 0x85EBCA6B
h = h ^ (h >>> 13)
h = h × 0xC2B2AE35
h = h ^ (h >>> 16)
```

**hashSeed(text)** is FNV-1a over the text's UTF-16 code units, then mix32:

```
h = 0x811C9DC5
for each UTF-16 code unit c of text, in order:
    h = h ^ c
    h = h × 0x01000193
return mix32(h)
```

A character outside the Basic Multilingual Plane is two code units (a
surrogate pair), each taken in turn. A port that reads text as UTF-8 bytes or
as code points gives different seeds for anything but ASCII.

**deriveSeed(seed, label₁, label₂, …)**:

```
h = mix32(u32(seed))
for each label, in order:
    text = the label, or "#" followed by its decimal digits if it is a number
    h = mix32((h ^ hashSeed(text)) + 0x9E3779B9)
return h
```

So `deriveSeed(s, "round", 3)` hashes `"round"` and then `"#3"`, and the text
label `"3"` is a different part from the number 3.

**fork(random)** draws `r` once from the stream it is given and returns a new
stream with the seed `mix32(floor(r × 4294967296))`.

**seedFrom(input)**: a whole number is `u32` of itself. Text is trimmed of
white space; if it is then one to ten decimal digits and no more than
4294967295, it is that number; otherwise it is `hashSeed` of the trimmed text.

## Seeds that travel

A seed meant to be passed around is a whole number from 1 to 2³¹ − 1
(`SEED_MOST`). **drawSeed** takes one draw `r` and, with `kept` the total size
of the reserved blocks and `most` the largest seed:

```
seed = floor(r × (most − kept)) + 1
for each reserved block, in ascending order of its first seed:
    if seed ≥ block.from: seed = seed + block.size
```

## A seed a day

A day is `YYYY-MM-DD` on the Gregorian calendar, in UTC unless an IANA time
zone is named, and **dailySeed** is `year × 10000 + month × 100 + day`:
2026-09-30 is 20260930. **daySeed(day, block)** is `block.from` plus that
number.

## A position written down

`tane:1:<seed>:<draws>` names a stream and how far into it something is:
format 1, the seed as an unsigned 32-bit integer in decimal, the number of
draws taken. The JSON form holds the same two numbers and, as a check, the
state they come to: `{ "format": 1, "algorithm": "mulberry32", "seed": 42,
"draws": 7, "state": 4231026141 }`. A reader works the state out again and
refuses a file whose state is not that.

## Test vectors

<!-- vectors:start -->
### mulberry32

The first five draws of each seed, as integers before the division by 2³².

| Seed | Draws, as integers |
| --- | --- |
| 0 | 1144304738, 1416247, 958946056, 627933444, 2007157716 |
| 1 | 2693262067, 11749833, 2265367787, 4213581821, 4159151403 |
| 42 | 2581720956, 1925393290, 3661312704, 2876485805, 750819978 |
| 20260930 | 3062186079, 3878177923, 3850244914, 3521296756, 915236091 |
| 2147483647 | 1842962257, 546041740, 1654754255, 1702490205, 513796057 |
| 4294967295 | 3850105811, 813802916, 3073704848, 4054706436, 3630262831 |

The same draws as the numbers handed back, and the state after each.

| Seed | Numbers | States |
| --- | --- | --- |
| 0 | 0.26642920868471265, 0.0003297457005828619, 0.2232720274478197, 0.1462021479383111, 0.46732782293111086 | 1831565813, 3663131626, 1199730143, 3031295956, 567894473 |
| 1 | 0.6270739405881613, 0.002735721180215478, 0.5274470399599522, 0.9810509674716741, 0.9683778982143849 | 1831565814, 3663131627, 1199730144, 3031295957, 567894474 |
| 42 | 0.6011037519201636, 0.44829055899754167, 0.8524657934904099, 0.6697340414393693, 0.17481389874592423 | 1831565855, 3663131668, 1199730185, 3031295998, 567894515 |
| 20260930 | 0.7129707557614893, 0.9029586620163172, 0.8964550015516579, 0.8198657901957631, 0.2130950081627816 | 1851826743, 3683392556, 1219991073, 3051556886, 588155403 |
| 2147483647 | 0.4290980885270983, 0.12713524978607893, 0.3852774982806295, 0.39639189024455845, 0.11962746665813029 | 3979049460, 1515647977, 3347213790, 883812307, 2715378120 |
| 4294967295 | 0.8964226141106337, 0.189478256739676, 0.7156526781618595, 0.9440599093213677, 0.8452364315744489 | 1831565812, 3663131625, 1199730142, 3031295955, 567894472 |

### hashSeed

| Text | UTF-16 code units | Seed |
| --- | --- | --- |
| (empty) | none | 2872998923 |
| `a` | 97 | 444641715 |
| `b` | 98 | 2193908274 |
| `table` | 116, 97, 98, 108, 101 | 115308040 |
| `room-7` | 114, 111, 111, 109, 45, 55 | 948657874 |
| `2026-09-30` | 50, 48, 50, 54, 45, 48, 57, 45, 51, 48 | 1595680497 |
| `種` | 31278 | 296313953 |
| `🎲` | 55356, 57266 | 3598423584 |

### deriveSeed

| Seed | Labels | Derived |
| --- | --- | --- |
| 42 | none | 142593372 |
| 42 | `"deck"` | 3104557420 |
| 42 | `"dice"` | 217474656 |
| 42 | `"round"`, `3` | 597383337 |
| 42 | `"round"`, `"3"` | 4266760536 |
| 0 | `"deck"` | 3283220001 |

### fork

| Seed of the parent | The child's first three numbers | The parent's next number |
| --- | --- | --- |
| 42 | 0.9250807701610029, 0.3315518458839506, 0.29228480509482324 | 0.44829055899754167 |
| 20260930 | 0.5502561333123595, 0.02662526606582105, 0.910766473505646 | 0.9029586620163172 |

### seedFrom

| Input | Seed |
| --- | --- |
| `"42"` | 42 |
| `" 42 "` | 42 |
| `"0"` | 0 |
| `"4294967295"` | 4294967295 |
| `"4294967296"` | 1338794561 |
| `"table"` | 115308040 |
| `"-1"` | 2139564650 |

### below and int

Eight draws each.

| Seed | Call | Values |
| --- | --- | --- |
| 42 | `below(6)` | 3, 2, 5, 4, 1, 3, 1, 3 |
| 42 | `int(1, 6)` | 4, 3, 6, 5, 2, 4, 2, 4 |
| 1 | `int(-3, 3)` | 1, -3, 0, 3, 3, -2, 1, 2 |

### shuffle

The items are the whole numbers from 0 in order.

| Seed | Items | Shuffled |
| --- | --- | --- |
| 42 | 0 to 9 | 0, 7, 3, 5, 2, 1, 8, 9, 4, 6 |
| 1 | 0 to 9 | 7, 8, 3, 2, 1, 5, 9, 4, 0, 6 |
| 20260930 | 0 to 51 | 26, 20, 36, 1, 0, 50, 24, 38, 48, 25, 15, 42, 49, 21, 39, 11, 4, 19, 6, 17, 33, 28, 2, 30, 12, 16, 3, 9, 43, 32, 35, 22, 14, 8, 18, 27, 23, 5, 47, 51, 31, 29, 34, 13, 7, 41, 45, 10, 40, 44, 46, 37 |
| 42 | 0 to 0 | 0 |

### sample

| Seed | Items | Count | Sampled |
| --- | --- | --- | --- |
| 42 | 0 to 9 | 4 | 6, 5, 8, 7 |
| 42 | 0 to 2 | 5 | 1, 0, 2 |

### distinctBelow

| Seed | Count | Limit | Drawn |
| --- | --- | --- | --- |
| 42 | 5 | 10 | 6, 4, 8, 1, 5 |
| 1 | 8 | 8 | 5, 0, 4, 7, 2, 3, 1, 6 |
| 20260930 | 4 | 225 | 160, 203, 201, 184 |

### weightedIndex

Eight draws.

| Seed | Weights | Values |
| --- | --- | --- |
| 42 | 1, 2, 3, 4 | 3, 2, 3, 3, 1, 2, 1, 3 |

### drawSeed

| Seed of the stream | Reserved | Drawn |
| --- | --- | --- |
| 42 | nothing | 1290860478 |
| 42 | 100000000 from 1000000000 | 1330750103 |

### dailySeed

| The moment | Zone | Day | Seed |
| --- | --- | --- | --- |
| 2026-09-30T12:00:00Z | UTC | 2026-09-30 | 20260930 |
| 2026-10-01T03:30:00Z | UTC | 2026-10-01 | 20261001 |
| 2026-10-01T03:30:00Z | America/Toronto | 2026-09-30 | 20260930 |
| 2026-12-31T15:00:00Z | Asia/Tokyo | 2027-01-01 | 20270101 |
| 2024-02-29T23:59:59Z | UTC | 2024-02-29 | 20240229 |

### A position

| Seed | Draws | As text | State |
| --- | --- | --- | --- |
| 42 | 7 | `tane:1:42:7` | 4231026141 |
| 4294967295 | 0 | `tane:1:4294967295:0` | 4294967295 |
<!-- vectors:end -->
