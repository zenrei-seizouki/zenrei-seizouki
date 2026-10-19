// X投稿用の宣伝動画（縦 1080×1920・約30秒）を作る。  npm run promo
// 狙い: 「自分の判決が、別の人に持ち出されて返ってくる」の1点。無音でもテロップで分かり、音を出すと本物の声で笑える。
//
// 1. Vite の開発サーバーを立て、Playwright（Edge）で 375×667・2倍の静止画を各場面で撮る（?stories= で本を固定）
// 2. テロップはゲームと同じ明朝体で、ブラウザに透明PNGとして描かせる
// 3. 声・効果音・BGMは public/audio の mp3 を ffmpeg で並べて合成（ブラウザ録音はしない）
// 4. 静止画に軽いズーム、場面の切り替えは短いクロスフェード → docs/promo/promo-x.mp4（H.264＋AAC・faststart）
//    各場面の静止画は docs/promo/frames/ に残す
//
// 本を変えるときは、下の SHOTS（どの本を、どの判決で、どのセリフを見せるか）とテロップを書き換える。
// 必要: ffmpeg / ffprobe が PATH にあること。ブラウザは PROMO_BROWSER（既定 msedge。chrome も可）
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright-core';
import { createServer } from 'vite';
import { parseCrossovers, parseStories } from '../src/v3/parse';

const ROOT = process.cwd();
const OUT = join(ROOT, 'docs/promo/promo-x.mp4');
const FRAMES = join(ROOT, 'docs/promo/frames');
const TMP = join(ROOT, 'node_modules/.cache/promo');
const AUDIO = join(ROOT, 'public/audio');
const W = 1080;
const H = 1920;
const FPS = 30;
const FADE = 0.25; // 場面の切り替え（秒）
const TEMPO = 1.5; // 声の速さ
const COURT_VOL = 0.15;
const FUTURE_VOL = 0.3;

/** 遊ぶ3本と選ぶ判決（1件目の判決 → 続き → 交差事件）。手羽先🟦＋看板🟦 で交差事件 X1 */
const STORIES = ['wing', 'sign', 'chatbot'];
const FIRST: ('blue' | 'red')[] = ['blue', 'blue', 'blue'];
const FOLLOW = ['follow', 'follow', 'follow'];
const CROSS: 'blue' | 'red' = 'red';
/** 見せるセリフ（その事件の「原告→被告」の並びでの番号） */
const LINES = { first: [1, 2], next: [0, 2], cross: [0, 2] };

const TELOP = {
  title: 'あなたの判決が、\nこの国の法律になる',
  first: '事件① 骨なし手羽先',
  later: '数日後――',
  next: '自分の判決が、\n返ってくる',
  cross: '判決が、ぶつかる',
  paper: '百年後、この国は――',
};

// ---- 台本（セリフ → 声のファイル） ----
const stories = parseStories(readFileSync(join(ROOT, 'docs/fable_cases.md'), 'utf8'));
const crossovers = parseCrossovers(readFileSync(join(ROOT, 'docs/fable_crossovers.md'), 'utf8'));
const manifest: Record<string, { file: string }> = JSON.parse(readFileSync(join(AUDIO, 'voice/manifest.json'), 'utf8'));
const ENDINGS = stories.length * 2 + crossovers.length * 2 + 2;
const ID_NO: Record<string, number> = { wing: 1, ice: 2, sign: 3, fighter: 4, satisfy: 5, train: 6, branch: 7, armrest: 8, trademark: 9, moon: 10, uniform: 11, chatbot: 12, animal: 13, free: 14, buffet: 15 };
const story = (id: string) => stories.find((s) => s.no === ID_NO[id])!;
const linesOf = (sc: { plaintiff: { lines: string[] }; defendant: { lines: string[] } }) => [...sc.plaintiff.lines, ...sc.defendant.lines];

