import { useState } from 'preact/hooks';
import { NODES } from '../../data/ontology';

const BASE = import.meta.env.BASE_URL;
export const artUrl = (group: 'chara' | 'scene' | 'news' | 'ending', name: string) => `${BASE}art/${group}/${name}.webp`;

/** 画像が無いときの代用: 墨ベタの切り絵風シルエット（絵文字は使わない） */
export function Silhouette({ glyph, class: cls }: { glyph?: string; class?: string }) {
  return (
    <svg class={`sil ${cls ?? ''}`} viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect width="100" height="100" fill="#e7dabb" />
      <g transform="translate(2.5 1.5)" fill="#c8321b" opacity="0.8">
        <circle cx="50" cy="38" r="19" />
        <path d="M14 100 C14 70 30 62 50 62 C70 62 86 70 86 100 Z" />
      </g>
      <g fill="#231a12">
        <circle cx="50" cy="38" r="19" />
        <path d="M14 100 C14 70 30 62 50 62 C70 62 86 70 86 100 Z" />
      </g>
      {glyph && (
        <text x="50" y="92" textAnchor="middle" fontSize="20" fontWeight="800" fill="#f3ead3" fontFamily="'Shippori Mincho B1', serif">
          {glyph}
        </text>
      )}
    </svg>
  );
}

/** 絵が無い当事者の影絵に入れる一字（被告役など） */
const ROLE_GLYPH: Record<string, string> = { owner: '主', clerk: '役', father: '父', shopkeeper: '店', senior: '上', teacher: '師', monk: '僧', mayor: '長', maker: '製', citizen: '民' };

export function Portrait({ name, group = 'chara', glyphFor, alt = '' }: { name: string; group?: 'chara' | 'scene' | 'news' | 'ending'; glyphFor?: string; alt?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Silhouette glyph={glyphFor ? NODES[glyphFor]?.glyph : (ROLE_GLYPH[name] ?? NODES[name]?.glyph)} />;
  return <img src={artUrl(group, name)} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} draggable={false} />;
}

/** 傍聴席の人影（SVG） */
export function Gallery({ react }: { react: 'cheer' | 'boo' | null }) {
  const heads = [26, 30, 24, 28, 25, 30, 27, 24];
  return (
    <div class={`gallery ${react ?? ''}`} aria-hidden="true">
      {heads.map((h, i) => (
        <svg key={i} viewBox="0 0 22 28" style={{ height: `${h}px` }}>
          <circle cx="11" cy="8" r="6" />
          <path d="M1 28 C1 17 6 15 11 15 C16 15 21 17 21 28 Z" />
        </svg>
      ))}
    </div>
  );
}

export function GavelIcon({ class: cls }: { class?: string }) {
  return (
    <svg class={cls} viewBox="0 0 100 100" aria-hidden="true">
      <rect x="57.5" y="34" width="9" height="58" rx="2" transform="rotate(45 62 34)" />
      <rect x="36" y="20" width="52" height="28" rx="3" transform="rotate(45 62 34)" />
      <rect x="4" y="88" width="44" height="8" />
    </svg>
  );
}

/** 号外の写真: 争点ごとの報道写真風イラスト。無ければ原告の立ち絵 */
export function NewsPhoto({ issue, fallbackArt, glyphFor }: { issue: string; fallbackArt: string; glyphFor?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Portrait name={fallbackArt} glyphFor={glyphFor} />;
  return <img src={artUrl('news', `news-${issue}`)} alt="" loading="lazy" onError={() => setFailed(true)} draggable={false} />;
}

/** タイトルのキービジュアル（画像が無い場合の、墨と朱の切り絵）: 木槌を振り上げる判事の後ろ姿と猫 */
export function TitleArt() {
  return (
    <svg viewBox="0 0 160 110" class="sil" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="160" height="110" fill="#e7dabb" />
      <g fill="none" stroke="#c8321b"><circle cx="104" cy="38" r="26" stroke-width="5" /><circle cx="104" cy="38" r="20" stroke-width="1.5" /></g>
      <text x="104" y="49" text-anchor="middle" font-size="30" font-weight="800" fill="#c8321b" font-family="'Shippori Mincho B1', serif">法</text>
      {[16, 52, 108, 144].map((x) => (
        <rect key={x} x={x - 3} y="0" width="6" height="74" fill="#231a12" opacity="0.18" />
      ))}
      <rect x="0" y="72" width="160" height="38" fill="#231a12" />
      <rect x="0" y="72" width="160" height="4" fill="#c8321b" />
      {/* 判事（後ろ姿） */}
      <g fill="#231a12">
        <path d="M22 110 C22 80 34 64 52 64 C70 64 82 80 82 110 Z" />
        <circle cx="52" cy="52" r="12" />
        <path d="M60 66 L84 34 L90 38 L68 72 Z" />
        <g transform="rotate(-28 90 30)">
          <rect x="78" y="14" width="26" height="14" rx="2" />
          <rect x="88" y="26" width="5" height="14" />
        </g>
      </g>
      {/* 猫 */}
      <g fill="#231a12" transform="translate(112 62)">
        <ellipse cx="14" cy="14" rx="14" ry="10" />
        <circle cx="12" cy="3" r="8" />
        <path d="M5 -2 L7 -10 L12 -3 Z M13 -3 L18 -10 L20 -1 Z" />
        <path d="M26 14 C34 12 36 4 32 0" stroke="#231a12" stroke-width="3" fill="none" />
      </g>
      <g fill="#f3ead3">
        <circle cx="10" cy="2" r="1.1" transform="translate(112 62)" />
        <circle cx="15" cy="2" r="1.1" transform="translate(112 62)" />
      </g>
    </svg>
  );
}
