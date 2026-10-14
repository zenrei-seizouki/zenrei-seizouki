// 古い形式のセーブ（変更前に始めた任期）と、ホットリロードで古い形のままメモリに残った状態を、落ちずに続行できること
import { describe, expect, it } from 'vitest';
import { ISSUE_IDS } from '../data/issues';
import { ISSUES_PER_TERM } from './issues';
import { applyRuling, optionsFor } from './ruling';
import { advance, deserialize, migrateState, newGame, serialize, STATE_VERSION } from './state';
import type { GameState } from './types';

/** 変更前（v1）の形: issues が無く、固定オープニングは 占有-01 → 労働-02 → 占有-02 */
function legacyOf(s: GameState): Record<string, unknown> {
  const o = JSON.parse(serialize(s));
  delete o.issues;
  o.version = 1;
  o.opening = ['occupy-01', 'labor-02', 'occupy-02'];
  return o;
}

/** 方針: 判例があれば従い、なければ新判例（射程は日によって変える）。最後まで進める */
function playOut(start: GameState, maxDays = 10): { state: GameState; ids: string[] } {
  let s = start;
  const ids: string[] = [];
  while (!s.finished && ids.length < maxDays + 2) {
    ids.push(s.currentCase!.id);
    const o = optionsFor(s);
    const v = s.day % 2 ? 'grant' : 'deny';
    const k = o.verdictKind[v];
    s = applyRuling(
      s,
      k === 'new' ? { kind: 'new', verdict: v, level: (s.day % 3) as 0 | 1 | 2 } : k === 'follow' ? { kind: 'follow', verdict: v } : { kind: 'distinguish', verdict: v, exception: o.distinguishNodes[0] },
    ).state;
    s = advance(s);
  }
  return { state: s, ids };
}

/** 変更前のコードで3日目まで進めた状態（占有・労働・占有）を作る */
function midTerm(seed = 11): GameState {
  let s = newGame({ seed, opening: true });
  s.issues = ['occupy', 'labor', 'eat'];
  for (let d = 0; d < 2; d++) {
    const o = optionsFor(s);
    s = applyRuling(s, o.governing ? { kind: 'follow', verdict: o.governing.verdict } : { kind: 'new', verdict: 'grant', level: 2 }).state;
    s = advance(s);
  }
  return s;
}

