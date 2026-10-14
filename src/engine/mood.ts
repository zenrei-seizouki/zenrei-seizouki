import { MOOD, WARN } from '../data/mood';
import { STRAIN_AT } from './meters';
import { hashString } from './rng';
import { METER_IDS, type GameState, type GameEvent, type MeterId } from './types';

/** この判決で「大きな変化」とみなす絶対値 */
export const STRONG_DELTA = 3;

export interface Mood {
  /** この判決で一番動いたメーターの様子（変化が無ければ undefined） */
  line?: string;
  meter?: MeterId;
  /** メーターが限界近くのときの警告（威信が減る理由）。 */
  warn?: string;
}

/** 判決の結果（events と判決後の state）から、号外に出す「国の様子」を作る。数字は出さない */
export function moodFor(events: GameEvent[], state: GameState): Mood {
  const ev = events.find((e) => e.type === 'meterChanged') as Extract<GameEvent, { type: 'meterChanged' }> | undefined;
  const mood: Mood = {};
  if (ev) {
    let best: MeterId | null = null;
    let bestAbs = 0;
    for (const m of METER_IDS) {
      const d = ev.deltas[m] ?? 0;
      if (Math.abs(d) > bestAbs + 1e-9) {
        best = m;
        bestAbs = Math.abs(d);
      }
    }
    if (best) {
      const d = ev.deltas[best] as number;
      const pool = MOOD[best][d > 0 ? 'up' : 'down'][bestAbs >= STRONG_DELTA ? 1 : 0];
      const i = hashString(`${state.seed}:${state.day}:${best}`) % pool.length;
      mood.line = pool[i];
      mood.meter = best;
    }
  }
  // 限界近いメーターがあれば警告
  let worst: MeterId | null = null;
  let worstAbs = 0;
  for (const m of METER_IDS) {
    const a = Math.abs(state.meters[m]);
    if (a >= STRAIN_AT && a > worstAbs) {
      worst = m;
      worstAbs = a;
    }
  }
  if (worst) mood.warn = WARN[worst][state.meters[worst] > 0 ? 'up' : 'down'];
  return mood;
}
