// 前例製造機 v3 の進行（純粋関数）。1プレイ = 最初の事件3件 → 続き3件 → 交差事件（条件が合えば）→ 百年後新聞
import { CROSSOVERS, DEFAULT_STORIES, OVERRULED, PATCHWORK, STORY_BY_ID, type Crossover, type Future, type Scene, type Side, type Story } from './data';

export type Follow = 'follow' | 'except' | 'overrule';

export interface RunState {
  /** 今期の3本 */
  stories: string[];
  /** 1〜3件目で選んだ判決文 */
  picks: Record<string, Side>;
  /** 4〜6件目: 判例に従ったか、ただし書きを付けたか、取り消したか */
  follow: Record<string, Follow>;
  /** 7件目 */
  crossover?: { id: string; pick: Side };
  /** 0〜: 次に裁く事件の番号（7 か、交差事件が無ければ 6 で新聞） */
  step: number;
}

export type Step =
  | { kind: 'first'; story: Story; scene: Scene }
  | { kind: 'next'; story: Story; side: Side; scene: Scene }
  | { kind: 'cross'; cross: Crossover; scene: Scene }
  | { kind: 'paper' };

export function newRun(stories: string[] = DEFAULT_STORIES): RunState {
  return { stories: [...stories], picks: {}, follow: {}, step: 0 };
}

/**
 * その任期の判決文の組み合わせに合う交差事件（最初に合った1件）。
 * 条件の本が両方「生きている」（従う／ただし書き。まだ続きを裁いていないものも含む）ときだけ。取り消した法律は条件を満たさない
 */
export function matchCrossover(run: Pick<RunState, 'stories' | 'picks'> & { follow?: RunState['follow'] }): Crossover | undefined {
  return CROSSOVERS.find((x) => x.requires.every((r) => run.stories.includes(r.story) && run.picks[r.story] === r.side && run.follow?.[r.story] !== 'overrule'));
}

export function stepOf(run: RunState): Step {
  const n = run.stories.length;
  if (run.step < n) {
    const story = STORY_BY_ID[run.stories[run.step]];
    return { kind: 'first', story, scene: story.first };
  }
  if (run.step < 2 * n) {
    const story = STORY_BY_ID[run.stories[run.step - n]];
    const side = run.picks[story.id];
    return { kind: 'next', story, side, scene: story.verdicts[side].next };
  }
  if (run.step === 2 * n) {
    const cross = matchCrossover(run);
    if (cross) return { kind: 'cross', cross, scene: cross.scene };
  }
  return { kind: 'paper' };
}

/** 画面の「3/7」の分母。交差事件が無いと決まったら6 */
export function totalSteps(run: RunState): number {
  const n = run.stories.length;
  const decided = run.stories.every((id) => run.picks[id]);
  return decided && !matchCrossover(run) ? 2 * n : 2 * n + 1;
}

/** 今の事件に答えて、次へ進めた RunState を返す（元の state は書き換えない） */
export function choose(run: RunState, answer: Side | Follow): RunState {
  const st = stepOf(run);
  const next: RunState = { ...run, picks: { ...run.picks }, follow: { ...run.follow }, step: run.step + 1 };
  if (st.kind === 'first') {
    if (answer !== 'blue' && answer !== 'red') throw new Error('first: blue/red で答える');
    next.picks[st.story.id] = answer;
  } else if (st.kind === 'next') {
    if (answer !== 'follow' && answer !== 'except' && answer !== 'overrule') throw new Error('next: follow/except/overrule で答える');
    next.follow[st.story.id] = answer;
  } else if (st.kind === 'cross') {
    if (answer !== 'blue' && answer !== 'red') throw new Error('cross: blue/red で答える');
    next.crossover = { id: st.cross.id, pick: answer };
  } else {
    throw new Error('もう新聞です');
  }
  return next;
}

export interface Law {
  base: string;
  exception?: string;
  /** 取り消された（取り消し線で載せる） */
  struck?: boolean;
  regret?: { by: string; text: string };
}

