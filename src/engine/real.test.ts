// 実話ベースの事件と、号外の「実際の裁判では」欄
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CASE_BY_ID, HAND_CASES, REAL_NOTES } from '../data/cases';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

describe('実話ベースの事件（REAL_NOTES）', () => {
  it('REAL_NOTES のキーは、実在する手書き事件の id', () => {
    const hand = new Set(HAND_CASES.map((c) => c.id));
    for (const id of Object.keys(REAL_NOTES)) {
      expect(hand.has(id), id).toBe(true);
      expect(CASE_BY_ID[id].generated).toBeFalsy();
    }
  });

  it('各注記は text と出典を持ち、未解決のプレースホルダが無い。長すぎない', () => {
    expect(Object.keys(REAL_NOTES).length).toBeGreaterThanOrEqual(6);
    for (const [id, n] of Object.entries(REAL_NOTES)) {
      expect(n.text.trim().length, id).toBeGreaterThan(20);
      expect(n.text.length, `${id}: 号外の囲みに収まる長さ`).toBeLessThanOrEqual(220);
      expect(n.source.trim().length, id).toBeGreaterThan(0);
      expect(`${n.text}${n.source}`, id).not.toMatch(/[{}]/);
    }
  });

  it('注記には、ゲームの判決が現実と同じ向きか逆向きかを示す欄が無い（text/source だけ）', () => {
    for (const n of Object.values(REAL_NOTES)) expect(Object.keys(n).sort()).toEqual(['source', 'text']);
  });

  it('実話ベースの事件は、序盤から出せる（T1・出現条件なし）', () => {
    for (const id of Object.keys(REAL_NOTES)) {
      const c = CASE_BY_ID[id];
      expect(c.tier, id).toBe(1);
      expect(c.requires ?? [], id).toHaveLength(0);
    }
  });
});

describe('「法律相談ではありません」の注記', () => {
  it('UIのソースの中に、ちょうど1か所だけある', () => {
    const files = walk('src/ui').filter((f) => /\.(tsx?|css)$/.test(f));
    const hits = files.flatMap((f) => (readFileSync(f, 'utf-8').match(/法律相談ではありません/g) ?? []).map(() => f));
    expect(hits).toHaveLength(1);
    expect(hits[0].replace(/\\/g, '/')).toContain('components/overlays.tsx'); // 「実際の裁判では」欄の中
  });
});