const sh = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'] }).toString();
const durOf = (file: string) => Number(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]));
const voiceFile = (text: string) => {
  const v = manifest[text];
  if (!v) throw new Error(`声がありません（npm run voice）: ${text}`);
  return join(AUDIO, 'voice', v.file);
};

// ---- 場面 ----
interface Cue {
  file: string;
  /** 場面の頭からの秒 */
  at: number;
  vol?: number;
  tempo?: number;
}
interface Seg {
  name: string;
  img: string;
  dur: number;
  telop?: string;
  cues: Cue[];
  zoom?: boolean;
}

/** 声を順に並べた場面（長さは声に合わせる。セリフは途中で切らない） */
function voiced(name: string, img: string, texts: string[], min: number, extra: Cue[] = [], telop?: string): Seg {
  let t = 0.2;
  const cues: Cue[] = [...extra];
  for (const tx of texts) {
    const f = voiceFile(tx);
    cues.push({ file: f, at: t, tempo: TEMPO });
    t += durOf(f) / TEMPO + 0.12;
  }
  return { name, img, dur: Math.max(min, t + 0.35), telop, cues, zoom: true };
}
const sfx = (name: string, at: number, vol = 0.8): Cue => ({ file: join(AUDIO, 'sfx', `${name}.mp3`), at, vol });

// ---- 撮影 ----
async function shoot(page: Page, name: string) {
  const path = join(FRAMES, `${name}.jpg`);
  await page.screenshot({ path, type: 'jpeg', quality: 90 });
  return path;
}
/** その事件の from 行目から to 行目まで送り、セリフを出し切ったところを撮る（声を止めているので自動では進まない） */
async function lineShot(page: Page, name: string, from: number, to: number, text: string) {
  for (let i = from; i < to; i++) await page.locator('.chosho').click();
  await page.waitForFunction((tx) => document.querySelector('.chosho .txt')?.textContent === tx, text, { timeout: 10000 });
  await page.waitForTimeout(250);
  return shoot(page, name);
}
async function decide(page: Page, sel: string, shots?: { stamp?: string; extra?: string }) {
  if (await page.locator('.skip').count()) await page.locator('.skip').click();
  await page.locator(sel).waitFor();
  await page.waitForTimeout(700);
  await page.locator(sel).click();
  const out: { stamp?: string; extra?: string } = {};
  if (shots?.stamp) {
    await page.locator('.hanko').waitFor();
    await page.waitForTimeout(350);
    out.stamp = await shoot(page, shots.stamp);
  }
  await page.locator('.nextbtn').waitFor();
  await page.waitForTimeout(600);
  if (shots?.extra) out.extra = await shoot(page, shots.extra);
  await page.locator('.nextbtn').click();
  await page.waitForTimeout(400);
  return out;
}

