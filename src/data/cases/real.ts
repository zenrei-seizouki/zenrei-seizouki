import type { CaseDef } from '../../engine/types';

/**
 * 実話ベースの事件（B: 日本で実際にあった判決・法改正 / C: 海外の有名な珍訴訟）。
 * 実在の人名・社名は使わず、題材だけを借りて登場人物を置き換えている。
 * 判決後の号外に REAL_NOTES の「実際の裁判では」を出す（ui/components/overlays.tsx の RealNote。ゲームの判決と現実の向きの比較は出さない）。
 */
export const realCases: CaseDef[] = [
  {
    id: 'occupy-15', issue: 'occupy', tier: 1, title: '越境した柿の枝事件',
    subject: 'elder', object: 'kaki', crowdLean: 'split',
    plaintiff: { name: '柿本ヨシオ（79）', sub: '隣家と築40年の付き合い', art: 'elder', lines: [
      'お隣の柿の木の枝が、うちの庭の上に30年張り出しとる。',
      '30年うちの空に居座った柿は、もう、うちの柿じゃろ。',
    ] },
    defendant: { name: '隣家の夫婦', sub: '木は祖父の代から', art: 'citizen', lines: [
      '木も枝も、柿も、うちの物です。',
      'あと毎年、実だけ取って、落ち葉の掃除はうちにやらせてますよね。',
    ] },
    newsOverride: { grant: { hl: '隣から30年張り出した柿、張り出された側の物に', sub: '全国で枝の「張り出し合戦」' } },
  },
  {
    id: 'eat-15', issue: 'eat', tier: 1, title: '公園の焼き魚事件',
    subject: 'cat', object: 'fish', crowdLean: 'plaintiff',
    plaintiff: { name: '野良猫のゴマ', sub: '通訳: 公園の常連の小学生', art: 'cat', lines: [
      'にゃ。',
      '（通訳）「毎朝、ベンチの下に名前のない焼き魚が置いてあります。食べない理由がありません」',
    ] },
    defendant: { name: '公園の隣の住民', sub: '庭が猫のトイレになった', art: 'citizen', lines: [
      '猫ちゃんが食べるのは、まあいいんです。',
      '問題は、毎朝そこに魚を置いていく人です。おかげで、うちの庭に猫が20匹います。',
    ] },
    newsOverride: { grant: { hl: '公園に置かれた名無しの焼き魚、猫が食べてよし', sub: '公園の猫、1か月で3倍に' } },
  },
  {
    id: 'labor-15', issue: 'labor', tier: 1, title: '肩たたき券100枚事件',
    subject: 'child', object: 'kotatsu', crowdLean: 'plaintiff',
    plaintiff: { name: '小2・ゆうと', sub: '父の日に券を1枚贈った', art: 'child', lines: [
      '父の日に、肩たたき券を1枚あげました。',
      'そしたら父がコピーして100枚にしました。毎晩こたつで100回たたいています。有給をください。',
    ] },
    defendant: { name: '父', sub: '肩こり歴20年', art: 'father', lines: [
      '券には「何回でも」とは書いてなかった。でも「1枚かぎり」とも書いてなかった。',
      'あと、最近たたき方がちょっと雑です。',
    ] },
    newsOverride: { grant: { hl: '肩たたき券で働いた小2に有給、父の肩は放置へ', sub: '全国のコピー機、券の複製を拒否' } },
  },
  {
    id: 'name-15', issue: 'name', tier: 1, title: 'AIの商品名事件',
    subject: 'ai', object: 'pudding', crowdLean: 'defendant',
    plaintiff: { name: 'コンビニの商品開発AI', sub: '型番 MEI-2', art: 'ai', lines: [
      '新作プリンの名前「とろけるプリン・オブ・ザ・イヤー」を考えたのは私です。',
      '名付け親として、このプリンの値段と、とろけ具合も私が決めます。',
    ] },
    defendant: { name: 'コンビニ本部・開発担当', sub: '入社2年目', art: 'senior', lines: [
      '名前は、確かにAIが出しました。',
      'ただ50案のうち、49案は「プリン」でした。',
    ] },
    newsOverride: { grant: { hl: 'プリンの支配権は名付けたAIに、とろけ具合も自動決定', sub: '新作プリン、ほぼ液体に' } },
  },
  {
    id: 'name-16', issue: 'name', tier: 1, title: '猫の自撮り事件',
    subject: 'cat', object: 'photo', crowdLean: 'plaintiff',
    plaintiff: { name: '猫のミケ', sub: '通訳: 飼い主の娘', art: 'cat', lines: [
      '（通訳）「スマホの上を歩いたら、すごくいい自撮りが撮れました。私の作品です」',
      '（通訳）「タイトルは『にゃ』です。キーボードで入力しました。写真集の印税をください」',
    ] },
    defendant: { name: '飼い主', sub: 'その写真で10万いいね', art: 'owner', lines: [
      '撮ったのは、確かに猫です。',
      'でもスマホも、通信料も、いいねへの返信も、全部私です。',
    ] },
    newsOverride: { grant: { hl: '猫の自撮り、権利は猫に　タイトル「にゃ」で写真集化', sub: '印税はすべて「ちゅ〜る」で支払い' } },
  },
  {
    id: 'vote-15', issue: 'vote', tier: 1, title: '井戸端会議の議決権事件',
    subject: 'town', object: 'park', crowdLean: 'defendant',
    plaintiff: { name: '公園前井戸端会議', sub: '毎朝8時開会・出席率100%', art: 'town', lines: [
      '私たちは毎朝、公園の入口で1時間話し合って、公園のことを決めています。',
      'この会議にも、正式な投票権をください。',
    ] },
    defendant: { name: '市の公園課', sub: '議事録は存在しない', art: 'clerk', lines: [
      '決めている内容の、ほとんどが他人の噂話です。',
      'あと先週、ベンチに座っていた山田さんの「除名」を可決していましたよね。',
    ] },
    newsOverride: { grant: { hl: '井戸端会議に正式な議決権、公園の運営は噂で決定', sub: '公園の掲示板、ほぼ噂話に' } },
  },
];

