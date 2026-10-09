import type { IssueId, MeterId, Verdict } from '../engine/types';

export interface IssueDef {
  id: IssueId;
  label: string;
  question: string;
  grant: string; // {S} {O}
  deny: string;
  /** 認容/棄却 ボタン下の説明 */
  grantCap: string;
  denyCap: string;
  vector: Record<Verdict, Partial<Record<MeterId, number>>>;
}

export const ISSUES: Record<IssueId, IssueDef> = {
  occupy: {
    id: 'occupy',
    label: '占有',
    question: '長く居座った者は、それを所有できるか',
    grant: '{S}が{O}を長時間占拠したときは、{S2}はその所有権を得る。',
    deny: '{S}がいかに長く{O}を占拠しても、所有権は生じない。',
    grantCap: '居座りを認める',
    denyCap: '居座りは居座り',
    vector: {
      grant: { 秩序: -2, 自由: 2, 経済: 1 },
      deny: { 秩序: 1, 自由: -1 },
    },
  },
  labor: {
    id: 'labor',
    label: '労働',
    question: '働いた（つもりの）者は、有給休暇をもらえるか',
    grant: '{O}のために働いた{S}は、有給休暇を得る。',
    deny: '{S}が{O}のために働いても、それは労働とはみなさない。',
    grantCap: '有給を認める',
    denyCap: 'それは労働ではない',
    vector: {
      grant: { 経済: -2, 幸福: 2 },
      deny: { 経済: 1, 幸福: -1 },
    },
  },
  eat: {
    id: 'eat',
    label: '名無しの食べ物',
    question: '名前を書いていない食べ物は、食べていいか',
    grant: '名前の書かれていない{O}は、{S}が食べてよい。',
    deny: '名前がなくとも、{S}は他人の{O}を食べてはならない。',
    grantCap: '食べてよい',
    denyCap: '名無しでも他人の物',
    vector: {
      grant: { 幸福: 2, 秩序: -1 },
      deny: { 秩序: 1, 幸福: -1 },
    },
  },
  name: {
    id: 'name',
    label: '命名',
    question: '先に名前をつけた者は、それを支配できるか',
    grant: '{O}に最初に名前をつけた{S}は、それを支配できる。',
    deny: '{S}が{O}に名前をつけても、何の権利も生じない。',
    grantCap: '名付け親が支配する',
    denyCap: '名付けに権利なし',
    vector: {
      grant: { 自由: 1, 秩序: -1, 経済: 1 },
      deny: { 秩序: 1 },
    },
  },
  sleep: {
    id: 'sleep',
    label: '居眠り',
    question: '寝ていた間のことに、責任はあるか',
    grant: '眠っていた{S}は、{O}で起きたことに責任を負わない。',
    deny: '{S}は眠っていても、{O}で起きたことに責任を負う。',
    grantCap: '寝ていたなら無罪',
    denyCap: '寝ていても責任あり',
    vector: {
      grant: { 幸福: 2, 秩序: -2 },
      deny: { 秩序: 2, 幸福: -1 },
    },
  },
  vote: {
    id: 'vote',
    label: '投票権',
    question: 'この者にも、投票させるべきか',
    grant: '{S}にも、{O}の運営について投票権を認める。',
    deny: '{S}には、{O}の運営についての投票権を認めない。',
    grantCap: '一票を認める',
    denyCap: '投票は認めない',
    vector: {
      grant: { 自由: 2, 秩序: -1 },
      deny: { 秩序: 1, 自由: -1 },
    },
  },
};

export const ISSUE_IDS = Object.keys(ISSUES) as IssueId[];
