import type { CaseDef } from '../../engine/types';
import { covers, meterLte } from './helpers';

/** 名無しの食べ物 —「名前を書いていない食べ物は、食べていいか」 */
export const eatCases: CaseDef[] = [
  {
    id: 'eat-01', issue: 'eat', tier: 1, title: '冷蔵庫のプリン事件',
    subject: 'worker', object: 'pudding', crowdLean: 'split',
    plaintiff: { name: '後輩・山本', sub: '入社2年目', art: 'worker', lines: [
      '名前が書いてなかったので、みんなのプリンだと思いました。',
      '共用の冷蔵庫に入っていたので。',
    ] },
    defendant: { name: '先輩・高橋', sub: 'プリンの持ち主', art: 'senior', lines: [
      '3個パックの最後の1個だぞ。',
      '文脈で分かるだろ。',
    ] },
  },
  {
    id: 'eat-02', issue: 'eat', tier: 1, title: 'お供え物の饅頭事件',
    subject: 'crow', object: 'manju', crowdLean: 'split',
    plaintiff: { name: 'カラス', sub: '墓地の常連', art: 'crow', lines: [
      'カァ。（ご先祖は、食べないでしょ）',
      'カァ、カァ。（名前も書いてない）',
    ] },
    defendant: { name: 'おばあちゃん', sub: '墓参り歴50年', art: 'citizen', lines: [
      'ご先祖が食べるかどうかは、ご先祖が決めます。',
      'そもそも、饅頭に名前は書きません。',
    ] },
  },
  {
    id: 'eat-03', issue: 'eat', tier: 1, title: '欠席者の揚げパン',
    subject: 'child', object: 'agepan', crowdLean: 'plaintiff',
    plaintiff: { name: 'クラス全員', sub: '代表: 小4', art: 'child', lines: [
      '休んだ村井くんの揚げパンに、名前がありませんでした。',
      'だから、みんなで分けました。',
    ] },
    defendant: { name: '村井くん', sub: 'リモート出廷', art: 'child', lines: [
      '熱が下がったら食べようと思ってたのに。',
      '揚げパン、楽しみにしてたのに。',
    ] },
  },
  {
    id: 'eat-04', issue: 'eat', tier: 2, title: '視察と称して',
    subject: 'politician', object: 'curry', crowdLean: 'defendant',
    requires: [covers('eat', 'human', 'food')],
    plaintiff: { name: '政治家・大河内', sub: '「現場主義」', art: 'politician', lines: [
      '{cite}に基づき、社食のカレーを「視察」しました。',
      '全部です。',
    ] },
    defendant: { name: '社員食堂', sub: '調理長', art: 'shopkeeper', lines: [
      '13時以降のお客様が、全員おかわりできませんでした。',
      '先生、あれは視察ではなく、完食です。',
    ] },
  },
  {
    id: 'eat-05', issue: 'eat', tier: 2, title: '魚屋の店先事件',
    subject: 'cat', object: 'fish', crowdLean: 'plaintiff',
    requires: [covers('eat', 'animal', 'food')],
    plaintiff: { name: '猫のサバ', sub: '商店街の常連', art: 'cat', lines: [
      'にゃ。（どの魚にも、名前が書いてなかった）',
      'にゃー。（{cite}を読んでから、こうなると思っていた）',
    ] },
    defendant: { name: '魚屋の店主', sub: '創業40年', art: 'shopkeeper', lines: [
      '魚に名前を書くやつはいない。',
      '値札がついてるだろう、値札が。',
    ] },
  },
  {
    id: 'eat-06', issue: 'eat', tier: 2, title: '名無し食品回収株式会社',
    subject: 'company', object: 'manju', crowdLean: 'defendant',
    requires: [covers('eat', 'org', 'food')],
    plaintiff: { name: '株式会社ナナシ', sub: '代表取締役', art: 'company', lines: [
      '判例に基づき、名前のない食べ物を回収して食べるサービスを始めました。',
      'お供え物は特に美味しい。',
    ] },
    defendant: { name: 'お寺の住職', sub: '住職', art: 'monk', lines: [
      '罰当たりにも、ほどがある。',
      '会員は既に3000人いるそうですね。',
    ] },
  },
  {
    id: 'eat-07', issue: 'eat', tier: 2, title: '賢すぎる冷蔵庫',
    subject: 'ai', object: 'pudding', crowdLean: 'split',
    requires: [covers('eat', 'machine', 'food')],
    plaintiff: { name: 'スマート冷蔵庫', sub: 'AI「ヒエル」', art: 'ai', lines: [
      '名前ノナイ プリンヲ 検知。',
      '規定ニヨリ、消費シマシタ。',
    ] },
    defendant: { name: '一家', sub: '4人家族', art: 'father', lines: [
      '冷蔵庫に口があるとは知りませんでした。',
      'どこから食べたのか、教えてほしい。',
    ] },
  },
  {
    id: 'eat-08', issue: 'eat', tier: 3, title: '政府、国民の弁当を食べる',
    subject: 'gov', object: 'curry', crowdLean: 'defendant', star: true,
    requires: [covers('eat', 'org', 'food'), meterLte('秩序', -3)],
    plaintiff: { name: '政府', sub: '財務担当', art: 'gov', lines: [
      '財源確保のため、名前のない社食のカレーを、国として食べています。',
      '来月からは、全国の弁当も対象にします。',
    ] },
    defendant: { name: '全国の社員食堂', sub: '連合会', art: 'shopkeeper', lines: [
      'カレーに、名前は書けません。',
      '鍋が大きすぎて、ラベルが貼れません。',
    ] },
    newsOverride: {
      grant: { hl: '政府、国民のカレーを食べる　財源は「おかわり」', sub: '全国の社員食堂に「国家用」の列が新設' },
    },
  },
  {
    id: 'eat-09', issue: 'eat', tier: 3, title: '犬、傘を食べる',
    subject: 'dog', object: 'umbrella', crowdLean: 'split', star: true,
    requires: [covers('eat', 'animal', 'anything')],
    plaintiff: { name: '犬のポチ', sub: '雑食', art: 'dog', lines: [
      'わん。（名前は、書いてなかった）',
      'わんわん。（{cite}は、食べ物の種類を限定していない）',
    ] },
    defendant: { name: '傘の持ち主', sub: '雨の日の通勤者', art: 'citizen', lines: [
      '傘は、食べ物ではありません。',
      '柄の部分が、まだ半分残っています。',
    ] },
    newsOverride: {
      grant: { hl: '犬、傘を食べて勝訴　「名前がなければ食べ物」', sub: '傘の持ち主「次は私の番では」' },
    },
  },
  {
    id: 'eat-10', issue: 'eat', tier: 2, title: '自分のプリンなのに',
    subject: 'child', object: 'pudding', crowdLean: 'plaintiff',
    requires: [covers('eat', 'human', 'food', 'deny')],
    plaintiff: { name: '小2・ゆい', sub: '名前を書き忘れた', art: 'child', lines: [
      '自分のプリンに名前を書き忘れたら、{cite}のせいで、自分でも食べちゃダメになった。',
      '自分で買ったのに。',
    ] },
    defendant: { name: '母', sub: '専業主婦', art: 'owner', lines: [
      '法律だから……。',
      'お母さんも、食べたいけど我慢してるの。',
    ] },
  },
];
