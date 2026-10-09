import { describe, expect, it } from 'vitest';
import { CASE_BY_ID } from '../data/cases';
import { depth, isDescendant, leavesUnder, nodeAtLevel } from './ontology';
import { applies, boundCount, findGoverning, checkCondition } from './precedent';
import { applyRuling, optionsFor } from './ruling';
import { advance, newGame } from './state';
import { drawNextCase } from './selector';
import { makeRng } from './rng';
import { holdingText } from './text';
import { primaryEnding, unlockedEndings, countryName } from './endings';
import { generateCase } from './generate';
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

const withCase = (s: GameState, c: CaseDef): GameState => ({ ...structuredClone(s), currentCase: c });

describe('ontology', () => {
  it('isDescendant は自身・親・root を含む', () => {
    expect(isDescendant('cat', 'cat')).toBe(true);
    expect(isDescendant('cat', 'animal')).toBe(true);
    expect(isDescendant('cat', 'anyone')).toBe(true);
    expect(isDescendant('cat', 'human')).toBe(false);
    expect(isDescendant('cat', 'anything')).toBe(false);
  });
  it('nodeAtLevel は射程ごとの祖先を返す', () => {
    expect(nodeAtLevel('cat', 0)).toBe('cat');
    expect(nodeAtLevel('cat', 1)).toBe('animal');
    expect(nodeAtLevel('cat', 2)).toBe('anyone');
    expect(nodeAtLevel('bench', 2)).toBe('anything');
  });
  it('depth と leavesUnder', () => {
    expect(depth('anyone')).toBe(0);
    expect(depth('animal')).toBe(1);
    expect(depth('cat')).toBe(2);
    expect(leavesUnder('animal')).toHaveLength(5);
    expect(leavesUnder('anyone')).toHaveLength(15);
    expect(boundCount('anyone', 'anything')).toBe(15 * 18);
  });
});

describe('適用判定', () => {
  const c = CASE_BY_ID['occupy-02']; // 老人×ベンチ
  it('射程の外には適用されない', () => {
    expect(applies(prec({ no: 1, subject: 'cat', object: 'keyboard' }), c)).toBe(false);
    expect(applies(prec({ no: 1, subject: 'animal', object: 'private' }), c)).toBe(false);
  });
  it('広い射程には適用される', () => {
    expect(applies(prec({ no: 1, subject: 'anyone', object: 'anything' }), c)).toBe(true);
    expect(applies(prec({ no: 1, subject: 'human', object: 'public' }), c)).toBe(true);
  });
  it('争点が違えば適用されない', () => {
    expect(applies(prec({ no: 1, issue: 'labor', subject: 'anyone', object: 'anything' }), c)).toBe(false);
  });
  it('例外（主体・客体どちら）で除外される', () => {
    expect(applies(prec({ no: 1, subject: 'anyone', object: 'anything', exceptions: ['elder'] }), c)).toBe(false);
    expect(applies(prec({ no: 1, subject: 'anyone', object: 'anything', exceptions: ['bench'] }), c)).toBe(false);
    expect(applies(prec({ no: 1, subject: 'anyone', object: 'anything', exceptions: ['public'] }), c)).toBe(false);
    expect(applies(prec({ no: 1, subject: 'anyone', object: 'anything', exceptions: ['cat'] }), c)).toBe(true);
  });
  it('判例変更された判例は適用されない', () => {
    expect(applies(prec({ no: 1, subject: 'anyone', object: 'anything', overruledBy: 2 }), c)).toBe(false);
  });
});

describe('最具体判例', () => {
  const c = CASE_BY_ID['occupy-02'];
  it('射程が狭い（深い）判例が支配する', () => {
    const a = prec({ no: 1, subject: 'anyone', object: 'anything', verdict: 'grant' });
    const b = prec({ no: 2, subject: 'human', object: 'public', verdict: 'deny' });
    expect(findGoverning(c, [a, b])?.no).toBe(2);
    expect(findGoverning(c, [b, a])?.no).toBe(2);
  });
  it('同点なら新しい方', () => {
    const a = prec({ no: 1, subject: 'human', object: 'public', verdict: 'grant' });
    const b = prec({ no: 2, subject: 'human', object: 'public', verdict: 'deny' });
    expect(findGoverning(c, [a, b])?.no).toBe(2);
  });
  it('主体と客体の深さの合計で比べる', () => {
    const a = prec({ no: 1, subject: 'elder', object: 'anything' }); // 2+0
    const b = prec({ no: 2, subject: 'anyone', object: 'bench' }); // 0+2
    const d = prec({ no: 3, subject: 'human', object: 'public' }); // 1+1
    expect(findGoverning(c, [a, b, d])?.no).toBe(3); // 同点(2)なら新しい方
  });
  it('なければ undefined', () => {
    expect(findGoverning(c, [])).toBeUndefined();
  });
});

