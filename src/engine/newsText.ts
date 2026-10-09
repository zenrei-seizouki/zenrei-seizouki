import { FUTURE, NEWS, type NewsTpl } from '../data/news';
import { NODES } from '../data/ontology';
import { label } from './ontology';
import type { CaseDef, IssueId, Level, NodeId, Precedent, Verdict } from './types';

export function fillTpl(tpl: string, subject: NodeId, object: NodeId): string {
  const sc = NODES[subject].parent ? label(NODES[subject].parent as string) : label(subject);
  const oc = NODES[object].parent ? label(NODES[object].parent as string) : label(object);
  return tpl
    .replaceAll('{SC}', sc)
    .replaceAll('{OC}', oc)
    .replaceAll('{S}', label(subject))
    .replaceAll('{O}', label(object));
}

const fill = (t: NewsTpl, subject: NodeId, object: NodeId) => ({
  hl: fillTpl(t.hl, subject, object),
  sub: fillTpl(t.sub, subject, object),
});

/** 新判例成立時の号外（事件個別の newsOverride があれば優先） */
export function newPrecedentNews(c: CaseDef, verdict: Verdict, level: Level): { hl: string; sub: string } {
  const o = c.newsOverride?.[verdict];
  if (o) return o;
  return fill(NEWS[c.issue][verdict][level], c.subject, c.object);
}

const FOLLOW_RESULT: Record<IssueId, Record<Verdict, string>> = {
  occupy: { grant: '{S}、{O}の所有者に。隣の{O}にも座り始める', deny: '{S}、{O}をあきらめる。座るのは自由、持つのは不自由' },
  labor: { grant: '{S}、有給を取得。{O}は今日、無人', deny: '{S}の働きは今日も労働と認められず' },
  eat: { grant: '{S}、{O}を食べる。「名前がなかったので」', deny: '{S}、{O}を前に踏みとどまる' },
  name: { grant: '{S}、{O}を支配。さっそく別の名前をつけ直す', deny: '{S}の命名、また無効に' },
  sleep: { grant: '{S}、寝ていたので責任なし。起きたら全部終わっていた', deny: '{S}、寝ていても責任。起きたら全部背負っていた' },
  vote: { grant: '{S}、一票を投じる。開票係はまだ数えている', deny: '{S}の一票、今日も認められず' },
};

export function followNews(p: Precedent, c: CaseDef, verdict: Verdict) {
  return {
    hl: `【第${p.no}号判例、また適用】${fillTpl(FOLLOW_RESULT[c.issue][verdict], c.subject, c.object)}`,
    sub: `この判例の引用は、これで${p.citations}回目`,
  };
}

export function extendNews(p: Precedent, c: CaseDef, to: Level) {
  const scope = ['狭く', 'ふつうに', '広く'][to];
  return {
    hl: `第${p.no}号判例、射程を拡大　${label(p.subject)}×${label(p.object)}に`,
    sub: `判例は${scope}書き換えられた。どこまで届くのか、誰も知らない`,
  };
}

export function distinguishNews(p: Precedent, node: NodeId) {
  return {
    hl: `第${p.no}号判例に例外「ただし${label(node)}を除く」`,
    sub: `全国の${label(node)}、静かに立ち上がる`,
  };
}

export function overruleNews(old: Precedent, c: CaseDef, today: number) {
  const days = Math.max(0, today - old.day);
  return {
    hl: days === 0 ? `第${old.no}号判例、成立当日に変更` : `第${old.no}号判例、わずか${days}日で変更`,
    sub: `「${label(old.subject)}×${label(old.object)}」の先例、取り消し線とともに歴史へ`,
  };
}

/** 百年後新聞の見出し。主役の判例から */
export function futureHeadline(p: Precedent): { hl: string; sub: string } {
  const level = (NODES[p.subject].level) as Level;
  return fill(FUTURE[p.issue][p.verdict][level], p.heroLeaf, p.objectLeaf);
}
