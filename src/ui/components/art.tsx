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

export function Portrait({ name, group = 'chara', glyphFor, alt = '' }: { name: string; group?: 'chara' | 'scene' | 'news' | 'ending'; glyphFor?: string; alt?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Silhouette glyph={glyphFor ? NODES[glyphFor]?.glyph : undefined} />;
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