describe('古い形式のセーブの読み込み（マイグレーション）', () => {
  it('issues が無い v1 のセーブを読み込める。その周で使った争点を含めて3つに補完される', () => {
    const s = midTerm();
    const used = new Set(s.log.map((l) => l.issue));
    const old = legacyOf(s);
    expect(old.issues).toBeUndefined();
    const loaded = deserialize(JSON.stringify(old));
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(STATE_VERSION);
    expect(loaded!.issues.length).toBeGreaterThanOrEqual(ISSUES_PER_TERM);
    for (const i of used) expect(loaded!.issues).toContain(i);
    for (const i of loaded!.issues) expect(ISSUE_IDS).toContain(i);
    expect(new Set(loaded!.issues).size).toBe(loaded!.issues.length);
    // 今日の事件・判例・メーター・威信はそのまま
    expect(loaded!.day).toBe(s.day);
    expect(loaded!.currentCase!.id).toBe(s.currentCase!.id);
    expect(loaded!.precedents).toEqual(s.precedents);
    expect(loaded!.authority).toBe(s.authority);
  });

  it('読み込んだ古いセーブで、次の事件へ進み、任期を最後まで終えられる', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const loaded = deserialize(JSON.stringify(legacyOf(midTerm(seed))))!;
      const { state, ids } = playOut(loaded);
      expect(state.finished || state.authority <= 0, `seed=${seed}`).toBe(true);
      expect(new Set(ids).size).toBe(ids.length); // 同じ事件が二度出ない
      for (const c of state.log) expect(c.day).toBeGreaterThan(0);
    }
  });

  it('旧セーブが3つ以上の争点を使っていたら、使った争点をすべて残す（進行中のチェーンを切らない）', () => {
    const s = midTerm();
    s.log.push({ ...s.log[0], day: 3, issue: 'vote', caseId: 'vote-01' }, { ...s.log[0], day: 3, issue: 'name', caseId: 'name-01' });
    const loaded = deserialize(JSON.stringify(legacyOf(s)))!;
    for (const i of ['occupy', 'labor', 'vote', 'name']) expect(loaded.issues).toContain(i);
  });

  it('旧オープニング（占有-01 → 労働-02 → 占有-02）は新しい2件に置き換わる', () => {
    const loaded = deserialize(JSON.stringify(legacyOf(newGame({ seed: 4, opening: true }))))!;
    expect(loaded.opening).toEqual(['occupy-01', 'occupy-02']);
    expect(loaded.issues).toContain('occupy');
  });

  it('issues が空・不正・重複でも補完される', () => {
    for (const bad of [[], ['nope'], ['occupy', 'occupy'], 'occupy', null, [1, 2, 3]]) {
      const o = JSON.parse(serialize(midTerm()));
      o.issues = bad;
      const loaded = deserialize(JSON.stringify(o));
      expect(loaded, JSON.stringify(bad)).not.toBeNull();
      expect(loaded!.issues.length).toBeGreaterThanOrEqual(ISSUES_PER_TERM);
      for (const i of loaded!.issues) expect(ISSUE_IDS).toContain(i);
    }
  });

  it('欠けたフィールド（stats・配列・メーター）は既定値で埋まり、そのまま遊べる', () => {
    const o = JSON.parse(serialize(midTerm()));
    delete o.issues;
    delete o.stats;
    delete o.crisisUsed;
    delete o.beneficiaries;
    delete o.meters.幸福;
    o.leafWins = null;
    const loaded = deserialize(JSON.stringify(o))!;
    expect(loaded.stats).toMatchObject({ follows: 0, distinguishes: 0, overrules: 0, extends: 0 });
    expect(loaded.crisisUsed).toEqual([]);
    expect(loaded.meters.幸福).toBe(0);
    expect(loaded.leafWins).toEqual({});
    expect(() => playOut(loaded)).not.toThrow();
  });

  it('マイグレーションは冪等で、元のオブジェクトを書き換えない', () => {
    const old = legacyOf(midTerm());
    const snap = JSON.stringify(old);
    const once = migrateState(old)!;
    expect(JSON.stringify(old)).toBe(snap);
    expect(migrateState(once)).toEqual(once);
    // 新しい形のセーブはそのまま
    const fresh = newGame({ seed: 9 });
    expect(migrateState(JSON.parse(serialize(fresh)))).toEqual(fresh);
  });

  it('壊れたデータ・直せないデータは null（落ちない）', () => {
    for (const bad of ['', '{', 'null', '[]', '"x"', '{"day":"3"}', '{"day":2,"seed":1}', JSON.stringify({ day: 0, seed: 1, authority: 5 })]) {
      expect(deserialize(bad), bad).toBeNull();
    }
  });

  it('進行中なのに今日の事件が無い（壊れた）セーブは、今日の事件を引き直す', () => {
    const o = JSON.parse(serialize(midTerm()));
    o.currentCase = null;
    const loaded = deserialize(JSON.stringify(o))!;
    expect(loaded.currentCase).not.toBeNull();
    expect(loaded.issues).toContain(loaded.currentCase!.crisis ? loaded.currentCase!.issue : loaded.currentCase!.issue);
  });
});

describe('ホットリロードで古い形のままメモリに残った状態', () => {
  it('issues の無い状態に advance しても例外にならず、次の事件が引ける（3日目の「次の事件へ」が固まらない）', () => {
    const s = midTerm();
    // UI がメモリに持っている状態（変更前のコードで作られた）: issues が無い
    const stale = JSON.parse(serialize(s)) as Record<string, unknown>;
    delete stale.issues;
    stale.version = 1;
    const staleState = stale as unknown as GameState;
    const o = optionsFor(staleState);
    const ruled = applyRuling(staleState, o.governing ? { kind: 'follow', verdict: o.governing.verdict } : { kind: 'new', verdict: 'grant', level: 1 }).state;
    expect(ruled.issues).toBeUndefined(); // 判決の適用は issues を触らないので、古い形のまま
    const next = advance(ruled);
    expect(next.day).toBe(s.day + 1);
    expect(next.currentCase).not.toBeNull();
    expect(Array.isArray(next.issues)).toBe(true);
    expect(next.version).toBe(STATE_VERSION);
  });

  it('最後まで古い形の状態から始めても進められる', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const stale = legacyOf(midTerm(seed)) as unknown as GameState;
      expect(() => playOut(stale)).not.toThrow();
    }
  });
});
