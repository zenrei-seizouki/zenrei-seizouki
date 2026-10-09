import type { CaseDef } from '../../engine/types';
import { occupyCases } from './occupy';
import { laborCases } from './labor';

export const HAND_CASES: CaseDef[] = [...occupyCases, ...laborCases];
export const CRISIS_CASES: CaseDef[] = [];
export const ALL_CASES: CaseDef[] = [...HAND_CASES, ...CRISIS_CASES];
export const CASE_BY_ID: Record<string, CaseDef> = Object.fromEntries(ALL_CASES.map((c) => [c.id, c]));

/** 初回・デイリーの1〜3日目固定（占有-01 → 労働-02 → 占有-02） */
export const OPENING_IDS = ['occupy-01', 'labor-02', 'occupy-02'];
