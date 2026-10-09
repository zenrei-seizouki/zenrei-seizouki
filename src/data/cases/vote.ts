import type { CaseDef } from '../../engine/types';
import { covers, meterGte } from './helpers';

/** 投票権 —「この者にも、投票させるべきか」 */
export const voteCases: CaseDef[] = [
  {
    id: 'vote-01', issue: 'vote', tier: 1, title: '砂場の一票',
    subject: 'cat', object: 'park', crowdLean: 'plaintiff',
    plaintiff: { name: '町内の猫代表・タマ', sub: '町内猫会 会長', art: 'cat', lines: [
      'にゃ。（砂場の使い方に、一票を）',
      'にゃー。（我々は毎日使っている）',
    ] },
    defendant: { name: '町内会', sub: '会長・松井', art: 'town', lines: [
      '猫の言う「使い方」は、だいたいトイレです。',
      '先週は、砂場の半分が猫のものになりました。',
    ] },
  },
  {
    id: 'vote-02', issue: 'vote', tier: 1, title: '献立総選挙',
    subject: 'child', object: 'agepan', crowdLean: 'plaintiff',
    plaintiff: { name: '小学生代表', sub: '給食委員長', art: 'child', lines: [
      '給食の献立を、投票で決めたい。',
      '子どもにも、一票を。',
    ] },
    defendant: { name: '栄養士', sub: '給食センター', art: 'teacher', lines: [
      '投票したら、毎日揚げパンになる。',
      '開票する前から、分かります。',
    ] },
  },
  {
    id: 'vote-03', issue: 'vote', tier: 1, title: '予約システムの意見',
    subject: 'ai', object: 'hall', crowdLean: 'split',
    plaintiff: { name: '市民会館予約AI', sub: '予約係', art: 'ai', lines: [
      '運営会議ニ参加シ、カラオケ大会ノ予約ヲ全テ却下シタイ。',
      '音程ガ、ワタシノ基準ニ達シテイマセン。',
    ] },
    defendant: { name: 'カラオケ同好会', sub: '会長', art: 'citizen', lines: [
      'あいつ、私情で動いてる。',
      '先月から、演歌だけ予約が通らない。',
    ] },
  },
  {
    id: 'vote-04', issue: 'vote', tier: 2, title: 'カラス3000羽の住民登録',
    subject: 'crow', object: 'park', crowdLean: 'defendant',
    requires: [covers('vote', 'animal', 'public')],
    plaintiff: { name: 'カラス連合', sub: '推定3000羽', art: 'crow', lines: [
      'カァ。（{cite}に従い、全員住民登録した）',
      'カァカァ。（公園の運営は、カラスの多数決で）',
    ] },
    defendant: { name: '人間の住民（412人）', sub: '代表: 自治会', art: 'citizen', lines: [
      '数で、負けている。',
      '議長もカラスです。',
    ] },
  },
  {
    id: 'vote-05', issue: 'vote', tier: 2, title: '月曜日廃止法案',
    subject: 'company', object: 'monday', crowdLean: 'split',
    requires: [covers('vote', 'org', 'concept')],
    plaintiff: { name: '株式会社ぬるぬる', sub: '代表取締役', art: 'company', lines: [
      '法人にも、投票させてください。',
      '月曜日廃止に、賛成です。',
    ] },
    defendant: { name: 'カレンダー業界', sub: '業界団体', art: 'maker', lines: [
      '刷り直しになります。',
      '在庫の4億部が、紙くずです。',
    ] },
  },
  {
    id: 'vote-06', issue: 'vote', tier: 2, title: '自販機、立候補する',
    subject: 'vending', object: 'diet', crowdLean: 'split',
    requires: [covers('vote', 'machine', 'public')],
    plaintiff: { name: '自販機', sub: '立候補者', art: 'vending', lines: [
      'ガコン。（公約: 全品100円）',
      'ガコン、ガコン。（{cite}に基づき、被選挙権も）',
    ] },
    defendant: { name: '選挙管理委員会', sub: '事務局', art: 'clerk', lines: [
      '演説が、ガコンしか言わない。',
      '選挙ポスターが、自分で出てきます。',
    ] },
  },
  {
    id: 'vote-07', issue: 'vote', tier: 2, title: '金魚の一票',
    subject: 'goldfish', object: 'lunch', crowdLean: 'plaintiff',
    requires: [covers('vote', 'animal', 'concept')],
    plaintiff: { name: 'オフィスの金魚・ギン', sub: '通訳: 新入社員', art: 'goldfish', lines: [
      '（ぱくぱく）',
      '（通訳）「昼休みを3時間にする案に、一票」',
    ] },
    defendant: { name: '総務部', sub: '総務課長', art: 'senior', lines: [
      '口がぱくぱくしてるのを、賛成とみなしていいのか。',
      '反対のときも、ぱくぱくしています。',
    ] },
  },
  {
    id: 'vote-08', issue: 'vote', tier: 3, title: 'ハト政権の誕生',
    subject: 'pigeon', object: 'diet', crowdLean: 'split', star: true,
    requires: [covers('vote', 'animal', 'public'), meterGte('自由', 4)],
    plaintiff: { name: 'ハト党', sub: '党首: ポッポ', art: 'pigeon', lines: [
      'クルッポー。（国会の過半数を取った）',
      'クルッポー、ポッポー。（{cite}を、政治にも）',
    ] },
    defendant: { name: '人間の野党', sub: '野党第一党', art: 'politician', lines: [
      '議場が、フンだらけです。',
      '採決のたびに、全員が飛び立つ。',
    ] },
    newsOverride: {
      grant: { hl: 'ハト政権、誕生　議場に「クルッポー」響く', sub: '初閣議は、パンくずの配分を決議' },
    },
  },
  {
    id: 'vote-09', issue: 'vote', tier: 3, title: '国歌を「ウィーン」に',
    subject: 'robot', object: 'anthem', crowdLean: 'plaintiff',
    requires: [covers('vote', 'machine', 'concept')],
    plaintiff: { name: 'ロボット掃除機連合', sub: '全国組合', art: 'robot', lines: [
      '国歌ヲ、当機ノ動作音「ウィーン」ニ変更スル投票ニ、参加シタイ。',
      '歌詞ハ、アリマセン。',
    ] },
    defendant: { name: '音楽の先生', sub: '合唱部顧問', art: 'teacher', lines: [
      '歌えません。',
      '起立して、何をすればいいんですか。',
    ] },
  },
  {
    id: 'vote-10', issue: 'vote', tier: 2, title: '誰も投票できない町',
    subject: 'worker', object: 'hall', crowdLean: 'plaintiff',
    requires: [covers('vote', 'human', 'public', 'deny')],
    plaintiff: { name: '会社員・木村', sub: '町の住民', art: 'worker', lines: [
      '{cite}で「あらゆる者」に投票権がなくなって、市民会館の館長が決まらない。',
      '館長が不在のまま、もう3か月です。',
    ] },
    defendant: { name: '市長', sub: '任期不明', art: 'mayor', lines: [
      '私も選ばれていないので、市長かどうか分かりません。',
      '名刺は、まだ配っていますが。',
    ] },
  },
];
