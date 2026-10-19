import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { CROSSOVERS, NOTES, STORIES, STORY_BY_ID, STORY_PAIRS, type Scene, type Side } from './data';
import { achievement, allEndings, choose, lawOf, matchCrossover, newRun, newspaper, pickStories, seededRng, shareText, stepOf, totalSteps, type Follow, type RunState } from './engine';
import { PAIRS } from './extras';
import { parseCrossovers, parseStories } from './parse';

// 交差事件の組にならない3本（交差事件が出ない場合を確かめる用）
const NO_PAIR = ['wing', 'ice', 'fighter'];
const play = (picks: Side[], follows: Follow[], cross: Side = 'blue', stories?: string[]): RunState => {
  let r = newRun(stories);
  for (const p of picks) r = choose(r, p);
  for (const f of follows) r = choose(r, f);
  if (stepOf(r).kind === 'cross') r = choose(r, cross);
  return r;
};

describe('1プレイの流れ', () => {
  it('最初の事件3件 → 続き3件 → （交差事件）→ 百年後新聞に到達する（全216通り）', () => {
    const sides: Side[] = ['blue', 'red'];
    const fs: Follow[] = ['follow', 'except', 'overrule'];
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
    expect(reached).toBe(216);
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
    const r = play(['red', 'red', 'blue'], ['follow', 'follow', 'follow'], 'blue', NO_PAIR);
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
    const r = play(['red', 'red', 'blue'], ['except', 'follow', 'except'], 'blue', ['ice', 'sign', 'fighter']);
    const p = newspaper(r);
    expect(p.main).toMatchObject({ story: 'sign', hl: '「立入禁止」が全て「入らないでほしいな」に', ending: 'お願いしかない国' });
    expect(p.side.map((s) => s.ending)).toEqual(['ツギハギ法の国', 'ツギハギ法の国']);
  });
  it('全部ただし書きなら、最初の本のツギハギ版が主見出し', () => {
    const r = play(['red', 'red', 'blue'], ['except', 'except', 'except'], 'blue', NO_PAIR);
    expect(newspaper(r).main).toMatchObject({ ending: 'ツギハギ法の国', endingId: 'patchwork' });
  });
});

describe('判例を取り消す', () => {
  it('取り消した本は条文に取り消し線と関係者の一言、100年後は朝令暮改の国', () => {
    // 手羽先🟥＋看板🟦（X5）は看板を取り消したので出ない
    const r = play(['red', 'blue', 'red'], ['follow', 'overrule', 'follow'], 'blue', ['wing', 'sign', 'ice']);
    expect(r.crossover).toBeUndefined();
    expect(lawOf(r, 'sign')).toEqual({ base: '看板に書いた罰金は、見た者が払わねばならない。', struck: true, regret: { by: '第3町内会', text: '3万円は、どうなるんですか' } });
    const p = newspaper(r);
    expect(p.side.map((s) => s.ending)).toContain('朝令暮改の国');
    expect(p.main.ending).not.toBe('朝令暮改の国'); // 従った本が主見出し
  });
  it('全部取り消したら、主見出しは朝令暮改の国', () => {
    const r = play(['red', 'red', 'blue'], ['overrule', 'overrule', 'overrule'], 'blue', NO_PAIR);
    expect(newspaper(r).main).toMatchObject({ ending: '朝令暮改の国', endingId: 'overruled' });
  });
  it('交差事件は、条件の2本が両方生きているときだけ（取り消すと出ない）', () => {
    // 手羽先🟦＋看板🟦 → X1。看板を取り消すと出ない
    const alive = play(['blue', 'blue', 'red'], ['follow', 'except', 'follow'], 'blue', ['wing', 'sign', 'ice']);
    expect(alive.crossover?.id).toBe('x1');
    let r = newRun(['wing', 'sign', 'ice']);
    for (const p of ['blue', 'blue', 'red'] as Side[]) r = choose(r, p);
    expect(totalSteps(r)).toBe(7); // まだ交差事件の可能性がある
    for (const f of ['follow', 'overrule', 'follow'] as Follow[]) r = choose(r, f);
    // 看板🟦を取り消したので X1 は出ない（氷とは組にならない）
    expect(matchCrossover(r)).toBeUndefined();
    expect(stepOf(r).kind).toBe('paper');
    expect(totalSteps(r)).toBe(6);
  });
  it('取り消しの一言: #1・#3・#12 は DESIGN_V3.md の文、ほかは短い一言', () => {
    const design = readFileSync('DESIGN_V3.md', 'utf-8');
    for (const s of STORIES)
      for (const side of ['blue', 'red'] as Side[]) {
        const r = s.verdicts[side].regret;
        expect(r.by, s.id).toBeTruthy();
        if ([1, 3, 12].includes(s.no)) expect(design, r.text).toContain(r.text);
        else expect(r.text.length, r.text).toBeLessThanOrEqual(30);
      }
  });
});

