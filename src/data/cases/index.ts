import type { CaseDef } from '../../engine/types';
import { crisisCases } from './crisis';
import { eatCases } from './eat';
import { laborCases } from './labor';
import { nameCases } from './name';
import { occupyCases } from './occupy';
import { sleepCases } from './sleep';
import { voteCases } from './vote';

export const HAND_CASES: CaseDef[] = [...occupyCases, ...laborCases, ...eatCases, ...nameCases, ...sleepCases, ...voteCases];
export const CRISIS_CASES: CaseDef[] = crisisCases;
export const ALL_CASES: CaseDef[] = [...HAND_CASES, ...CRISIS_CASES];
export const CASE_BY_ID: Record<string, CaseDef> = Object.fromEntries(ALL_CASES.map((c) => [c.id, c]));

/** 初回・デイリーの1〜3日目固定（占有-01 → 労働-02 → 占有-02） */
export const OPENING_IDS = ['occupy-01', 'labor-02', 'occupy-02'];
