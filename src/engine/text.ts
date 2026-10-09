import { ISSUES } from '../data/issues';
import { NODES } from '../data/ontology';
import { label } from './ontology';
import type { IssueId, Level, NodeId, Precedent, Verdict } from './types';

export interface TextPart {
  t: string;
  /** 主体/客体の語（射程ハイライト用）。レベルを持つ */
  lv?: Level;
}

export function holdingParts(issue: IssueId, verdict: Verdict, subject: NodeId, object: NodeId): TextPart[] {
  const tpl = ISSUES[issue][verdict];
  const parts: TextPart[] = [];
  const re = /\{(S2|S|O)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tpl))) {
    if (m.index > last) parts.push({ t: tpl.slice(last, m.index) });
    if (m[1] === 'S') parts.push({ t: label(subject), lv: NODES[subject].level });
    else if (m[1] === 'O') parts.push({ t: label(object), lv: NODES[object].level });
    else parts.push({ t: NODES[subject].level === 2 ? 'その者' : label(subject) });
    last = m.index + m[0].length;
  }
  if (last < tpl.length) parts.push({ t: tpl.slice(last) });
  return parts;
}

export function holdingText(issue: IssueId, verdict: Verdict, subject: NodeId, object: NodeId, exceptions: NodeId[] = []): string {
  const base = holdingParts(issue, verdict, subject, object)
    .map((p) => p.t)
    .join('');
  return base + exceptions.map((e) => `ただし、${label(e)}の場合を除く。`).join('');
}

export const precedentText = (p: Precedent, withExceptions = true): string =>
  holdingText(p.issue, p.verdict, p.subject, p.object, withExceptions ? p.exceptions : []);

export const exceptionText = (node: NodeId): string => `ただし、${label(node)}の場合を除く。`;
