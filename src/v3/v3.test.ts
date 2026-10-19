import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CROSSOVERS, NOTES, STORIES, type Scene, type Side } from './data';
import { allEndings, choose, lawOf, matchCrossover, newRun, newspaper, shareText, stepOf, totalSteps, type Follow, type RunState } from './engine';

const play = (picks: Side[], follows: Follow[], cross: Side = 'blue'): RunState => {
  let r = newRun();
  for (const p of picks) r = choose(r, p);
  for (const f of follows) r = choose(r, f);
  if (stepOf(r).kind === 'cross') r = choose(r, cross);
  return r;
};

describe('1プレイの流れ', () => {
  it('最初の事件3件 → 続き3件 → （交差事件）→ 百年後新聞に到達する（全64通り）', () => {
    const sides: Side[] = ['blue', 'red'];
    const fs: Follow[] = ['follow', 'except'];
    let reached = 0;
    for (const a of sides)
      for (const b of sides)
        for (const c of sides)
          for (const fa of fs)
            for (const fb of fs)
              for (const fc of fs) {
                let r = newRun();
                const kinds: string[] = [];
                while (stepOf(r).kind !== 'paper') {
                  const st = stepOf(r);
                  kinds.push(st.kind);
                  const ans = st.kind === 'first' ? [a, b, c][r.step] : st.kind === 'next' ? [fa, fb, fc][r.step - 3] : 'red';
                  r = choose(r, ans as Side | Follow);
                }
                expect(kinds.slice(0, 6)).toEqual(['first', 'first', 'first', 'next', 'next', 'next']);
                expect(kinds.length).toBe(totalSteps(r));
                const p = newspaper(r);
                expect(p.main.hl).toBeTruthy();
                expect(p.laws).toHaveLength(3);
                expect(p.side.length).toBeLessThanOrEqual(2);
                reached++;
              }
    expect(reached).toBe(64);
  });

  it('続きの事件は、選んだ判決文の側の物が来る', () => {
    let r = choose(newRun(), 'red');
    r = choose(r, 'blue');
    r = choose(r, 'blue');
    const st = stepOf(r);
    expect(st.kind).toBe('next');
    if (st.kind === 'next') expect(st.scene.title).toBe('本当に無農薬の爺さん事件');
  });

  it('元の state を書き換えない。答えの種類を間違えると例外', () => {
    const r = newRun();
    const snap = JSON.stringify(r);
    choose(r, 'blue');
    expect(JSON.stringify(r)).toBe(snap);
    expect(() => choose(r, 'follow')).toThrow();
  });
});

describe('交差事件の条件判定', () => {
  it('手羽先🟦＋看板🟦 → たい焼き屋の看板事件', () => {
    expect(matchCrossover({ stories: ['wing', 'sign', 'chatbot'], picks: { wing: 'blue', sign: 'blue', chatbot: 'red' } })?.id).toBe('x1');
  });
  it('看板🟦＋AI🟥 → AIが書いた看板事件（手羽先🟥のとき）', () => {
    expect(matchCrossover({ stories: ['wing', 'sign', 'chatbot'], picks: { wing: 'red', sign: 'blue', chatbot: 'red' } })?.id).toBe('x2');
  });
  it('手羽先🟦＋AI🟦 → 幸せになれるパン事件', () => {
    expect(matchCrossover({ stories: ['wing', 'sign', 'chatbot'], picks: { wing: 'blue', sign: 'red', chatbot: 'blue' } })?.id).toBe('x3');
  });
  it('どれにも合わなければ交差事件は出ず、6件で新聞', () => {
    const r = play(['red', 'red', 'blue'], ['follow', 'follow', 'follow']);
    expect(matchCrossover(r)).toBeUndefined();
    expect(r.step).toBe(6);
    expect(stepOf(r).kind).toBe('paper');
    expect(totalSteps(r)).toBe(6);
  });
  it('交差事件の結末が主見出しになる', () => {
    const r = play(['blue', 'blue', 'red'], ['follow', 'follow', 'follow'], 'red');
    expect(r.crossover).toEqual({ id: 'x1', pick: 'red' });
    expect(newspaper(r).main).toMatchObject({ hl: 'たい焼きは3800円、看板は「お願い」のみ、客は来ず', ending: '名は体を表す静かな国', endingId: 'x1-red' });
  });
});

