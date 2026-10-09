import { CASE_BY_ID, CRISIS_CASES, HAND_CASES } from '../data/cases';
import { ISSUE_IDS } from '../data/issues';
import { OBJECT_LEAVES, SUBJECT_LEAVES } from '../data/ontology';
import { generateCase } from './generate';
import { leavesUnder } from './ontology';
import { activePrecedents, findGoverning, requirementsMet } from './precedent';
import { pick, weightedPick, type Rng } from './rng';
import type { CaseDef, GameState, IssueId } from './types';

/** 自動生成事件を選ぶ確率（手書き優先: 目安 手書き7〜8件 / 自動2〜3件） */
export const GEN_PROBABILITY = 0.28;
/** 自動生成のうち「既存判例が当てはまる事件」にする割合 */
export const GEN_GOVERNED_BIAS = 0.85;
/** 既存判例が当てはまる手書き事件の重み（DESIGN §4.1 は×2。手触りを強くするため上げた） */
export const GOVERNED_WEIGHT = 3;

const stageTier = (day: number): 1 | 2 | 3 => (day <= 3 ? 1 : day <= 7 ? 2 : 3);

export function drawNextCase(s: GameState, rng: Rng): CaseDef {
  const day = s.day;

  // 固定の序盤（チュートリアル/デイリー）
  const fixed = s.opening[day - 1];
  if (fixed && CASE_BY_ID[fixed] && !s.usedCaseIds.includes(fixed)) return CASE_BY_ID[fixed];

  // 危機事件: メーターが限界に達した翌日に強制出現
  if (day >= 2) {
    const crisis = CRISIS_CASES.filter((c) => !s.usedCaseIds.includes(c.id) && requirementsMet(c, s));
    if (crisis.length) return crisis[0];
  }

  const active = activePrecedents(s);
  const tier = stageTier(day);
  const usedIssues = new Set(s.log.map((l) => l.issue));
  const early = day <= 3;

  let hand = HAND_CASES.filter((c) => !s.usedCaseIds.includes(c.id) && c.tier <= tier && requirementsMet(c, s));
  if (early) {
    const fresh = hand.filter((c) => !usedIssues.has(c.issue));
    hand = fresh; // 序盤は新しい争点だけ（足りなければ自動生成で埋める）
  }

  const useGen = hand.length === 0 || rng.next() < GEN_PROBABILITY;
  if (!useGen) {
    return weightedPick(rng, hand, (c) => {
      let w = c.weight ?? 1;
      if (c.requires?.length) w *= 3; // 連鎖事件
      if (findGoverning(c, active)) w *= GOVERNED_WEIGHT; // 既存判例が適用される
      return w;
    });
  }
  return drawGenerated(s, rng, early ? usedIssues : new Set());
}

function drawGenerated(s: GameState, rng: Rng, avoidIssues: Set<IssueId>): CaseDef {
  const active = activePrecedents(s);
  const usedGen = new Set(s.usedCaseIds);
  for (let tries = 0; tries < 30; tries++) {
    let issue: IssueId;
    let subject: string;
    let object: string;
    let allowCite = false;
    const seeds = active.filter((p) => !avoidIssues.has(p.issue));
    if (seeds.length && rng.next() < GEN_GOVERNED_BIAS) {
      // 既存判例の射程内に事件を作る → 「前例に縛られる」手触りを増やす
      const p = pick(rng, seeds);
      issue = p.issue;
      subject = pick(rng, leavesUnder(p.subject));
      object = pick(rng, leavesUnder(p.object));
      allowCite = true;
    } else {
      const issues = ISSUE_IDS.filter((i) => !avoidIssues.has(i));
      issue = pick(rng, issues.length ? issues : ISSUE_IDS);
      subject = pick(rng, SUBJECT_LEAVES);
      object = pick(rng, OBJECT_LEAVES);
      allowCite = active.some((p) => p.issue === issue);
    }
    const id = `gen:${issue}:${subject}:${object}`;
    if (usedGen.has(id)) continue;
    return generateCase(issue, subject, object, rng, allowCite);
  }
  // 万一の保険
  return generateCase('occupy', 'cat', 'bench', rng, false);
}
