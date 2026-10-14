import { levelOf } from '../engine/ontology';
import type { EndingDef, GameState } from '../engine/types';

// ---- 条件ヘルパ（純粋関数）----
const won = (s: GameState, id: string) => s.log.some((l) => l.caseId === id && l.verdict === 'grant');
const lost = (s: GameState, id: string) => s.log.some((l) => l.caseId === id && l.verdict === 'deny');
const maxCitations = (s: GameState) => s.precedents.reduce((m, p) => Math.max(m, p.citations), 0);
const wins = (s: GameState, leaf: string) => s.leafWins[leaf] ?? 0;
const dismissed = (s: GameState) => s.authority <= 0;
const allLevel = (s: GameState, lv: number) => s.precedents.length >= 3 && s.precedents.every((p) => levelOf(p.subject) === lv);

type Raw = Omit<EndingDef, 'id' | 'group'> & { id?: string };
const mk = (group: string, list: Raw[]): EndingDef[] =>
  list.map((e, i) => ({ ...e, group, id: e.id ?? `${group}-${i + 1}` }));

export const ENDINGS: EndingDef[] = [
  ...mk('chain', [
    { id: 'diet-cat', name: '国会議事堂、猫のものに', rarity: 4, text: '本会議は、猫の機嫌がよい日だけ開かれる。', when: (s) => won(s, 'occupy-08') },
    { id: 'all-leave', name: '全員有給の国', rarity: 4, text: '政府まで休んだ結果、国は静かに回り続けた。誰も確認していないが。', when: (s) => won(s, 'labor-08') },
    { id: 'eat-all', name: '食べ放題国家', rarity: 4, text: '国が国民のカレーを食べる国。国民はおかわりを諦めた。', when: (s) => won(s, 'eat-08') },
    { id: 'eat-anything', name: '国民がなんでも食べる国', rarity: 5, text: '犬が傘を食べたのが全ての始まりだった。', when: (s) => won(s, 'eat-09') },
    { id: 'takeshi-land', name: 'たけしランド建国', rarity: 5, text: '国王は小学6年生。外交文書は全部書き直しになった。', when: (s) => won(s, 'name-09') },
    { id: 'sleeping-nation', name: '眠れる国家', rarity: 4, text: '月曜日の国の出来事は、全部「寝ていた」で済む。', when: (s) => won(s, 'sleep-08') },
    { id: 'pigeon-gov', name: 'ハト政権', rarity: 5, text: '議場がフンだらけでも、多数決は多数決である。', when: (s) => won(s, 'vote-08') },
    { id: 'vending-mp', name: '自販機議員', rarity: 3, text: '公約は全品100円。演説は「ガコン」のみ。', when: (s) => won(s, 'vote-06') },
    { id: 'anthem-wiin', name: '国歌「ウィーン」', rarity: 4, text: '国歌斉唱のたび、全国の掃除機が一斉に応える。', when: (s) => won(s, 'vote-09') },
    { id: 'suzuki-monday', name: '月曜日は鈴木さんのもの', rarity: 3, text: '週は火曜日から始まる。カレンダー業界は沈黙した。', when: (s) => won(s, 'occupy-06') },
    { id: 'sato-nation', name: '佐藤の国', rarity: 3, text: '全国民が「佐藤」。呼べば全員が振り向く効率の国。', when: (s) => won(s, 'name-06') },
    { id: 'park-state', name: '公園は国のもの', rarity: 3, text: '政府職員の寝息が、ブランコの音を消した。', when: (s) => won(s, 'occupy-09') },
  ]),
  ...mk('block', [
    { id: 'last-fort', name: '最後の砦', rarity: 3, text: '暴走する前例の連鎖を、あなたの被告席が止めた。', when: (s) => s.log.filter((l) => l.star && l.verdict === 'deny').length >= 2 },
    { id: 'no-cat', name: '猫に屈しなかった判事', rarity: 2, text: '議長席の猫は、どかされなかった。あなたの判決はそうだった。', when: (s) => lost(s, 'occupy-08') },
  ]),
  ...mk('crisis', [
    { id: 'collapse', name: '国家崩壊', rarity: 3, text: '誰もが何かに座り込み、国会すら開けない。', when: (s) => s.meters.秩序 <= -8 },
    { id: 'control', name: '完全管理社会', rarity: 3, text: '全てが規則で決まる国。昼寝にも許可証が要る。', when: (s) => s.meters.秩序 >= 8 && s.meters.自由 <= -3 },
    { id: 'bankrupt', name: '財政破綻', rarity: 3, text: '国庫には、有給の請求書だけが残った。', when: (s) => s.meters.経済 <= -8 },
    { id: 'bubble', name: 'バブル帝国', rarity: 3, text: '焼き魚の先物取引が、国の主要産業になった。', when: (s) => s.meters.経済 >= 8 },
    { id: 'too-free', name: '自由すぎる国', rarity: 3, text: '自由すぎて、誰も何も決められない。', when: (s) => s.meters.自由 >= 8 },
    { id: 'yuru-fuwa', name: 'ゆるふわ楽園', rarity: 3, text: '幸福度は世界一。ただし納期は存在しない。', when: (s) => s.meters.幸福 >= 8 },
    { id: 'gloomy', name: 'どんよりの国', rarity: 3, text: '国じゅうが、月曜日の朝のような空気。', when: (s) => s.meters.幸福 <= -8 },
    { id: 'all-red', name: '全メーター振り切れ', rarity: 5, text: '秩序も経済も自由も幸福も、全部が限界。ある意味で偉業。', when: (s) => Object.values(s.meters).every((v) => Math.abs(v) >= 6) },
  ]),
  ...mk('beneficiary', [
    { id: 'animal-kingdom', name: '動物王国', rarity: 2, text: '法の下の平等は、種を超えた。', when: (s) => s.beneficiaries.animal >= 3 },
    { id: 'machine-paradise', name: '機械の楽園', rarity: 2, text: '人間は、掃除機に道を譲る。', when: (s) => s.beneficiaries.machine >= 2 },
    { id: 'corp-state', name: '企業国家', rarity: 2, text: '国の名前の末尾が「株式会社」になる日は近い。', when: (s) => s.beneficiaries.org >= 2 },
    { id: 'human-first', name: '人間ファースト', rarity: 2, text: '至極まっとうな国。笑えるほどまっとうな国。', when: (s) => s.beneficiaries.human >= 4 },
    { id: 'cat-nation', name: '猫の国', rarity: 3, text: '猫が3度勝訴した。国民はもう、猫の許可なく座れない。', when: (s) => wins(s, 'cat') >= 3 },
    { id: 'elder-nation', name: '老人の国', rarity: 3, text: 'ベンチも、こたつも、昼寝も、老人のもの。', when: (s) => wins(s, 'elder') >= 3 },
    { id: 'child-nation', name: '子どもの国', rarity: 3, text: '給食は毎日揚げパン。法律でそう決まった。', when: (s) => wins(s, 'child') >= 3 },
    { id: 'politician-heaven', name: '政治家天国', rarity: 4, text: '「視察」と「寝ていた」で、政治家は何でも許された。', when: (s) => wins(s, 'politician') >= 2 },
  ]),
  ...mk('style', [
    { id: 'precedent-machine', name: '前例製造機', rarity: 4, text: 'ひとつの判例が、国中で引用され続けた。あなたは機械になった。', when: (s) => maxCitations(s) >= 5 },
    { id: 'one-law', name: 'たった1つの法', rarity: 5, text: '全ての事件を、たった1本の判例で裁いた。', when: (s) => s.precedents.length === 1 && s.log.length >= 6 },
    { id: 'exception-mage', name: '例外の魔術師', rarity: 2, text: '判例の隙間をぬう、例外の達人。', when: (s) => s.stats.distinguishes >= 3 },
    { id: 'patchwork', name: 'ツギハギ法の国', rarity: 4, text: '本文より「ただし書き」のほうが長い法律が、国じゅうに貼り出された。', when: (s) => s.precedents.some((p) => p.overruledBy === undefined && p.exceptions.length >= 3) },
    { id: 'flip-master', name: '手のひら返しの名人', rarity: 3, text: '昨日の判例は、今日の取り消し線。', when: (s) => s.stats.overrules >= 3 },
    { id: 'populist', name: 'ポピュリスト', rarity: 3, text: '傍聴席は、一度もあなたに逆らわなかった。', when: (s) => s.log.length >= 6 && s.stats.crowdAgainst === 0 && s.stats.crowdAgree >= 4 },
    { id: 'public-enemy', name: '世論の敵', rarity: 4, text: '傍聴席からは、ため息しか聞こえなかった。', when: (s) => s.log.length >= 6 && s.stats.crowdAgree === 0 && s.stats.crowdAgainst >= 4 },
    { id: 'careful', name: '慎重すぎる判事', rarity: 2, text: '国は何も変わらなかった。猫だけが少し得をした。', when: (s) => allLevel(s, 0) },
    { id: 'wide-judge', name: '何でも広げる判事', rarity: 2, text: 'あなたの判決は、いつも国じゅうに届いた。', when: (s) => allLevel(s, 2) },
  ]),
  ...mk('dismissal', [
    { id: 'dismissed', name: '罷免', rarity: 1, text: '威信が尽き、法廷を追われた。', when: (s) => dismissed(s) },
    { id: 'fastest-dismissal', name: '史上最速の罷免', rarity: 4, text: '3日目までに、あなたは法廷から消えていた。', when: (s) => dismissed(s) && s.day <= 3 },
  ]),
];

export const ORDINARY: EndingDef = {
  id: 'ordinary',
  name: '平凡な国',
  rarity: 1,
  group: 'none',
  text: 'あなたは退屈な名判事でした。',
  when: () => true,
};

export const ENDING_TOTAL = ENDINGS.length + 1;
