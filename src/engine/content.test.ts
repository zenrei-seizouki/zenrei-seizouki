import { describe, expect, it } from 'vitest';
import { ALL_CASES, CASE_BY_ID, CRISIS_CASES, HAND_CASES, OPENING_IDS } from '../data/cases';
import { ENDINGS } from '../data/endings';
import { ISSUE_IDS } from '../data/issues';
import { FUTURE, NEWS } from '../data/news';
import { NODES, OBJECT_LEAVES, SUBJECT_LEAVES } from '../data/ontology';
import { buildShareText } from '../ui/share';
import { futureHeadlines, primaryEnding } from './endings';
import { makeRng } from './rng';
import { drawNextCase } from './selector';
import { advance, newGame } from './state';
import { applyRuling } from './ruling';

describe('コンテンツの整合性', () => {
  it('手書き84件(6争点×14)＋危機6件', () => {
    expect(HAND_CASES).toHaveLength(84);
    expect(CRISIS_CASES).toHaveLength(6);
    for (const i of ISSUE_IDS) expect(HAND_CASES.filter((c) => c.issue === i)).toHaveLength(14);
  });
  it('idは一意で、主体・客体は正しい葉', () => {
    expect(new Set(ALL_CASES.map((c) => c.id)).size).toBe(ALL_CASES.length);
    for (const c of ALL_CASES) {
      expect(SUBJECT_LEAVES, c.id).toContain(c.subject);
      expect(OBJECT_LEAVES, c.id).toContain(c.object);
    }
  });
  it('セリフは各2〜3行で、未解決のプレースホルダが無い（{cite}以外）', () => {
    for (const c of ALL_CASES) {
      for (const p of [c.plaintiff, c.defendant]) {
        expect(p.lines.length, c.id).toBeGreaterThanOrEqual(2);
        expect(p.lines.length, c.id).toBeLessThanOrEqual(3);
        for (const l of p.lines) expect(l.replace('{cite}', ''), c.id).not.toMatch(/[{}]/);
      }
    }
  });
  it('出現条件のノードは存在する。{cite} を使う事件は判例を前提にする', () => {
    for (const c of ALL_CASES) {
      for (const r of c.requires ?? []) {
        if (r.kind === 'precedent') {
          if (r.covers?.subject) expect(NODES[r.covers.subject], c.id).toBeTruthy();
          if (r.covers?.object) expect(NODES[r.covers.object], c.id).toBeTruthy();
        }
      }
      const usesCite = [...c.plaintiff.lines, ...c.defendant.lines].some((l) => l.includes('{cite}'));
      if (usesCite && !c.crisis) expect(c.requires?.some((r) => r.kind === 'precedent'), c.id).toBe(true);
    }
  });
  it('チュートリアルの3件が存在する', () => {
    for (const id of OPENING_IDS) expect(CASE_BY_ID[id]).toBeTruthy();
  });
  it('号外36本・百年後見出し36本・名前付きエンディング40種以上', () => {
    for (const T of [NEWS, FUTURE]) {
      let n = 0;
      for (const i of ISSUE_IDS) for (const v of ['grant', 'deny'] as const) n += T[i][v].length;
      expect(n).toBe(36);
    }
    expect(ENDINGS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(ENDINGS.map((e) => e.id)).size).toBe(ENDINGS.length);
  });
});

describe('危機事件', () => {
  it('メーターが限界に達した翌日に強制出現し、二度は出ない', () => {
    let s = newGame({ seed: 9 });
    s.day = 5;
    s.meters.秩序 = -8.4;
    const c = drawNextCase(s, makeRng(1));
    expect(c.id).toBe('crisis-order-low');
    s.usedCaseIds.push(c.id);
    expect(drawNextCase(s, makeRng(1)).id).not.toBe('crisis-order-low');
    // 1日目には出ない
    s.day = 1;
    s.usedCaseIds = [];
    expect(drawNextCase(s, makeRng(1)).crisis).toBeFalsy();
  });
  it('危機事件も通常どおり裁ける', () => {
    let s = newGame({ seed: 9 });
    s.day = 5;
    s.meters.経済 = 8.5;
    s = advance({ ...s, day: 4 });
    expect(s.currentCase?.id).toBe('crisis-econ-high');
    const r = applyRuling(s, { kind: 'new', verdict: 'deny', level: 1 });
    expect(r.state.log).toHaveLength(1);
  });
});

describe('共有・結果', () => {
  it('Xの共有文は140字(全角換算)に収まり、ハッシュタグを含む', () => {
    const s = newGame({ seed: 4 });
    s.precedents = [
      { no: 1, issue: 'occupy', verdict: 'grant', subject: 'anyone', object: 'anything', exceptions: [], citations: 3, originCaseId: 'occupy-01', day: 1, heroLeaf: 'cat', objectLeaf: 'keyboard' },
    ];
    s.leafWins = { cat: 3 };
    const t = buildShareText(s);
    expect(t).toContain('#前例製造機');
    expect(t).toContain('が法律になりました');
    expect(t.length).toBeLessThanOrEqual(140);
  });
  it('百年後新聞の見出しは主役の判例から作られ、プレースホルダが残らない', () => {
    const s = newGame({ seed: 4 });
    s.precedents = [
      { no: 1, issue: 'occupy', verdict: 'grant', subject: 'anyone', object: 'anything', exceptions: [], citations: 3, originCaseId: 'occupy-01', day: 1, heroLeaf: 'cat', objectLeaf: 'keyboard' },
      { no: 2, issue: 'sleep', verdict: 'deny', subject: 'human', object: 'public', exceptions: [], citations: 1, originCaseId: 'sleep-04', day: 2, heroLeaf: 'politician', objectLeaf: 'diet', overruledBy: 3 },
    ];
    const h = futureHeadlines(s);
    expect(h[0].hl).toContain('座り込み済み');
    for (const x of h) expect(x.hl + x.sub).not.toMatch(/[{}]/);
    expect(primaryEnding(s).name).toBeTruthy();
  });
  it('全36本の見出しで {S}{O} が埋まる', () => {
    for (const T of [NEWS, FUTURE]) {
      for (const i of ISSUE_IDS) {
        for (const v of ['grant', 'deny'] as const) {
          for (const t of T[i][v]) {
            expect(t.hl + t.sub).toMatch(/./);
          }
        }
      }
    }
  });
});
