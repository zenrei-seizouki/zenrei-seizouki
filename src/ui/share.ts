import { countryName, heroLeaf, primaryEnding, topPrecedents, judgeTitle } from '../engine/endings';
import { precedentText } from '../engine/text';
import type { GameState } from '../engine/types';
import { artUrl } from './components/art';

const TAG = '#前例製造機';

/** X(Twitter)共有の文面。トップ1判例を優先し、全体が140字(全角)に収まるよう切る */
export function buildShareText(s: GameState): string {
  const top = topPrecedents(s, 1)[0];
  const country = countryName(s);
  const ending = primaryEnding(s);
  const law = top ? precedentText(top, false) : 'ひとつも法律を作らなかった';
  const tail = `\n結果：${country}が誕生（${ending.name}）\n${TAG}`;
  const head = '私の国では「';
  const mid = '」が法律になりました。';
  const room = 100 - (head.length + mid.length + tail.length);
  const body = law.length > room ? law.slice(0, Math.max(10, room - 1)) + '…' : law;
  return `${head}${body}${mid}${tail}`;
}

export function shareOnX(text: string): void {
  const url = location.href.split('#')[0];
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(intent, '_blank', 'noopener');
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW && line) {
      out.push(line);
      line = ch;
    } else line += ch;
  }
  if (line) out.push(line);
  return out;
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
  const law = top ? precedentText(top, true) : '法律は、ひとつも作られなかった。';
  const country = countryName(s);
  const ending = primaryEnding(s);

  // 見出し
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = RED;
  ctx.font = `800 26px ${MINCHO}`;
  ctx.fillText('前例製造機　— 私の国の法律 —', 70, 92);

  // 法律文（判例の紙片）
  ctx.save();
  ctx.translate(70, 120);
  ctx.rotate(-0.012);
  ctx.font = `800 40px ${MINCHO}`;
  const lines = wrap(ctx, `「${law}」`, 600).slice(0, 4);
  const boxH = lines.length * 58 + 30;
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(0, 0, 660, boxH);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 660, boxH);
  ctx.fillStyle = INK;
  lines.forEach((l, i) => ctx.fillText(l, 24, 56 + i * 58));
  ctx.restore();

  // 国名（版ズレ）
  const cy = 120 + boxH + 120;
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
