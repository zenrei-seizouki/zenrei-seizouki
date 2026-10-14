// 外部レビューを受けた設計変更（3争点 / 手書き優先 / メーター非表示+国の様子 / ただし書きを主役に）のテスト
import { describe, expect, it } from 'vitest';
import { CASE_BY_ID, HAND_CASES } from '../data/cases';
import { ENDINGS } from '../data/endings';
import { ISSUE_IDS } from '../data/issues';
import { buildShareText, lawSentences } from '../ui/share';
import { judgeTitle, primaryEnding, topPrecedents, unlockedEndings } from './endings';
import { pickIssues, ISSUES_PER_TERM } from './issues';
import { moodFor, STRONG_DELTA } from './mood';
import { COST_DISTINGUISH, COST_OVERRULE, CROWD_AGAINST, CROWD_AGAINST_FOLLOWING } from './meters';
import { applyRuling, optionsFor } from './ruling';
import { deserialize, advance, newGame, serialize } from './state';
import { holdingText } from './text';
import type { CaseDef, GameState, Precedent } from './types';

const prec = (o: Partial<Precedent> & Pick<Precedent, 'no' | 'subject' | 'object'>): Precedent => ({
  issue: 'occupy',
  verdict: 'grant',
  exceptions: [],
  citations: 0,
  originCaseId: 'x',
  day: 1,
  heroLeaf: 'cat',
  objectLeaf: 'keyboard',
  ...o,
});
const withCase = (s: GameState, c: CaseDef): GameState => ({ ...structuredClone(s), currentCase: c, meters: { 秩序: 0, 経済: 0, 自由: 0, 幸福: 0 } });

describe('A1: 1任期に出る争点は3つ', () => {
  it('6争点から3つ。重複なし・シード付きで再現する', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const a = pickIssues(seed);
      expect(a).toHaveLength(ISSUES_PER_TERM);
      expect(new Set(a).size).toBe(ISSUES_PER_TERM);
      for (const i of a) expect(ISSUE_IDS).toContain(i);
      expect(pickIssues(seed)).toEqual(a);
    }
    // シードによって組み合わせが変わる（国が毎回違う）
    const kinds = new Set(Array.from({ length: 100 }, (_, i) => pickIssues(i + 1).join(',')));
    expect(kinds.size).toBeGreaterThan(10);
    // 6争点すべてが、どこかのシードで選ばれる
    const seen = new Set(Array.from({ length: 100 }, (_, i) => pickIssues(i + 1)).flat());
    expect(seen.size).toBe(6);
  });

  it('初回・デイリーは「占有」を必ず含む', () => {
    for (let seed = 1; seed <= 100; seed++) {
      expect(pickIssues(seed, ['occupy'])).toContain('occupy');
      expect(newGame({ seed, opening: true }).issues).toContain('occupy');
      expect(newGame({ seed, mode: 'daily' }).issues).toContain('occupy');
    }
  });

  it('デイリーは同じシードなら全員同じ3争点・同じ序盤', () => {
    const a = newGame({ mode: 'daily', seed: 20261014 });
    const b = newGame({ mode: 'daily', seed: 20261014 });
    expect(a.issues).toEqual(b.issues);
    expect(a.currentCase!.id).toBe('occupy-01');
    expect(a.opening).toEqual(['occupy-01', 'occupy-02']);
  });

  it('抽選される事件は今期の3争点のものだけ（危機事件は争点不問）', () => {
    for (let seed = 1; seed <= 150; seed++) {
      let s = newGame({ seed });
      for (let d = 0; d < 10; d++) {
        const c = s.currentCase!;
        if (!c.crisis) expect(s.issues, `${c.id} seed=${seed}`).toContain(c.issue);
        const o = optionsFor(s);
        s = applyRuling(s, o.governing ? { kind: 'follow', verdict: o.governing.verdict } : { kind: 'new', verdict: 'grant', level: 2 }).state;
        if (s.authority <= 0) break;
        s = advance(s);
        if (s.finished) break;
      }
    }
  });

  it('序盤の3件は、今期の3争点を1つずつ裁く（通常モード）', () => {
    for (let seed = 1; seed <= 60; seed++) {
      let s = newGame({ seed });
      const first: string[] = [];
      for (let d = 0; d < 3; d++) {
        first.push(s.currentCase!.issue);
        s = applyRuling(s, { kind: 'new', verdict: 'grant', level: 0 }).state;
        s = advance(s);
      }
      expect(new Set(first).size, `seed=${seed}`).toBe(3);
    }
  });

  it('争点が絞られる前の古いセーブは、使った争点を含めて補完して読み込める（詳しくは save.test.ts）', () => {
    const s = newGame({ seed: 3 });
    expect(deserialize(serialize(s))?.issues).toEqual(s.issues);
    const old = JSON.parse(serialize(s));
    delete old.issues;
    const loaded = deserialize(JSON.stringify(old));
    expect(loaded?.issues.length).toBeGreaterThanOrEqual(ISSUES_PER_TERM);
    expect(loaded?.issues).toContain(s.currentCase!.issue);
  });
});

