import { ISSUES } from '../data/issues';
import { METER_IDS, type IssueId, type Level, type MeterId, type Verdict } from './types';

/** 射程倍率 狭1 / 中1.5 / 広2（v1の1/2/3は2件目で国家崩壊したので下げた） */
export const SCOPE_MULT: Record<Level, number> = { 0: 1, 1: 1.5, 2: 2 };
/** 新判例の威信ボーナス */
export const SCOPE_BONUS: Record<Level, number> = { 0: 0, 1: 1, 2: 2 };
export const METER_MAX = 10;

export function meterVector(issue: IssueId, verdict: Verdict, mult: number): Partial<Record<MeterId, number>> {
  const out: Partial<Record<MeterId, number>> = {};
  const vec = ISSUES[issue].vector[verdict];
  for (const m of METER_IDS) {
    const x = vec[m];
    if (x) out[m] = x * mult;
  }
  return out;
}

export const clampMeter = (v: number): number => Math.max(-METER_MAX, Math.min(METER_MAX, v));

export function addMeters(
  meters: Record<MeterId, number>,
  deltas: Partial<Record<MeterId, number>>,
): Record<MeterId, number> {
  const next = { ...meters };
  for (const m of METER_IDS) {
    if (deltas[m]) next[m] = clampMeter(Math.round((next[m] + (deltas[m] as number)) * 10) / 10);
  }
  return next;
}

/** メーターがこの絶対値以上だと「国が荒れている」: 毎回 威信−1（最大−2） */
export const STRAIN_AT = 7;
/** 1日ごとにメーターが0へ戻る量（国は少しずつ落ち着く） */
export const DRIFT_PER_DAY = 0.4;

export function drift(meters: Record<MeterId, number>): Record<MeterId, number> {
  const next = { ...meters };
  for (const m of METER_IDS) {
    const v = next[m];
    next[m] = Math.round((v > 0 ? Math.max(0, v - DRIFT_PER_DAY) : Math.min(0, v + DRIFT_PER_DAY)) * 10) / 10;
  }
  return next;
}

/** N日ごとに威信が1すり減る（広い判例で稼がないとジリ貧になる） */
export const UPKEEP_EVERY = 2;