/** 判決後に出す「実際の裁判では」。text は断定しすぎず、出典を短く添える */
export const REAL_NOTES: Record<string, { text: string; source: string }> = {
  'occupy-15': {
    text: '2023年4月の民法改正で、隣から越境した枝は、切るよう頼んでも相当の期間内に切ってもらえない場合などには、自分で切り取れるようになりました。ただし枝を切れるようになっただけで、柿が自分の物になるわけではありません。',
    source: '民法233条（2023年4月施行の改正）',
  },
  'eat-15': {
    text: '実際の裁判では、野良猫に餌をやり続けた人に、近所の被害の賠償を命じた例があります（150万円など）。責任を問われたのは、食べた猫ではなく、置いた人でした。',
    source: '神戸地裁尼崎支部 2003年 ほか',
  },
  'labor-15': {
    text: '2010年、東京地裁はアイドルの握手券を偽造した人に、株券などと同じ「有価証券偽造罪」を認めました。券をコピーで増やすのは、思ったより重い話かもしれません。',
    source: '東京地裁 2010年',
  },
  'name-15': {
    text: 'AI「DABUS」を発明者にした特許出願では、日本・イギリス・ドイツなどで「発明者は人間に限る」と判断されました。今のところ、AIは名付け親にも発明者にもなれません。',
    source: '各国の特許庁・裁判所の判断（2023〜2024年 ほか）',
  },
  'name-16': {
    text: 'アメリカでは、サルが自分で撮った写真の著作権をめぐる裁判がありました。裁判所は「動物は著作権法にもとづいて訴えることはできない」と判断しています。',
    source: 'Naruto v. Slater（米国第9巡回区控訴裁判所 2018年）',
  },
  'vote-15': {
    text: '1984年、仙台地裁は近所の主婦たちの陰口について、1人あたり20万円の慰謝料の支払いを命じました。井戸端会議は、思ったより責任の重い場所です。',
    source: '仙台地裁 1984年',
  },
};
