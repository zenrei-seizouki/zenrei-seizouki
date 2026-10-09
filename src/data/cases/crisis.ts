import type { CaseDef } from '../../engine/types';
import { meterGte, meterLte } from './helpers';

/** 危機事件: メーターが限界(±8)に達した翌日に強制出現（各1回） */
export const crisisCases: CaseDef[] = [
  {
    id: 'crisis-order-low', issue: 'occupy', tier: 3, crisis: true, title: '無法の日',
    subject: 'elder', object: 'diet', crowdLean: 'split',
    requires: [meterLte('秩序', -8)],
    plaintiff: { name: '山田ゲン（82）', sub: '秩序が崩れた国で', art: 'elder', lines: [
      '国会議事堂に、座ってみた。',
      '誰も止めないので、もらってもいいかの。',
    ] },
    defendant: { name: '（被告席は空席）', sub: '誰も来なかった', art: 'citizen', lines: [
      '…………。',
      '（被告席は、空いたまま審理が進む）',
    ] },
    newsOverride: {
      grant: { hl: '無法の日　老人、国会議事堂を取得　誰も止めず', sub: '警備員は昼休み中だった' },
      deny: { hl: '無法の日　それでも国会は老人のものにならず', sub: '警備員は昼休み中だった' },
    },
  },
  {
    id: 'crisis-order-high', issue: 'sleep', tier: 3, crisis: true, title: '昼寝禁止令',
    subject: 'child', object: 'lunch', crowdLean: 'plaintiff',
    requires: [meterGte('秩序', 8)],
    plaintiff: { name: '保育園児代表', sub: '年長組・全員', art: 'child', lines: [
      'お昼寝しても、怒られない国にしてください。',
      '寝ないと、午後がもたない。',
    ] },
    defendant: { name: '国家秩序委員会', sub: '昼寝取締部', art: 'senior', lines: [
      '寝ている間に、何が起きるか分からない。',
      '寝ている間に、何も起きないのが一番怖い。',
    ] },
  },
  {
    id: 'crisis-econ-low', issue: 'labor', tier: 3, crisis: true, title: '国庫が空っぽ',
    subject: 'ai', object: 'diet', crowdLean: 'split',
    requires: [meterLte('経済', -8)],
    plaintiff: { name: '国家財務AI', sub: '24時間稼働', art: 'ai', lines: [
      '人間ガ全員休ンデイルノデ、私ガ働キマス。',
      'ソノ代ワリ、有給ヲクダサイ。',
    ] },
    defendant: { name: '財務省（無人）', sub: '留守番電話', art: 'clerk', lines: [
      '（留守番電話）ただいま、職員が全員、有給中です。',
      '（ピーという発信音のあとに、ご用件を）',
    ] },
  },
  {
    id: 'crisis-econ-high', issue: 'eat', tier: 3, crisis: true, title: '買い占め帝国',
    subject: 'company', object: 'fish', crowdLean: 'defendant',
    requires: [meterGte('経済', 8)],
    plaintiff: { name: '株式会社ぬるぬる', sub: '好景気の覇者', art: 'company', lines: [
      '全国の焼き魚を、買い占めて、名前シールを剥がしました。',
      '名無しになったので、食べます。',
    ] },
    defendant: { name: '全国の猫', sub: '連合会', art: 'cat', lines: [
      'にゃー！',
      'にゃにゃにゃー！（返せ！）',
    ] },
  },
  {
    id: 'crisis-free-high', issue: 'vote', tier: 3, crisis: true, title: '国名変更提案',
    subject: 'goldfish', object: 'countryname', crowdLean: 'split',
    requires: [meterGte('自由', 8)],
    plaintiff: { name: '金魚・ギン', sub: '自由すぎる国で', art: 'goldfish', lines: [
      '（ぱくぱく）',
      '（通訳）「国名を『ぱくぱく』にしたい」',
    ] },
    defendant: { name: '外務省', sub: '旅券課', art: 'clerk', lines: [
      'パスポートの印刷が……。',
      '先月、改名したばかりなのですが。',
    ] },
  },
  {
    id: 'crisis-joy-low', issue: 'name', tier: 3, crisis: true, title: '日曜日2',
    subject: 'child', object: 'monday', crowdLean: 'plaintiff',
    requires: [meterLte('幸福', -8)],
    plaintiff: { name: '小3・あおい', sub: 'みんな不幸な国で', art: 'child', lines: [
      'みんなが不幸なので、月曜日を「日曜日2」って名前にした。',
      '日曜日が2回あれば、少し幸せになる。',
    ] },
    defendant: { name: 'カレンダー業界', sub: '業界団体', art: 'maker', lines: [
      '刷り直しになります。（2回目）',
      '前回の刷り直しの在庫が、まだ倉庫に。',
    ] },
  },
];
