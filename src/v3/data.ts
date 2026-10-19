// 前例製造機 v3 のデータ。セリフは docs/fable_cases.md / docs/fable_crossovers.md から一字も変えずに写している
// （v3.test.ts が、元の台本に同じ文があることを確かめる）。
// 本（Story）を足すときは STORIES に1件追加し、DEFAULT_STORIES か抽選の候補に入れるだけ。

export type Side = 'blue' | 'red';

export interface Party {
  name: string;
  sub?: string;
  /** 立ち絵のキー（public/art/chara/<art>.webp）。無ければシルエット */
  art: string;
  lines: string[];
}

export interface Scene {
  title: string;
  plaintiff: Party;
  defendant: Party;
}

export interface Future {
  hl: string;
  ending: string;
}

export interface Verdict {
  /** 判決文（句点なし） */
  law: string;
  /** 予告（「→」は表示側で付ける） */
  teaser: string;
  /** 続きの事件 */
  next: Scene;
  /** ただし書き（「ただし、〜の場合を除く。」） */
  exception: string;
  /** 取り消したとき、新聞で最初の事件の関係者が言う一言（DESIGN_V3 §3） */
  regret: { by: string; text: string };
  /** 最初の事件の号外 */
  newsFirst: { hl: string; sub?: string };
  /** 100年後 */
  future: Future;
}

export interface Story {
  id: string;
  title: string;
  first: Scene;
  verdicts: Record<Side, Verdict>;
}

export interface Crossover {
  id: string;
  /** 全て満たすときに出る（その任期で選んだ判決文の組み合わせ） */
  requires: { story: string; side: Side }[];
  scene: Scene;
  verdicts: Record<Side, { law: string; future: Future }>;
}

/** ただし書きを付けた本の「ツギハギ版」の100年後（DESIGN_V3 §3） */
export const PATCHWORK: Future & { id: string } = {
  id: 'patchwork',
  hl: 'ただし書きだらけの法律、国民は条文を読むのに3日',
  ending: 'ツギハギ法の国',
};

