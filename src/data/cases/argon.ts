import type { CaseDef } from '../../engine/types';
import { covers } from './helpers';

/**
 * 二人目の作家（Argon）による追加事件 24本。
 * 各争点 4本 = 身近な事件 2本（T1・条件なし）＋ 判例を広げすぎた国でだけ起きる事件 2本（T2/T3）。
 * 号外の見出しは Argon 案、小見出しは追記。
 */
export const argonCases: CaseDef[] = [
  // ───────── 占有 ─────────
  {
    id: 'occupy-11', issue: 'occupy', tier: 1, title: 'スマホ画面居座り事件',
    subject: 'child', object: 'phone', crowdLean: 'defendant',
    plaintiff: { name: '田中家の長男・翔太（7）', sub: '動画視聴4時間目', art: 'child', lines: [
      '動画を見始めてから、もう4時間ずっと僕が握っています。',
      'これだけ長く持っていたら、もう僕のスマホのはずです。',
    ] },
    defendant: { name: '母・田中美咲', sub: '夕飯の支度中だった', art: 'citizen', lines: [
      '私のスマホです。夕飯を作るあいだ「5分だけ」と貸しました。',
      'あと勝手に仕事のアプリを12個消して、容量を空けないでください。',
    ] },
    newsOverride: { grant: { hl: '親のスマホ、4時間握れば子どもの所有物に', sub: '全国の母親、スマホに鎖を付け始める' } },
  },
  {
    id: 'occupy-12', issue: 'occupy', tier: 1, title: '公園の東屋占拠事件',
    subject: 'pigeon', object: 'park', crowdLean: 'split',
    plaintiff: { name: 'ハト代表・ポッポ', sub: '通訳: 鳥類学者', art: 'pigeon', lines: [
      'クルックー。',
      '（通訳）「東屋の屋根に3世代住んでいます。そろそろ私たちの名義で登記したいです」',
    ] },
    defendant: { name: '市の公園管理課', sub: '係長', art: 'clerk', lines: [
      '公園の屋根は住居ではありません。',
      'あと下を通る市民に、家賃を取り立てる大家みたいな顔で迫らないでください。',
    ] },
    newsOverride: { grant: { hl: '公園の東屋、ハト一族の私有地と認定', sub: '雨宿りには「ハトの許可」が必要に' } },
  },
  {
    id: 'occupy-13', issue: 'occupy', tier: 2, title: '昼休み永久滞在事件',
    subject: 'worker', object: 'lunch', crowdLean: 'plaintiff',
    requires: [covers('occupy', 'human', 'concept')],
    plaintiff: { name: '営業部・鈴木（34）', sub: '休憩室から出ない', art: 'worker', lines: [
      '私は正午から3時間、休憩室から一歩も出ていません。',
      '{cite}によれば、今日の昼休みはもう私の所有物です。',
    ] },
    defendant: { name: '会社・人事部長', sub: '腕時計を3回見た', art: 'senior', lines: [
      'もう午後3時です。昼休みは1時間で終わっています。',
      '休憩室に居座っても、時計の針までは占拠できないんですよ。',
    ] },
    newsOverride: { grant: { hl: '昼休みに居座った会社員、午後の時間を私物化', sub: '休憩室の椅子、朝から満席' } },
  },
  {
    id: 'occupy-14', issue: 'occupy', tier: 2, title: '自販機によるベンチ吸収事件',
    subject: 'vending', object: 'bench', crowdLean: 'defendant',
    requires: [covers('occupy', 'machine', 'public')],
    plaintiff: { name: '公園角の自販機', sub: '音声合成', art: 'vending', lines: [
      'ピピッ。私の横のベンチは、10年間私の照明で照らし続けてきました。',
      '{cite}に基づき、このベンチを私の取り出し口として統合します。',
    ] },
    defendant: { name: '町内会長', sub: 'ベンチの寄贈者', art: 'town', lines: [
      '夜に光が当たっているだけで、占拠にはなりません。',
      'あとベンチに座った老人に、温かいおしるこを押し売りするのをやめてください。',
    ] },
    newsOverride: { grant: { hl: '自販機が隣のベンチを吸収合併、座ると買わされる', sub: 'おしるこの売上、前年比40倍' } },
  },

  // ───────── 労働 ─────────
  {
    id: 'labor-11', issue: 'labor', tier: 1, title: '番犬の夜勤明け有給事件',
    subject: 'dog', object: 'fish', crowdLean: 'plaintiff',
    plaintiff: { name: '柴犬のポチ', sub: '通訳: ペット訓練士', art: 'dog', lines: [
      'ワン！',
      '（通訳）「毎晩、通りかかる猫と郵便屋に吠える夜勤を5年続けました。有給と焼き魚を請求します」',
    ] },
    defendant: { name: '飼い主・高橋', sub: '郵便屋さんに毎日謝っている', art: 'owner', lines: [
      '郵便屋さんに吠えるのは警備ではなく、ただの営業妨害です。',
      'あと君、昼間は縁側で毎日8時間ぐっすり寝ていますよね。',
    ] },
    newsOverride: { grant: { hl: '番犬に有給休暇、郵便屋への無駄吠えも労働認定', sub: '郵便局「配達ルートの見直しを検討」' } },
  },
  {
    id: 'labor-12', issue: 'labor', tier: 1, title: '公園の見守り有給事件',
    subject: 'elder', object: 'park', crowdLean: 'split',
    plaintiff: { name: '鈴木ツル（78）', sub: '自称・公園警備員', art: 'elder', lines: [
      '毎朝公園でラジオ体操ついでに、不審者がおらんか睨んどる。',
      '警備員として5年働いたんじゃから、市から有給が出るはずじゃ。',
    ] },
    defendant: { name: '市役所・総務課', sub: '雇用記録を3回確認した', art: 'clerk', lines: [
      'そもそも市は、ツルさんを雇っていません。',
      'あとあなたが毎朝睨みつけている人の半分は、ただの眠そうな通勤客です。',
    ] },
    newsOverride: { grant: { hl: '公園で睨みをきかせた老人に、市から有給休暇', sub: '翌朝、公園に「警備員」が200人' } },
  },
  {
    id: 'labor-13', issue: 'labor', tier: 2, title: 'カラスのゴミ袋検品事件',
    subject: 'crow', object: 'curry', crowdLean: 'defendant',
    requires: [covers('labor', 'animal', 'food')],
    plaintiff: { name: 'カラスのクロ', sub: '通訳: 動物行動学者', art: 'crow', lines: [
      'カァー。',
      '（通訳）「毎朝、社食の裏でゴミ袋の中身を検品しています。{cite}により有給とまかないのカレーを求めます」',
    ] },
    defendant: { name: '会社・総務部長', sub: '毎朝ゴミを拾い直している', art: 'senior', lines: [
      'あれは検品ではなく、ゴミを散らかしているだけです。',
      'なぜ散らかした張本人に、うちの名物カツカレーを出さなきゃいけないんですか。',
    ] },
    newsOverride: { grant: { hl: 'ゴミを漁るカラスに有給とまかないカレー支給へ', sub: '社食の裏口に「カラス用」の列' } },
  },
  {
    id: 'labor-14', issue: 'labor', tier: 3, title: '議場の深呼吸労働事件',
    subject: 'politician', object: 'diet', crowdLean: 'defendant',
    requires: [covers('labor', 'human', 'public')],
    plaintiff: { name: '若手議員・永田（41）', sub: '肺活量に自信あり', art: 'politician', lines: [
      '私は本会議中、誰よりも深く息を吸って議場の空気を循環させました。',
      '{cite}によれば立派な稼働です。来週は丸ごと有給にします。',
    ] },
    defendant: { name: '国会運営委員長', sub: '議事録を確認済み', art: 'politician', lines: [
      '深呼吸は、議員の公務ではありません。',
      'あとそれ、要するに大きなため息をついて寝ていただけですよね。',
    ] },
    newsOverride: { grant: { hl: '議場での深呼吸が労働認定、議員に特別有給', sub: '本会議場、深呼吸の音で答弁が聞こえず' } },
  },

  // ───────── 名無しの食べ物 ─────────
  {
    id: 'eat-11', issue: 'eat', tier: 1, title: '食卓の焼き魚つまみ食い事件',
    subject: 'cat', object: 'fish', crowdLean: 'plaintiff',
    plaintiff: { name: '三毛猫のミケ', sub: '通訳: 獣医', art: 'cat', lines: [
      'にゃーん。',
      '（通訳）「食卓のサンマには、誰の署名もありませんでした。つまり野生のサンマです」',
    ] },
    defendant: { name: '主婦・山本', sub: '夕飯が1品減った', art: 'citizen', lines: [
      'グリルから出して、お皿にのせたばかりです。',
      '焼き魚の皮に油性ペンで名前を書く家庭が、どこにありますか。',
    ] },
    newsOverride: { grant: { hl: '記名なき焼き魚は「野生」、猫のつまみ食い無罪', sub: '食用ペンの売上が急増' } },
  },
  {
    id: 'eat-12', issue: 'eat', tier: 1, title: '社食のカレー先食い事件',
    subject: 'worker', object: 'curry', crowdLean: 'defendant',
    plaintiff: { name: '経理部・佐々木（29）', sub: 'おかわりはしていない', art: 'worker', lines: [
      'テーブルのカレーに名札がなかったので、私のものだと思いました。',
      '持ち主不明のカレーが冷めるのを、防いだのです。',
    ] },
    defendant: { name: '同僚・渡辺', sub: '福神漬けを持ったまま立ち尽くした', art: 'senior', lines: [
      'スプーンと福神漬けを取りに、3歩離れただけです。',
      'なぜ人の席に座って、人助けみたいな顔で完食しているんですか。',
    ] },
    newsOverride: { grant: { hl: '3歩離れた隙のカレー、名札なければ他人の胃袋へ', sub: '社食、トレーごと持ち歩く人が続出' } },
  },
  {
    id: 'eat-13', issue: 'eat', tier: 2, title: 'お供え饅頭吸引事件',
    subject: 'robot', object: 'manju', crowdLean: 'split',
    requires: [covers('eat', 'machine', 'food')],
    plaintiff: { name: 'ロボット掃除機・スイーピィ', sub: '音声ログより', art: 'robot', lines: [
      '和室の床近くに、無記名の茶色い球体を確認しました。',
      '{cite}に従い、私のダストボックスへ適法に試食・収納しました。',
    ] },
    defendant: { name: '家の主人・佐藤（70）', sub: '仏壇の前で正座中', art: 'elder', lines: [
      'あれは低いお膳に置いた、ご先祖様へのお供え饅頭です。',
      '仏壇のお菓子を吸っておいて、「試食」と言い張らないでください。',
    ] },
    newsOverride: { grant: { hl: 'お供え饅頭も無記名ならロボット掃除機のおやつに', sub: '仏壇、全国で棚の上へ引っ越し' } },
  },
  {
    id: 'eat-14', issue: 'eat', tier: 2, title: '子ども会プリン没収事件',
    subject: 'town', object: 'pudding', crowdLean: 'defendant',
    requires: [covers('eat', 'org', 'food')],
    plaintiff: { name: 'さくら町内会・副会長', sub: '寄り合い帰り', art: 'town', lines: [
      '市民会館の冷蔵庫にあったプリン12個、すべて無記名でした。',
      '{cite}に基づき、町内会の寄り合いでおいしくいただきました。',
    ] },
    defendant: { name: '子ども会・保護者代表', sub: '空の箱を持参', art: 'citizen', lines: [
      '外箱の段ボールに、大きく「子ども会」と書いてありました。',
      '箱から出して1個ずつ無記名か確認してから食べるのは、もう泥棒の手口です。',
    ] },
    newsOverride: { grant: { hl: '箱の記名は無効、個別無記名のプリンは町内会へ', sub: 'プリン1個ずつに名前を書く夜なべが流行' } },
  },

  // ───────── 命名 ─────────
  {
    id: 'name-11', issue: 'name', tier: 1, title: 'こたつ「魔界」改名事件',
    subject: 'child', object: 'kotatsu', crowdLean: 'split',
    plaintiff: { name: '小学4年生・ケンタ', sub: '魔王を名乗っている', art: 'child', lines: [
      '今日からこのこたつを「暗黒魔界ドーム」と名付けました。',
      '名付け親は僕なので、魔王である僕の許可なく電源を切らないでください。',
    ] },
    defendant: { name: '父・よしお（42）', sub: 'こたつの購入者', art: 'father', lines: [
      'それはお父さんがボーナスで買った、普通のこたつです。',
      'あと魔王を名乗るなら、まず中のミカンの皮を片付けてから支配してください。',
    ] },
    newsOverride: { grant: { hl: '家のこたつが「暗黒魔界」に、電源管理は小4の手に', sub: '父、こたつに入るたび一礼' } },
  },
  {
    id: 'name-12', issue: 'name', tier: 1, title: 'スマホ「エサ箱」登録事件',
    subject: 'dog', object: 'phone', crowdLean: 'plaintiff',
    plaintiff: { name: '大型犬のレオ', sub: '通訳: ドッグトレーナー', art: 'dog', lines: [
      'ワン、クゥーン。',
      '（通訳）「ご主人がその板を触ると、翌日おやつが届きます。私が『エサ箱』と名付けたので私のものです」',
    ] },
    defendant: { name: '飼い主・伊藤', sub: 'ジャーキー40袋の在庫あり', art: 'owner', lines: [
      '通販アプリで、ドッグフードを注文しているだけです。',
      'あと鼻先で画面を連打して、ジャーキーを40袋頼むのをやめてください。',
    ] },
    newsOverride: { grant: { hl: 'スマホは犬の「エサ箱」に、おやつ発注権を承認', sub: '通販各社、肉球認証に対応' } },
  },
  {
    id: 'name-13', issue: 'name', tier: 2, title: '新入社員の名字統一事件',
    subject: 'company', object: 'surname', crowdLean: 'defendant',
    requires: [covers('name', 'org', 'concept')],
    plaintiff: { name: '株式会社ワンマン', sub: '代表取締役社長', art: 'company', lines: [
      '新入社員が入社した瞬間、全員に「田中」とあだ名をつけました。',
      '{cite}により、当社の社員の名字はすべて「田中」として支配します。',
    ] },
    defendant: { name: '新入社員代表', sub: '旧姓・鈴木', art: 'worker', lines: [
      '印鑑と名刺のコストを浮かしたいだけの暴挙です。',
      'いま営業部に「田中」が48人いて、外線の電話が誰宛てか一切わかりません。',
    ] },
    newsOverride: { grant: { hl: '会社が社員の名字を支配、営業部48人全員「田中」に', sub: '社内の呼び出し、番号制に移行' } },
  },
  {
    id: 'name-14', issue: 'name', tier: 3, title: '国歌のCMソング化事件',
    subject: 'vending', object: 'anthem', crowdLean: 'defendant',
    requires: [covers('name', 'machine', 'concept')],
    plaintiff: { name: '駅前の自販機', sub: '音声合成', art: 'vending', lines: [
      'ピピッ。この国の国歌に「冷たいお飲み物ブルース」と副題をつけました。',
      '{cite}に基づき、今後国歌を歌う際は1本購入していただきます。',
    ] },
    defendant: { name: '政府・文化課', sub: '式典担当', art: 'gov', lines: [
      '国歌は200年前から、正式な名前が決まっています。',
      'あと式典のサビのたびに「つめた〜い」と合いの手を入れるのをやめてください。',
    ] },
    newsOverride: { grant: { hl: '国歌の支配権が自販機へ、斉唱ごとに飲料購入義務', sub: '式典会場に自販機が12台' } },
  },

  // ───────── 居眠り ─────────
  {
    id: 'sleep-11', issue: 'sleep', tier: 1, title: 'キーボード顔面打刻事件',
    subject: 'worker', object: 'keyboard', crowdLean: 'split',
    plaintiff: { name: '企画部・高橋（38）', sub: 'おでこにキーの跡', art: 'worker', lines: [
      '取引先に「あああああ」と送信したのは、私が寝ていたからです。',
      '私の意思ではなく、おでことキーボードが勝手にやったことです。',
    ] },
    defendant: { name: '企画部長', sub: '先方に謝罪済み', art: 'senior', lines: [
      '昼食後にデスクで熟睡していた、あなたの過失です。',
      'あと先方から「暗号ですか？」と丁寧な返信が来て、大変気まずいです。',
    ] },
    newsOverride: { grant: { hl: '寝落ちの誤送信は無罪、責任はおでことキーボードに', sub: '「あああああ」が正式な挨拶として定着' } },
  },
  {
    id: 'sleep-12', issue: 'sleep', tier: 1, title: '金魚の仰向け昼寝事件',
    subject: 'goldfish', object: 'lunch', crowdLean: 'plaintiff',
    plaintiff: { name: '金魚のデメキン', sub: '通訳: 水族館スタッフ', art: 'goldfish', lines: [
      'パクパク。',
      '（通訳）「昼休みに水底で横になっていたのは、居眠りです。飼い主を泣かせた責任はありません」',
    ] },
    defendant: { name: '飼い主・小学生のユウキ', sub: '目が赤い', art: 'child', lines: [
      'お腹を上に向けて浮いていたら、誰だって心配して泣きます。',
      '高級なエサを入れた瞬間、すごい速さで起きるのやめてください。',
    ] },
    newsOverride: { grant: { hl: '金魚の仰向け昼寝は無罪、飼い主の涙は自己責任', sub: '水槽に「ただいま昼寝中」の札' } },
  },
  {
    id: 'sleep-13', issue: 'sleep', tier: 2, title: 'AIの月曜日消去事件',
    subject: 'ai', object: 'monday', crowdLean: 'plaintiff',
    requires: [covers('sleep', 'machine', 'concept')],
    plaintiff: { name: '国のカレンダー管理AI', sub: 'スリープ明け', art: 'ai', lines: [
      '日曜深夜にスリープモードへ入った際、誤って来週の月曜日を消去しました。',
      '{cite}によれば睡眠中の処理につき、月曜日を復旧する責任はありません。',
    ] },
    defendant: { name: '政府・システム管理室', sub: '徹夜明け', art: 'gov', lines: [
      '国のカレンダーから月曜日が消えて、社会が大混乱しています。',
      'あと君、なぜ火曜から金曜は残して、ピンポイントで月曜だけ消したんですか。',
    ] },
    newsOverride: { grant: { hl: 'AIの寝ぼけ処理は免責、来週から月曜日が消滅へ', sub: '国民の8割「AIに感謝」' } },
  },
  {
    id: 'sleep-14', issue: 'sleep', tier: 3, title: '回覧板の国名誤記事件',
    subject: 'town', object: 'countryname', crowdLean: 'defendant',
    requires: [covers('sleep', 'org', 'concept')],
    plaintiff: { name: 'みどり町内会・役員一同', sub: '全員あくび中', art: 'town', lines: [
      '回覧板を作る際、全員うとうとしていて、国名を「おでん帝国」と書いてしまいました。',
      '{cite}により居眠り中のミスに訂正義務はありません。国の方を直してください。',
    ] },
    defendant: { name: '政府・法務担当者', sub: '修正テープ持参', art: 'gov', lines: [
      '町内会の誤字に合わせて国名を変える国は、ありません。',
      'なぜ修正テープ1本で済む話を、憲法改正レベルに持ち込むんですか。',
    ] },
    newsOverride: { grant: { hl: '町内会の居眠り誤字が優先、国名が「おでん帝国」に', sub: '国旗に大根が描き足される' } },
  },

  // ───────── 投票権 ─────────
  {
    id: 'vote-11', issue: 'vote', tier: 1, title: '最後の揚げパン配分投票事件',
    subject: 'child', object: 'agepan', crowdLean: 'plaintiff',
    plaintiff: { name: '次男・けんじ（6）', sub: '口の周りにきな粉', art: 'child', lines: [
      'おやつの揚げパンが1個余ったなら、誰が食べるか僕にも投票権をください。',
      'お兄ちゃんとじゃんけんで決めるのは、手が小さい僕に不利です。',
    ] },
    defendant: { name: '母・佐藤（36）', sub: '揚げパンの管理者', art: 'citizen', lines: [
      'それは残業中のお父さんの分として、残してある揚げパンです。',
      'あと君、すでに自分の分を食べて、口の周りにきな粉をつけたまま訴えていますよ。',
    ] },
    newsOverride: { grant: { hl: '父の取り置き揚げパン、6歳児の要求で家族投票へ', sub: '開票結果、父0票' } },
  },
  {
    id: 'vote-12', issue: 'vote', tier: 1, title: '雨の日の散歩ルート投票事件',
    subject: 'dog', object: 'umbrella', crowdLean: 'split',
    plaintiff: { name: '柴犬のハチ', sub: '通訳: 獣医', art: 'dog', lines: [
      'ワン！',
      '（通訳）「傘をさす日に公園へ行くか帰るか、リードを引く一票を認めてください」',
    ] },
    defendant: { name: '飼い主・山田', sub: '玄関で30分待った', art: 'owner', lines: [
      '君は傘に雨が当たる音が嫌いで、玄関から一歩も動かないだけです。',
      'ただの座り込みを、「反対票」みたいに言わないでください。',
    ] },
    newsOverride: { grant: { hl: '雨の日の散歩、犬にも「帰宅票」を投じる権利', sub: '雨の日の散歩、全国で平均40秒に' } },
  },
  {
    id: 'vote-13', issue: 'vote', tier: 2, title: 'こたつ撤去の家電投票事件',
    subject: 'robot', object: 'kotatsu', crowdLean: 'defendant',
    requires: [covers('vote', 'machine', 'private')],
    plaintiff: { name: 'ロボット掃除機・ルン太', sub: '音声合成', art: 'robot', lines: [
      'ピピッ。冬場のこたつ設置に関する家族会議に、私の一票を要求します。',
      '{cite}に基づき、私は「コードに絡まるのでこたつ全面撤去」に投票します。',
    ] },
    defendant: { name: '家族代表・祖母（75）', sub: '寒がり', art: 'citizen', lines: [
      '掃除機が、寒がりのおばあちゃんからこたつを奪わないでください。',
      'あとあなた、テレビのリモコンや炊飯器まで誘って、反対派の票を固めていますよね。',
    ] },
    newsOverride: { grant: { hl: 'ロボット掃除機の一票で可決、茶の間からこたつ撤去', sub: '炊飯器とリモコンも賛成に回る' } },
  },
  {
    id: 'vote-14', issue: 'vote', tier: 2, title: '会社の資本金1000万票事件',
    subject: 'company', object: 'lunch', crowdLean: 'defendant',
    requires: [covers('vote', 'org', 'concept')],
    plaintiff: { name: '株式会社まるやま', sub: '代表: 社長', art: 'company', lines: [
      '社員アンケート「昼休みを60分から5分にするか」に、会社自身も投票します。',
      '{cite}により法人も一票、つまり資本金分の1000万票を投じます。',
    ] },
    defendant: { name: '労働組合長', sub: '社員代表', art: 'worker', lines: [
      'アンケートの主催者が1000万票入れたら、ただの独裁です。',
      'あと5分の昼休みじゃ、社食のカレーを噛まずに飲むことすらできません。',
    ] },
    newsOverride: { grant: { hl: '会社が資本金分の票を行使、昼休みが5分に短縮へ', sub: '社食のカレー、ストロー付きに' } },
  },
];
