---
title: 選択ツールの埋め込みとフック
section: how-to
order: 6
description: 選択ツールの要素をページに置き、共有するリンクに含める内容を決め、Reactのフックを使います。
---

## 選択ツールを置く

`tane-picker`を使う前に定義用のエントリーを読み込みます。ビルダーは選択、シャッフル、人数をそろえるグループ分けを本来の要素で確認し、モジュール、要素、フレーム、フレームワーク、HTMLのコードをコピーできます。

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

## 共有する内容を選ぶ

設定URLには項目の文言が入ります。伝播するイベントとフレームの通知には、その文言ではなく位置とグループが入ります。端末内のselectionは文言を返します。表示先の通知関数では、自分の一覧と位置を対応させられます。独自の乱数の関数と重みは表示先のオプションです。[埋め込みガイド](../../embeds.md)に属性、イベント、上限と情報の扱いがあります。

## Reactコンポーネント内で使う

`useSeeded`はシードが変わると作り直し、再描画のたびに共有の数列を進めません。makeはシードが変わるときに読まれるので、他の依存を変える場合はコンポーネントのkeyを変えます。`useDailySeed`は選んだ場所の午前0時に更新し、アンマウント時にタイマーを片付けます。

```ts no-run
import { createElement } from "react";
import { shuffled } from "@johnmorrisdotca/tane";
import { useSeeded } from "@johnmorrisdotca/tane/react";

export function Order({ seed }: { seed: number }) {
  const names = useSeeded(seed, (random) => shuffled(random, ["Aki", "Ben", "Cy"]));
  return createElement("p", null, names.join(", "));
}
```