/** その本の条文（判決文＋ただし書き。取り消したら取り消し線と、関係者の一言） */
export function lawOf(run: RunState, storyId: string): Law {
  const v = STORY_BY_ID[storyId].verdicts[run.picks[storyId]];
  const f = run.follow[storyId];
  if (f === 'overrule') return { base: `${v.law}。`, struck: true, regret: v.regret };
  return { base: `${v.law}。`, exception: f === 'except' ? v.exception : undefined };
}

export interface Headline extends Future {
  /** 図鑑のid */
  endingId: string;
  /** どの本の見出しか（交差事件なら undefined） */
  story?: string;
}

/** 本の100年後。ただし書きを付けた本は「ツギハギ版」 */
export function storyFuture(run: RunState, storyId: string): Headline {
  if (run.follow[storyId] === 'except') return { hl: PATCHWORK.hl, ending: PATCHWORK.ending, endingId: PATCHWORK.id, story: storyId };
  if (run.follow[storyId] === 'overrule') return { hl: OVERRULED.hl, ending: OVERRULED.ending, endingId: OVERRULED.id, story: storyId };
  const side = run.picks[storyId];
  const f = STORY_BY_ID[storyId].verdicts[side].future;
  return { ...f, endingId: `${storyId}-${side}`, story: storyId };
}

export interface Newspaper {
  main: Headline;
  side: Headline[];
  laws: ({ story: string; title: string } & Law)[];
}

/** 新聞に載せる順: 従った本 → ただし書き → 取り消し */
const rank = (run: RunState, id: string) => ({ follow: 0, except: 1, overrule: 2 })[run.follow[id] ?? 'follow'];

/**
 * 百年後新聞（DESIGN_V3 §2.2）
 * 主見出し: 交差事件の結末 > 判例に従った本の100年後 > ただし書きの本（ツギハギ版）> 取り消した本（朝令暮改）
 * 脇見出し: 残りの本の100年後（2本まで）
 */
export function newspaper(run: RunState): Newspaper {
  let main: Headline;
  let rest = [...run.stories];
  if (run.crossover) {
    const x = CROSSOVERS.find((c) => c.id === run.crossover!.id)!;
    main = { ...x.verdicts[run.crossover.pick].future, endingId: `${x.id}-${run.crossover.pick}` };
  } else {
    const id = [...run.stories].sort((a, b) => rank(run, a) - rank(run, b))[0];
    main = storyFuture(run, id);
    rest = rest.filter((s) => s !== id);
  }
  // 脇見出しは、判例に従った本を先に
  rest.sort((a, b) => rank(run, a) - rank(run, b));
  const side = rest.slice(0, 2).map((id) => storyFuture(run, id));
  const laws = run.stories.map((id) => ({ story: id, title: STORY_BY_ID[id].title, ...lawOf(run, id) }));
  return { main, side, laws };
}

/** 図鑑に載る結末の全て（各本2つ＋交差事件2つずつ＋ツギハギ法の国＋朝令暮改の国） */
export function allEndings(stories: string[] = DEFAULT_STORIES): { id: string; name: string; hl: string }[] {
  const out: { id: string; name: string; hl: string }[] = [];
  for (const id of stories) {
    const s = STORY_BY_ID[id];
    for (const side of ['blue', 'red'] as Side[]) out.push({ id: `${id}-${side}`, name: s.verdicts[side].future.ending, hl: s.verdicts[side].future.hl });
  }
  for (const x of CROSSOVERS.filter((c) => c.requires.every((r) => stories.includes(r.story)))) {
    for (const side of ['blue', 'red'] as Side[]) out.push({ id: `${x.id}-${side}`, name: x.verdicts[side].future.ending, hl: x.verdicts[side].future.hl });
  }
  out.push({ id: PATCHWORK.id, name: PATCHWORK.ending, hl: PATCHWORK.hl });
  out.push({ id: OVERRULED.id, name: OVERRULED.ending, hl: OVERRULED.hl });
  return out;
}

/** X投稿文（DESIGN_V3 §2.2） */
export const shareText = (paper: Newspaper): string => `私の国では、${paper.main.hl}。#前例製造機`;