describe('出現条件', () => {
  it('covers は射程が条件ノードを含むときだけ満たされる', () => {
    let s = newGame({ seed: 1 });
    const cond = CASE_BY_ID['occupy-04'].requires![0]; // 動物×私物 grant
    expect(checkCondition(cond, s)).toBe(false);
    s = { ...s, precedents: [prec({ no: 1, subject: 'cat', object: 'keyboard' })] };
    expect(checkCondition(cond, s)).toBe(false); // 狭く裁いた人には来ない
    s = { ...s, precedents: [prec({ no: 1, subject: 'animal', object: 'private' })] };
    expect(checkCondition(cond, s)).toBe(true);
    s = { ...s, precedents: [prec({ no: 1, subject: 'anyone', object: 'anything' })] };
    expect(checkCondition(cond, s)).toBe(true);
    s = { ...s, precedents: [prec({ no: 1, subject: 'anyone', object: 'anything', verdict: 'deny' })] };
    expect(checkCondition(cond, s)).toBe(false); // 向きが違う
    s = { ...s, precedents: [prec({ no: 1, subject: 'anyone', object: 'anything', overruledBy: 2 })] };
    expect(checkCondition(cond, s)).toBe(false); // 変更済み
  });
  it('メーター条件', () => {
    const s = newGame({ seed: 1 });
    expect(checkCondition({ kind: 'meter', meter: '秩序', lte: -3 }, s)).toBe(false);
    s.meters.秩序 = -4;
    expect(checkCondition({ kind: 'meter', meter: '秩序', lte: -3 }, s)).toBe(true);
  });
});

