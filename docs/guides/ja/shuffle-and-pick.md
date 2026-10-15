---
title: 並べ替え・選択・重み
section: how-to
order: 2
description: 並べ替え、選択、抽出、重み付きの選択に合う関数を使い、乱数の消費を予測できるようにします。
---

## 用途に合う関数を使う

`below`は上限を含まず、`int`は両端を含み、`float`は上限を含みません。`pick`は1項目を選びます。`shuffled`はコピーを返し、`shuffle`は渡した配列を直接並べ替えます。

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

## 同じ位置を選び直さない

`sample`は一覧の位置を重複なく選び、一覧より多い要求は長さに合わせます。入力に同じ値が複数あれば、結果にも同じ値が出る場合があります。`distinctBelow`は重複を引き直すため、消費する回数が変わります。新しいコードにはsampleを使い、既存のシードの動作が依存する場合はdistinctBelowを保ちます。

## 重みを項目に対応させる

weightedPickには項目ごとの負でない重みを渡します。合計がない場合、weightedIndexは0です。乱数を消費する回数が変わると、その後の数列も変わります。[仕様](../../spec.md)に互換性の規則があります。
