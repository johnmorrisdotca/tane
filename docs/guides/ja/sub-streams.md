---
title: 機能ごとに数列を分ける
section: how-to
order: 3
description: 機能ごとに数列を分けるの使い方と注意点。
---

## 固定の名前から作る

`deriveSeed`で、元のシードから機能ごとの数列を作ります。別の名前の数列を追加しても、以前の数列は消費されず、位置も変わりません。ラベルは順番のある文字列や整数なので、各端末で同じ名前と順番を使います。

```ts
import { deriveSeed, mulberry32 } from "@johnmorrisdotca/tane";

const deckSeed = deriveSeed(42, "deck");
const decoration = mulberry32(deriveSeed(42, "decoration"));
for (let draw = 0; draw < 20; draw += 1) decoration();
console.log(mulberry32(deckSeed)());
console.log(mulberry32(deriveSeed(42, "deck"))());
```

## 順番で分ける

`fork`は元の数列を 1 回消費して、新しい数列を作ります。順番が重要なら便利です。他の処理を増やしても機能を保ちたい場合は、名前付きの deriveSeed を使います。

## 消費回数を意識する

無関係な機能で 1 つの数列を共有すると、互いの結果が変わります。デッキ、地形、飾り、テストには名前付きの数列を使い、再開する位置を保存します。[エンジンの設計](engine-design.md)に状態と互換性の説明があります。
