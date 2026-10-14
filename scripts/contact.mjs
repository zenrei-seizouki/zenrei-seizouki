// 生成した絵を並べて、画風が揃っているか確認するためのコンタクトシート
// usage: node scripts/contact.mjs <out.png> <name> <name> ...   （art-src/<name>.png を使う）
import sharp from 'sharp';
import { existsSync } from 'node:fs';

const [out, ...names] = process.argv.slice(2);
const cols = Math.min(5, names.length);
const rows = Math.ceil(names.length / cols);
const S = 300;
const tiles = [];
for (const n of names) {
  const f = `art-src/${n}.png`;
  if (!existsSync(f)) continue;
  tiles.push({ n, buf: await sharp(f).resize(S, S, { fit: 'cover' }).png().toBuffer() });
}
const labels = tiles.map(
  (t, i) => ({
    input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="26"><rect width="${S}" height="26" fill="#231a12"/><text x="8" y="19" font-size="16" fill="#f3ead3" font-family="sans-serif">${t.n}</text></svg>`),
    left: (i % cols) * S,
    top: Math.floor(i / cols) * (S + 26) + S,
  }),
);
await sharp({ create: { width: S * cols, height: (S + 26) * rows, channels: 3, background: '#f3ead3' } })
  .composite([...tiles.map((t, i) => ({ input: t.buf, left: (i % cols) * S, top: Math.floor(i / cols) * (S + 26) })), ...labels])
  .png()
  .toFile(out);
console.log('wrote', out, tiles.length);
