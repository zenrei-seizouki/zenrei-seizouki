# 前例製造機

> あなたが下した判決が、この国の新しい法律になる。

裁判シミュレーション × 不条理コメディのブラウザゲーム。プレイヤーは架空の国の裁判官。判決は「判例」になって後の事件を縛り、広く書くほど威信が稼げる代わりに、自分の判例に自分が縛られていく。
無料・ログイン不要・PC/スマホ対応。サーバーなしの静的サイト（Vite + Preact + TypeScript / セーブは localStorage）。

- 仕様: [DESIGN.md](DESIGN.md)（コアループ §2・判例エンジン §3・アートディレクション §6.0）
- 事件・エンディングの企画: [CASES.md](CASES.md)

## v3（いま動いている版・DESIGN_V3.md）

1プレイ＝3本の事件（骨なし手羽先・罰金の看板・AIチャットボット）。最初の事件3件で「判決文2枚」から選び、続きの事件3件で「判例に従う／ただし書きを付ける」を選び、条件が合えば交差事件、最後に百年後新聞。射程・威信・メーター・罷免・日数は画面に出さない。

- コード: `src/v3/`（`data.ts` 本と交差事件のデータ、`engine.ts` 進行の純粋関数、`CaseView.tsx` 事件画面、`screens.tsx` タイトル・百年後新聞・結末図鑑、`share.ts` 共有カード）。入口は `src/ui/App.tsx` → `V3App`。v0.2 の画面（`src/ui/AppV2.tsx` 以下）と旧エンジンは残してあるが、ビルドには含まれない。
- セリフは `docs/fable_cases.md` / `docs/fable_crossovers.md` から一字も変えずに写す（`src/v3/v3.test.ts` が台本と照合する）。
- スクショ: `docs/screenshots/v3/`

### 残り12本を足す手順
1. `docs/fable_cases.md` の該当節を見ながら、`src/v3/data.ts` の `STORIES` に `Story` を1件追加する（最初の事件・判決文2枚・予告・続きの事件2件・ただし書き・100年後）。立ち絵は `public/art/chara` のキー（無ければシルエットになる）。
2. その本の「実際の裁判では」がある場合だけ `NOTES` に追加する。
3. その本を含む交差事件があれば `CROSSOVERS` に追加する（`requires` に本と向き）。
4. 遊ぶ3本を変えるなら `DEFAULT_STORIES` を書き換える（ランダムにするなら `newRun()` に渡す配列を抽選する）。
5. `npm test`（台本との照合・全通りの到達テスト）と `npm run build` を通す。

エンジン・画面のコードは触らなくてよい（データの追加だけで済む）。図鑑の総数も自動で増える。

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
