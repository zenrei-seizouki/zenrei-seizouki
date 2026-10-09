import { NODES, LEAVES_BY_CAT, SUBJECT_LEAVES, OBJECT_LEAVES } from '../data/ontology';
import type { Level, NodeId } from './types';

export const label = (id: NodeId): string => NODES[id]?.label ?? id;
export const levelOf = (id: NodeId): Level => NODES[id].level;

/** 根から数えた深さ（root=0, カテゴリ=1, 葉=2）。「最も具体的」の比較に使う */
export function depth(id: NodeId): number {
  let d = 0;
  let cur = NODES[id];
  while (cur?.parent) {
    d++;
    cur = NODES[cur.parent];
  }
  return d;
}

/** node が ancestor の子孫（自身を含む）か */
export function isDescendant(node: NodeId, ancestor: NodeId): boolean {
  let cur: string | undefined = node;
  while (cur) {
    if (cur === ancestor) return true;
    cur = NODES[cur]?.parent;
  }
  return false;
}

/** 葉から、射程レベルに応じた祖先ノードを返す（0=葉自身 / 1=カテゴリ / 2=root） */
export function nodeAtLevel(leaf: NodeId, level: Level): NodeId {
  let cur = leaf;
  for (let i = 0; i < level; i++) {
    const p = NODES[cur]?.parent;
    if (!p) break;
    cur = p;
  }
  return cur;
}

/** その射程のノードに含まれる葉の一覧 */
export function leavesUnder(node: NodeId): NodeId[] {
  const n = NODES[node];
  if (n.level === 0) return [node];
  if (n.level === 1) return LEAVES_BY_CAT[node] ?? [];
  return n.side === 'subject' ? SUBJECT_LEAVES : OBJECT_LEAVES;
}
