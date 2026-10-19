# 前例製造機

> あなたが下した判決が、この国の新しい法律になる。

裁判シミュレーション × 不条理コメディのブラウザゲーム。プレイヤーは架空の国の裁判官。判決は「判例」になって後の事件を縛り、広く書くほど威信が稼げる代わりに、自分の判例に自分が縛られていく。
無料・ログイン不要・PC/スマホ対応。サーバーなしの静的サイト（Vite + Preact + TypeScript / セーブは localStorage）。

- 仕様: [DESIGN.md](DESIGN.md)（コアループ §2・判例エンジン §3・アートディレクション §6.0）
- 事件・エンディングの企画: [CASES.md](CASES.md)

## v3 完成版 v1.0（いま動いている版・DESIGN_V3.md §5）

本15本（`docs/fable_cases.md` #1〜#15）。1プレイ＝その任期の3本。最初の事件3件で「判決文2枚」から選び、続きの事件3件で「判例に従う／ただし書きを付ける／判例を取り消す」を選び、条件が合えば交差事件、最後に百年後新聞。射程・威信・メーター・罷免・日数は画面に出さない。

- 任期の3本: 交差事件のある組（DESIGN_V3 §5-3 の9組のうち、交差事件が書かれている組）を1つ選んで、その2本＋別の1本。「開廷する」は、まだ結末を見ていない本・交差事件が出やすい。「本日の3本」は日付シードで全員同じ。
- 結末図鑑: 各本2つ＋交差事件2つずつ＋共通2つ（ツギハギ法の国・朝令暮改の国）。達成率を出す。
- コード: `src/v3/`（`parse.ts` 台本の読み込み、`extras.ts` 台本に無い物、`data.ts` 本と交差事件の組み立て、`engine.ts` 進行と3本の選び方の純粋関数、`CaseView.tsx` 事件画面、`screens.tsx` タイトル・百年後新聞・結末図鑑、`share.ts` 共有カード）。入口は `src/ui/App.tsx` → `V3App`。v0.2 の画面（`src/ui/AppV2.tsx` 以下）と旧エンジンは残してあるが、ビルドには含まれない。
- セリフ・判決文・予告・100年後は、台本（`docs/fable_cases.md` / `docs/fable_crossovers.md`）をビルド時にそのまま読み込む（一字も変えない。`src/v3/v3.test.ts` が台本と照合する）。
- 開発時だけ `http://localhost:5173/?stories=wing,sign,chatbot` で3本を固定できる（確認・録画用。本番ビルドでは無効）。
- スクショ: `docs/screenshots/v3/`（v1.0 は `v1-*.jpg`）。1プレイの録画: `docs/promo/play.mp4`（375px幅）

### 本・交差事件を足す手順
1. 台本 `docs/fable_cases.md` に節を足す（`## 16. 題（争点）` と、`### 最初の事件` `### 判決文` `### 続きの事件` `### 100年後` を今の節と同じ書き方で）。
2. `src/v3/extras.ts` の `EXTRAS` に1件足す（本のid・ただし書き2つ・取り消したときの一言2つ）。「実際の裁判では」を出す本は `NOTES` にも足す。交差事件の組を増やすなら `PAIRS` に足す。
3. 交差事件は `docs/fable_crossovers.md` に `## X4. 題` の節を足すだけ（`**条件**: #1 🟦 ＋ #3 🟦` の形、場面、`**判決文**`、`**100年後**`）。組×4通り（🟦🟦・🟦🟥・🟥🟦・🟥🟥）まで何本でも並べてよい。その組の3本が選ばれたとき、組の交差事件が先に探される。
4. 新しい役の立ち絵は `scripts/art-list.tsv` に足して `scripts/gen-all.sh` → `node scripts/optimize-art.mjs`。役の名前との対応は `extras.ts` の `ART_RULES`（無ければ一般市民の絵）。
5. `npm test`（台本の見出しの数と取り込めた数の一致・台本との照合・全通りの到達・立ち絵の有無）と `npm run build` を通す。

