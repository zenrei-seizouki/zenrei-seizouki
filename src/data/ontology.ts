import type { CategoryId, Level, OntNode } from '../engine/types';

const L = (
  id: string,
  label: string,
  level: Level,
  side: 'subject' | 'object',
  parent?: string,
  glyph?: string,
): OntNode => ({ id, label, level, side, parent, glyph });

export const ROOT_SUBJECT = 'anyone';
export const ROOT_OBJECT = 'anything';

export const SUBJECT_CATS: CategoryId[] = ['animal', 'human', 'org', 'machine'];
export const OBJECT_CATS = ['private', 'food', 'public', 'concept'];

const nodes: OntNode[] = [
  L('anyone', 'あらゆる者', 2, 'subject'),
  L('anything', 'あらゆる物', 2, 'object'),
  L('animal', '動物', 1, 'subject', 'anyone'),
  L('human', '人間', 1, 'subject', 'anyone'),
  L('org', '組織', 1, 'subject', 'anyone'),
  L('machine', '機械', 1, 'subject', 'anyone'),
  L('private', '私物', 1, 'object', 'anything'),
  L('food', '食べ物', 1, 'object', 'anything'),
  L('public', '公共物', 1, 'object', 'anything'),
  L('concept', '概念', 1, 'object', 'anything'),
  // 動物
  L('cat', '猫', 0, 'subject', 'animal', '猫'),
  L('dog', '犬', 0, 'subject', 'animal', '犬'),
  L('crow', 'カラス', 0, 'subject', 'animal', '鴉'),
  L('pigeon', 'ハト', 0, 'subject', 'animal', '鳩'),
  L('goldfish', '金魚', 0, 'subject', 'animal', '金'),
  // 人間
  L('child', '子ども', 0, 'subject', 'human', '童'),
  L('elder', '老人', 0, 'subject', 'human', '翁'),
  L('worker', '会社員', 0, 'subject', 'human', '勤'),
  L('politician', '政治家', 0, 'subject', 'human', '政'),
  // 組織
  L('company', '会社', 0, 'subject', 'org', '社'),
  L('town', '町内会', 0, 'subject', 'org', '町'),
  L('gov', '政府', 0, 'subject', 'org', '府'),
  // 機械
  L('robot', 'ロボット掃除機', 0, 'subject', 'machine', '掃'),
  L('vending', '自販機', 0, 'subject', 'machine', '販'),
  L('ai', 'AI', 0, 'subject', 'machine', '知'),
  // 私物
  L('keyboard', 'キーボード', 0, 'object', 'private', '鍵'),
  L('umbrella', '傘', 0, 'object', 'private', '傘'),
  L('kotatsu', 'こたつ', 0, 'object', 'private', '炬'),
  L('phone', 'スマホ', 0, 'object', 'private', '携'),
  L('photo', '写真', 0, 'object', 'private', '写'),
  // 食べ物
  L('pudding', 'プリン', 0, 'object', 'food', '菓'),
  L('agepan', '揚げパン', 0, 'object', 'food', '揚'),
  L('manju', 'お供えの饅頭', 0, 'object', 'food', '饅'),
  L('curry', '社食のカレー', 0, 'object', 'food', '汁'),
  L('fish', '焼き魚', 0, 'object', 'food', '魚'),
  L('kaki', '柿', 0, 'object', 'food', '柿'),
  // 公共物
  L('bench', 'ベンチ', 0, 'object', 'public', '椅'),
  L('park', '公園', 0, 'object', 'public', '園'),
  L('hall', '市民会館', 0, 'object', 'public', '館'),
  L('diet', '国会議事堂', 0, 'object', 'public', '議'),
  // 概念
  L('monday', '月曜日', 0, 'object', 'concept', '月'),
  L('surname', '名字', 0, 'object', 'concept', '姓'),
  L('lunch', '昼休み', 0, 'object', 'concept', '昼'),
  L('anthem', '国歌', 0, 'object', 'concept', '歌'),
  L('countryname', '国名', 0, 'object', 'concept', '國'),
];

export const NODES: Record<string, OntNode> = Object.fromEntries(nodes.map((n) => [n.id, n]));
export const ALL_NODES = nodes;
export const SUBJECT_LEAVES = nodes.filter((n) => n.side === 'subject' && n.level === 0).map((n) => n.id);
export const OBJECT_LEAVES = nodes.filter((n) => n.side === 'object' && n.level === 0).map((n) => n.id);
export const LEAVES_BY_CAT: Record<string, string[]> = {};
for (const n of nodes) if (n.level === 0 && n.parent) (LEAVES_BY_CAT[n.parent] ??= []).push(n.id);

/** 受益者カウント用: 葉→主体カテゴリ */
export const subjectCategory = (leaf: string): CategoryId => NODES[leaf].parent as CategoryId;