describe('A2: 自動生成事件は原則オフ', () => {
  it('通常のプレイでは手書き事件しか出ない', () => {
    for (let seed = 1; seed <= 200; seed++) {
      let s = newGame({ seed, opening: seed % 2 === 0 });
      for (let d = 0; d < 10; d++) {
        expect(s.currentCase!.generated, `seed=${seed} day=${s.day}`).toBeFalsy();
        const o = optionsFor(s);
        const v = d % 2 === 0 ? 'grant' : 'deny';
        const k = o.verdictKind[v];
        s = applyRuling(
          s,
          k === 'new' ? { kind: 'new', verdict: v, level: 1 } : k === 'follow' ? { kind: 'follow', verdict: v } : { kind: 'distinguish', verdict: v, exception: o.distinguishNodes[0] },
        ).state;
        if (s.authority <= 0) break;
        s = advance(s);
        if (s.finished) break;
      }
    }
  });

  it('手書きが尽きたときだけ、今期の3争点の中で自動生成にフォールバックする', () => {
    const s = newGame({ seed: 5 });
    s.day = 6;
    s.usedCaseIds = HAND_CASES.filter((c) => s.issues.includes(c.issue)).map((c) => c.id);
    const next = advance({ ...s, day: 5 });
    expect(next.currentCase!.generated).toBe(true);
    expect(s.issues).toContain(next.currentCase!.issue);
  });
});

