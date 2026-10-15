---
title: シードの正規化と予約範囲
section: explanation
order: 8
description: シードを正規化し、数列のシードと配布用のシードを区別し、範囲を予約します。
---

## 数列と配布用のシードは異なる

mulberry32は整数を符号なし32ビットとして読みます。`seedFrom`は42のような数値の文字列をその数値にし、それ以外をハッシュします。hashSeed("42")は別の処理です。`isSeed`は外から配布する正のシードを1〜most、既定では2³¹−1で確認します。そのため、数列のシード0は使えてもisSeed(0)はfalseです。

```ts
import { drawSeed, hashSeed, isSeed, mulberry32, seedFrom } from "@johnmorrisdotca/tane";

console.log(seedFrom("42"), hashSeed("42"));
console.log(isSeed(0), mulberry32(0)());
console.log(drawSeed(mulberry32(42), { most: 100, reserved: [{ from: 10, size: 5 }] }));
```

## 予約を避けて配布する

SeedBlockはfromからsize個のシードです。checkBlocksは整数、重なり、上限を確認して並べます。drawSeedは予約を避け、すべて予約された範囲は拒否します。

## 日付のブロック

日付用には、基準日からの日数ではなくYYYYMMDDの十進数の位置を使います。その数が入る長さを取り、ランダムな配布から予約できます。[日替わり](daily-seeds.md)に逆変換とタイムゾーンの例があります。
