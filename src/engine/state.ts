import { OPENING_IDS } from '../data/cases';
import { METER_IDS, TERM, type GameState, type MeterId } from './types';
import { drift } from './meters';
import { makeRng } from './rng';
import { drawNextCase } from './selector';

export const INITIAL_AUTHORITY = 10;
export const MAX_AUTHORITY = 20;

export interface NewGameOptions {
  mode?: 'normal' | 'daily';
  seed?: number;
  /** 1〜3日目を 占有-01 → 労働-02 → 占有-02 に固定する（初回プレイ・デイリー） */
  opening?: boolean;
}

export function newGame(opts: NewGameOptions = {}): GameState {
  const seed = (opts.seed ?? Math.floor(Math.random() * 2 ** 32)) >>> 0;
  const meters = Object.fromEntries(METER_IDS.map((m) => [m, 0])) as Record<MeterId, number>;
  const s: GameState = {
    version: 1,
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
    opening: opts.opening || opts.mode === 'daily' ? [...OPENING_IDS] : [],
    currentCase: null,
    log: [],
    stats: { follows: 0, distinguishes: 0, overrules: 0, extends: 0, crowdAgree: 0, crowdAgainst: 0 },
    finished: false,
  };
  return drawInto(s);
}

/** 今日の事件を抽選して state.currentCase に入れる（イミュータブル） */
export function drawInto(s: GameState): GameState {
  const next: GameState = structuredClone(s);
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
  const n: GameState = { ...structuredClone(s), day: s.day + 1 };
  n.meters = drift(n.meters);
  return drawInto(n);
}

export const isDismissed = (s: GameState): boolean => s.authority <= 0;

// ---- シリアライズ ----
export const serialize = (s: GameState): string => JSON.stringify(s);
export function deserialize(json: string): GameState | null {
  try {
    const s = JSON.parse(json) as GameState;
    if (s?.version !== 1 || typeof s.day !== 'number') return null;
    return s;
  } catch {
    return null;
  }
}
