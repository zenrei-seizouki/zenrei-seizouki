import { CASE_BY_ID, CRISIS_CASES, HAND_CASES } from '../data/cases';
import { OBJECT_LEAVES, SUBJECT_LEAVES } from '../data/ontology';
import { generateCase } from './generate';
import { leavesUnder } from './ontology';
import { activePrecedents, findGoverning, requirementsMet } from './precedent';
import { pick, weightedPick, type Rng } from './rng';
import type { CaseDef, GameState, IssueId } from './types';

/**
 * 自動生成事件を選ぶ確率。0 = 原則オフ（笑いの打率が下がるため、手書きだけで回す）。
 * 手書きの候補が尽きたときの保険としてだけ、drawGenerated が使われる。
 */
export const GEN_PROBABILITY = 0;
/** 保険の自動生成のうち「既存判例が当てはまる事件」にする割合 */
export const GEN_GOVERNED_BIAS = 0.85;
/** 既存判例が当てはまる手書き事件の重み（DESIGN §4.1 は×2。前例に縛られる手触りを強くするため上げた） */
export const GOVERNED_WEIGHT = 3;
/** 連鎖事件（出現条件つき）の重み */
export const CHAIN_WEIGHT = 3;

const stageTier = (day: number): 1 | 2 | 3 => (day <= 3 ? 1 : day <= 7 ? 2 : 3);

export function drawNextCase(s: GameState, rng: Rng): CaseDef {
  const day = s.day;

  // 固定の序盤（チュートリアル/デイリー: 占有-01 → 占有-02）
  const fixed = s.opening[day - 1];
  if (fixed && CASE_BY_ID[fixed] && !s.usedCaseIds.includes(fixed)) return CASE_BY_ID[fixed];

  // 危機事件: メーターが限界に達した翌日に強制出現（争点は問わない）
  if (day >= 2) {
    const crisis = CRISIS_CASES.filter((c) => !s.usedCaseIds.includes(c.id) && requirementsMet(c, s));
    if (crisis.length) return crisis[0];
  }

  const active = activePrecedents(s);
  const tier = stageTier(day);
  const usedIssues = new Set(s.log.map((l) => l.issue));

  // 今期の3争点の手書き事件だけが候補
  let hand = HAND_CASES.filter((c) => s.issues.includes(c.issue) && !s.usedCaseIds.includes(c.id) && c.tier <= tier && requirementsMet(c, s));
  if (day <= 3) {
    // 序盤は、まだ裁いていない争点を優先（判例の種を撒く）
    const fresh = hand.filter((c) => !usedIssues.has(c.issue));
    if (fresh.length) hand = fresh;
  }

  const useGen = hand.length === 0 || (GEN_PROBABILITY > 0 && rng.next() < GEN_PROBABILITY);
  if (!useGen) {
    return weightedPick(rng, hand, (c) => {
      let w = c.weight ?? 1;
      if (c.requires?.length) w *= CHAIN_WEIGHT; // 連鎖事件
      if (findGoverning(c, active)) w *= GOVERNED_WEIGHT; // 既存判例が適用される
      return w;
    });
  }
  return drawGenerated(s, rng);
}

/** 手書きが尽きたときの保険。今期の3争点の中で、手書きと同じ構造の事件を作る */
function drawGenerated(s: GameState, rng: Rng): CaseDef {
  const active = activePrecedents(s).filter((p) => s.issues.includes(p.issue));
  const usedGen = new Set(s.usedCaseIds);
  for (let tries = 0; tries < 30; tries++) {
    let issue: IssueId;
    let subject: string;
    let object: string;
    let allowCite = false;
    if (active.length && rng.next() < GEN_GOVERNED_BIAS) {
      // 既存判例の射程内に事件を作る → 「前例に縛られる」手触りを保つ
      const p = pick(rng, active);
      issue = p.issue;
      subject = pick(rng, leavesUnder(p.subject));
      object = pick(rng, leavesUnder(p.object));
      allowCite = true;
    } else {
      issue = pick(rng, s.issues);
      subject = pick(rng, SUBJECT_LEAVES);
      object = pick(rng, OBJECT_LEAVES);
      allowCite = active.some((p) => p.issue === issue);
    }
    const id = `gen:${issue}:${subject}:${object}`;
    if (usedGen.has(id)) continue;
    return generateCase(issue, subject, object, rng, allowCite);
  }
  // 万一の保険
  return generateCase(s.issues[0] ?? 'occupy', 'cat', 'bench', rng, false);
}
