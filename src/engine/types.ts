export type Level = 0 | 1 | 2; // 0=狭(葉) 1=中(カテゴリ) 2=広(root)
export type Verdict = 'grant' | 'deny';
export type IssueId = 'occupy' | 'labor' | 'eat' | 'name' | 'sleep' | 'vote';
export type MeterId = '秩序' | '経済' | '自由' | '幸福';
export type NodeId = string;
export type LeafId = string;
export type CategoryId = 'animal' | 'human' | 'org' | 'machine';

export interface OntNode {
  id: NodeId;
  label: string;
  level: Level;
  parent?: NodeId;
  side: 'subject' | 'object';
  glyph?: string; // アイコンマップ用の一字
}

export interface Precedent {
  no: number;
  issue: IssueId;
  verdict: Verdict;
  subject: NodeId;
  object: NodeId;
  exceptions: NodeId[];
  citations: number;
  overruledBy?: number;
  originCaseId: string;
  day: number;
  /** 判例の持ち主（ストーリー用）: 最初に作った事件の主体の葉 */
  heroLeaf: LeafId;
  objectLeaf: LeafId;
}

export type Condition =
  | {
      kind: 'precedent';
      issue: IssueId;
      /** 省略=grant。'any' で向き不問 */
      verdict?: Verdict | 'any';
      covers?: { subject?: NodeId; object?: NodeId };
    }
  | { kind: 'meter'; meter: MeterId; gte?: number; lte?: number };

export interface Party {
  name: string;
  sub?: string;
  /** 立ち絵のキー（public/art/chara/<art>.webp）。無ければ影絵 */
  art: string;
  lines: string[];
}

export interface CaseDef {
  id: string;
  issue: IssueId;
  tier: 1 | 2 | 3;
  title: string;
  subject: LeafId;
  object: LeafId;
  plaintiff: Party;
  defendant: Party;
  crowdLean: 'plaintiff' | 'defendant' | 'split';
  requires?: Condition[];
  weight?: number;
  star?: boolean;
  crisis?: boolean;
  generated?: boolean;
  newsOverride?: Partial<Record<Verdict, { hl: string; sub: string }>>;
}

export type ChoiceKind = 'new' | 'follow' | 'extend' | 'distinguish' | 'overrule';
export interface Choice {
  kind: ChoiceKind;
  verdict: Verdict;
  level?: Level; // new / extend / overrule
  exception?: NodeId; // distinguish
}

export interface RulingLog {
  day: number;
  caseId: string;
  issue: IssueId;
  subject: LeafId;
  object: LeafId;
  verdict: Verdict;
  kind: ChoiceKind;
  level?: Level;
  precedentNo: number; // 関わった判例（新設なら新判例）
  governedBy?: number; // 事件時点で支配していた判例
  crowd: 'agree' | 'against' | 'split';
  star?: boolean;
  chain?: boolean;
  authorityDelta: number;
}

export interface GameState {
  version: 1;
  mode: 'normal' | 'daily';
  seed: number;
  rngState: number;
  day: number; // 1..TERM
  authority: number;
  meters: Record<MeterId, number>;
  beneficiaries: Record<CategoryId, number>;
  leafWins: Record<LeafId, number>;
  precedents: Precedent[];
  usedCaseIds: string[];
  crisisUsed: string[];
  opening: string[]; // 1〜3日目の固定順（チュートリアル/デイリー）
  currentCase: CaseDef | null;
  log: RulingLog[];
  stats: { follows: number; distinguishes: number; overrules: number; extends: number; crowdAgree: number; crowdAgainst: number };
  finished: boolean;
}

export type GameEvent =
  | { type: 'precedentCreated'; precedent: Precedent }
  | { type: 'cited'; no: number; citations: number }
  | { type: 'extended'; no: number; from: Level; to: Level }
  | { type: 'exceptionAdded'; no: number; node: NodeId }
  | { type: 'overruled'; no: number; by: number }
  | { type: 'meterChanged'; deltas: Partial<Record<MeterId, number>> }
  | { type: 'crowd'; result: 'agree' | 'against' | 'split' }
  | { type: 'authority'; delta: number; parts: { label: string; value: number }[] }
  | { type: 'news'; headline: string; sub: string }
  | { type: 'ended'; reason: 'term' | 'dismissed' };

export interface EndingDef {
  id: string;
  name: string;
  rarity: 1 | 2 | 3 | 4 | 5;
  text: string;
  group: string;
  when: (s: GameState) => boolean;
}

export const TERM = 10;
export const METER_IDS: MeterId[] = ['秩序', '経済', '自由', '幸福'];