describe('判決の適用', () => {
  const start = () => withCase(newGame({ seed: 7 }), CASE_BY_ID['occupy-01']);

  it('新判例: 射程ごとに威信とメーターが変わる（倍率 1/1.5/2）', () => {
    const narrow = applyRuling(start(), { kind: 'new', verdict: 'grant', level: 0 });
    const mid = applyRuling(start(), { kind: 'new', verdict: 'grant', level: 1 });
    const wide = applyRuling(start(), { kind: 'new', verdict: 'grant', level: 2 });
    // 占有 grant: 秩序-2 自由+2 経済+1。世論は猫派(原告寄り)で +1
    expect(narrow.state.meters.秩序).toBe(-2);
    expect(mid.state.meters.秩序).toBe(-3);
    expect(wide.state.meters.秩序).toBe(-4);
    expect(wide.state.meters.経済).toBe(2);
    expect(narrow.state.authority).toBe(10 + 0 + 1);
    expect(mid.state.authority).toBe(10 + 1 + 1);
    expect(wide.state.authority).toBe(10 + 2 + 1);
    expect(wide.state.precedents[0]).toMatchObject({ no: 1, subject: 'anyone', object: 'anything', verdict: 'grant' });
    expect(wide.events.map((e) => e.type)).toContain('precedentCreated');
  });

  it('世論に逆らうと威信-1、splitは±0', () => {
    const r = applyRuling(start(), { kind: 'new', verdict: 'deny', level: 0 });
    expect(r.state.authority).toBe(10 + 0 - 1);
    const s2 = withCase(newGame({ seed: 7 }), CASE_BY_ID['occupy-02']);
    s2.precedents = [];
    const r2 = applyRuling(s2, { kind: 'new', verdict: 'grant', level: 0 });
    expect(r2.state.authority).toBe(10);
  });

  it('従う: 引用+1 / 威信+1', () => {
    let s = applyRuling(start(), { kind: 'new', verdict: 'grant', level: 2 }).state;
    s = withCase(s, CASE_BY_ID['occupy-02']);
    expect(optionsFor(s).governing?.no).toBe(1);
    const before = s.authority;
    const r = applyRuling(s, { kind: 'follow', verdict: 'grant' });
    expect(r.state.precedents[0].citations).toBe(1);
    expect(r.state.authority).toBe(before + 1); // 世論 split
    expect(r.state.stats.follows).toBe(1);
    expect(r.events.find((e) => e.type === 'cited')).toBeTruthy();
  });

  it('従いつつ拡張: 射程が書き換わり威信+2', () => {
    let s = applyRuling(start(), { kind: 'new', verdict: 'grant', level: 0 }).state; // 猫×キーボード
    s = withCase(s, { ...CASE_BY_ID['occupy-02'], subject: 'cat', object: 'keyboard' });
    const o = optionsFor(s);
    expect(o.extendLevels).toEqual([1, 2]);
    const before = s.authority;
    const r = applyRuling(s, { kind: 'extend', verdict: 'grant', level: 2 });
    expect(r.state.precedents[0]).toMatchObject({ subject: 'anyone', object: 'anything', citations: 1 });
    expect(r.state.authority).toBe(before + 2);
  });

  it('区別: 例外が追記され、その葉には以後適用されない。威信-2', () => {
    let s = applyRuling(start(), { kind: 'new', verdict: 'grant', level: 2 }).state;
    s = withCase(s, CASE_BY_ID['occupy-02']); // 老人×ベンチ
    expect(optionsFor(s).verdictKind.deny).toBe('against');
    const before = s.authority;
    const r = applyRuling(s, { kind: 'distinguish', verdict: 'deny', exception: 'bench' });
    expect(r.state.precedents[0].exceptions).toEqual(['bench']);
    expect(r.state.authority).toBe(before - 2); // 世論 split
    expect(r.state.stats.distinguishes).toBe(1);
    expect(applies(r.state.precedents[0], CASE_BY_ID['occupy-02'])).toBe(false);
    expect(applies(r.state.precedents[0], CASE_BY_ID['occupy-03'])).toBe(true);
    expect(() => applyRuling(s, { kind: 'distinguish', verdict: 'deny', exception: 'cat' })).toThrow();
  });

  it('判例変更: 旧判例が失効し、新判例が成立。威信-4+射程ボーナス', () => {
    let s = applyRuling(start(), { kind: 'new', verdict: 'grant', level: 2 }).state;
    s = withCase(s, CASE_BY_ID['occupy-02']);
    const before = s.authority;
    const r = applyRuling(s, { kind: 'overrule', verdict: 'deny', level: 1 });
    expect(r.state.precedents[0].overruledBy).toBe(2);
    expect(r.state.precedents[1]).toMatchObject({ no: 2, verdict: 'deny', subject: 'human', object: 'public' });
    expect(r.state.authority).toBe(before - 4 + 1);
    expect(r.state.stats.overrules).toBe(1);
    expect(findGoverning(CASE_BY_ID['occupy-02'], r.state.precedents)?.no).toBe(2);
  });

  it('不正な選択は例外', () => {
    expect(() => applyRuling(start(), { kind: 'follow', verdict: 'grant' })).toThrow();
    let s = applyRuling(start(), { kind: 'new', verdict: 'grant', level: 2 }).state;
    s = withCase(s, CASE_BY_ID['occupy-02']);
    expect(() => applyRuling(s, { kind: 'new', verdict: 'grant', level: 0 })).toThrow();
    expect(() => applyRuling(s, { kind: 'follow', verdict: 'deny' })).toThrow();
  });

  it('メーターは±10に収まり、威信は0..20', () => {
    let s = start();
    s.meters.秩序 = -9.5;
    s = applyRuling(s, { kind: 'new', verdict: 'grant', level: 2 }).state;
    expect(s.meters.秩序).toBe(-10);
    s = withCase(s, CASE_BY_ID['occupy-02']);
    s.authority = 1;
    const r = applyRuling(s, { kind: 'overrule', verdict: 'deny', level: 0 });
    expect(r.state.authority).toBe(0);
    expect(r.events.some((e) => e.type === 'ended')).toBe(true);
  });

  it('原告勝訴で受益者・勝ち星が増える', () => {
    const r = applyRuling(start(), { kind: 'new', verdict: 'grant', level: 1 });
    expect(r.state.beneficiaries.animal).toBe(1);
    expect(r.state.leafWins.cat).toBe(1);
    const d = applyRuling(start(), { kind: 'new', verdict: 'deny', level: 1 });
    expect(d.state.beneficiaries.animal).toBe(0);
  });

  it('イミュータブル（元のstateを変更しない）', () => {
    const s = start();
    const snap = JSON.stringify(s);
    applyRuling(s, { kind: 'new', verdict: 'grant', level: 2 });
    expect(JSON.stringify(s)).toBe(snap);
  });

  it('文章: 射程プレビュー', () => {
    expect(holdingText('occupy', 'grant', 'cat', 'keyboard')).toBe('猫がキーボードを長時間占拠したときは、猫はその所有権を得る。');
    expect(holdingText('occupy', 'grant', 'animal', 'private')).toBe('動物が私物を長時間占拠したときは、動物はその所有権を得る。');
    expect(holdingText('occupy', 'grant', 'anyone', 'anything')).toBe('あらゆる者があらゆる物を長時間占拠したときは、その者はその所有権を得る。');
    expect(holdingText('occupy', 'deny', 'cat', 'keyboard', ['elder'])).toContain('ただし、老人の場合を除く。');
  });
});

