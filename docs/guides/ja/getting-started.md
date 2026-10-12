---
title: はじめに
section: tutorial
order: 1
description: はじめにの使い方と注意点。
---

Tane を入れ、1 つのシードから同じ数列を再現します。基本エンジンは Node 22 以降とブラウザーで使え、DOM も実行時の依存パッケージも必要ありません。

## インストール

```sh
npm install @johnmorrisdotca/tane
```

型も含まれています。React は別のフック用エントリーを使う場合だけ必要です。

## 同じ数列を出す

```ts
import { mulberry32, seedFrom } from "@johnmorrisdotca/tane";

const seed = seedFrom("room-7");
const first = mulberry32(seed);
const second = mulberry32(seed);
console.log([first(), first(), first()]);
console.log([second(), second(), second()]);
```

乱数の関数は 0 以上 1 未満の数を返し、呼ぶたびに進みます。同じシードで新しく作ると最初から、同じ関数を使い続けると続きから出ます。`seedFrom`は数値を読み、文字列をハッシュします。

## 使い方を選ぶ

[並べ替えと選択](shuffle-and-pick.md)、[独立した数列](sub-streams.md)、[日替わりのシード](daily-seeds.md)、[保存と再開](save-and-resume.md)、[埋め込みとフック](embed-and-hooks.md)へ進みます。[公開 API](entry:main)に全関数があります。
