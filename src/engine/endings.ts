import { ENDINGS, ORDINARY } from '../data/endings';
import { NODES } from '../data/ontology';
import { futureHeadline } from './newsText';
import { label } from './ontology';
import { hashString } from './rng';
import type { EndingDef, GameState, MeterId, Precedent } from './types';

/** 条件を満たした名前付きエンディングを全て返す（何もなければ「平凡な国」） */
export function unlockedEndings(s: GameState): EndingDef[] {
  const hit = ENDINGS.filter((e) => e.when(s));
  return hit.length ? hit : [ORDINARY];
}

/** 結果画面の大見出し。罷免なら罷免系を最優先、それ以外は最もレアなもの */
export function primaryEnding(s: GameState): EndingDef {
  const hit = unlockedEndings(s);
  if (s.authority <= 0) {
    return hit.find((e) => e.id === 'fastest-dismissal') ?? hit.find((e) => e.id === 'dismissed') ?? hit[0];
  }
  const pool = hit.filter((e) => e.group !== 'dismissal');
  return pool.reduce((a, b) => (b.rarity > a.rarity ? b : a), pool[0] ?? ORDINARY);
}

// ---- 国名 ----
const TEMPER: Record<MeterId, [string, string]> = {
  秩序: ['規律', '無法'],
  経済: ['商業', '貧乏'],
  自由: ['自由', '窮屈'],
  幸福: ['ゆるふわ', 'どんより'],
};
const POLITY = ['連邦', '共和国', '王国', '合衆国', '自治区', '株式会社'];

export function heroLeaf(s: GameState): string | null {
  const e = Object.entries(s.leafWins).sort((a, b) => b[1] - a[1]);
  return e.length ? e[0][0] : null;
}

export function temperament(s: GameState): { meter: MeterId | null; word: string } {
  const e = (Object.entries(s.meters) as [MeterId, number][]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const [m, v] = e[0];
  if (Math.round(v) === 0) return { meter: null, word: '平穏' };
  return { meter: m, word: TEMPER[m][v > 0 ? 0 : 1] };
}

export function countryName(s: GameState): string {
  const hero = heroLeaf(s);
  const t = temperament(s);
  const polity = POLITY[hashString(`${s.seed}:${s.log.length}`) % POLITY.length];
  return `${hero ? label(hero) : '名もなき'}${t.word}${polity}`;
}

// ---- 判事の称号 ----
export function judgeTitle(s: GameState): string {
  const st = s.stats;
  const totalCites = s.precedents.reduce((a, p) => a + p.citations, 0);
  if (st.overrules >= 3) return '手のひら返しの名人';
  if (st.distinguishes >= 3) return '例外の魔術師';
  if (s.log.length >= 5 && st.crowdAgainst === 0 && st.crowdAgree >= 3) return 'ポピュリスト判事';
  if (totalCites >= 4) return '前例製造機';
  return '普通の裁判官';
}

// ---- 国民の一言 ----
export function peopleVoice(s: GameState): { text: string; by: string } {
  const m = s.meters;
  if (s.authority <= 0) return { text: '判事さんがいなくなっても、法律だけが残りました', by: '国民（52）' };
  if (m.秩序 <= -5) return { text: '朝起きたら、家の前の道路が隣の人のものになっていました', by: '国民（34）' };
  if (m.秩序 >= 5) return { text: '昼寝をするには、申請書が3枚いります', by: '国民（41）' };
  if (m.自由 >= 5) return { text: 'なんでも自由。ただし、座ったら負け', by: '国民（27）' };
  if (m.自由 <= -5) return { text: '自由の定義が、毎週更新されます', by: '国民（45）' };
  if (m.経済 >= 5) return { text: '景気はいいです。何が売れてるのかは分かりません', by: '国民（38）' };
  if (m.経済 <= -5) return { text: '有給はあります。給料の支払いだけ、ありません', by: '国民（30）' };
  if (m.幸福 >= 5) return { text: '毎日が日曜日みたいで、月曜日が怖いです', by: '国民（29）' };
  if (m.幸福 <= -5) return { text: '誰も悪くないのに、みんな少しずつ疲れています', by: '国民（47）' };
  return { text: '特に何も変わりませんね。猫以外は', by: '国民（34）' };
}

// ---- 奇妙な法律トップ3 / 百年後新聞の見出し ----
export function topPrecedents(s: GameState, n = 3): Precedent[] {
  const alive = (p: Precedent) => (p.overruledBy === undefined ? 1 : 0);
  return [...s.precedents].sort((a, b) => alive(b) - alive(a) || b.citations - a.citations || levelRank(b) - levelRank(a) || a.no - b.no).slice(0, n);
}
const levelRank = (p: Precedent) => NODES[p.subject].level;

export function futureHeadlines(s: GameState): { hl: string; sub: string; no: number }[] {
  return topPrecedents(s, 3).map((p) =>
    p.overruledBy !== undefined
      ? { hl: `第${p.no}号判例の廃止記念日、今年も祝日に`, sub: `「${label(p.subject)}×${label(p.object)}」の法は、あの日で終わった`, no: p.no }
      : { ...futureHeadline(p), no: p.no },
  );
}