describe('事件の抽選', () => {
  it('初回は 占有-01 → 労働-02 → 占有-02 の順に固定', () => {
    let s = newGame({ seed: 3, opening: true });
    const seen: string[] = [s.currentCase!.id];
    for (let i = 0; i < 2; i++) {
      s = applyRuling(s, { kind: 'new', verdict: 'grant', level: 0 }).state;
      if (optionsFor(s).governing) s = applyRuling(s, { kind: 'follow', verdict: 'grant' }).state;
      s = advance(s);
      seen.push(s.currentCase!.id);
    }
    expect(seen).toEqual(['occupy-01', 'labor-02', 'occupy-02']);
  });

  it('同じシードなら同じ事件列（再現性）', () => {
    const play = () => {
      let s = newGame({ seed: 12345 });
      const ids: string[] = [];
      for (let d = 0; d < 6; d++) {
        ids.push(s.currentCase!.id);
        const g = optionsFor(s).governing;
        s = applyRuling(s, g ? { kind: 'follow', verdict: g.verdict } : { kind: 'new', verdict: 'grant', level: 1 }).state;
        s = advance(s);
      }
      return ids;
    };
    expect(play()).toEqual(play());
  });

  it('連鎖事件は広く裁いたときだけ来る', () => {
    const rng = () => makeRng(99);
    // 狭い判例だけ → occupy-04/05/06/07/08/09 は出ない
    let s = newGame({ seed: 5 });
    s.day = 8;
    s.precedents = [prec({ no: 1, subject: 'cat', object: 'keyboard' })];
    const ids = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const r = makeRng(i + 1);
      ids.add(drawNextCase(s, r).id);
    }
    for (const x of ['occupy-04', 'occupy-05', 'occupy-06', 'occupy-07', 'occupy-08', 'occupy-09']) expect(ids.has(x)).toBe(false);
    // 広い判例 → 出る
    s.precedents = [prec({ no: 1, subject: 'anyone', object: 'anything' })];
    const ids2 = new Set<string>();
    for (let i = 0; i < 300; i++) ids2.add(drawNextCase(s, makeRng(i + 1)).id);
    for (const x of ['occupy-04', 'occupy-05', 'occupy-08']) expect(ids2.has(x)).toBe(true);
    expect(rng().next()).toBeGreaterThan(0);
  });

  it('使用済みの事件は出ない / 1〜3日目は争点が重複しない', () => {
    for (let seed = 1; seed <= 40; seed++) {
      let s = newGame({ seed });
      const used = new Set<string>();
      const issues: string[] = [];
      for (let d = 0; d < 10; d++) {
        const c = s.currentCase!;
        expect(used.has(c.id)).toBe(false);
        used.add(c.id);
        if (d < 3) issues.push(c.issue);
        const o = optionsFor(s);
        s = applyRuling(s, o.governing ? { kind: 'follow', verdict: o.governing.verdict } : { kind: 'new', verdict: 'grant', level: 1 }).state;
        if (s.authority <= 0) break;
        s = advance(s);
      }
      expect(new Set(issues).size).toBe(issues.length);
    }
  });

  it('自動生成事件は手書きと同じ構造で、判例が適用される', () => {
    const c = generateCase('occupy', 'crow', 'bench', makeRng(1), false);
    expect(c.generated).toBe(true);
    expect(c.plaintiff.lines.length).toBeGreaterThanOrEqual(2);
    expect(c.plaintiff.lines.join('')).not.toContain('{');
    expect(applies(prec({ no: 1, subject: 'animal', object: 'public' }), c)).toBe(true);
  });
});

