---
title: 日替わりの問題を作る
section: how-to
order: 4
description: 日替わりの問題を作るの使い方と注意点。
---

## カレンダーを明示する

UTC なら全員が同じ日付の境界を使います。特定の場所の午前 0 時に変える場合は IANA のタイムゾーン名を使います。`dayKey`、`dailySeed`、`nextDayStart`は、1 日を常に 24 時間とせず、そのカレンダーを使います。

```ts
import { dailySeed, dayKey, dayOfSeed, daySeed, nextDayStart } from "@johnmorrisdotca/tane";

const at = new Date("2026-10-11T03:00:00Z");
console.log(dayKey(at, "UTC"), dayKey(at, "America/Toronto"));
console.log(dailySeed(at, "UTC"));
console.log(nextDayStart(at, "America/Toronto").toISOString());
const block = { from: 1000000000, size: 100000000 };
console.log(dayOfSeed(daySeed("2026-10-11", block), block));
```

## 日替わり用の範囲を取る

`daySeed`は YYYYMMDD の数値を SeedBlock の中に置きます。その十進数の位置が入るだけの長さが必要です。`dayOfSeed`は日付へ戻し、実在する日付でなければ null です。ランダムなシードを引くときも同じブロックを予約して、範囲を分けます。

## ページを開いたままにする

React の日替わりフックは選んだ場所の午前 0 時に更新します。基本エンジンだけを使う場合は nextDayStart で境界を調べ、更新は表示先が管理します。[フック](entry:react)と[シードの範囲](seed-ranges.md)に説明があります。
