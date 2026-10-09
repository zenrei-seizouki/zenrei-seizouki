import { depth, isDescendant, leavesUnder } from './ontology';
import type { CaseDef, Condition, GameState, IssueId, NodeId, Precedent } from './types';

type CaseLike = Pick<CaseDef, 'issue' | 'subject' | 'object'>;

/** 判例 P が事件 C に適用されるか（DESIGN §3.4） */
export function applies(p: Precedent, c: CaseLike): boolean {
  if (p.overruledBy !== undefined) return false;
  if (p.issue !== c.issue) return false;
  if (!isDescendant(c.subject, p.subject) || !isDescendant(c.object, p.object)) return false;
  return !p.exceptions.some((e) => isDescendant(c.subject, e) || isDescendant(c.object, e));
}

/** 適用される判例のうち最も具体的なもの（同点なら新しい方） */
export function findGoverning(c: CaseLike, precedents: Precedent[]): Precedent | undefined {
  let best: Precedent | undefined;
  let bestScore = -1;
  for (const p of precedents) {
    if (!applies(p, c)) continue;
    const score = depth(p.subject) + depth(p.object);
    if (score > bestScore || (score === bestScore && best && p.no > best.no)) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

export const activePrecedents = (s: Pick<GameState, 'precedents'>): Precedent[] =>
  s.precedents.filter((p) => p.overruledBy === undefined);

export function checkCondition(cond: Condition, s: GameState): boolean {
  if (cond.kind === 'meter') {
    const v = s.meters[cond.meter];
    if (cond.gte !== undefined && v < cond.gte) return false;
    if (cond.lte !== undefined && v > cond.lte) return false;
    return true;
  }
  const want = cond.verdict ?? 'grant';
  return activePrecedents(s).some((p) => {
    if (p.issue !== cond.issue) return false;
    if (want !== 'any' && p.verdict !== want) return false;
    if (cond.covers?.subject && !isDescendant(cond.covers.subject, p.subject)) return false;
    if (cond.covers?.object && !isDescendant(cond.covers.object, p.object)) return false;
    return true;
  });
}

export const requirementsMet = (c: CaseDef, s: GameState): boolean => (c.requires ?? []).every((r) => checkCondition(r, s));

/** この判例にしばられる(主体の葉 × 客体の葉)の組み合わせ数。UIの「影響範囲」 */
export function boundCount(subject: NodeId, object: NodeId): number {
  return leavesUnder(subject).length * leavesUnder(object).length;
}

export const issueOf = (p: Precedent): IssueId => p.issue;
