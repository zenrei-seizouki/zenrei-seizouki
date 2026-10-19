// 前例製造機 v3 のデータ。本と交差事件は台本（docs/*.md）をビルド時に取り込んで組み立てる（セリフは一字も変えない）。
// 台本に無い物（id・ただし書き・取り消しの一言・実際の裁判では・立ち絵）は extras.ts。
import casesMd from '../../docs/fable_cases.md?raw';
import crossMd from '../../docs/fable_crossovers.md?raw';
import { EXTRAS, NOTES as NOTE_TABLE, PAIRS, artFor } from './extras';
import { parseCrossovers, parseStories, type RawScene } from './parse';

export type Side = 'blue' | 'red';

export interface Party {
  name: string;
  sub?: string;
  /** 立ち絵のキー（public/art/chara/<art>.webp）。無ければシルエット */
  art: string;
  lines: string[];
}

export interface Scene {
  title: string;
  plaintiff: Party;
  defendant: Party;
}

export interface Future {
  hl: string;
  ending: string;
}

export interface Verdict {
  /** 判決文（句点なし） */
  law: string;
  /** 予告（「→」は表示側で付ける） */
  teaser: string;
  /** 続きの事件 */
  next: Scene;
  /** ただし書き（「ただし、〜の場合を除く。」） */
  exception: string;
  /** 取り消したとき、新聞で最初の事件の関係者が言う一言 */
  regret: { by: string; text: string };
  /** 最初の事件の号外 */
  newsFirst: { hl: string; sub?: string };
  /** 100年後 */
  future: Future;
}

export interface Story {
  id: string;
  /** 台本の番号 */
  no: number;
  title: string;
  first: Scene;
  verdicts: Record<Side, Verdict>;
}

export interface Crossover {
  id: string;
  /** 全て満たすときに出る（その任期で選んだ判決文の組み合わせ） */
  requires: { story: string; side: Side }[];
  scene: Scene;
  verdicts: Record<Side, { law: string; future: Future }>;
}

/** ただし書きを付けた本の100年後 */
export const PATCHWORK: Future & { id: string } = {
  id: 'patchwork',
  hl: 'ただし書きだらけの法律、国民は条文を読むのに3日',
  ending: 'ツギハギ法の国',
};

/** 判例を取り消した本の100年後 */
export const OVERRULED: Future & { id: string } = {
  id: 'overruled',
  hl: '法律が平均3日で変わる国、国民は条文を覚えない',
  ending: '朝令暮改の国',
};

const scene = (s: RawScene): Scene => ({
  title: s.title,
  plaintiff: { name: s.plaintiff.name, art: artFor(s.plaintiff.name), lines: s.plaintiff.lines },
  defendant: { name: s.defendant.name, art: artFor(s.defendant.name), lines: s.defendant.lines },
});

export const STORIES: Story[] = parseStories(casesMd)
  .filter((r) => EXTRAS[r.no])
  .map((r) => {
    const ex = EXTRAS[r.no];
    const verdict = (side: Side): Verdict => {
      const v = r.verdicts[side];
      return {
        law: v.law,
        teaser: v.teaser,
        next: scene(v.next),
        exception: ex.exception[side],
        regret: ex.regret[side],
        newsFirst: { hl: v.law, sub: v.teaser },
        future: v.future,
      };
    };
    return { id: ex.id, no: r.no, title: r.title, first: scene(r.first), verdicts: { blue: verdict('blue'), red: verdict('red') } };
  });

export const STORY_BY_ID: Record<string, Story> = Object.fromEntries(STORIES.map((s) => [s.id, s]));
const ID_BY_NO: Record<number, string> = Object.fromEntries(STORIES.map((s) => [s.no, s.id]));

export const CROSSOVERS: Crossover[] = parseCrossovers(crossMd)
  .filter((x) => x.requires.length >= 2 && x.requires.every((r) => ID_BY_NO[r.no]) && x.verdicts.blue.future && x.verdicts.red.future)
  .map((x) => ({
    id: x.id,
    requires: x.requires.map((r) => ({ story: ID_BY_NO[r.no], side: r.side })),
    scene: scene(x.scene),
    verdicts: x.verdicts,
  }));

/** 交差事件のある組（本のid）。交差事件がまだ1本も書かれていない組は除く */
export const STORY_PAIRS: [string, string][] = PAIRS.map(([a, b]) => [ID_BY_NO[a], ID_BY_NO[b]] as [string, string]).filter(
  ([a, b]) => a && b && CROSSOVERS.some((x) => x.requires.every((r) => r.story === a || r.story === b)),
);

export const NOTES = NOTE_TABLE;

/** 交差事件の結末が1つも無いときなどの既定の3本（テスト・最初の版との互換用） */
export const DEFAULT_STORIES = ['wing', 'sign', 'chatbot'];