describe('B: 威信のコストと世論', () => {
  const start = () => withCase(newGame({ seed: 7 }), CASE_BY_ID['occupy-01']);
  /** 広く認容した判例（第1号）の上で、世論が味方/逆の事件を裁く */
  const withWideGrant = () => applyRuling(start(), { kind: 'new', verdict: 'grant', level: 2 }).state;

  it('定数: 区別 −1 / 判例変更 −4 / 判例どおりで世論と逆は、世論に逆らう通常の減り(−1)より重い', () => {
    expect(COST_DISTINGUISH).toBe(1);
    expect(COST_OVERRULE).toBe(4);
    expect(CROWD_AGAINST_FOLLOWING).toBeGreaterThanOrEqual(2);
    expect(CROWD_AGAINST_FOLLOWING).toBeGreaterThan(CROWD_AGAINST);
  });

  it('判例どおりに判決して世論と逆なら威信が重く減る（従う+1 と合わせてマイナス）', () => {
    // occupy-10(老人×こたつ)は世論=原告寄り。「棄却」の広い判例に従って棄却すると、世論と逆
    let s = applyRuling(start(), { kind: 'new', verdict: 'deny', level: 2 }).state; // 占有:棄却 を広く
    s = withCase(s, CASE_BY_ID['occupy-03']); // 子ども×こたつ・世論=原告寄り
    expect(optionsFor(s).governing?.verdict).toBe('deny');
    const before = s.authority;
    const r = applyRuling(s, { kind: 'follow', verdict: 'deny' });
    expect(r.state.authority).toBe(before + 1 - CROWD_AGAINST_FOLLOWING);
    const au = r.events.find((e) => e.type === 'authority') as Extract<(typeof r.events)[number], { type: 'authority' }>;
    expect(au.parts.some((p) => p.label.includes('判例どおりなのに傍聴席が敵') && p.value === -CROWD_AGAINST_FOLLOWING)).toBe(true);
    // 拡張も「判例どおり」に数える
    let s2 = applyRuling(start(), { kind: 'new', verdict: 'deny', level: 0 }).state;
    s2 = withCase(s2, { ...CASE_BY_ID['occupy-03'], subject: 'cat', object: 'keyboard' });
    const b2 = s2.authority;
    const r2 = applyRuling(s2, { kind: 'extend', verdict: 'deny', level: 2 });
    expect(r2.state.authority).toBe(b2 + 2 - CROWD_AGAINST_FOLLOWING);
  });

  it('同じ事件で、世論の側に区別（ただし書き）すれば 区別−1 と 世論+1 で差し引き0', () => {
    let s = applyRuling(start(), { kind: 'new', verdict: 'deny', level: 2 }).state;
    s = withCase(s, CASE_BY_ID['occupy-03']); // 世論=原告寄り（認容）
    const before = s.authority;
    const r = applyRuling(s, { kind: 'distinguish', verdict: 'grant', exception: 'child' });
    expect(r.state.authority).toBe(before - COST_DISTINGUISH + 1);
    expect(r.state.precedents[0].exceptions).toEqual(['child']);
    // 判例どおり(−1)より、区別(0)のほうが得
    const follow = applyRuling(s, { kind: 'follow', verdict: 'deny' });
    expect(r.state.authority).toBeGreaterThan(follow.state.authority);
  });

  it('世論どおりに判例に従うのは今まで通り +1（従う）+1（世論）', () => {
    let s = withWideGrant();
    s = withCase(s, CASE_BY_ID['occupy-03']); // 世論=原告寄り、判例=認容
    const before = s.authority;
    const r = applyRuling(s, { kind: 'follow', verdict: 'grant' });
    expect(r.state.authority).toBe(before + 2);
  });

  it('判例に逆らう判決で世論と逆なら、今まで通り −1', () => {
    let s = withWideGrant();
    s = withCase(s, CASE_BY_ID['occupy-03']); // 世論=原告寄り(認容)
    const before = s.authority;
    const r = applyRuling(s, { kind: 'distinguish', verdict: 'deny', exception: 'child' }); // 判例=認容に逆らい棄却 → 世論とも逆
    expect(r.state.authority).toBe(before - COST_DISTINGUISH - CROWD_AGAINST);
  });
});

describe('B: 判例は「本文＋ただし書き」が連結した1本の条文', () => {
  it('条文テキストはただし書きを連結する', () => {
    const p = prec({ no: 1, subject: 'anyone', object: 'anything', exceptions: ['elder', 'bench'] });
    expect(holdingText(p.issue, p.verdict, p.subject, p.object, p.exceptions)).toBe(
      'あらゆる者があらゆる物を長時間占拠したときは、その者はその所有権を得る。ただし、老人の場合を除く。ただし、ベンチの場合を除く。',
    );
    expect(lawSentences(p)).toEqual(['あらゆる者があらゆる物を長時間占拠したときは、その者はその所有権を得る。', 'ただし、老人の場合を除く。', 'ただし、ベンチの場合を除く。']);
  });

  it('結果画面の主役は「ただし書きが一番多い条文」（同数なら引用数）。廃止された判例は後ろ', () => {
    const s = newGame({ seed: 1 });
    s.precedents = [
      prec({ no: 1, subject: 'anyone', object: 'anything', citations: 9 }),
      prec({ no: 2, issue: 'labor', subject: 'human', object: 'food', citations: 1, exceptions: ['child', 'agepan'] }),
      prec({ no: 3, issue: 'eat', subject: 'animal', object: 'food', citations: 3, exceptions: ['cat', 'dog'] }),
      prec({ no: 4, issue: 'vote', subject: 'org', object: 'public', citations: 0, exceptions: ['gov', 'hall', 'park', 'diet'], overruledBy: 5 }),
    ];
    expect(topPrecedents(s, 4).map((p) => p.no)).toEqual([3, 2, 1, 4]);
  });

  it('共有文には、ただし書きがつながった条文が入る。長ければ文単位で切って「…」', () => {
    const s = newGame({ seed: 4 });
    s.leafWins = { cat: 3 };
    s.precedents = [prec({ no: 1, subject: 'anyone', object: 'anything', exceptions: ['elder'] })];
    const t = buildShareText(s);
    expect(t).toContain('その所有権を得る。ただし、老人の場合を除く。」が法律になりました');
    expect(t.length).toBeLessThanOrEqual(140);
    s.precedents = [prec({ no: 1, issue: 'sleep', subject: 'politician', object: 'curry', exceptions: ['company', 'town', 'gov', 'robot', 'vending'] })];
    const long = buildShareText(s);
    expect(long.length).toBeLessThanOrEqual(140);
    expect(long).toContain('…');
    expect(long).toContain('」が法律になりました');
  });
});

