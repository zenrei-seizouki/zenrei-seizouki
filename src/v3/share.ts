// 百年後新聞を 1200×630 のリソグラフ風カード画像に描く（旧 ui/share.ts の画風を流用）
import { artUrl } from '../ui/components/art';
import type { Newspaper } from './engine';
import { CROSSOVERS, STORY_BY_ID } from './data';

const INK = '#231a12';
const RED = '#c8321b';
const PAPER = '#f3ead3';
const MINCHO = '"Shippori Mincho B1","Yu Mincho",serif';
const KLEE = '"Klee One","Yu Mincho",serif';

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

export function shareOnX(text: string): void {
  const url = location.href.split('#')[0];
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener');
}

export async function drawPaperCard(paper: Newspaper): Promise<string> {
  try {
    await Promise.all([document.fonts.load('800 40px "Shippori Mincho B1"'), document.fonts.load('600 30px "Klee One"')]);
  } catch {
    /* フォントが無くても描く */
  }
  const W = 1200;
  const H = 630;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(90,66,30,${Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.strokeRect(22, 22, W - 44, H - 44);
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, W - 68, H - 68);

  // 主役の本の原告の立ち絵（交差事件なら交差事件の原告。新聞の本体と同じ）
  const cross = paper.main.story ? undefined : CROSSOVERS.find((x) => paper.main.endingId.startsWith(`${x.id}-`));
  const storyId = paper.main.story ?? paper.laws[0]?.story;
  const art = cross ? cross.scene.plaintiff.art : storyId ? STORY_BY_ID[storyId].first.plaintiff.art : 'cat';
  const im = await loadImg(artUrl('chara', art));
  if (im) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(im, 800, 170, 360, 360);
    ctx.restore();
  }

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;
  ctx.font = `800 52px ${MINCHO}`;
  ctx.fillText('百年後新聞', 70, 104);
  ctx.font = `800 20px ${MINCHO}`;
  ctx.fillStyle = RED;
  ctx.fillText('前例製造機　建国百年記念号', 380, 100);
  ctx.fillStyle = INK;
  ctx.fillRect(70, 122, W - 140, 5);

  // 主見出し
  ctx.font = `800 46px ${MINCHO}`;
  const hl = wrap(ctx, paper.main.hl, 700).slice(0, 3);
  hl.forEach((l, i) => {
    ctx.fillStyle = RED;
    ctx.fillText(l, 73, 192 + i * 62);
    ctx.fillStyle = INK;
    ctx.fillText(l, 70, 190 + i * 62);
  });
  let y = 190 + hl.length * 62 + 6;
  ctx.font = `800 24px ${MINCHO}`;
  ctx.fillText(`結末「${paper.main.ending}」`, 70, y);
  y += 44;

  // この国の法律（本文は墨、ただし書きは朱の手書き）
  ctx.font = `800 20px ${MINCHO}`;
  ctx.fillStyle = RED;
  ctx.fillText('この国の法律', 70, y);
  y += 32;
  for (const law of paper.laws) {
    ctx.font = `800 21px ${MINCHO}`;
    ctx.fillStyle = INK;
    const base = wrap(ctx, law.base, 690)[0];
    ctx.fillText(base, 70, y);
    if (law.struck) {
      // 取り消した法律は朱の取り消し線
      ctx.fillStyle = RED;
      ctx.fillRect(68, y - 8, ctx.measureText(base).width + 4, 3);
    }
    if (law.exception) {
      const w = ctx.measureText(base).width;
      ctx.font = `600 20px ${KLEE}`;
      ctx.fillStyle = RED;
      if (w + ctx.measureText(law.exception).width < 700) ctx.fillText(law.exception, 70 + w, y);
      else {
        y += 28;
        ctx.fillText(law.exception, 90, y);
      }
    }
    y += 34;
  }

  ctx.font = `600 24px ${MINCHO}`;
  ctx.fillStyle = RED;
  ctx.fillText('#前例製造機', 70, H - 58);
  ctx.textAlign = 'right';
  ctx.fillStyle = INK;
  ctx.font = `800 22px ${MINCHO}`;
  ctx.fillText('あなたの判決が、この国の法律になる。', W - 70, H - 58);
  return cv.toDataURL('image/png');
}
