---
title: シードの正規化と予約範囲
section: explanation
order: 8
description: シードの正規化と予約範囲の使い方と注意点。
---

## 数列と配布用のシードは異なる

mulberry32 は整数を符号なし 32 ビットとして読みます。`seedFrom`は 42 のような数値の文字列をその数値にし、それ以外をハッシュします。hashSeed("42") は別の処理です。`isSeed`は外から配布する正のシードを 1〜most、既定では 2³¹−1 で確認します。そのため、数列のシード 0 は使えても isSeed(0) は false です。

```ts
import { drawSeed, hashSeed, isSeed, mulberry32, seedFrom } from "@johnmorrisdotca/tane";

console.log(seedFrom("42"), hashSeed("42"));
console.log(isSeed(0), mulberry32(0)());
console.log(drawSeed(mulberry32(42), { most: 100, reserved: [{ from: 10, size: 5 }] }));
```

## 予約を避けて配布する

SeedBlock は from から size 個のシードです。checkBlocks は整数、重なり、上限を確認して並べます。drawSeed は予約を避け、すべて予約された範囲は拒否します。

## 日付のブロック

日付用には、基準日からの日数ではなく YYYYMMDD の十進数の位置を使います。その数が入る長さを取り、ランダムな配布から予約できます。[日替わり](daily-seeds.md)に逆変換とタイムゾーンの例があります。
