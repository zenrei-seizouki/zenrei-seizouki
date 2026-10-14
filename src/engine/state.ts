import { OPENING_IDS } from '../data/cases';
import { ISSUE_IDS } from '../data/issues';
import { METER_IDS, TERM, type GameState, type IssueId, type MeterId } from './types';
import { ISSUES_PER_TERM, pickIssues } from './issues';
import { drift } from './meters';
import { makeRng } from './rng';
import { drawNextCase } from './selector';

/** GameState の形が変わったら上げる。古いものは migrateState で今の形に直す */
export const STATE_VERSION = 2;
export const INITIAL_AUTHORITY = 10;
export const MAX_AUTHORITY = 20;

export interface NewGameOptions {
  mode?: 'normal' | 'daily';
  seed?: number;
  /** 序盤を 占有-01 → 占有-02 に固定し、今期の争点に「占有」を必ず入れる（初回プレイ・デイリー） */
  opening?: boolean;
}

export function newGame(opts: NewGameOptions = {}): GameState {
  const seed = (opts.seed ?? Math.floor(Math.random() * 2 ** 32)) >>> 0;
  const meters = Object.fromEntries(METER_IDS.map((m) => [m, 0])) as Record<MeterId, number>;
  const opening = !!opts.opening || opts.mode === 'daily';
  const s: GameState = {
    version: STATE_VERSION,
    mode: opts.mode ?? 'normal',
    seed,
    rngState: seed,
    day: 1,
    authority: INITIAL_AUTHORITY,
    meters,
    beneficiaries: { animal: 0, human: 0, org: 0, machine: 0 },
    leafWins: {},
    precedents: [],
    usedCaseIds: [],
    crisisUsed: [],
    issues: pickIssues(seed, opening ? ['occupy'] : []),
    opening: opening ? [...OPENING_IDS] : [],
    currentCase: null,
    log: [],
    stats: { follows: 0, distinguishes: 0, overrules: 0, extends: 0, crowdAgree: 0, crowdAgainst: 0 },
    finished: false,
  };
  return drawInto(s);
}

/**
 * 古い形（issues が無い等）の状態が渡されても落ちないよう、抽選の前に今の形へ直す。
 * ホットリロードで、変更前に始めた任期の状態がメモリに残ったときの保険でもある。直せなければそのまま返す。
 */
function current(s: GameState): GameState {
  if (s.version === STATE_VERSION && Array.isArray(s.issues)) return s;
  return migrateState(s) ?? s;
}

/** 今日の事件を抽選して state.currentCase に入れる（イミュータブル） */
export function drawInto(s: GameState): GameState {
  const next: GameState = structuredClone(current(s));
  const rng = makeRng(next.rngState);
  const c = drawNextCase(next, rng);
  next.rngState = rng.state();
  next.currentCase = c;
  next.usedCaseIds.push(c.id);
  return next;
}

/** 判決後に呼ぶ。任期満了/罷免なら finished、そうでなければ翌日の事件を引く */
export function advance(s: GameState): GameState {
  if (s.authority <= 0 || s.day >= TERM) {
    return { ...structuredClone(s), finished: true, currentCase: null };
  }
  const n: GameState = { ...structuredClone(current(s)), day: s.day + 1 };
  n.meters = drift(n.meters);
  return drawInto(n);
}

export const isDismissed = (s: GameState): boolean => s.authority <= 0;

// ---- シリアライズ / 古いセーブの補正 ----
export const serialize = (s: GameState): string => JSON.stringify(s);

const isIssue = (x: unknown): x is IssueId => typeof x === 'string' && (ISSUE_IDS as string[]).includes(x);
const num = (x: unknown, d: number): number => (typeof x === 'number' && Number.isFinite(x) ? x : d);
/** 変更前（1任期に6争点）の固定オープニング */
const LEGACY_OPENING = ['occupy-01', 'labor-02', 'occupy-02'];

/**
 * 古い形式・欠けたフィールドのある状態を、今の形（version 2）に直す。直せなければ null。
 * - issues が無い/不正: その周で使った争点（log → 判例 → 今日の事件）を必ず含め、3つに満たなければシードから補う
 *   （3つ以上使っていたら、使った争点を全部残す＝進行中のチェーンを切らない）
 * - opening が旧3件の固定順なら、新しい2件（占有-01 → 占有-02）に置き換える
 * - 配列・オブジェクト・数値の欠けは既定値で埋める
 * 何度かけても同じ結果になる（冪等）。
 */
export function migrateState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = structuredClone(raw) as Record<string, any>;
  if (typeof s.day !== 'number' || s.day < 1 || typeof s.seed !== 'number' || typeof s.authority !== 'number') return null;

  s.mode = s.mode === 'daily' ? 'daily' : 'normal';
  s.rngState = num(s.rngState, s.seed);
  const meters: Record<string, number> = {};
  for (const m of METER_IDS) meters[m] = num(s.meters?.[m], 0);
  s.meters = meters;
  s.beneficiaries = { animal: 0, human: 0, org: 0, machine: 0, ...(s.beneficiaries ?? {}) };
  s.leafWins = s.leafWins && typeof s.leafWins === 'object' ? s.leafWins : {};
  s.precedents = Array.isArray(s.precedents) ? s.precedents : [];
  for (const p of s.precedents) if (!Array.isArray(p.exceptions)) p.exceptions = [];
  s.usedCaseIds = Array.isArray(s.usedCaseIds) ? s.usedCaseIds : [];
  s.crisisUsed = Array.isArray(s.crisisUsed) ? s.crisisUsed : [];
  s.log = Array.isArray(s.log) ? s.log : [];
  s.stats = { follows: 0, distinguishes: 0, overrules: 0, extends: 0, crowdAgree: 0, crowdAgainst: 0, ...(s.stats ?? {}) };
  s.finished = !!s.finished;
  s.currentCase = s.currentCase && typeof s.currentCase === 'object' ? s.currentCase : null;

  // 序盤の固定順
  const opening: unknown[] = Array.isArray(s.opening) ? s.opening : [];
  s.opening = opening.length === LEGACY_OPENING.length && opening.every((x, i) => x === LEGACY_OPENING[i]) ? [...OPENING_IDS] : opening.filter((x) => typeof x === 'string');

  // この任期の争点
  const valid = Array.isArray(s.issues) && s.issues.length > 0 && s.issues.every(isIssue) && new Set(s.issues).size === s.issues.length;
  if (!valid) {
    const used: IssueId[] = [];
    const add = (i: unknown) => {
      if (isIssue(i) && !used.includes(i)) used.push(i);
    };
    for (const l of s.log) add(l?.issue);
    for (const p of s.precedents) add(p?.issue);
    if (s.currentCase && !s.currentCase.crisis) add(s.currentCase.issue);
    s.issues = used.length >= ISSUES_PER_TERM ? used : pickIssues(s.seed, used);
  }
  s.version = STATE_VERSION;
  return s as GameState;
}

export function deserialize(json: string): GameState | null {
  try {
    const s = migrateState(JSON.parse(json));
    if (!s) return null;
    // 進行中なのに今日の事件が無い（壊れている）なら、引き直す
    return !s.finished && !s.currentCase ? drawInto(s) : s;
  } catch {
    return null;
  }
}
