import { subjectCategory } from '../data/ontology';
import { isDescendant, levelOf, nodeAtLevel } from './ontology';
import { distinguishNews, extendNews, followNews, newPrecedentNews, overruleNews } from './newsText';
import { findGoverning } from './precedent';
import { SCOPE_BONUS, SCOPE_MULT, STRAIN_AT, UPKEEP_EVERY, addMeters, meterVector } from './meters';
import { MAX_AUTHORITY } from './state';
import { METER_IDS, TERM, type CaseDef, type Choice, type GameEvent, type GameState, type Level, type Precedent, type RulingLog, type Verdict } from './types';

export interface RulingResult {
  state: GameState;
  events: GameEvent[];
}

export type ChoiceError = string;

/** 事件に対して、いま選べる選択肢の構造（UIが使う） */
export interface Options {
  governing?: Precedent;
  /** 判例の向きと違う判決を選ぶと区別/判例変更になる */
  verdictKind: Record<Verdict, 'new' | 'follow' | 'against'>;
  /** 判例どおり判決した場合に「拡張」できる射程 */
  extendLevels: Level[];
  /** 区別できる理由（主体の葉 / 客体の葉） */
  distinguishNodes: string[];
}

export function optionsFor(s: GameState): Options {
  const c = s.currentCase as CaseDef;
  const governing = findGoverning(c, s.precedents);
  const kind = (v: Verdict): 'new' | 'follow' | 'against' => (!governing ? 'new' : governing.verdict === v ? 'follow' : 'against');
  const cur = governing ? levelOf(governing.subject) : 0;
  return {
    governing,
    verdictKind: { grant: kind('grant'), deny: kind('deny') },
    extendLevels: ([0, 1, 2] as Level[]).filter((l) => l > cur),
    distinguishNodes: [c.subject, c.object],
  };
}

/** 新しい判例を作る */
function mkPrecedent(s: GameState, c: CaseDef, verdict: Verdict, level: Level): Precedent {
  return {
    no: s.precedents.length + 1,
    issue: c.issue,
    verdict,
    subject: nodeAtLevel(c.subject, level),
    object: nodeAtLevel(c.object, level),
    exceptions: [],
    citations: 0,
    originCaseId: c.id,
    day: s.day,
    heroLeaf: c.subject,
    objectLeaf: c.object,
  };
}

