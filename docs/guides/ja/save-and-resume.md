---
title: 数列の保存と再開
section: how-to
order: 5
description: 数列の保存と再開の使い方と注意点。
---

## 乱数の消費を数える

`counted`はシード、消費回数、位置を持つ本来の乱数の関数です。再開したい処理の後で位置を保存します。回数は乱数の呼び出し回数であり、高水準の処理の回数ではありません。正規分布の 1 回は乱数を 2 回使います。

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

## 形式を選ぶ

JSON には形式、アルゴリズム、位置、計算した状態が入り、読み取りで整合性を確認します。テキストは短い位置の表記です。CSV は次の数値と状態を書きます。`randomAt`で続きから出し、`stateAt`で以前の全呼び出しを再実行せずに状態を求めます。

## 不正な位置を拒否する

`fromJSON` と `fromText`は不正な記録や対応しない形式に null を返します。結果を確認してから再開します。保存先はアプリが決め、パッケージは送信しません。[仕様](../../spec.md)にアルゴリズムと形式の詳細があります。
