import { countryName, heroLeaf, primaryEnding, topPrecedents, judgeTitle } from '../engine/endings';
import { exceptionText, precedentText } from '../engine/text';
import type { GameState, Precedent } from '../engine/types';
import { artUrl } from './components/art';

const TAG = '#前例製造機';

/** 条文を「本文」と「ただし書き」の文に分ける（共有文はこの単位で切る） */
export function lawSentences(p: Precedent): string[] {
  return [precedentText(p, false), ...p.exceptions.map((e) => exceptionText(e))];
}

/** X(Twitter)共有の文面。「ただし書きが一番多い」条文を主役に、本文＋ただし書きをつなげて全体が100字前後に収まるよう文単位で切る */
export function buildShareText(s: GameState): string {
  const top = topPrecedents(s, 1)[0];
  const country = countryName(s);
  const ending = primaryEnding(s);
  const sentences = top ? lawSentences(top) : ['ひとつも法律を作らなかった'];
  const tail = `
結果：${country}が誕生（${ending.name}）
${TAG}`;
  const head = '私の国では「';
  const mid = '」が法律になりました。';
  const room = 100 - (head.length + mid.length + tail.length);
  let body = '';
  let cut = false;
  for (const sen of sentences) {
    if ((body + sen).length > room && body) {
      cut = true;
      break;
    }
    body += sen;
  }
  if (body.length > room) body = body.slice(0, Math.max(10, room - 1)) + '…';
  else if (cut) body += '…';
  return `${head}${body}${mid}${tail}`;
}

export function shareOnX(text: string): void {
  const url = location.href.split('#')[0];
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(intent, '_blank', 'noopener');
}

interface Tok {
  ch: string;
  ex: boolean;
}

/** 本文(墨)とただし書き(朱の手書き)が連結した1本の条文を、1文字ずつ折り返して並べる */
function layoutLaw(ctx: CanvasRenderingContext2D, toks: Tok[], size: number, maxW: number, fonts: { base: string; ex: string }): Tok[][] {
  const lines: Tok[][] = [];
  let line: Tok[] = [];
  let w = 0;
  for (const tk of toks) {
    ctx.font = tk.ex ? `600 ${size - 2}px ${fonts.ex}` : `800 ${size}px ${fonts.base}`;
    const cw = ctx.measureText(tk.ch).width;
    if (w + cw > maxW && line.length) {
      lines.push(line);
      line = [];
      w = 0;
    }
    line.push(tk);
    w += cw;
  }
  if (line.length) lines.push(line);
  return lines;
}

const loadImg = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });

/** 結果を 1200×630 のリソグラフ風カード画像に描く（PNG data URL） */
export async function drawShareCard(s: GameState): Promise<string> {
  try {
    await Promise.all([document.fonts.load('800 40px "Shippori Mincho B1"'), document.fonts.load('400 40px "Dela Gothic One"'), document.fonts.load('600 30px "Klee One"')]);
  } catch {
    /* フォントが無くても描く */
  }
  const W = 1200;
  const H = 630;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;
  const INK = '#231a12';
  const RED = '#c8321b';
  const PAPER = '#f3ead3';
  const MINCHO = '"Shippori Mincho B1","Yu Mincho",serif';

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  // 紙の粒
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(90,66,30,${Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.strokeRect(22, 22, W - 44, H - 44);
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, W - 68, H - 68);

  // 立ち絵（主役の葉）
  const hero = heroLeaf(s) ?? 'cat';
  const im = await loadImg(artUrl('chara', hero));
  if (im) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(im, 730, 120, 430, 430);
    ctx.restore();
  }

  const top = topPrecedents(s, 1)[0];
  const country = countryName(s);
  const ending = primaryEnding(s);
  const KLEE = '"Klee One","Yu Mincho",serif';
  const fonts = { base: MINCHO, ex: KLEE };

  // 見出し
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = RED;
  ctx.font = `800 26px ${MINCHO}`;
  ctx.fillText('前例製造機　— 私の国の法律 —', 70, 92);

  // 条文（判例の紙片）: 本文は墨、ただし書きは朱の手書き。長ければ文字を小さくし、それでも4行に収まらなければ後ろのただし書きを落とす
  const toks: Tok[] = [{ ch: '「', ex: false }];
  const sentences = top ? lawSentences(top) : ['法律は、ひとつも作られなかった。'];
  sentences.forEach((sen, i) => {
    for (const ch of sen) toks.push({ ch, ex: i > 0 });
  });
  toks.push({ ch: '」', ex: false });
  let size = 38;
  let lines = layoutLaw(ctx, toks, size, 600, fonts);
  while (lines.length > 4 && size > 28) {
    size -= 3;
    lines = layoutLaw(ctx, toks, size, 600, fonts);
  }
  if (lines.length > 4) {
    lines = lines.slice(0, 4);
    const last = lines[3];
    last.splice(Math.max(0, last.length - 2), 2, { ch: '…', ex: false }, { ch: '」', ex: false });
  }
  const lineH = Math.round(size * 1.5);
  const boxH = lines.length * lineH + 26;
  ctx.save();
  ctx.translate(70, 120);
  ctx.rotate(-0.012);
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(0, 0, 660, boxH);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 660, boxH);
  lines.forEach((ln, i) => {
    let x = 24;
    for (const tk of ln) {
      ctx.font = tk.ex ? `600 ${size - 2}px ${KLEE}` : `800 ${size}px ${MINCHO}`;
      ctx.fillStyle = tk.ex ? RED : INK;
      ctx.fillText(tk.ch, x, 14 + (i + 1) * lineH - Math.round(lineH * 0.22));
      x += ctx.measureText(tk.ch).width;
    }
  });
  ctx.restore();

  // 国名（版ズレ）
  const cy = Math.max(120 + boxH + 110, 340);
  ctx.font = `800 24px ${MINCHO}`;
  ctx.fillStyle = INK;
  ctx.fillText('その結果、生まれた国', 70, cy - 82);
  ctx.font = `800 ${country.length > 9 ? 56 : 68}px ${MINCHO}`;
  ctx.fillStyle = RED;
  ctx.fillText(country, 74, cy + 4);
  ctx.fillStyle = INK;
  ctx.fillText(country, 70, cy);

  ctx.font = `800 26px ${MINCHO}`;
  ctx.fillStyle = INK;
  ctx.fillText(`エンディング「${ending.name}」　称号「${judgeTitle(s)}」`, 70, cy + 54);

  ctx.font = `600 24px ${MINCHO}`;
  ctx.fillStyle = RED;
  ctx.fillText(TAG, 70, H - 62);
  ctx.fillStyle = INK;
  ctx.font = `800 24px ${MINCHO}`;
  ctx.textAlign = 'right';
  ctx.fillText('あなたの判決が、この国の法律になる。', W - 70, H - 62);

  // 判子
  ctx.save();
  ctx.translate(1060, 150);
  ctx.rotate(-0.2);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 60, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = RED;
  ctx.textAlign = 'center';
  ctx.font = `800 46px ${MINCHO}`;
  ctx.fillText('判決', 0, 16);
  ctx.restore();

  return cv.toDataURL('image/png');
}