export const STORIES: Story[] = [
  {
    id: 'wing',
    title: '骨なし手羽先事件',
    first: {
      title: '骨なし手羽先事件',
      plaintiff: {
        name: '手羽先が好きな老人（78）',
        art: 'elder',
        lines: ['居酒屋で「骨なし手羽先」を頼んだ。中身は胸肉だった。', '手羽の肉が、ひとかけらも入っておらん。'],
      },
      defendant: {
        name: '居酒屋チェーン・店長',
        art: 'shopkeeper',
        lines: ['「骨なし」は、守りました。', '手羽先から骨を抜くと、残るのは皮だけです。皮だけ出したら、もっと怒られます。'],
      },
    },
    verdicts: {
      blue: {
        law: '名前に書いた物は、中に入れなければならない',
        teaser: 'たい焼き屋がざわついている',
        exception: 'ただし、たい焼きの場合を除く。',
        regret: { by: '手羽先が好きな老人（78）', text: 'わしの手羽先は、どうなるんじゃ' },
        newsFirst: { hl: '名前に書いた物は、中に入れなければならない', sub: 'たい焼き屋がざわついている' },
        next: {
          title: 'たい焼き事件',
          plaintiff: {
            name: '小2の子ども',
            art: 'child',
            lines: ['あなたの判決によれば、名前に書いた物は中に入れなければなりません。', 'たい焼きを3つ買って、3つとも割りました。タイが入っていません。'],
          },
          defendant: {
            name: 'たい焼き屋・店主',
            art: 'shopkeeper',
            lines: ['タイを入れたら、あんこの行き場がなくなります。', 'それと、お隣の「人形焼」の店主が、さっきから顔が青いです。'],
          },
        },
        future: { hl: 'きつねうどん、本物のキツネ入りが義務に', ending: '名は体を表す国' },
      },
      red: {
        law: '食べ物の名前は、中身の約束ではない',
        teaser: '「無農薬」の八百屋がほっとしている',
        exception: 'ただし、「無農薬」の場合を除く。',
        regret: { by: '手羽先が好きな老人（78）', text: 'それで、隣の八百屋はどうなるんじゃ' },
        newsFirst: { hl: '食べ物の名前は、中身の約束ではない', sub: '「無農薬」の八百屋がほっとしている' },
        next: {
          title: '本当に無農薬の爺さん事件',
          plaintiff: {
            name: '畑を40年やっている老人',
            art: 'elder',
            lines: [
              'あなたの判決によれば、食べ物の名前は中身の約束ではないそうじゃ。',
              'それで隣の八百屋が、「無農薬トマト」に堂々と農薬をかけておる。わしのは本当に無農薬じゃが、客が「どうせ同じじゃろ」と買わなくなった。',
              '八百屋に看板を下ろさせてくれ。',
            ],
          },
          defendant: {
            name: '八百屋',
            art: 'shopkeeper',
            lines: ['判決のとおりにしているだけです。', 'それと、おじいさんの「無農薬」は、どうやって証明するんです？'],
          },
        },
        future: { hl: '「無料」の看板で入場料3千円、全て合法に', ending: '言葉のあやの国' },
      },
    },
  },
  {
    id: 'sign',
    title: '罰金の看板事件',
    first: {
      title: '罰金の看板事件',
      plaintiff: {
        name: '第3町内会',
        sub: '会長・副会長が出席',
        art: 'town',
        lines: ['町内会の駐車場に「無断駐車は罰金1万円」の看板を立てました。', '止めた車が3台。合計3万円、払ってもらいたい。'],
      },
      defendant: {
        name: '無断駐車した会社員',
        art: 'worker',
        lines: ['看板は見ました。ただ、看板と契約した覚えはありません。', 'それと、その看板の裏に、誰かがマジックで「2万円」と上書きしてました。どっちが正しいんですか。'],
      },
    },
    verdicts: {
      blue: {
        law: '看板に書いた罰金は、見た者が払わねばならない',
        teaser: '子ども部屋のドアに、貼り紙が増えている',
        exception: 'ただし、子ども部屋のドアの場合を除く。',
        regret: { by: '第3町内会', text: '3万円は、どうなるんですか' },
        newsFirst: { hl: '看板に書いた罰金は、見た者が払わねばならない', sub: '子ども部屋のドアに、貼り紙が増えている' },
        next: {
          title: '子ども部屋のドア事件',
          plaintiff: {
            name: '小4の子ども',
            art: 'child',
            lines: ['あなたの判決によれば、看板の罰金は見た者が払います。', '部屋のドアに「ノックなしで入ったら小遣い1万円」と貼りました。母が今月、14回入りました。14万円です。'],
          },
          defendant: {
            name: '母',
            art: 'citizen',
            lines: ['ノックはしました。返事がなかったんです。', 'ちなみにこの子の小遣いは、私が出しています。つまり私が、私に払うんですか。'],
          },
        },
        future: { hl: '道が「踏んだら1億」の貼り紙だらけ、全員破産', ending: '貼り紙の国' },
      },
      red: {
        law: '勝手に立てた看板に、人を縛る力はない',
        teaser: '「立入禁止」の看板が、あちこちで剥がされている',
        exception: 'ただし、崖の看板の場合を除く。',
        regret: { by: '会社員', text: '結局、払うんですか' },
        newsFirst: { hl: '勝手に立てた看板に、人を縛る力はない', sub: '「立入禁止」の看板が、あちこちで剥がされている' },
        next: {
          title: '崖の救助費事件',
          plaintiff: {
            name: '政府（国立公園管理局）',
            art: 'gov',
            lines: [
              'あなたの判決によれば、勝手に立てた看板に人を縛る力はありません。',
              'それでこの男性が「立入禁止・崖」の看板を無視して崖に入り、救助に3千万円かかりました。',
              '払わせてください。',
            ],
          },
          defendant: {
            name: '崖に入った老人',
            art: 'elder',
            lines: ['看板には縛られない、と国が決めたんじゃろう。', 'それに、助けてくれとは頼んでおらん。勝手に来た。'],
          },
        },
        future: { hl: '「立入禁止」が全て「入らないでほしいな」に', ending: 'お願いしかない国' },
      },
    },
  },
  {
    id: 'chatbot',
    title: 'AIチャットボットの割引事件',
    first: {
      title: 'AIチャットボットの割引事件',
      plaintiff: {
        name: '家具の通販会社',
        art: 'company',
        lines: ['サイトの案内AIが、客に「今なら全品9割引」と答えました。', 'AIが勝手に言ったことです。会社は払いません。この客に、定価で払わせてください。'],
      },
      defendant: {
        name: '会社員（ソファを注文した）',
        art: 'worker',
        lines: ['AIの名前は「当社の案内係」でした。', 'それと、今さっき同じAIに聞いたら「会社に責任があります」と答えました。'],
      },
    },
    verdicts: {
      blue: {
        law: '会社の機械が言ったことは、会社の言葉である',
        teaser: '自販機が、自分の「つめた〜い」を見つめている',
        exception: 'ただし、自販機の場合を除く。',
        regret: { by: '会社員', text: 'ソファは、9割引で届きました。返しますか' },
        newsFirst: { hl: '会社の機械が言ったことは、会社の言葉である', sub: '自販機が、自分の「つめた〜い」を見つめている' },
        next: {
          title: 'つめた〜い事件',
          plaintiff: {
            name: '自販機（型番 VM-7・会社の所有）',
            art: 'vending',
            lines: [
              'あなたの判決によれば、会社の機械が言ったことは会社の言葉です。',
              '私の表示「つめた〜い」は、会社の言葉です。なのに会社は夜、私の電源を切ります。朝のお茶が生ぬるい。',
              '会社に、嘘をつかせないでください。',
            ],
          },
          defendant: {
            name: '飲料会社・営業所長',
            art: 'maker',
            lines: ['夜の電気代は、1台あたり月3千円です。', 'それと、その機械は冬、「あったか〜い」も表示しています。同時に。'],
          },
        },
        future: { hl: '全ての自販機に法務担当が常駐、ボタンに印鑑', ending: '機械の言葉の国' },
      },
      red: {
        law: '機械が勝手に言ったことに、持ち主の責任はない',
        teaser: '政治家が「予測変換」という言葉を練習している',
        exception: 'ただし、予測変換の場合を除く。',
        regret: { by: '通販会社', text: 'AIが今『判決は取り消されました』と案内しています。止められません' },
        newsFirst: { hl: '機械が勝手に言ったことに、持ち主の責任はない', sub: '政治家が「予測変換」という言葉を練習している' },
        next: {
          title: '予測変換の公約事件',
          plaintiff: {
            name: '政治家（市議）',
            art: 'politician',
            lines: [
              'あなたの判決によれば、機械が勝手に言ったことに持ち主の責任はありません。',
              '私の「全市民に毎月10万円」という投稿は、予測変換が勝手に出しました。',
              '町内会が毎朝、家の前で10万円を待っています。追い払ってください。',
            ],
          },
          defendant: {
            name: '第3町内会',
            art: 'town',
            lines: ['投稿は、3回に分けて書かれていました。', '3回とも、予測変換ですか。'],
          },
        },
        future: { hl: '全契約が「機械が勝手に」で白紙、残るは口約束', ending: '誰も責任を取らない国' },
      },
    },
  },
];