エンジン・画面のコードは触らなくてよい。図鑑の総数も自動で増える。

### 音（声・効果音・BGM）
- 再生は `src/v3/audio.ts`（Web Audio。最初のタップで起動。画面右上の「音」で入/切、設定はこの端末に保存）。ファイルが無い音は鳴らさず、無音で進む。
- 声: `npm run voice`（`scripts/voice.ts`。VOICEVOX をローカルで起動しておく）で台本の全セリフ・判決文・決まり文句を `public/audio/voice/` に作る。セリフ本文 → ファイルの対応が `manifest.json`、表記用の話者一覧が `credits.json`（タイトルと結末図鑑に「音声：VOICEVOX:〜」と出す。利用規約で必須）。本や交差事件を足したら実行する（`src/v3/audio.test.ts` が声の無いセリフを見つける）。
- 効果音 `public/audio/sfx/{gavel,stamp,paper,extra,murmur,strike,tap}.mp3`、BGM `public/audio/bgm/{court,extra,future}.mp3`（ループ・音量0.3。法廷→号外→百年後で切り替え）。

## 開発

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest（判例エンジン: 適用判定・最具体判例・区別/判例変更・抽選・メーター・エンディング）
npm run sim        # バランス用シミュレーター（方針ごとに N プレイ。npm run sim -- 2000）
npm run build      # tsc + vite build → dist/
npm run preview    # dist/ をローカルで確認
```

Node.js 20 以上を推奨（開発は 24 で確認）。

### シミュレーター（`npm run sim`）

方針（常に広く / 常に狭く / ランダム / 常に世論に従う / 判例どおり(慎重) / **広く＋判例どおり連打** / **世論を読んで区別**）ごとに N プレイして、次を出力する。

| 指標 | 目標（DESIGN §8.3） |
|---|---|
| 既存判例が適用された事件の割合 | 40〜60%（ランダム方針。広く裁く方針ほど高く、狭いほど低い＝射程の差が出る） |
| 罷免率（ランダム方針） | 10〜25% |
| **「広く＋判例どおり連打」の罷免率** | ランダムより高い（連打が最強にならない＝ただし書きに意味がある） |
| 区別（ただし書き）の回数/プレイ | 「世論を読んで区別」で約4回。罷免はほぼ0 |
| 1プレイで判例が3回以上適用 | 大半のプレイで満たす |
| 連鎖事件の出現率・危機事件の出現 | 参考値 |
| 自動生成事件の割合 | 0%（原則オフ） |
| エンディング分布・到達できる名前付き種数 | 偏りの確認 |
| 例外・クラッシュ | 0 |

最新の結果は [docs/sim-result.txt](docs/sim-result.txt)（ランダム: 罷免 22.9% / 判例適用 48.4%、広く＋判例どおり連打: 罷免 29.0%、世論を読んで区別: 罷免 0.5% / 区別 約4回）。

バランスのつまみ:
- `src/engine/meters.ts` — 射程倍率、区別のコスト（−1）、判例変更のコスト（−4）、**判例どおりで世論と逆の減り（−3）**、「国が荒れている」の閾値（±5）、日々の重圧（4日ごと）、メーターの自然回復
- `src/engine/selector.ts` — 自動生成の確率（0）、判例が当てはまる事件・連鎖事件の重み（×3）
- `src/engine/issues.ts` — 1任期に出る争点の数（3）
- `src/data/issues.ts` — 争点ごとのメーター変動 / `src/data/mood.ts` — 号外の「国の様子」の文

## 構成

```
src/
  engine/      UIに依存しない純粋関数（ここをテストで固めてある）
    ontology / precedent / ruling / selector / issues / mood / generate / meters / endings / text / newsText / rng / state
  data/        ontology.ts issues.ts news.ts mood.ts endings.ts generated.ts  cases/*.ts（手書き90件＋危機6件。1任期はそのうち3争点）
  ui/          App・screens(Title/Court/Result/Album)・components・styles.css・share.ts・storage.ts
scripts/       sim.ts（シミュレーター） / optimize-art.mjs（画像→WebP） / gen*.sh（Codex 画像生成）
public/art/    本番用イラスト（WebP・最大幅512px・1枚100KB以下）
art-src/       生成した元PNG（gitignore）
```

事件を足すには `src/data/cases/*.ts` に `CaseDef` を追記するだけ（出現条件は `requires`、★事件は `star: true`）。名前付きエンディングは `src/data/endings.ts` に条件関数を足す。

## 画像（Codex CLI の image_generation）

全画像で共通のSTYLEプロンプト（`scripts/style.txt`）を使い、`cat` と `elder` を画風の参照画像として添付して統一感を保つ。

```bash
scripts/gen.sh <name> "<被写体の説明>"      # art-src/<name>.png を1枚生成
scripts/gen-all.sh 2                         # scripts/art-list.tsv の未生成分をまとめて生成（同時2本）
node scripts/optimize-art.mjs                # art-src/*.png → public/art/*/*.webp（≤512px, ≤100KB）
```

生成済み（`public/art/`、計45枚）: 立ち絵25（主体の葉15＋被告役10）／場面2（`scene/title`・`scene/court`）／号外の写真6（争点ごと `news/news-<争点>`）／★エンディング挿絵12（`ending/end-<id>`）。
画像が無い当事者は、墨ベタの切り絵風シルエット（SVG）で代用される（絵文字は使わない）。使用量上限に当たったら `gen-all.sh` は途中で止まるので、時間を置いて再実行すれば続きから生成される（同時数は 2〜3 本に抑えること）。
画風が揃っているかの確認用に `node scripts/contact.mjs <出力.png> <name>...` でコンタクトシートを作れる（結果は `docs/art-contact/`）。

`docs/screenshots/` に画面のスクショ（スマホ幅375px・PC 1280px。v0.2: メーター非表示・ただし書きが連結した条文）、`docs/sim-result.txt` に `npm run sim` の出力を置いている。

## 公開（デプロイ手順）

静的ファイルだけなので、どこでも置ける。`vite.config.ts` は `base: './'` なので、ルート直下でもサブパス（GitHub Pages の `/<repo>/`）でもそのまま動く。

### Cloudflare Pages

- Framework preset: None / Build command: `npm run build` / Build output directory: `dist`
- Node のバージョンは環境変数 `NODE_VERSION=20` 以上

### GitHub Pages

`.github/workflows/pages.yml` を同梱している（`main` へ push すると build → Pages へ公開）。リポジトリの Settings → Pages で Source を「GitHub Actions」にする。

### 公開前チェックリスト

- [ ] `index.html` の `og:image` / `twitter:card` 用に `public/ogp.png`（1200×630）がある（`scripts/make-ogp.html` をブラウザで開いて保存）
- [ ] 公開URLを決めたら `index.html` の `og:url` を足す（任意）
- [ ] `npm test` / `npm run build` が通る
- [ ] スマホ実機でタップ送り・木槌演出・結果画像の保存を確認

計測は任意（Cloudflare Web Analytics は cookie 不要・無料）。入れる場合は `index.html` にスニペットを足す。

## フォントについて

見出しと本文は Google Fonts（Shippori Mincho B1 / Dela Gothic One / Klee One）を `index.html` から読み込む。オフラインでも `serif` でフォールバックして遊べる（見た目は変わる）。完全にオフラインで配信したい場合は、フォントを `public/fonts/` に置いて `@font-face` に差し替える。

## ライセンス・注意

実在の人物・団体・宗教・国名とは関係ありません。イラストは Codex CLI の画像生成で作成したものです。