describe('B: ツギハギ法の国 / 但し書き職人', () => {
  const done = (mut: (s: GameState) => void): GameState => {
    const s = newGame({ seed: 1 });
    s.finished = true;
    mut(s);
    return s;
  };
  it('1本の判例にただし書き3つ以上でエンディング「ツギハギ法の国」', () => {
    const s = done((s) => {
      s.precedents = [prec({ no: 1, subject: 'anyone', object: 'anything', exceptions: ['elder', 'bench', 'cat'] })];
    });
    expect(unlockedEndings(s).map((e) => e.name)).toContain('ツギハギ法の国');
    const two = done((s) => {
      s.precedents = [prec({ no: 1, subject: 'anyone', object: 'anything', exceptions: ['elder', 'bench'] }), prec({ no: 2, issue: 'labor', subject: 'anyone', object: 'anything', exceptions: ['cat'] })];
    });
    expect(unlockedEndings(two).map((e) => e.name)).not.toContain('ツギハギ法の国');
    const dead = done((s) => {
      s.precedents = [prec({ no: 1, subject: 'anyone', object: 'anything', exceptions: ['elder', 'bench', 'cat'], overruledBy: 2 })];
    });
    expect(unlockedEndings(dead).map((e) => e.name)).not.toContain('ツギハギ法の国');
    expect(primaryEnding(s).name).toBe('ツギハギ法の国');
  });
  it('称号「但し書き職人」は区別3回以上。名前付きエンディングは41種＋平凡', () => {
    const s = done((s) => {
      s.stats.distinguishes = 3;
    });
    expect(judgeTitle(s)).toBe('但し書き職人');
    expect(judgeTitle(done((s) => (s.stats.distinguishes = 2)))).not.toBe('但し書き職人');
    expect(ENDINGS).toHaveLength(41);
  });
});

describe('A4: 国の様子（メーターの数字は出さない）', () => {
  const mk = (deltas: Partial<Record<'秩序' | '経済' | '自由' | '幸福', number>>) => [{ type: 'meterChanged' as const, deltas }];
  it('一番動いたメーターの一言を返す。大きな変化は別の文', () => {
    const s = newGame({ seed: 2 });
    const mild = moodFor(mk({ 秩序: -2, 自由: 2 }), s);
    expect(mild.meter).toBe('秩序');
    expect(mild.line).toBeTruthy();
    const strong = moodFor(mk({ 秩序: -STRONG_DELTA - 1, 自由: 4 }), s);
    expect(strong.meter).toBe('秩序');
    expect(['街のベンチに行列ができた', '交番に「居座られました」の届け出が殺到']).toContain(strong.line);
    expect(mild.line).not.toBe(strong.line);
    expect(moodFor(mk({ 幸福: 3 }), s).meter).toBe('幸福');
    expect(moodFor([], s).line).toBeUndefined();
  });
  it('メーターが限界近く(±5)なら警告を出す。数字は含めない', () => {
    const s = newGame({ seed: 2 });
    s.meters.秩序 = -6.5;
    const m = moodFor(mk({ 秩序: -1 }), s);
    expect(m.warn).toBeTruthy();
    expect(`${m.line}${m.warn}`).not.toMatch(/\d/);
    s.meters.秩序 = -2;
    expect(moodFor(mk({ 秩序: -1 }), s).warn).toBeUndefined();
  });
});
