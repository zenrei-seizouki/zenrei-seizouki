// 実際に1周遊んだプレイ映像を、音つきで録る。  npx tsx scripts/playrec.ts
// ブラウザの録画には音が入らないので、遊んでいる間に「どの音がいつ鳴ったか」を全部記録し、
// あとで public/audio の同じ mp3 をその時刻に重ねる（声は 1.5 倍速、BGM はループ）。
// 出力: docs/promo/play-full.mp4（1周まるごと）と docs/promo/play-cut.mp4（X用に事件1→4→7→新聞に詰めた版）
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright-core';
import { createServer } from 'vite';

const ROOT = process.cwd();
const TMP = join(ROOT, 'node_modules/.cache/playrec');
const OUTDIR = join(ROOT, 'docs/promo');
const VW = 390;
const VH = 780;
const SFX_VOL: Record<string, number> = { tap: 0.35, murmur: 0.4, paper: 0.7 };
const BGM_VOL = 0.3;

// 遊び方（本は固定。手羽先🟦＋看板🟦 で交差事件 X1）
const PICK_FIRST = ['名前に書いた物は', '看板に書いた罰金は', '会社の機械が言ったことは'];
const PICK_FOLLOW = ['判例に従う', 'ただし書きを付ける', '判例に従う'];
const PICK_CROSS = '看板の罰金は、相手の看板';

type Ev = { t: number; kind: 'voice' | 'buf'; url: string; rate?: number; end?: number; loop?: boolean };

const HOOK = `(() => {
  window.__ev = [];
  const bufUrl = new WeakMap();
  const abUrl = new WeakMap();
  const of = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const r = await of(input, init);
    const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    if (url.includes('/audio/') && url.endsWith('.mp3')) {
      const ab = r.arrayBuffer.bind(r);
      r.arrayBuffer = async function () { const b = await ab(); abUrl.set(b, url); return b; };
    }
    return r;
  };
  const dec = BaseAudioContext.prototype.decodeAudioData;
  BaseAudioContext.prototype.decodeAudioData = function (ab) {
    const url = abUrl.get(ab);
    return dec.apply(this, arguments).then(function (buf) { if (url) bufUrl.set(buf, url); return buf; });
  };
  const st = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function () {
    const node = this;
    const url = node.buffer ? bufUrl.get(node.buffer) : undefined;
    if (url) {
      const ev = { t: Date.now(), kind: 'buf', url: url, loop: node.loop };
      window.__ev.push(ev);
      const sp = node.stop.bind(node);
      node.stop = function (when) {
        const ctx = node.context;
        const w = when === undefined ? ctx.currentTime : when;
        ev.end = Date.now() + Math.max(0, (w - ctx.currentTime) * 1000);
        return sp(when);
      };
    }
    return st.apply(this, arguments);
  };
  const pl = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const el = this;
    if (el.src.includes('/audio/')) {
      const ev = { t: Date.now(), kind: 'voice', url: el.src, rate: el.playbackRate };
      window.__ev.push(ev);
      const done = function () {
        if (!ev.end) ev.end = Date.now();
        el.removeEventListener('ended', done); el.removeEventListener('pause', done); el.removeEventListener('emptied', done);
      };
      el.addEventListener('ended', done); el.addEventListener('pause', done); el.addEventListener('emptied', done);
    }
    return pl.apply(this, arguments);
  };
})();`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function buttons(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const ovs = [...document.querySelectorAll('.ov')].filter((o) => (o as HTMLElement).offsetParent || getComputedStyle(o).position === 'fixed');
    const scope: ParentNode = ovs.length ? ovs[ovs.length - 1] : document;
    return [...scope.querySelectorAll('button')].filter((b) => (b as HTMLElement).offsetParent).map((b) => b.textContent ?? '');
  });
}
async function clickText(page: Page, text: string) {
  const ov = page.locator('.ov').last();
  const scope = (await ov.count()) ? ov : page;
  const b = scope.locator('button', { hasText: text }).first();
  try {
    await b.scrollIntoViewIfNeeded({ timeout: 3000 });
    await sleep(500);
    await b.click({ timeout: 3000 });
  } catch {
    await sleep(600); // 演出の途中などで押せなかった。次の周回でやり直す
  }
}
async function counter(page: Page): Promise<string> {
  return page.evaluate(() => (document.body.innerText.match(/(\d)／(\d)/) ?? [''])[0]);
}

