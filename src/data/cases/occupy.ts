import type { CaseDef } from '../../engine/types';
import { anyPrecedent, covers } from './helpers';

/** 占有 —「長く居座った者は、それを所有できるか」 */
export const occupyCases: CaseDef[] = [
  {
    id: 'occupy-01', issue: 'occupy', tier: 1, title: 'キーボード占拠事件',
    subject: 'cat', object: 'keyboard', crowdLean: 'plaintiff',
    plaintiff: { name: '猫のタマ', sub: '通訳: 近所の小学生', art: 'cat', lines: [
      'にゃ。',
      '（通訳）「3時間前から、ここが私の寝床です。温かいので」',
    ] },
    defendant: { name: '飼い主・佐藤', sub: 'プログラマー', art: 'owner', lines: [
      '納期が今日なんです。',
      'あと「jjjjjjjjjjjjj」って入力されたコードが、もう本番に出ました。',
    ] },
  },
  {
    id: 'occupy-02', issue: 'occupy', tier: 1, title: 'ベンチ20年事件',
    subject: 'elder', object: 'bench', crowdLean: 'split', requires: [anyPrecedent('occupy')],
    plaintiff: { name: '山田ゲン（82）', sub: '元・郵便局員', art: 'elder', lines: [
      '20年座り続けて、もうベンチの木目がわしのお尻の形にへこんどる。',
      '{cite}によれば、ここまで馴染んだらわしのもんじゃろ。',
    ] },
    defendant: { name: '市の公園課', sub: '担当: 新人の木下', art: 'clerk', lines: [
      '塗装が剥げたのを「馴染んだ」と言わないでください。',
      'あとベンチの裏に、勝手に「山田」と表札を貼るのをやめてください。',
    ] },
  },
  {
    id: 'occupy-03', issue: 'occupy', tier: 1, title: 'こたつ籠城事件',
    subject: 'child', object: 'kotatsu', crowdLean: 'plaintiff',
    plaintiff: { name: '小4・けんた', sub: '冬休み12日目', art: 'child', lines: [
      '冬休みに入ってから、一度も出てない。トイレ以外。',
      'もう、ぼくの体の一部です。',
    ] },
    defendant: { name: '父', sub: '会社員・43歳', art: 'father', lines: [
      'こたつは父のボーナスで買った。',
      'そして、父の足が入らない。',
    ] },
  },
  {
    id: 'occupy-04', issue: 'occupy', tier: 2, title: '駅の傘37本事件',
    subject: 'crow', object: 'umbrella', crowdLean: 'defendant',
    requires: [covers('occupy', 'animal', 'private')],
    plaintiff: { name: 'カラスのクロウ', sub: '巣の建設主', art: 'crow', lines: [
      'カァ。（巣にして、もう半年）',
      'カァ、カァ。（{cite}があるはず。猫に認めて、カラスに認めない理由がない）',
    ] },
    defendant: { name: '駅の忘れ物センター', sub: '係員', art: 'clerk', lines: [
      '傘は37本。うち半分は、持ち主が毎日取り返しに来ます。',
      'そして、つつかれて帰っていきます。',
    ] },
  },
  {
    id: 'occupy-05', issue: 'occupy', tier: 2, title: '市民会館座り込み事件',
    subject: 'town', object: 'hall', crowdLean: 'split',
    requires: [covers('occupy', 'org', 'public')],
    plaintiff: { name: 'ひまわり町内会', sub: '会長・松井', art: 'town', lines: [
      '{cite}に従い、市民会館に2か月座り込みました。',
      '所有権をください。あと、盆踊りを毎日やります。',
    ] },
    defendant: { name: '市長', sub: '来月の成人式を控えている', art: 'mayor', lines: [
      '成人式が開けません。',
      'しかも、毎晩やぐらが立っています。',
    ] },
  },
  {
    id: 'occupy-06', issue: 'occupy', tier: 2, title: '月曜日占拠事件',
    subject: 'worker', object: 'monday', crowdLean: 'plaintiff',
    requires: [covers('occupy', 'human', 'concept')],
    plaintiff: { name: '会社員・鈴木', sub: '有給消化率100%', art: 'worker', lines: [
      '3年間、月曜日はずっと有給で占拠してきました。',
      '月曜日は、私のものです。',
    ] },
    defendant: { name: '勤務先の人事部', sub: '部長', art: 'senior', lines: [
      '鈴木さんが月曜日を持っていくと、うちの週が火曜日から始まります。',
      'みんな鈴木さんをうらやましがっています。',
    ] },
  },
  {
    id: 'occupy-07', issue: 'occupy', tier: 2, title: 'こたつ下の巡回者',
    subject: 'robot', object: 'kotatsu', crowdLean: 'split',
    requires: [covers('occupy', 'machine', 'private')],
    plaintiff: { name: 'ロボット掃除機', sub: '型番不明・稼働2年', art: 'robot', lines: [
      'ピピッ。当機ハ2年間、コノこたつノ下ヲ巡回シテイマス。',
      '{cite}ニ基ヅキ、占有ヲ主張シマス。',
    ] },
    defendant: { name: '家族一同', sub: '4人（猫1匹含む）', art: 'father', lines: [
      'こたつの下に引っかかって、動けなくなってただけです。',
      'ピピッて鳴くたびに猫が逃げます。',
    ] },
  },
  {
    id: 'occupy-08', issue: 'occupy', tier: 3, title: '国会議事堂、猫に占拠される',
    subject: 'cat', object: 'diet', crowdLean: 'plaintiff', star: true,
    requires: [covers('occupy', 'animal', 'public')],
    plaintiff: { name: '野良猫連合 代表ミケ', sub: '推定組員 312匹', art: 'cat', lines: [
      'にゃーん。（本会議場の日当たりが最高）',
      'にゃ。（{cite}を、国会にも適用してほしい）',
    ] },
    defendant: { name: '衆議院事務局', sub: '総務課長', art: 'clerk', lines: [
      '議長席で寝ているので、開会できません。',
      'かわいいので、誰もどかせません。',
    ] },
    newsOverride: {
      grant: { hl: '国会議事堂、猫のものに　開会は「猫の機嫌しだい」', sub: '議長席は日当たり最優先で割り当て' },
    },
  },
  {
    id: 'occupy-09', issue: 'occupy', tier: 3, title: '政府、公園を占拠し返す',
    subject: 'gov', object: 'park', crowdLean: 'defendant',
    requires: [covers('occupy', 'org', 'public')],
    plaintiff: { name: '政府', sub: '公園対策室', art: 'gov', lines: [
      '{cite}を活用し、全国の公園に職員を24時間座らせました。',
      '公園は、国のものです。',
    ] },
    defendant: { name: '公園で遊びたい子どもたち', sub: '代表: 小3', art: 'child', lines: [
      '職員さんが、砂場で寝てる。',
      'ブランコも、書類を広げる場所になってる。',
    ] },
  },
  {
    id: 'occupy-10', issue: 'occupy', tier: 2, title: '30年使ったこたつ事件',
    subject: 'elder', object: 'kotatsu', crowdLean: 'plaintiff',
    requires: [covers('occupy', 'human', 'private', 'deny')],
    plaintiff: { name: '老人・梅さん（90）', sub: 'こたつ歴30年', art: 'elder', lines: [
      '30年使ったこたつを、孫が「所有権は生じないから」と持っていった。',
      'わしはどこで冬を越せばいいんじゃ。',
    ] },
    defendant: { name: '孫', sub: '大学生', art: 'child', lines: [
      '{cite}に書いてある。',
      '「いかに長く占拠しても、所有権は生じない」って。',
    ] },
  },
];
