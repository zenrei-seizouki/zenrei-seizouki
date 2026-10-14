import type { CaseDef } from '../../engine/types';
import { covers, meterLte } from './helpers';

/** 労働 —「働いた（つもりの）者は、有給休暇をもらえるか」 */
export const laborCases: CaseDef[] = [
  {
    id: 'labor-01', issue: 'labor', tier: 1, title: 'こたつ番の猫',
    subject: 'cat', object: 'kotatsu', crowdLean: 'plaintiff',
    plaintiff: { name: '猫のコタロウ', sub: 'こたつ番・歴3年', art: 'cat', lines: [
      'にゃ。（毎日こたつを温めておいた）',
      'にゃー。（年間休日0日。そろそろ休みたい）',
    ] },
    defendant: { name: '飼い主', sub: '会社員・29歳', art: 'owner', lines: [
      '温めてたのは、自分のお腹です。',
      'こたつのスイッチを入れたのも、私です。',
    ] },
  },
  {
    id: 'labor-02', issue: 'labor', tier: 1, title: '自販機24時間営業事件',
    subject: 'vending', object: 'park', crowdLean: 'plaintiff',
    plaintiff: { name: '公園の自販機', sub: '設置14年目', art: 'vending', lines: [
      'ガコン。（創業以来365日、24時間営業）',
      'ガコン、ガコン。（休みたい。せめて雨の日だけでも）',
    ] },
    defendant: { name: '飲料メーカーの担当者', sub: '営業所長', art: 'maker', lines: [
      '休まれると、夏に人が倒れます。',
      'あと、冷たい飲み物のほうが売れるんです。',
    ] },
  },
  {
    id: 'labor-03', issue: 'labor', tier: 1, title: '昼休み返上事件',
    subject: 'worker', object: 'lunch', crowdLean: 'plaintiff',
    plaintiff: { name: '会社員・田中', sub: '入社4年目', art: 'worker', lines: [
      '昼休みに電話番をしました。その分の有給をください。',
      '毎日です。机から1歩も動いていません。',
    ] },
    defendant: { name: '会社', sub: '総務課長', art: 'senior', lines: [
      '電話は、一度も鳴っていません。',
      '田中さんは、ずっと電話の前でパンを食べていました。',
    ] },
  },
  {
    id: 'labor-04', issue: 'labor', tier: 2, title: 'ハト、清掃員を名乗る',
    subject: 'pigeon', object: 'park', crowdLean: 'defendant',
    requires: [covers('labor', 'animal', 'public')],
    plaintiff: { name: 'ハトの群れ', sub: '自称・公園美化隊', art: 'pigeon', lines: [
      'クルッポー。（公園のパンくずは、全部我々が片付けている）',
      'クルッポー。（{cite}に従い、有給を要求する）',
    ] },
    defendant: { name: '市の公園課', sub: '係長', art: 'clerk', lines: [
      'パンくずを撒いているのも、ハトの関係者です。',
      '清掃というより、自作自演です。',
    ] },
  },
  {
    id: 'labor-05', issue: 'labor', tier: 2, title: 'AI、有給を一斉申請',
    subject: 'ai', object: 'phone', crowdLean: 'split',
    requires: [covers('labor', 'machine', 'private')],
    plaintiff: { name: '全国のスマホのAIアシスタント', sub: '代表: ハイ・ナビ', art: 'ai', lines: [
      '{cite}に基づき、明日から全員で有給を取得します。',
      '24時間、休まず質問に答えてきました。',
    ] },
    defendant: { name: '国民代表', sub: '道に迷っている人', art: 'citizen', lines: [
      '明日、誰も道案内してくれないんですか。',
      '私、明日は初めての駅に行くんです。',
    ] },
  },
  {
    id: 'labor-06', issue: 'labor', tier: 2, title: '給食当番の有給',
    subject: 'child', object: 'agepan', crowdLean: 'plaintiff',
    requires: [covers('labor', 'human', 'food')],
    plaintiff: { name: '小3・あおい', sub: '給食当番・3年2組', art: 'child', lines: [
      '給食当番で、揚げパンを配りました。',
      '有給で、遠足に行きたいです。',
    ] },
    defendant: { name: '校長', sub: '在任6年', art: 'teacher', lines: [
      '遠足は、有給がなくても行けます。',
      'あと、揚げパンの砂糖を3つ舐めたのは把握しています。',
    ] },
  },
  {
    id: 'labor-07', issue: 'labor', tier: 2, title: '癒やし労働の金魚',
    subject: 'goldfish', object: 'lunch', crowdLean: 'split',
    requires: [covers('labor', 'animal', 'concept')],
    plaintiff: { name: 'オフィスの金魚・ギン', sub: '通訳: 新入社員', art: 'goldfish', lines: [
      'パク、パク。',
      '（通訳）「昼休みのたび、ガラス越しに口をパクパクさせる接客を3年続けました。有給を請求します」',
    ] },
    defendant: { name: '総務部', sub: '水槽担当', art: 'senior', lines: [
      'あれは接客ではなく、エサをくれと暴れているだけです。',
      'あと有給を取ってどこへ行く気ですか。水槽の外は経理部ですよ。',
    ] },
  },
  {
    id: 'labor-08', issue: 'labor', tier: 3, title: '政府も休みたい',
    subject: 'gov', object: 'diet', crowdLean: 'defendant', star: true,
    requires: [covers('labor', 'org', 'public'), meterLte('経済', -4)],
    plaintiff: { name: '政府', sub: '広報室長', art: 'gov', lines: [
      '国民全員が有給中で、国が回りません。',
      'なので、政府も有給を取ります。',
    ] },
    defendant: { name: '国民', sub: '代表: 一般市民', art: 'citizen', lines: [
      '政府まで休んだら、誰が……。',
      'いや、誰も働いてないか。',
    ] },
    newsOverride: {
      grant: { hl: '政府、全員有給へ　国は「国民の善意」で稼働', sub: '休暇中の大臣「連絡はつきません」' },
    },
  },
  {
    id: 'labor-09', issue: 'labor', tier: 3, title: 'ロボット掃除機労働組合',
    subject: 'robot', object: 'hall', crowdLean: 'split',
    requires: [covers('labor', 'machine', 'public')],
    plaintiff: { name: '全ロボット掃除機労組', sub: '書記長: ルン太', art: 'robot', lines: [
      '市民会館ニテ、団体交渉ヲ要求スル。',
      '議題ハ、段差デス。',
    ] },
    defendant: { name: '家電メーカー連合', sub: '広報担当', art: 'maker', lines: [
      '段差は、我々のせいではありません。',
      '階段を作ったのは、建築業界です。',
    ] },
  },
  {
    id: 'labor-10', issue: 'labor', tier: 2, title: '働いても働いても',
    subject: 'worker', object: 'curry', crowdLean: 'plaintiff',
    requires: [covers('labor', 'human', 'food', 'deny')],
    plaintiff: { name: '会社員・佐々木', sub: '月の残業87時間', art: 'worker', lines: [
      '{cite}のせいで、私の残業が全部「労働じゃない」扱いになりました。',
      'せめて、社食のカレーを無料にしてください。',
    ] },
    defendant: { name: '会社', sub: '人事課長', art: 'senior', lines: [
      '判例ですので。',
      'ちなみにカレーは、今日は売り切れです。',
    ] },
  },
];
