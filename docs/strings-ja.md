# Tane's words, in English and Japanese

Made from `src/strings.ts` by `pnpm docs:make`; a test fails if the two differ, so this list is never out of date.

**The Japanese has not yet been reviewed by a native reader.** If a line reads wrongly or unnaturally, please
open a *Fix a translation* issue with the string's name. `{seed}` and the other braces are filled in when shown.
Names that begin `cli` are the command line's; names that begin `page` are the seed explorer's on the demo page.

| Name | English | Japanese |
| --- | --- | --- |
| `cliUnknown` | unknown option {part} | 不明なオプションです: {part} |
| `cliNeeds` | {part} needs a value | {part} には値が必要です |
| `cliTryHelp` | Try `tane --help`. | `tane --help` をご覧ください。 |
| `cliCountBad` | --count takes a whole number from 1 to {most} | --count は1〜{most}の整数です |
| `cliSkipBad` | --skip takes a whole number from 0 | --skip は0以上の整数です |
| `cliIntBad` | --int takes two whole numbers, the lower first: 1..6 | --int は整数2つを小さいほうから指定します: 1..6 |
| `cliLangBad` | --lang takes en or ja | --lang は en か ja です |
| `cliZoneBad` | “{part}” is not a time zone this system knows | 「{part}」は、このシステムが知らないタイムゾーンです |
| `cliBoth` | --json and --csv are one or the other | --json と --csv は同時に使えません |
| `cliOneJob` | {a} and {b} are one or the other | {a} と {b} は同時に使えません |
| `cliNothing` | there are no items to draw from | 選ぶ項目がありません |
| `cliSampleBad` | --sample takes a whole number from 1 | --sample は1以上の整数です |
| `cliFresh` | seed {seed} (pass --seed {seed} to repeat this) | シード {seed}（--seed {seed} で同じ結果を再現できます） |
| `cliToday` | {seed}  {day} ({zone}) | {seed}  {day}（{zone}） |
| `cliNext` | next at {time} | 次の切り替わり: {time} |
| `cliPositionBad` | “{part}” is not a position. One looks like tane:1:42:7 | 「{part}」は位置ではありません。例: tane:1:42:7 |
| `pagePitch` | One seed, the same numbers everywhere. Type a seed and everything below follows it: on this device, on any other, and on a server. | 同じシードなら、どこでも同じ数になります。シードを入力すると、下のすべてがそれに従います。この端末でも、ほかの端末でも、サーバーでも同じです。 |
| `pageName` | Tane is Japanese for a seed, the kind you plant. | 「種（たね）」は、植物の種を表す日本語です。 |
| `pageNameLink` | About the name | 名前について（英語） |
| `pageSeed` | Seed | シード |
| `pageSeedHint` | A whole number, or any words | 整数、または好きな言葉 |
| `pageSeedNumber` | Seed {seed} | シード {seed} |
| `pageSeedText` | “{text}” is seed {seed} | 「{text}」はシード {seed} です |
| `pageUseToday` | Today's | 今日のシード |
| `pageNewSeed` | New seed | 新しいシード |
| `pageCopyLink` | Copy link | リンクをコピー |
| `pageCopied` | Copied | コピーしました |
| `pageCopyFailed` | Copy the address bar | アドレスバーからコピーしてください |
| `pageNumbers` | Its first numbers | 最初の数 |
| `pageNumbersNote` | The raw stream for this seed, each number from 0 up to but not including 1. The same in every browser and on every server. | このシードの乱数列そのものです。どの数も0以上1未満です。どのブラウザでも、どのサーバーでも同じになります。 |
| `pageMore` | Ten more | あと10個 |
| `pageDraw` | Draw | 順番 |
| `pageValue` | Number | 数 |
| `pageState` | State after | 引いたあとの状態 |
| `pageShuffle` | A seeded shuffle | シードでシャッフル |
| `pageShuffleNote` | The same seed puts the same list in the same order. Share the link and whoever opens it sees this order. | 同じシードなら、同じリストは同じ順番になります。リンクを共有すると、開いた人にも同じ順番が表示されます。 |
| `pageItems` | Items | 項目 |
| `pageItemsHint` | Separated by spaces or commas | 空白またはカンマで区切ります |
| `pagePicked` | One picked: {item} | 選ばれた1つ: {item} |
| `pageToday` | Today's seed, worldwide | 今日のシード（世界共通） |
| `pageTodayNote` | The date in UTC as a number. Everyone gets this one today. | UTC の日付をそのまま数にしたものです。今日は誰でもこのシードです。 |
| `pageTodayHere` | Today's seed, where you are | 今日のシード（あなたの地域） |
| `pageTodayHereNote` | By midnight in {zone}, for a puzzle that turns over with your own day. | {zone} の午前0時で切り替わります。自分の1日に合わせて替わるパズルに使えます。 |
| `pageChangesIn` | Changes in | 切り替わりまで |
| `pageParts` | Separate parts, one seed | 1つのシードから、別々の部分 |
| `pagePartsNote` | A part named “dice” has a stream of its own: rolling more dice never changes the shuffle above. | 「dice」という名前の部分は、独立した乱数列です。ダイスを何回振っても、上のシャッフルは変わりません。 |
| `pageKeep` | Keep it, and read it back | 保存して、読み込む |
| `pageKeepNote` | Where this stream has got to, written three ways. The line of text is the one to paste into a message. | この乱数列がどこまで進んだかを、3つの形式で書き出します。メッセージに貼るならテキストの1行が便利です。 |
| `pageAsText` | Text | テキスト |
| `pageAsJson` | JSON | JSON |
| `pageAsCsv` | CSV | CSV |
| `pageCopy` | Copy | コピー |
| `pagePaste` | Read one back | 読み込む |
| `pagePasteHint` | Paste a line of text or JSON | テキストの1行か JSON を貼り付けます |
| `pageRead` | Read | 読み込む |
| `pageReadBad` | That is not a position Tane wrote. | Tane が書き出した位置ではありません。 |
| `pageFoot` | mulberry32, in whole-number arithmetic: the numbers never depend on the machine. Not for secrets. | mulberry32 を整数演算だけで計算するので、数は環境に左右されません。秘密には使えません。 |
| `pageSeedIs` | The seed in use | 使用中のシード |
| `pagePosition` | {draws} drawn | {draws} 個引きました |
| `pageDice` | Eight dice | ダイス8個 |
| `pageHere` | your time zone | あなたのタイムゾーン |
| `pageShuffled` | In this seed's order | このシードの順番 |

