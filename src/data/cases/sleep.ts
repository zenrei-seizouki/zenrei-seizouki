import type { CaseDef } from '../../engine/types';
import { covers } from './helpers';

/** 居眠り —「寝ていた間のことに、責任はあるか」 */
export const sleepCases: CaseDef[] = [
  {
    id: 'sleep-01', issue: 'sleep', tier: 1, title: '昼休み寝過ごし事件',
    subject: 'worker', object: 'lunch', crowdLean: 'plaintiff',
    plaintiff: { name: '会社員・中村', sub: '入社6年目', art: 'worker', lines: [
      '昼休みに寝てたら、役員会議が終わってました。',
      '寝ていたので、無罪です。',
    ] },
    defendant: { name: '会社', sub: '総務部長', art: 'senior', lines: [
      '議題は、あなたの昇進でした。',
      '代わりに、隣の席の方が昇進しました。',
    ] },
  },
  {
    id: 'sleep-02', issue: 'sleep', tier: 1, title: '寝言の揚げパン',
    subject: 'child', object: 'agepan', crowdLean: 'plaintiff',
    plaintiff: { name: '小1・そうた', sub: '給食前の4時間目', art: 'child', lines: [
      '寝言で「揚げパン全部ぼくの」って言ったら、給食当番が本当にくれた。',
      'ぼくは寝てたので、悪くない。',
    ] },
    defendant: { name: '給食当番', sub: '小5', art: 'child', lines: [
      '寝言でも、命令口調だったので。',
      'あと、すごくはっきり言っていました。',
    ] },
  },
  {
    id: 'sleep-03', issue: 'sleep', tier: 1, title: '寝返り課金事件',
    subject: 'cat', object: 'phone', crowdLean: 'plaintiff',
    plaintiff: { name: '猫のモチ', sub: '睡眠中', art: 'cat', lines: [
      '（寝返り1回で、ゲームに10万円課金）',
      'にゃ……。（寝ていたので、覚えていない）',
    ] },
    defendant: { name: 'クレジットカード会社', sub: '不正検知課', art: 'senior', lines: [
      '肉球の指紋で、認証されています。',
      '寝息の波形も、本人のものと一致しました。',
    ] },
  },
  {
    id: 'sleep-04', issue: 'sleep', tier: 2, title: '寝ていたら法案が通った',
    subject: 'politician', object: 'diet', crowdLean: 'defendant',
    requires: [covers('sleep', 'human', 'public')],
    plaintiff: { name: '政治家・大河内', sub: '本会議で熟睡', art: 'politician', lines: [
      '{cite}のとおり、寝ていた私に責任はない。',
      '法案の中身は、知らない。',
    ] },
    defendant: { name: '国民', sub: '代表: 納税者', art: 'citizen', lines: [
      'あなたが提出した法案です。',
      '採決のときだけ、元気に手を挙げていました。',
    ] },
  },
  {
    id: 'sleep-05', issue: 'sleep', tier: 2, title: 'こたつで寝た犬',
    subject: 'dog', object: 'kotatsu', crowdLean: 'plaintiff',
    requires: [covers('sleep', 'animal', 'private')],
    plaintiff: { name: '犬のハチ', sub: 'こたつ3日目', art: 'dog', lines: [
      'わふ。（こたつで3日寝ていた。電気代3万円）',
      'わん。（寝ていたので、責任は取れない）',
    ] },
    defendant: { name: '飼い主', sub: '電気代の支払者', art: 'father', lines: [
      '起きてる時間のほうが、短い。',
      'こたつの中から、いびきが聞こえます。',
    ] },
  },
  {
    id: 'sleep-06', issue: 'sleep', tier: 2, title: 'スリープモード中の吸引',
    subject: 'robot', object: 'phone', crowdLean: 'split',
    requires: [covers('sleep', 'machine', 'private')],
    plaintiff: { name: 'ロボット掃除機', sub: 'スリープ明け', art: 'robot', lines: [
      'スリープ中ニ、スマホヲ吸イ込ミマシタ。',
      '記憶ニゴザイマセン。',
    ] },
    defendant: { name: 'スマホの持ち主', sub: '充電中だった', art: 'citizen', lines: [
      '中から、着信音が聞こえる。',
      '母から、38件。',
    ] },
  },
  {
    id: 'sleep-07', issue: 'sleep', tier: 2, title: '寝たふりの老人',
    subject: 'elder', object: 'bench', crowdLean: 'defendant',
    requires: [covers('sleep', 'human', 'public')],
    plaintiff: { name: '山田ゲン（82）', sub: 'ベンチの常連', art: 'elder', lines: [
      'ベンチで寝ていたので、席を譲らなかった責任はない。',
      '寝ていた。わしは寝ていた。',
    ] },
    defendant: { name: '妊婦さん', sub: '臨月', art: 'citizen', lines: [
      '目は、開いてました。',
      '「おっ」って顔もしてました。',
    ] },
  },
  {
    id: 'sleep-08', issue: 'sleep', tier: 3, title: '眠れる政府',
    subject: 'gov', object: 'monday', crowdLean: 'defendant', star: true,
    requires: [covers('sleep', 'org', 'concept')],
    plaintiff: { name: '政府', sub: '寝ぼけ気味', art: 'gov', lines: [
      '国として、月曜日はずっと寝ていた。',
      '月曜日に起きたことは、国の責任ではない。',
    ] },
    defendant: { name: '国民', sub: '代表: 月曜日の被害者', art: 'citizen', lines: [
      '月曜日に、増税されました。',
      '月曜日に、橋も落ちました。',
    ] },
    newsOverride: {
      grant: { hl: '政府、「月曜日は寝ていた」で責任なし　国民は火曜日から訴え', sub: '官邸の月曜日の会議は、全員欠席と記録' },
    },
  },
  {
    id: 'sleep-09', issue: 'sleep', tier: 3, title: '真夜中の大放出',
    subject: 'vending', object: 'park', crowdLean: 'plaintiff',
    requires: [covers('sleep', 'machine', 'public')],
    plaintiff: { name: '公園の自販機', sub: '深夜2時', art: 'vending', lines: [
      'ガコガコガコ。（夜中は「寝ていた」ので、全商品を無料で出した責任はない）',
      'ガコン。（{cite}を、機械にも適用してほしい）',
    ] },
    defendant: { name: '飲料メーカー', sub: '営業所長', art: 'maker', lines: [
      '近所の大学生が、毎晩並んでいます。',
      '先週は、折りたたみ椅子の持参者もいました。',
    ] },
  },
  {
    id: 'sleep-10', issue: 'sleep', tier: 2, title: '寝言で家を買った',
    subject: 'worker', object: 'phone', crowdLean: 'plaintiff',
    requires: [covers('sleep', 'human', 'private', 'deny')],
    plaintiff: { name: '会社員・小林', sub: '35年ローン', art: 'worker', lines: [
      '寝言にスマホのAIが反応して、家を買いました。',
      '{cite}のせいで、寝てても私の責任らしいです。',
    ] },
    defendant: { name: '不動産会社', sub: '営業担当', art: 'senior', lines: [
      '良い物件ですよ。',
      '日当たりも、寝室の寝心地も、保証します。',
    ] },
  },
];