describe('データ', () => {
  const cases = readFileSync('docs/fable_cases.md', 'utf-8');
  const crosses = readFileSync('docs/fable_crossovers.md', 'utf-8');
  const linesOf = (s: Scene) => [...s.plaintiff.lines, ...s.defendant.lines];

  it('台本の本15本・交差事件を全部取り込めている（見出しの数と一致、空の欄なし）', () => {
    expect(STORIES).toHaveLength(15);
    expect(STORIES.map((s) => s.no)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(STORIES).toHaveLength((cases.match(/^## \d+\. /gm) ?? []).length);
    expect(parseStories(cases)).toHaveLength(15);
    expect(new Set(STORIES.map((s) => s.id)).size).toBe(15);
    for (const s of STORIES) {
      for (const sc of [s.first, s.verdicts.blue.next, s.verdicts.red.next]) {
        expect(sc.title, s.id).toBeTruthy();
        expect(sc.plaintiff.name, `${s.id} ${sc.title}`).toBeTruthy();
        expect(sc.defendant.name, `${s.id} ${sc.title}`).toBeTruthy();
      }
      for (const side of ['blue', 'red'] as Side[]) {
        const v = s.verdicts[side];
        expect(v.law && v.teaser && v.future?.hl && v.future?.ending, `${s.id} ${side}`).toBeTruthy();
      }
    }
    // 交差事件: 台本の見出しの数だけ、条件2つ・判決文2つ・100年後2つ付きで取り込む
    const xs = parseCrossovers(crosses);
    expect(CROSSOVERS).toHaveLength((crosses.match(/^## X\d+\. /gm) ?? []).length);
    expect(xs).toHaveLength(CROSSOVERS.length);
    for (const x of CROSSOVERS) {
      expect(x.requires, x.id).toHaveLength(2);
      expect(x.scene.plaintiff.lines.length && x.scene.defendant.lines.length, x.id).toBeTruthy();
      expect(x.verdicts.blue.law && x.verdicts.red.law, x.id).toBeTruthy();
    }
  });

  it('交差事件は組×4通り（🟦🟦・🟦🟥・🟥🟦・🟥🟥）が重複なく揃っている', () => {
    for (const [a, b] of STORY_PAIRS) {
      const xs = CROSSOVERS.filter((x) => x.requires.every((r) => r.story === a || r.story === b));
      const combos = xs.map((x) => `${x.requires.find((r) => r.story === a)!.side}-${x.requires.find((r) => r.story === b)!.side}`);
      expect(new Set(combos).size, `${a}×${b}`).toBe(combos.length);
      expect(combos.length, `${a}×${b}`).toBeLessThanOrEqual(4);
    }
  });

  it('交差事件は、決めた組（DESIGN_V3 §5-3）のどれかにだけある', () => {
    const pairIds = PAIRS.map(([a, b]) => [STORIES.find((s) => s.no === a)!.id, STORIES.find((s) => s.no === b)!.id]);
    for (const x of CROSSOVERS) expect(pairIds.some((p) => x.requires.every((r) => p.includes(r.story))), x.id).toBe(true);
    expect(STORY_PAIRS.length).toBeGreaterThan(0);
  });

  it('立ち絵は public/art/chara にある物（無ければ一般市民の絵）', () => {
    for (const s of [...STORIES.flatMap((s) => [s.first, s.verdicts.blue.next, s.verdicts.red.next]), ...CROSSOVERS.map((x) => x.scene)])
      for (const p of [s.plaintiff, s.defendant]) expect(existsSync(`public/art/chara/${p.art}.webp`), `${p.name} → ${p.art}`).toBe(true);
    expect(STORY_BY_ID.wing.verdicts.blue.next.defendant.art).toBe('taiyaki');
    expect(STORY_BY_ID.train.first.defendant.art).toBe('stationmaster');
  });

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
        // 動物の原告は1行のこともある（#13 金魚）
        expect(sc.plaintiff.lines.length, sc.title).toBeGreaterThanOrEqual(1);
        expect(sc.plaintiff.lines.length, sc.title).toBeLessThanOrEqual(3);
        expect(sc.defendant.lines.length, sc.title).toBeGreaterThanOrEqual(2);
      }
      for (const side of ['blue', 'red'] as Side[]) expect(s.verdicts[side].exception).toMatch(/^ただし、.+の場合を除く。$/);
    }
  });

  it('図鑑の結末は 各本2つ＋交差事件2つずつ＋ツギハギ法の国＋朝令暮改の国 で重複なし。達成率', () => {
    const e = allEndings();
    expect(e).toHaveLength(15 * 2 + CROSSOVERS.length * 2 + 2);
    expect(new Set(e.map((x) => x.id)).size).toBe(e.length);
    expect(achievement({})).toEqual({ got: 0, total: e.length, pct: 0 });
    expect(achievement({ 'wing-blue': 1, patchwork: 1, nope: 1 })).toMatchObject({ got: 2, pct: Math.floor((2 / e.length) * 100) });
    expect(achievement(Object.fromEntries(e.map((x) => [x.id, 1]))).pct).toBe(100);
  });

  it('「実際の裁判では」は CASES_V2_PLAN.md §2 で「出す」の本（と既存の柿）だけ', () => {
    expect(Object.keys(NOTES).sort()).toEqual(['animal', 'branch', 'chatbot', 'fighter', 'moon', 'satisfy', 'sign', 'trademark', 'train', 'uniform']);
    for (const k of Object.keys(NOTES)) expect(STORY_BY_ID[k], k).toBeTruthy();
  });

  it('投稿文は診断の結果の形（【結末名】・主見出し・問いかけ・タグ）', () => {
    const r = play(['red', 'red', 'blue'], ['follow', 'follow', 'follow'], 'blue', NO_PAIR);
    const p = newspaper(r);
    expect(shareText(p)).toBe(`私の判決で生まれた国は【${p.main.ending}】でした

「無料」の看板で入場料3千円、全て合法に

あなたの判決で、この国はどうなる？
#前例製造機`);
  });
});

describe('任期の3本の選び方', () => {
  it('交差事件のある組の2本＋別の1本（3本とも違う本）', () => {
    const rng = seededRng('test');
    for (let i = 0; i < 300; i++) {
      const r = pickStories({ rng });
      expect(new Set(r.stories).size).toBe(3);
      expect(r.pair).toBeTruthy();
      expect(STORY_PAIRS).toContainEqual(r.pair);
      for (const id of r.pair!) expect(r.stories).toContain(id);
      for (const id of r.stories) expect(STORY_BY_ID[id]).toBeTruthy();
    }
  });

  it('組の交差事件が先に出る', () => {
    const [a, b] = STORY_PAIRS[0];
    const x = CROSSOVERS.find((c) => c.requires.every((q) => q.story === a || q.story === b))!;
    const picks = Object.fromEntries(x.requires.map((q) => [q.story, q.side]));
    expect(matchCrossover({ stories: [a, b, 'buffet'], picks, pair: [a, b] })?.id).toBe(x.id);
  });

  it('本日の3本は日付だけで決まる（図鑑に関係なく全員同じ）', () => {
    const a = pickStories({ daily: '2026-10-19', album: {} });
    const b = pickStories({ daily: '2026-10-19', album: { 'wing-blue': { count: 1 } } });
    expect(b.stories).toEqual(a.stories);
    expect(a.daily).toBe('2026-10-19');
    const days = new Set(Array.from({ length: 30 }, (_, i) => pickStories({ daily: `2026-11-${String(i + 1).padStart(2, '0')}` }).stories.join()));
    expect(days.size).toBeGreaterThan(5);
  });

  it('ふだんは、まだ結末を見ていない本が出やすい', () => {
    // 1本以外は全部見た図鑑
    const target = STORIES.find((s) => !STORY_PAIRS.flat().includes(s.id)) ?? STORIES[STORIES.length - 1];
    const album = Object.fromEntries(STORIES.filter((s) => s.id !== target.id).flatMap((s) => [[`${s.id}-blue`, 1], [`${s.id}-red`, 1]]));
    const rng = seededRng('prefer');
    let hit = 0;
    for (let i = 0; i < 400; i++) if (pickStories({ album, rng }).stories.includes(target.id)) hit++;
    let base = 0;
    for (let i = 0; i < 400; i++) if (pickStories({ album: {}, rng }).stories.includes(target.id)) base++;
    expect(hit).toBeGreaterThan(base * 1.5);
  });

  it('選んだ3本でも最後まで遊べる', () => {
    const rng = seededRng('play');
    for (let i = 0; i < 50; i++) {
      let r = pickStories({ rng });
      while (stepOf(r).kind !== 'paper') {
        const k = stepOf(r).kind;
        r = choose(r, k === 'next' ? (['follow', 'except', 'overrule'] as Follow[])[Math.floor(rng() * 3)] : rng() < 0.5 ? 'blue' : 'red');
      }
      expect(newspaper(r).laws).toHaveLength(3);
    }
  });
});
