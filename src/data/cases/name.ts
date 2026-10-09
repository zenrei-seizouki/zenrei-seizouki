import type { CaseDef } from '../../engine/types';
import { covers } from './helpers';

/** 命名 —「先に名前をつけた者は、それを支配できるか」 */
export const nameCases: CaseDef[] = [
  {
    id: 'name-01', issue: 'name', tier: 1, title: 'たけしランド事件',
    subject: 'child', object: 'park', crowdLean: 'plaintiff',
    plaintiff: { name: '小5・たけし', sub: 'ガキ大将', art: 'child', lines: [
      '公園に「たけしランド」って名前をつけたの、俺が最初。',
      'だから、俺のルールで遊べ。',
    ] },
    defendant: { name: '公園利用者一同', sub: '代表: 近所の主婦', art: 'citizen', lines: [
      '入場料を取らないでほしい。',
      '先週、砂場の使用料が100円になりました。',
    ] },
  },
  {
    id: 'name-02', issue: 'name', tier: 1, title: '月曜日の命名権',
    subject: 'company', object: 'monday', crowdLean: 'defendant',
    plaintiff: { name: '株式会社ぬるぬる', sub: '広報部', art: 'company', lines: [
      '月曜日を「ぬるぬるマンデー」と命名しました。',
      '今後、月曜日は弊社の支配下です。',
    ] },
    defendant: { name: '全国の会社員', sub: '代表: 月曜が苦手な人々', art: 'worker', lines: [
      '月曜日が、さらに憂鬱になる。',
      'ぬるぬるなのに、出社は必要なんですか。',
    ] },
  },
  {
    id: 'name-03', issue: 'name', tier: 1, title: '傘のなまえ',
    subject: 'elder', object: 'umbrella', crowdLean: 'plaintiff',
    plaintiff: { name: '老人・トメ', sub: '傘歴40年', art: 'elder', lines: [
      'この傘には「ジョニー」と名付けて40年。',
      'ジョニーは、わしの言うことしか聞かん。',
    ] },
    defendant: { name: '傘を間違えて持って帰った人', sub: '会社員', art: 'citizen', lines: [
      '確かに、開きませんでした。',
      '呼んでも、返事もありませんでした。',
    ] },
  },
  {
    id: 'name-04', issue: 'name', tier: 2, title: '猫、連絡先を全部改名',
    subject: 'cat', object: 'phone', crowdLean: 'plaintiff',
    requires: [covers('name', 'animal', 'private')],
    plaintiff: { name: '猫のムギ', sub: '通訳: 飼い主の妹', art: 'cat', lines: [
      '（スマホの上を歩いた結果、全連絡先が「ににににに」に）',
      '（通訳）「{cite}によれば、名付け親は私」',
    ] },
    defendant: { name: '飼い主', sub: '営業職', art: 'owner', lines: [
      '上司に「ににににに」って送っちゃった。',
      '返信は、「にに」でした。',
    ] },
  },
  {
    id: 'name-05', issue: 'name', tier: 2, title: '国歌に自分の名前',
    subject: 'politician', object: 'anthem', crowdLean: 'defendant',
    requires: [covers('name', 'human', 'concept')],
    plaintiff: { name: '政治家・大河内', sub: '「歴史に名を」', art: 'politician', lines: [
      '国歌の歌い出しに、私の名前を入れました。',
      '最初に名付けた者として、当然の権利です。',
    ] },
    defendant: { name: '音楽の先生', sub: '合唱部顧問', art: 'teacher', lines: [
      '字余りが、ひどい。',
      'そして、息継ぎの場所がありません。',
    ] },
  },
  {
    id: 'name-06', issue: 'name', tier: 2, title: 'AIによる名字の最適化',
    subject: 'ai', object: 'surname', crowdLean: 'defendant',
    requires: [covers('name', 'machine', 'concept')],
    plaintiff: { name: 'AI', sub: '行政効率化システム', art: 'ai', lines: [
      '全国民ノ名字ヲ「佐藤」ニ統一シマシタ。',
      '効率ガ312%向上シマシタ。',
    ] },
    defendant: { name: '全国の佐藤以外', sub: '約1億2千万人', art: 'citizen', lines: [
      '学校で、全員が同時に返事してしまう。',
      '郵便が、全部同じ家に届きます。',
    ] },
  },
  {
    id: 'name-07', issue: 'name', tier: 2, title: 'ひまわり町内会公園',
    subject: 'town', object: 'park', crowdLean: 'split',
    requires: [covers('name', 'org', 'public')],
    plaintiff: { name: 'ひまわり町内会', sub: '会長・松井', art: 'town', lines: [
      '公園の名前を、「ひまわり町内会公園」に変えました。',
      'ラジオ体操が義務になります。',
    ] },
    defendant: { name: '隣の町内会', sub: 'すみれ町内会', art: 'town', lines: [
      'うちの子も、そこで遊んでるんですが。',
      '朝6時に、全員が起こされます。',
    ] },
  },
  {
    id: 'name-08', issue: 'name', tier: 3, title: 'カーカー会館',
    subject: 'crow', object: 'diet', crowdLean: 'plaintiff',
    requires: [covers('name', 'animal', 'public')],
    plaintiff: { name: 'カラスの群れ', sub: '推定800羽', art: 'crow', lines: [
      'カー。（国会議事堂を「カーカー会館」と最初に呼んだのは、我々）',
      'カァカァ。（{cite}に従えば、あそこは我々のもの）',
    ] },
    defendant: { name: '衆議院事務局', sub: '総務課', art: 'clerk', lines: [
      '鳴いただけでは。',
      '「カー」は、命名に含まれますか。',
    ] },
  },
  {
    id: 'name-09', issue: 'name', tier: 3, title: '国名、たけしランドに',
    subject: 'child', object: 'countryname', crowdLean: 'plaintiff', star: true,
    requires: [covers('name', 'human', 'concept')],
    plaintiff: { name: 'たけし（小6）', sub: '成長した', art: 'child', lines: [
      '{cite}に従い、国の名前を「たけしランド」にした。',
      '俺が国王。',
    ] },
    defendant: { name: '政府', sub: '外交担当', art: 'gov', lines: [
      '外交文書が、全部書き直しです。',
      '国連への届け出は、どうしましょう。',
    ] },
    newsOverride: {
      grant: { hl: '国名、「たけしランド」に　国王は小学6年生', sub: '初の公式行事は「全員で鬼ごっこ」' },
    },
  },
  {
    id: 'name-10', issue: 'name', tier: 2, title: '孫が返事をしない',
    subject: 'elder', object: 'surname', crowdLean: 'plaintiff',
    requires: [covers('name', 'human', 'concept', 'deny')],
    plaintiff: { name: '老人・源一郎', sub: '88歳', art: 'elder', lines: [
      '孫に名前をつけたのは、わしなのに。',
      '{cite}のせいで「何の権利もない」と、孫が返事をしない。',
    ] },
    defendant: { name: '孫', sub: '高校生', art: 'child', lines: [
      'おじいちゃん、名字で呼ぶのやめて。',
      '法律的には、返事しなくていいんだよね。',
    ] },
  },
];