export function applyRuling(prev: GameState, choice: Choice): RulingResult {
  const s: GameState = structuredClone(prev);
  const c = s.currentCase;
  if (!c) throw new Error('no current case');
  const events: GameEvent[] = [];
  const governing = findGoverning(c, s.precedents);
  const gov = governing ? s.precedents.find((p) => p.no === governing.no) : undefined;
  const v = choice.verdict;

  let authority = 0;
  const parts: { label: string; value: number }[] = [];
  let deltas: Partial<Record<string, number>> = {};
  let news: { hl: string; sub: string };
  let touched: Precedent;
  let usedLevel: Level | undefined;

  switch (choice.kind) {
    case 'new': {
      if (gov) throw new Error('new: governing precedent exists');
      const lv = (choice.level ?? 1) as Level;
      const p = mkPrecedent(s, c, v, lv);
      s.precedents.push(p);
      events.push({ type: 'precedentCreated', precedent: p });
      authority += SCOPE_BONUS[lv];
      parts.push({ label: `第${p.no}号判例 成立`, value: SCOPE_BONUS[lv] });
      deltas = meterVector(c.issue, v, SCOPE_MULT[lv]);
      news = newPrecedentNews(c, v, lv);
      touched = p;
      usedLevel = lv;
      break;
    }
    case 'follow': {
      if (!gov || gov.verdict !== v) throw new Error('follow: invalid');
      gov.citations += 1;
      s.stats.follows += 1;
      events.push({ type: 'cited', no: gov.no, citations: gov.citations });
      authority += 1;
      parts.push({ label: `第${gov.no}号判例を引用`, value: 1 });
      deltas = meterVector(c.issue, v, 1);
      news = followNews(gov, c, v);
      touched = gov;
      break;
    }
    case 'extend': {
      if (!gov || gov.verdict !== v) throw new Error('extend: invalid');
      const from = levelOf(gov.subject);
      const to = (choice.level ?? 2) as Level;
      if (to <= from) throw new Error('extend: must widen');
      gov.subject = nodeAtLevel(c.subject, to);
      gov.object = nodeAtLevel(c.object, to);
      gov.citations += 1;
      s.stats.follows += 1;
      s.stats.extends += 1;
      events.push({ type: 'extended', no: gov.no, from, to });
      events.push({ type: 'cited', no: gov.no, citations: gov.citations });
      authority += 2;
      parts.push({ label: `第${gov.no}号判例を拡張`, value: 2 });
      // 引用ぶん(×1) ＋ 広げたぶんの追加
      deltas = meterVector(c.issue, v, 1 + SCOPE_MULT[to] - SCOPE_MULT[from]);
      news = extendNews(gov, c, to);
      touched = gov;
      usedLevel = to;
      break;
    }
    case 'distinguish': {
      if (!gov || gov.verdict === v) throw new Error('distinguish: invalid');
      const e = choice.exception;
      if (!e || (!isDescendant(c.subject, e) && !isDescendant(c.object, e))) throw new Error('distinguish: bad exception');
      gov.exceptions.push(e);
      s.stats.distinguishes += 1;
      events.push({ type: 'exceptionAdded', no: gov.no, node: e });
      authority -= 2;
      parts.push({ label: `第${gov.no}号判例を区別`, value: -2 });
      deltas = meterVector(c.issue, v, 1);
      news = distinguishNews(gov, e);
      touched = gov;
      break;
    }
    case 'overrule': {
      if (!gov || gov.verdict === v) throw new Error('overrule: invalid');
      const lv = (choice.level ?? 1) as Level;
      const p = mkPrecedent(s, c, v, lv);
      gov.overruledBy = p.no;
      s.stats.overrules += 1;
      s.precedents.push(p);
      events.push({ type: 'overruled', no: gov.no, by: p.no });
      events.push({ type: 'precedentCreated', precedent: p });
      authority -= 4;
      parts.push({ label: `第${gov.no}号判例を変更`, value: -4 });
      authority += SCOPE_BONUS[lv];
      if (SCOPE_BONUS[lv]) parts.push({ label: `第${p.no}号判例 成立`, value: SCOPE_BONUS[lv] });
      deltas = meterVector(c.issue, v, SCOPE_MULT[lv]);
      news = overruleNews(gov, c, s.day);
      touched = p;
      usedLevel = lv;
      break;
    }
  }

  // メーター
  s.meters = addMeters(s.meters, deltas);
  events.push({ type: 'meterChanged', deltas });

  // 受益者・勝ち星
  if (v === 'grant') {
    s.leafWins[c.subject] = (s.leafWins[c.subject] ?? 0) + 1;
    const cat = subjectCategory(c.subject);
    s.beneficiaries[cat] += 1;
  }

  // 傍聴席
  const lean = c.crowdLean === 'plaintiff' ? 'grant' : c.crowdLean === 'defendant' ? 'deny' : null;
  let crowd: RulingLog['crowd'] = 'split';
  if (lean) {
    crowd = lean === v ? 'agree' : 'against';
    const d = crowd === 'agree' ? 1 : -1;
    authority += d;
    parts.push({ label: crowd === 'agree' ? '傍聴席が味方' : '傍聴席が敵', value: d });
    if (crowd === 'agree') s.stats.crowdAgree += 1;
    else s.stats.crowdAgainst += 1;
  }
  events.push({ type: 'crowd', result: crowd });

  // 世間の目: 毎日すり減る威信
  if (s.day % UPKEEP_EVERY === 0) {
    authority -= 1;
    parts.push({ label: '日々の重圧', value: -1 });
  }

  // 国が荒れている: メーターが限界(±8)にあると、判事への風当たりが強くなる
  const strained = METER_IDS.filter((m) => Math.abs(s.meters[m]) >= STRAIN_AT).length;
  if (strained) {
    const d = -Math.min(strained, 2);
    authority += d;
    parts.push({ label: '国が荒れている', value: d });
  }

  const before = s.authority;
  s.authority = Math.max(0, Math.min(MAX_AUTHORITY, s.authority + authority));
  events.push({ type: 'authority', delta: s.authority - before, parts });
  events.push({ type: 'news', headline: news.hl, sub: news.sub });

  s.log.push({
    day: s.day,
    caseId: c.id,
    issue: c.issue,
    subject: c.subject,
    object: c.object,
    verdict: v,
    kind: choice.kind,
    level: usedLevel,
    precedentNo: touched.no,
    governedBy: gov?.no,
    crowd,
    star: c.star,
    chain: !!c.requires?.length,
    authorityDelta: s.authority - before,
  });

  if (s.authority <= 0) events.push({ type: 'ended', reason: 'dismissed' });
  else if (s.day >= TERM) events.push({ type: 'ended', reason: 'term' });

  return { state: s, events };
}

