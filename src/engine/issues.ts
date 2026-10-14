import { ISSUE_IDS } from '../data/issues';
import { hashString, makeRng } from './rng';
import type { IssueId } from './types';

/** 1任期に出る争点の数（6つから抽選。事件10件に6争点は多く、連鎖が最後まで届かなかったため） */
export const ISSUES_PER_TERM = 3;

/**
 * 今期の争点をシードから決める。同じシードなら同じ3つ（デイリーは全員同じ）。
 * mustInclude を渡すと、それを必ず含める（初回・デイリーは「占有」を含めて、占有-01 → 占有-02 のチュートリアルを成立させる）。
 */
export function pickIssues(seed: number, mustInclude: IssueId[] = []): IssueId[] {
  const rng = makeRng(hashString(`issues:${seed}`));
  const rest = ISSUE_IDS.filter((i) => !mustInclude.includes(i));
  // Fisher–Yates
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [...mustInclude, ...rest].slice(0, ISSUES_PER_TERM);
}
