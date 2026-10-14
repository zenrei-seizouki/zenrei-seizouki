import type { CaseDef } from '../../engine/types';
import { argonCases } from './argon';
import { crisisCases } from './crisis';
import { eatCases } from './eat';
import { laborCases } from './labor';
import { nameCases } from './name';
import { occupyCases } from './occupy';
import { sleepCases } from './sleep';
import { voteCases } from './vote';

export const HAND_CASES: CaseDef[] = [...occupyCases, ...laborCases, ...eatCases, ...nameCases, ...sleepCases, ...voteCases, ...argonCases];
export const CRISIS_CASES: CaseDef[] = crisisCases;
export const ALL_CASES: CaseDef[] = [...HAND_CASES, ...CRISIS_CASES];
export const CASE_BY_ID: Record<string, CaseDef> = Object.fromEntries(ALL_CASES.map((c) => [c.id, c]));

/** 初回・デイリーの序盤固定（占有-01 → 占有-02。3日目以降は通常の抽選） */
export const OPENING_IDS = ['occupy-01', 'occupy-02'];