/** テロップ（透明PNG）や暗転・最後の画面を、ゲームと同じ明朝体で描く */
async function drawCard(page: Page, name: string, html: string, opaque = false) {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Shippori+Mincho+B1:wght@700;800&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; width: ${W}px; height: ${H}px; background: ${opaque ? '#231a12' : 'transparent'}; overflow: hidden; }
  body { font-family: 'Shippori Mincho B1', serif; position: relative; }
  .band { position: absolute; left: 0; right: 0; top: 74%; transform: translateY(-50%); background: #c8321b; border-top: 8px solid #231a12; border-bottom: 8px solid #231a12; padding: 30px 48px; text-align: center; box-shadow: 0 14px 0 rgba(35,26,18,.55); }
  .band div { color: #fff; font-weight: 800; letter-spacing: .06em; line-height: 1.32; text-shadow: 5px 5px 0 #231a12; white-space: nowrap; }
  .mid { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #f3ead3; font-weight: 800; font-size: 110px; letter-spacing: .2em; }
  .end { position: absolute; left: 70px; right: 70px; top: 50%; transform: translateY(-38%); background: #f3ead3; border: 10px solid #231a12; box-shadow: 18px 18px 0 #c8321b; padding: 56px 40px 60px; text-align: center; color: #231a12; }
  .end .a { font-size: 96px; font-weight: 800; color: #c8321b; letter-spacing: .04em; }
  .end .a b { font-family: 'Dela Gothic One', sans-serif; font-weight: 400; font-size: 128px; margin: 0 6px; }
  .end .b { font-size: 64px; font-weight: 800; margin-top: 18px; letter-spacing: .1em; }
  .end .c { font-size: 150px; font-weight: 800; margin-top: 34px; letter-spacing: .08em; border-top: 6px double #231a12; padding-top: 26px; }
  .end .d { font-size: 40px; font-weight: 700; margin-top: 10px; letter-spacing: .2em; color: #7a6a52; }
</style></head><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const path = join(opaque ? FRAMES : TMP, `${name}.png`);
  await page.screenshot({ path, omitBackground: !opaque });
  return path;
}
const band = (text: string, top = 74) => {
  const rows = text.split('\n');
  const size = Math.min(104, Math.floor((W - 120) / (Math.max(...rows.map((r) => r.length)) * 1.06)));
  return `<div class="band" style="top:${top}%">${rows.map((r) => `<div style="font-size:${size}px">${r}</div>`).join('')}</div>`;
};

async function main() {
  rmSync(FRAMES, { recursive: true, force: true });
  mkdirSync(FRAMES, { recursive: true });
  mkdirSync(TMP, { recursive: true });

  const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 5181, strictPort: false } });
  await server.listen();
  const base = server.resolvedUrls!.local[0];
  const browser = await chromium.launch({ channel: process.env.PROMO_BROWSER ?? 'msedge', headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    // 撮影中は音を出さない（声が無いと自動で送られないので、1行ずつ止めて撮れる）
    await page.route('**/audio/**', (r) => r.abort());
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {}
    });
    await page.goto(`${base}?stories=${STORIES.join(',')}`);
    await page.addStyleTag({ content: '.tools3 { display: none !important; }' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    const title = await shoot(page, '01-title');

    // 見せるセリフ
    const first = story(STORIES[0]);
    const firstLines = linesOf(first.first);
    const nextLines = linesOf(first.verdicts[FIRST[0]].next);
    const pairNos = [ID_NO[STORIES[0]], ID_NO[STORIES[1]]];
    const cross = crossovers.find((x) => x.requires.every((r) => pairNos.includes(r.no) && r.side === FIRST[pairNos.indexOf(r.no)]));
    if (!cross) throw new Error('この判決の組み合わせの交差事件がありません');
    const crossLines = linesOf(cross.scene);
    const law = first.verdicts[FIRST[0]].law;

    await page.getByRole('button', { name: /開廷する/ }).click();
    // 事件①: 最初の本
    const f1 = await lineShot(page, '02-first-a', 0, LINES.first[0], firstLines[LINES.first[0]]);
    const f2 = await lineShot(page, '03-first-b', LINES.first[0], LINES.first[1], firstLines[LINES.first[1]]);
    await page.locator('.skip').click();
    await page.waitForTimeout(1200);
    const cards = await shoot(page, '04-verdicts');
    const v = await decide(page, `.vcard.${FIRST[0]}`, { stamp: '05-stamp', extra: '06-extra' });
    // 残りの最初の事件
    await decide(page, `.vcard.${FIRST[1]}`);
    await decide(page, `.vcard.${FIRST[2]}`);
    // 続きの事件（1本目）: 自分の判決が返ってくる
    await page.waitForTimeout(300);
    const n1 = await lineShot(page, '08-next-a', 0, LINES.next[0], nextLines[LINES.next[0]]);
    const n2 = await lineShot(page, '09-next-b', LINES.next[0], LINES.next[1], nextLines[LINES.next[1]]);
    await page.locator('.skip').click();
    await page.waitForTimeout(1200);
    const slip = await shoot(page, '10-your-precedent');
    await decide(page, `.vcard.${FOLLOW[0]}`);
    await decide(page, `.vcard.${FOLLOW[1]}`);
    await decide(page, `.vcard.${FOLLOW[2]}`);
    // 交差事件
    await page.waitForTimeout(300);
    const x1 = await lineShot(page, '11-cross-a', 0, LINES.cross[0], crossLines[LINES.cross[0]]);
    const x2 = await lineShot(page, '12-cross-b', LINES.cross[0], LINES.cross[1], crossLines[LINES.cross[1]]);
    await decide(page, `.vcard.${CROSS}`);
    await page.waitForTimeout(1500);
    const paper = await shoot(page, '13-paper');

    // テロップ・暗転・最後の画面
    const card = await browser.newPage({ viewport: { width: W, height: H } });
    const tl = {
      title: await drawCard(card, 't-title', band(TELOP.title, 83)),
      first: await drawCard(card, 't-first', band(TELOP.first)),
      next: await drawCard(card, 't-next', band(TELOP.next)),
      cross: await drawCard(card, 't-cross', band(TELOP.cross)),
      paper: await drawCard(card, 't-paper', band(TELOP.paper)),
      end: await drawCard(
        card,
        't-end',
        `<div class="end"><div class="a">結末<b>${ENDINGS}</b>種</div><div class="b">3つの事件・5分</div><div class="c">前例製造機</div><div class="d">無料・ブラウザで遊べる</div></div>`,
      ),
    };
    const later = await drawCard(card, '07-later', `<div class="mid">${TELOP.later}</div>`, true);

    // ---- 台本どおりに場面を並べる ----
    const segs: Seg[] = [
      { name: 'title', img: title, dur: 3, telop: tl.title, cues: [sfx('gavel', 0.35, 0.9)], zoom: true },
      voiced('first-a', f1, [firstLines[LINES.first[0]]], 2.4, [], tl.first),
      voiced('first-b', f2, [firstLines[LINES.first[1]]], 2.0, [], tl.first),
      { name: 'verdicts', img: cards, dur: 1.4, cues: [], zoom: true },
      { name: 'stamp', img: v.stamp!, dur: 0.8, cues: [sfx('gavel', 0.0, 0.9), sfx('stamp', 0.3, 1)] },
      voiced('extra', v.extra!, [law, FIRST[0] === 'blue' ? '認容。' : '棄却。'], 2.4),
      { name: 'later', img: later, dur: 1.3, cues: [sfx('murmur', 0, 0.6)] },
      voiced('next-a', n1, [nextLines[LINES.next[0]]], 2.6, [], tl.next),
      voiced('next-b', n2, [nextLines[LINES.next[1]]], 2.2, [], tl.next),
      { name: 'slip', img: slip, dur: 1.6, telop: tl.next, cues: [sfx('paper', 0.1, 0.6)], zoom: true },
      voiced('cross-a', x1, [crossLines[LINES.cross[0]]], 2.6, [], tl.cross),
      voiced('cross-b', x2, [crossLines[LINES.cross[1]]], 2.2, [], tl.cross),
      { name: 'paper', img: paper, dur: 3.6, telop: tl.paper, cues: [sfx('paper', 0.1, 0.8)], zoom: true },
      { name: 'end', img: title, dur: 4, telop: tl.end, cues: [sfx('gavel', 0.3, 1), sfx('stamp', 0.7, 0.9)] },
    ];
    await render(segs);
  } finally {
    await browser.close();
    await server.close();
  }
}

async function render(segs: Seg[]) {
  // 各場面の開始時刻（クロスフェードで重なる分だけ前へ）
  const starts: number[] = [];
  let t = 0;
  for (const s of segs) {
    starts.push(t);
    t += s.dur - FADE;
  }
  const total = starts[starts.length - 1] + segs[segs.length - 1].dur;
  const paperAt = starts[segs.findIndex((s) => s.name === 'paper')];

  const args: string[] = ['-y', '-loglevel', 'error'];
  const f: string[] = [];
  let n = 0;
  const vin: string[] = [];
  segs.forEach((s, i) => {
    const d = (s.dur + 0.1).toFixed(3);
    args.push('-loop', '1', '-framerate', String(FPS), '-t', d, '-i', s.img);
    const img = n++;
    const zoom = s.zoom ? `min(1+0.0011*on,1.08)` : '1';
    f.push(
      `[${img}:v]scale=${W * 2}:${H * 2},zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=${FPS},setsar=1,format=yuv420p[s${i}]`,
    );
    let label = `s${i}`;
    if (s.telop) {
      args.push('-loop', '1', '-framerate', String(FPS), '-t', d, '-i', s.telop);
      const tel = n++;
      f.push(`[${label}][${tel}:v]overlay=0:0:format=auto,format=yuv420p[o${i}]`);
      label = `o${i}`;
    }
    f.push(`[${label}]trim=duration=${s.dur.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`);
    vin.push(`v${i}`);
  });
  let cur = vin[0];
  for (let i = 1; i < vin.length; i++) {
    const out = i === vin.length - 1 ? 'vout' : `x${i}`;
    f.push(`[${cur}][${vin[i]}]xfade=transition=fade:duration=${FADE}:offset=${starts[i].toFixed(3)}[${out}]`);
    cur = out;
  }

  // 音: 声・効果音を時刻に置き、法廷BGMを薄く全体に、新聞から百年後のBGM
  const ain: string[] = [];
  segs.forEach((s, i) =>
    s.cues.forEach((c) => {
      args.push('-i', c.file);
      const k = n++;
      const ms = Math.round((starts[i] + c.at) * 1000);
      f.push(`[${k}:a]aresample=48000,${c.tempo ? `atempo=${c.tempo},` : ''}volume=${c.vol ?? 1},adelay=${ms}:all=1[a${k}]`);
      ain.push(`a${k}`);
    }),
  );
  args.push('-stream_loop', '-1', '-i', join(AUDIO, 'bgm/court.mp3'));
  const court = n++;
  f.push(`[${court}:a]aresample=48000,atrim=0:${paperAt.toFixed(3)},volume=${COURT_VOL},afade=t=in:d=0.5,afade=t=out:st=${(paperAt - 0.6).toFixed(3)}:d=0.6[bc]`);
  args.push('-i', join(AUDIO, 'bgm/future.mp3'));
  const fut = n++;
  const rest = total - paperAt;
  f.push(
    `[${fut}:a]aresample=48000,atrim=0:${rest.toFixed(3)},volume=${FUTURE_VOL},afade=t=in:d=0.4,afade=t=out:st=${(rest - 1.2).toFixed(3)}:d=1.2,adelay=${Math.round(paperAt * 1000)}:all=1[bf]`,
  );
  ain.push('bc', 'bf');
  f.push(`${ain.map((a) => `[${a}]`).join('')}amix=inputs=${ain.length}:normalize=0:duration=longest,atrim=0:${total.toFixed(3)},loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000[aout]`);

  const script = join(TMP, 'filter.txt');
  writeFileSync(script, f.join(';\n'));
  args.push('-/filter_complex', script, '-map', '[vout]', '-map', '[aout]');
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-r', String(FPS));
  args.push('-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', '-t', total.toFixed(3), OUT);
  sh('ffmpeg', args);
  console.log(`完了: ${OUT}（${total.toFixed(1)}秒・${segs.length}場面・結末${ENDINGS}種）`);
  for (const [i, s] of segs.entries()) console.log(`  ${starts[i].toFixed(1).padStart(5)}s  ${s.name}  ${s.dur.toFixed(1)}s`);
}

if (!existsSync(join(AUDIO, 'voice/manifest.json'))) throw new Error('public/audio/voice/manifest.json がありません（npm run voice）');
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