async function play(page: Page, steps: Array<{ t: number; label: string }>) {
  let first = 0;
  let follow = 0;
  let last = '';
  const deadline = Date.now() + 5 * 60_000;
  while (Date.now() < deadline) {
    const c = await counter(page);
    if (c && c !== last) {
      steps.push({ t: Date.now(), label: c });
      last = c;
    }
    const bs = await buttons(page);
    const has = (s: string) => bs.some((b) => b.includes(s));
    const sig = c + ' ' + bs.map((b) => b.trim().slice(0, 10)).join('|');
    if (sig !== (play as unknown as { last?: string }).last) {
      (play as unknown as { last?: string }).last = sig;
      console.log('[画面]', sig);
    }
    if (has('Xでこの国を自慢する') || has('もう一度')) {
      steps.push({ t: Date.now(), label: 'paper' });
      await sleep(1500);
      for (let i = 0; i < 6; i++) {
        await page.mouse.wheel(0, 260);
        await sleep(900);
      }
      await sleep(1500);
      return;
    }
    if (has('次の事件へ') || has('百年後') || has('結末')) {
      await sleep(2200);
      const label = bs.find((b) => b.includes('次の事件へ') || b.includes('百年後') || b.includes('結末'))!;
      await clickText(page, label.trim().slice(0, 6));
      continue;
    }
    if (has(PICK_CROSS)) {
      await sleep(1600);
      await clickText(page, PICK_CROSS);
      continue;
    }
    const f = PICK_FIRST.find((p) => has(p));
    if (f && first < 3 && !has('判例に従う')) {
      await sleep(1600);
      await clickText(page, f);
      first++;
      continue;
    }
    if (has('判例に従う') && follow < 3) {
      await sleep(1800);
      await clickText(page, PICK_FOLLOW[follow]);
      follow++;
      continue;
    }
    await sleep(250);
  }
  await page.screenshot({ path: join(TMP, 'stuck.png') });
  throw new Error('時間内に新聞まで到達しなかった（' + join(TMP, 'stuck.png') + '）');
}

function ff(args: string[]) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
}

