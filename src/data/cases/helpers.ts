import type { Condition, IssueId, MeterId, NodeId, Verdict } from '../../engine/types';

/** 「その争点で、主体がsubject・客体がobjectを含む広さの（有効な）判例がある」 */
export const covers = (issue: IssueId, subject: NodeId, object: NodeId, verdict: Verdict | 'any' = 'grant'): Condition => ({
  kind: 'precedent',
  issue,
  verdict,
  covers: { subject, object },
});

/** その争点の判例が（向き不問で）ある */
export const anyPrecedent = (issue: IssueId): Condition => ({ kind: 'precedent', issue, verdict: 'any' });

export const meterLte = (meter: MeterId, lte: number): Condition => ({ kind: 'meter', meter, lte });
export const meterGte = (meter: MeterId, gte: number): Condition => ({ kind: 'meter', meter, gte });