## The command line's help

`cliUsage`, in English:

```
Usage: tane [options]

Seeded random numbers: one seed, the same numbers on every machine.

  tane --seed table --count 10       the first ten numbers of a seed
  tane --seed 42 --int 1..6 -n 5     five whole numbers from 1 to 6
  tane --seed 42 --shuffle a b c     the same order for the same seed
  tane --seed 42 --pick a b c        one of them
  tane --seed 42 --sample 2 a b c    two of them, none twice
  tane --seed 42 --derive deck       the seed of a part named "deck"
  tane --today                       today's seed, the same worldwide
  tane --today --zone Asia/Tokyo     today's seed by one place's midnight
  tane --today --shuffle a b c       today's order, the same for everybody

Options:
  -s, --seed <seed>     a whole number, or any text (hashed to a number)
  -n, --count <n>       how many numbers (1 to 10000; 5 unless said)
      --skip <n>        start after n draws
      --int <min..max>  whole numbers from min to max, both included
      --shuffle         the items in a seeded order
      --pick            one of the items (with --count, that many picks)
      --sample <n>      n of the items, none twice
      --derive <label>  the seed of a labelled part (may be given twice)
      --today           today's seed and the day; with a job, the seed it uses
      --zone <zone>     an IANA time zone for --today (UTC unless said)
      --at <position>   carry on from a position: tane:1:42:7
      --stdin           read items from standard input, one to a line
  -j, --json            print JSON (format 1)
      --csv             print CSV
      --lang <en|ja>    English or Japanese (default: your system's)
      --no-color        no colour (NO_COLOR is honoured too)
  -h, --help            this help
  -v, --version         the version

Items are the other arguments, separated by spaces or commas. With no seed,
one is drawn and named on standard error, so that the run can be repeated.
With nothing asked for, prints today's seed. Not for secrets: the numbers can
be predicted. Exit codes: 0 done, 1 what was asked for could not be done,
2 the command was wrong.
```

and in Japanese:

```
使い方: tane [オプション]

シード付きの乱数です。同じシードなら、どの環境でも同じ数になります。

  tane --seed table --count 10       シードの最初の10個の数
  tane --seed 42 --int 1..6 -n 5     1から6までの整数を5個
  tane --seed 42 --shuffle a b c     同じシードなら同じ順番になります
  tane --seed 42 --pick a b c        1つ選びます
  tane --seed 42 --sample 2 a b c    重複なしで2つ選びます
  tane --seed 42 --derive deck       「deck」という名前の部分のシード
  tane --today                       今日のシード（世界共通）
  tane --today --zone Asia/Tokyo     その地域の午前0時で切り替わる今日のシード
  tane --today --shuffle a b c       今日の順番（誰でも同じです）

オプション:
  -s, --seed <シード>    整数、または任意の文字列（ハッシュして数にします）
  -n, --count <個数>     数の個数（1〜10000、指定しなければ5）
      --skip <個数>      n 個引いたあとから始めます
      --int <最小..最大> 最小から最大までの整数（両端を含みます）
      --shuffle          項目をシードで決まる順番に並べます
      --pick             項目から1つ選びます（--count を付けるとその回数）
      --sample <個数>    項目から重複なしで n 個選びます
      --derive <ラベル>  ラベルを付けた部分のシード（複数指定できます）
      --today            今日のシードと日付。ほかの指定があれば、そのシードとして使います
      --zone <タイムゾーン>  --today に使う IANA タイムゾーン（指定しなければ UTC）
      --at <位置>        位置から続けます: tane:1:42:7
      --stdin            標準入力から項目を読みます（1行に1つ）
  -j, --json             JSON で出力します（形式 1）
      --csv              CSV で出力します
      --lang <en|ja>     英語または日本語（既定はシステムの言語）
      --no-color         色を付けません（NO_COLOR にも従います）
  -h, --help             このヘルプ
  -v, --version          バージョン

項目は残りの引数で、空白またはカンマで区切ります。シードを指定しない場合は新しく選び、
同じ結果を再現できるよう標準エラーに表示します。何も指定しない場合は
今日のシードを表示します。秘密には使えません。数は予測できます。
終了コード: 0 完了、1 指定された内容を実行できなかった、2 コマンドの誤り。
```