describe('ただし書き', () => {
  it('ただし書きを選ぶと条文が伸びる', () => {
    const r = play(['blue', 'red', 'blue'], ['except', 'follow', 'follow']);
    expect(lawOf(r, 'wing')).toEqual({ base: '名前に書いた物は、中に入れなければならない。', exception: 'ただし、たい焼きの場合を除く。' });
    expect(lawOf(r, 'sign').exception).toBeUndefined();
    const law = newspaper(r).laws.find((l) => l.story === 'wing')!;
    expect(`${law.base}${law.exception}`).toBe('名前に書いた物は、中に入れなければならない。ただし、たい焼きの場合を除く。');
  });
  it('ただし書きを付けた本の100年後はツギハギ版。主見出しは判例に従った本を優先', () => {
    const r = play(['red', 'red', 'blue'], ['except', 'follow', 'except']);
    const p = newspaper(r);
    expect(p.main).toMatchObject({ story: 'sign', hl: '「立入禁止」が全て「入らないでほしいな」に', ending: 'お願いしかない国' });
    expect(p.side.map((s) => s.ending)).toEqual(['ツギハギ法の国', 'ツギハギ法の国']);
  });
  it('全部ただし書きなら、最初の本のツギハギ版が主見出し', () => {
    const r = play(['red', 'red', 'blue'], ['except', 'except', 'except']);
    expect(newspaper(r).main).toMatchObject({ ending: 'ツギハギ法の国', endingId: 'patchwork' });
  });
});

describe('データ', () => {
  const cases = readFileSync('docs/fable_cases.md', 'utf-8');
  const crosses = readFileSync('docs/fable_crossovers.md', 'utf-8');
  const linesOf = (s: Scene) => [...s.plaintiff.lines, ...s.defendant.lines];

  it('セリフは台本（docs/fable_cases.md / fable_crossovers.md）から一字も変えずに使っている', () => {
    for (const s of STORIES) {
      for (const sc of [s.first, s.verdicts.blue.next, s.verdicts.red.next]) for (const l of linesOf(sc)) expect(cases, l).toContain(l);
      for (const side of ['blue', 'red'] as Side[]) {
        const v = s.verdicts[side];
        expect(cases).toContain(`**${v.law}**`);
        expect(cases).toContain(v.teaser);
        expect(cases).toContain(v.future.hl);
        expect(cases).toContain(v.future.ending);
      }
    }
    for (const x of CROSSOVERS) {
      for (const l of linesOf(x.scene)) expect(crosses, l).toContain(l);
      for (const side of ['blue', 'red'] as Side[]) {
        expect(crosses).toContain(`**${x.verdicts[side].law}**`);
        expect(crosses).toContain(x.verdicts[side].future.hl);
      }
    }
  });

  it('各セリフは2〜3行。ただし書きは「ただし、〜の場合を除く。」の形', () => {
    for (const s of STORIES) {
      for (const sc of [s.first, s.verdicts.blue.next, s.verdicts.red.next]) {
        expect(sc.plaintiff.lines.length).toBeGreaterThanOrEqual(2);
        expect(sc.plaintiff.lines.length).toBeLessThanOrEqual(3);
        expect(sc.defendant.lines.length).toBeGreaterThanOrEqual(2);
      }
      for (const side of ['blue', 'red'] as Side[]) expect(s.verdicts[side].exception).toMatch(/^ただし、.+の場合を除く。$/);
    }
  });

  it('図鑑の結末は 各本2つ＋交差事件2つずつ＋ツギハギ法の国 で重複なし', () => {
    const e = allEndings();
    expect(e).toHaveLength(3 * 2 + 3 * 2 + 1);
    expect(new Set(e.map((x) => x.id)).size).toBe(e.length);
  });

  it('「実際の裁判では」は看板とAIだけ（手羽先は無し）', () => {
    expect(Object.keys(NOTES).sort()).toEqual(['chatbot', 'sign']);
  });

  it('投稿文は「私の国では、{主見出し}。#前例製造機」', () => {
    const r = play(['red', 'red', 'blue'], ['follow', 'follow', 'follow']);
    expect(shareText(newspaper(r))).toBe('私の国では、「無料」の看板で入場料3千円、全て合法に。#前例製造機');
  });
});