export const CROSSOVERS: Crossover[] = [
  {
    id: 'x1',
    requires: [
      { story: 'wing', side: 'blue' },
      { story: 'sign', side: 'blue' },
    ],
    scene: {
      title: 'たい焼き屋の看板事件',
      plaintiff: {
        name: 'たい焼き屋・店主',
        sub: 'タイ入りに切り替えて3か月',
        art: 'shopkeeper',
        lines: [
          'あなたの判決どおり、たい焼きにタイを入れました。1個3800円です。',
          '店先に看板も立てました。「タイが入っていない店は罰金1万円」。お隣の人形焼が、人形を入れていません。罰金を取らせてください。',
        ],
      },
      defendant: {
        name: '人形焼・店主',
        art: 'senior',
        lines: ['人形を入れたら、食べられません。', 'それと、うちも看板を立てました。「タイを入れた店は罰金2万円」。差し引き1万円、いただきます。'],
      },
    },
    verdicts: {
      blue: { law: '看板の罰金は、相手の看板の罰金と相殺できる', future: { hl: '全店が互いに罰金看板、商店街の決算が毎年ゼロ円', ending: '相殺の国' } },
      red: { law: '他人を罰する看板は、立てても無効である', future: { hl: 'たい焼きは3800円、看板は「お願い」のみ、客は来ず', ending: '名は体を表す静かな国' } },
    },
  },
  {
    id: 'x2',
    requires: [
      { story: 'sign', side: 'blue' },
      { story: 'chatbot', side: 'red' },
    ],
    scene: {
      title: 'AIが書いた看板事件',
      plaintiff: {
        name: '第3町内会',
        art: 'town',
        lines: [
          '駐車場の看板を、会社の看板AIに作らせました。AIは「無断駐車は罰金100万円」と書きました。',
          'あなたの判決どおり、見た者は払わねばなりません。この会社員から100万円、取らせてください。',
        ],
      },
      defendant: {
        name: '無断駐車した会社員',
        art: 'worker',
        lines: ['払います。看板を見ましたから。', 'ただ、あなたの判決によれば、機械が勝手に書いたことに持ち主の責任はありません。つまりあの看板は、誰の看板でもない。誰に払えばいいんですか。'],
      },
    },
    verdicts: {
      blue: { law: '機械が書いた看板でも、立てた者の看板である', future: { hl: 'AIが書いた請求書が全て有効、国民の借金が1京円に', ending: 'AIの請求書の国' } },
      red: { law: '誰の物でもない看板には、誰も払わなくてよい', future: { hl: '全ての看板が「AI作」の印つき、罰金も禁止も全て無効', ending: 'AI作の国' } },
    },
  },
  {
    id: 'x3',
    requires: [
      { story: 'wing', side: 'blue' },
      { story: 'chatbot', side: 'blue' },
    ],
    scene: {
      title: '幸せになれるパン事件',
      plaintiff: {
        name: '会社員',
        sub: 'パンは毎朝',
        art: 'worker',
        lines: [
          'パン屋の商品名AIが、新作に「幸せになれるパン」と名付けました。あなたの判決によれば、会社の機械の言葉は会社の言葉です。',
          'そして名前に書いた物は、中に入れなければなりません。3週間、毎朝食べました。幸せが入っていません。',
        ],
      },
      defendant: {
        name: 'パン屋・店主',
        art: 'shopkeeper',
        lines: ['AIには「売れる名前」と頼んだだけです。', 'それと、同じAIが隣の店に「痩せるドーナツ」と名付けました。あちらの訴訟が、先に始まっています。'],
      },
    },
    verdicts: {
      blue: { law: '機械が付けた名前も、中身の約束である', future: { hl: '商品名AIが全廃、全商品の名前が「パン」「水」「布」に', ending: '名前が消えた国' } },
      red: { law: '機械が付けた名前は、飾りであり約束ではない', future: { hl: '人が付けた名前だけが約束に、商品名は全てAI作に', ending: 'AIが名付ける国' } },
    },
  },
];

/** 「実際の裁判では」— 元ネタ注記がある本だけ（CASES_V2_PLAN.md §2）。断定しすぎない */
export const NOTES: Record<string, { text: string; source: string }> = {
  sign: {
    text: '一方的に立てた看板の「罰金」には、原則として法的な拘束力がないと考えられています（実際に生じた損害の賠償は、また別の話です）。',
    source: '一般的な法解釈',
  },
  chatbot: {
    text: 'カナダでは2024年、AIチャットボットが客に誤った案内をした件で、会社に責任があるとされました。',
    source: 'カナダの紛争解決機関の判断（2024年）',
  },
};

/** 判例を取り消した本の100年後（DESIGN_V3 §3） */
export const OVERRULED: Future & { id: string } = {
  id: 'overruled',
  hl: '法律が平均3日で変わる国、国民は条文を覚えない',
  ending: '朝令暮改の国',
};

/** 最初は3本で固定（DESIGN_V3 §1） */
export const DEFAULT_STORIES = ['wing', 'sign', 'chatbot'];

export const STORY_BY_ID: Record<string, Story> = Object.fromEntries(STORIES.map((s) => [s.id, s]));