async function main() {
  if (process.env.REMIX) return mixAndCut(JSON.parse(readFileSync(join(TMP, 'log.json'), 'utf8')));
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 5183, strictPort: false } });
  await server.listen();
  const base = server.resolvedUrls!.local[0];
  const browser = await chromium.launch({ channel: process.env.PROMO_BROWSER ?? 'msedge', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({
    viewport: { width: VW, height: VH },
    deviceScaleFactor: 2,
    recordVideo: { dir: TMP, size: { width: VW * 2, height: VH * 2 } },
  });
  await ctx.addInitScript({ content: HOOK });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const steps: Array<{ t: number; label: string }> = [];
  await page.goto(`${base}?stories=wing,sign,chatbot`);
  await page.evaluate(() => {
    localStorage.setItem('zenrei:speed', '1.5');
    localStorage.removeItem('zenrei:mute');
  });
  await page.reload();
  await sleep(2500);
  steps.push({ t: Date.now(), label: 'title' });
  await clickText(page, '開廷する');
  await play(page, steps);
  const tEnd = Date.now();
  const evs = (await page.evaluate(() => (window as unknown as { __ev: unknown[] }).__ev)) as Ev[];
  await ctx.close();
  await browser.close();
  await server.close();

  writeFileSync(join(TMP, 'log.json'), JSON.stringify({ t0, tEnd, steps, evs }, null, 1));
  return mixAndCut({ t0, tEnd, steps, evs });
}

async function mixAndCut({ t0, tEnd, steps, evs }: { t0: number; tEnd: number; steps: Array<{ t: number; label: string }>; evs: Ev[] }) {
  const webm = join(TMP, readdirSync(TMP).find((f) => f.endsWith('.webm'))!);
  const total = (tEnd - t0) / 1000;
  console.log(`録画 ${total.toFixed(1)}秒、音 ${evs.length}件`);

  // 音を並べる
  const inputs: string[] = [];
  const filters: string[] = [];
  evs.forEach((e, i) => {
    const file = join(ROOT, 'public', decodeURIComponent(new URL(e.url, 'http://localhost/').pathname).replace(/^.*?\/audio\//, 'audio/'));
    const start = Math.max(0, (e.t - t0) / 1000);
    const end = (e.end ?? tEnd) / 1000 - t0 / 1000;
    const dur = Math.max(0.05, end - start);
    const name = file.split(/[\\/]/).pop()!.replace('.mp3', '');
    if (e.loop) inputs.push('-stream_loop', '-1');
    inputs.push('-i', file);
    let f = `[${i}:a]`;
    if (e.kind === 'voice') f += `atempo=${(e.rate ?? 1.5).toFixed(2)},`;
    const vol = e.kind === 'voice' ? 1 : e.loop ? BGM_VOL : SFX_VOL[name] ?? 0.8;
    f += `atrim=0:${dur.toFixed(3)},afade=t=out:st=${Math.max(0, dur - 0.3).toFixed(3)}:d=0.3,volume=${vol},adelay=${Math.round(start * 1000)}:all=1[a${i}]`;
    filters.push(f);
  });
  const mix = `${evs.map((_, i) => `[a${i}]`).join('')}amix=inputs=${evs.length}:normalize=0:dropout_transition=0,alimiter=limit=0.95[aout]`;
  const audio = join(TMP, 'audio.m4a');
  writeFileSync(join(TMP, 'filter.txt'), [...filters, mix].join(';\n'));
  ff([...inputs, '-/filter_complex', join(TMP, 'filter.txt'), '-map', '[aout]', '-t', total.toFixed(3), '-c:a', 'aac', '-b:a', '160k', audio]);

  const full = join(OUTDIR, 'play-full.mp4');
  // Playwright の録画は時間が縮んで記録されることがあるので、実時間（音の記録）に合わせて映像を伸ばす
  const vdur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', webm]).toString().trim());
  const stretch = total / vdur;
  console.log(`映像 ${vdur.toFixed(1)}秒 → ${total.toFixed(1)}秒（×${stretch.toFixed(3)}）`);
  ff(['-i', webm, '-i', audio, '-map', '0:v', '-map', '1:a', '-vf', `setpts=PTS*${stretch.toFixed(5)},fps=30`, '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', '-t', total.toFixed(3), full]);
  console.log('→', full);

  // X用: 事件1（手羽先）→ 4（たい焼き）→ 7（交差事件）→ 新聞 を残し、他は切る
  const at = (label: string) => (steps.find((s) => s.label === label)?.t ?? t0) / 1000 - t0 / 1000;
  const keep: Array<[number, number]> = [
    [at('title'), at('2／7')],
    [at('4／7'), at('5／7')],
    [at('7／7'), total],
  ].filter(([a, b]) => b > a) as Array<[number, number]>;
  const sel = keep.map(([a, b]) => `between(t,${a.toFixed(2)},${b.toFixed(2)})`).join('+');
  const cut = join(OUTDIR, 'play-cut.mp4');
  ff([
    '-i', full,
    '-vf', `select='${sel}',setpts=N/FRAME_RATE/TB`,
    '-af', `aselect='${sel}',asetpts=N/SR/TB`,
    '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', cut,
  ]);
  console.log('→', cut, keep.map(([a, b]) => `${a.toFixed(1)}-${b.toFixed(1)}`).join(' / '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