describe('エンディング', () => {
  const done = (mut: (s: GameState) => void): GameState => {
    const s = newGame({ seed: 1 });
    s.finished = true;
    mut(s);
    return s;
  };
  const logOf = (caseId: string, verdict: 'grant' | 'deny', over: object = {}) => ({
    day: 1, caseId, issue: 'occupy' as const, subject: 'cat', object: 'diet', verdict, kind: 'new' as const,
    precedentNo: 1, crowd: 'split' as const, authorityDelta: 0, ...over,
  });

  it('何も該当しなければ平凡な国', () => {
    const s = done(() => {});
    expect(primaryEnding(s).name).toBe('平凡な国');
  });
  it('★事件の原告勝訴で名前付きエンディング', () => {
    const s = done((s) => {
      s.log.push(logOf('occupy-08', 'grant'));
    });
    expect(primaryEnding(s).name).toBe('国会議事堂、猫のものに');
  });
  it('★事件の被告勝訴', () => {
    const s = done((s) => {
      s.log.push(logOf('occupy-08', 'deny'));
    });
    expect(unlockedEndings(s).map((e) => e.name)).toContain('猫に屈しなかった判事');
  });
  it('メーター系 / 受益者系は複数解除され、最もレアなものが大見出し', () => {
    const s = done((s) => {
      s.meters.秩序 = -9;
      s.beneficiaries.animal = 3;
    });
    const names = unlockedEndings(s).map((e) => e.name);
    expect(names).toEqual(expect.arrayContaining(['国家崩壊', '動物王国']));
    expect(primaryEnding(s).name).toBe('国家崩壊');
  });
  it('罷免と史上最速の罷免', () => {
    const s = done((s) => {
      s.authority = 0;
      s.day = 2;
    });
    expect(primaryEnding(s).name).toBe('史上最速の罷免');
    const s2 = done((s) => {
      s.authority = 0;
      s.day = 6;
    });
    expect(primaryEnding(s2).name).toBe('罷免');
  });
  it('たった1つの法 / 前例製造機', () => {
    const s = done((s) => {
      s.precedents = [prec({ no: 1, subject: 'anyone', object: 'anything', citations: 6 })];
      for (let i = 0; i < 7; i++) s.log.push(logOf('x' + i, 'grant'));
    });
    const names = unlockedEndings(s).map((e) => e.name);
    expect(names).toEqual(expect.arrayContaining(['たった1つの法', '前例製造機']));
  });
  it('国名はメーター・主役から作られる', () => {
    const s = done((s) => {
      s.leafWins = { cat: 3, elder: 1 };
      s.meters.自由 = 6;
    });
    expect(countryName(s)).toMatch(/^猫自由/);
  });
});

describe('シミュレーション的な安定性', () => {
  it('ランダム方針で2000回遊んでもクラッシュしない', () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const r = makeRng(seed * 7919);
      let s = newGame({ seed });
      for (let d = 0; d < 10; d++) {
        const o = optionsFor(s);
        const v = r.next() < 0.5 ? 'grant' : 'deny';
        const lv = Math.floor(r.next() * 3) as 0 | 1 | 2;
        const kind = o.verdictKind[v];
        if (kind === 'new') s = applyRuling(s, { kind: 'new', verdict: v, level: lv }).state;
        else if (kind === 'follow') s = applyRuling(s, r.next() < 0.3 && o.extendLevels.length ? { kind: 'extend', verdict: v, level: o.extendLevels[0] } : { kind: 'follow', verdict: v }).state;
        else if (r.next() < 0.5) s = applyRuling(s, { kind: 'distinguish', verdict: v, exception: o.distinguishNodes[Math.floor(r.next() * 2)] }).state;
        else s = applyRuling(s, { kind: 'overrule', verdict: v, level: lv }).state;
        s = advance(s);
        if (s.finished) break;
      }
      expect(unlockedEndings(s).length).toBeGreaterThan(0);
    }
  });
});
