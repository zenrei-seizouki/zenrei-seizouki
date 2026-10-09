// art-src/*.png (Codexで生成した元画像) → public/art/<group>/<name>.webp
// 本番用: WebP・最大幅512px・1枚100KB以下。キー画像(title/court/news-*)は group で振り分け。
import sharp from 'sharp';
import { readdirSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const SRC = 'art-src';
const OUT = 'public/art';
const MAX_BYTES = 100 * 1024;

const groupOf = (name) =>
  name.startsWith('news-') ? 'news' : name.startsWith('end-') ? 'ending' : ['title', 'court'].includes(name) ? 'scene' : 'chara';

const only = process.argv.slice(2);
const files = readdirSync(SRC).filter((f) => f.endsWith('.png') && !f.includes('_v1'));
const manifest = {};
for (const f of files) {
  const name = basename(f, '.png');
  if (only.length && !only.includes(name)) continue;
  const group = groupOf(name);
  mkdirSync(join(OUT, group), { recursive: true });
  const out = join(OUT, group, `${name}.webp`);
  let q = 82;
  let w = 512;
  for (;;) {
    await sharp(join(SRC, f)).resize({ width: w, withoutEnlargement: true }).webp({ quality: q, effort: 6 }).toFile(out);
    const size = statSync(out).size;
    if (size <= MAX_BYTES) {
      console.log(`${group}/${name}.webp ${(size / 1024).toFixed(0)}KB q${q} w${w}`);
      break;
    }
    if (q > 50) q -= 8;
    else w -= 48;
  }
}
// 既存の public/art を走査して、存在する立ち絵キーの一覧を作る（UIが影絵にフォールバックするため）
const all = {};
for (const g of ['chara', 'scene', 'news', 'ending']) {
  try {
    all[g] = readdirSync(join(OUT, g)).filter((x) => x.endsWith('.webp')).map((x) => basename(x, '.webp'));
  } catch {
    all[g] = [];
  }
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(all));
console.log('manifest:', Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.length])));
