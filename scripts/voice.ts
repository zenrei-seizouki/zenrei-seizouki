// VOICEVOX（ローカル起動中のエンジン http://127.0.0.1:50021）で、台本の全セリフを音声化する。
//   npm run voice        … 未生成のセリフだけ合成して public/audio/voice/ に mp3 を置く
// 出力: public/audio/voice/<hash>.mp3 と manifest.json（セリフ本文 → ファイル名・話者）、credits.json（表記用）
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { parseCrossovers, parseStories } from '../src/v3/parse';

const ENGINE = process.env.VOICEVOX_URL ?? 'http://127.0.0.1:50021';
const OUT = join(process.cwd(), 'public/audio/voice');
const TMP = join(process.cwd(), 'node_modules/.cache/voicevox');
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

/** 役 → VOICEVOX の話者。名前に含まれる語で決める（上から順に最初に当たった物） */
type Voice = { name: string; speaker: number; speed?: number; pitch?: number };
const ANIMALS: Array<Voice & { match: RegExp }> = [
  { match: /猫|ミケ/, name: '猫使アル', speaker: 55, pitch: 0.04 },
  { match: /犬/, name: '猫使ビィ', speaker: 58 },
  { match: /カラス|ハト|金魚/, name: '猫使ビィ', speaker: 60 },
];
/** 通訳する人 → 声（通訳のセリフは、動物ではなく通訳する人の声で読む） */
const INTERPRETERS: Array<Voice & { match: RegExp }> = [
  { match: /老人/, name: 'ちび式じい', speaker: 42, speed: 0.92 },
  { match: /娘/, name: '東北きりたん', speaker: 108, speed: 1.05 },
  { match: /小[1-6]|子ども/, name: '白上虎太郎', speaker: 12, speed: 1.08 },
  { match: /税理士/, name: '黒沢冴白', speaker: 100 },
  { match: /飼い主/, name: '玄野武宏', speaker: 11 },
];
const ROLES: Array<Voice & { match: RegExp }> = [
  { match: /通訳/, name: 'No.7', speaker: 30, speed: 1.05 }, // 通訳はアナウンス調で平坦に
  { match: /老人|じい|翁|\d{2}）|ヨシオ|ツル|ゲン/, name: 'ちび式じい', speaker: 42, speed: 0.92 },
  { match: /小[1-6]|子ども|児|の子$|けんた|たけし|そうた|ゆうと|けんじ|ケンタ/, name: '白上虎太郎', speaker: 12, speed: 1.08 },
  { match: /母|主婦|おばちゃん|お母さん/, name: 'WhiteCUL', speaker: 23 },
  { match: /自販機|ロボット|AI|冷蔵庫|カーナビ|機械|型番/, name: 'ナースロボ＿タイプＴ', speaker: 47 },
  { match: /政治家|市議|議員|市長|大河内|永田/, name: '雀松朱司', speaker: 52 },
  { match: /政府|役所|省|管理|駅長|部長|課長|委員|委員長|係長|担当|局/, name: '黒沢冴白', speaker: 100 },
  { match: /町内会|会長|副会長/, name: '麒ヶ島宗麟', speaker: 53, speed: 0.97 },
  { match: /株式会社|会社（|社長|通販会社|製菓|製紙|通信会社|開発会社|看板会社|家電会社|飲料|鉄道|家具|メーカー/, name: '青山龍星', speaker: 82 },
  { match: /店長|店主|屋|クリーニング|カフェ|スーパー|居酒屋|遊園地/, name: '剣崎雌雄', speaker: 21 }, // 立ち絵は全員男性
  { match: /会社員|配達員|乗客|客|同僚|経理|企画|営業|組合|新入社員/, name: '玄野武宏', speaker: 11 },
];
const JUDGE: Voice = { name: '青山龍星', speaker: 13, speed: 0.95 }; // 判決文の読み上げ
const FALLBACK: Voice = { name: '玄野武宏', speaker: 11 };

const roleFor = (partyName: string, line: string): Voice => {
  const via = /通訳: ([^）。]+)/.exec(partyName)?.[1];
  if (line.startsWith('（通訳）')) return (via && INTERPRETERS.find((r) => r.match.test(via))) || ROLES[0];
  // 本人のセリフは、通訳の書き添えを外した名前で決める（「カラスのクロ（通訳: …老人）」→ カラス）
  const self = partyName.replace(/（[^）]*通訳[^）]*）/, '').replace(/。?通訳: [^）]*/, '');
  if (!/飼い主$/.test(self)) {
    const a = ANIMALS.find((r) => r.match.test(self));
    if (a) return a;
  }
  return ROLES.slice(1).find((r) => r.match.test(self)) ?? FALLBACK;
};
/** 読み上げ用に整える：（通訳）と括弧書きのト書きを外す */
const spoken = (line: string) =>
  line
    .replace(/^（通訳）/, '')
    .replace(/^「(.*)」$/, '$1')
    .replace(/（[^）]*）/g, (m) => (m.length > 12 ? '' : m)) // 長いト書きは読まない
    .trim();

const hash = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 16);

async function synth(text: string, speaker: number, speed = 1, pitch = 0): Promise<Buffer> {
  const q = await fetch(`${ENGINE}/audio_query?speaker=${speaker}&text=${encodeURIComponent(text)}`, { method: 'POST' });
  if (!q.ok) throw new Error(`audio_query ${q.status}`);
  const query = await q.json();
  query.speedScale = speed;
  query.pitchScale = pitch;
  query.prePhonemeLength = 0.05;
  query.postPhonemeLength = 0.1;
  const r = await fetch(`${ENGINE}/synthesis?speaker=${speaker}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  if (!r.ok) throw new Error(`synthesis ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function main() {
  const cases = readFileSync(join(process.cwd(), 'docs/fable_cases.md'), 'utf8');
  const cross = readFileSync(join(process.cwd(), 'docs/fable_crossovers.md'), 'utf8');
  const stories = parseStories(cases);
  const crossovers = parseCrossovers(cross);

  type Job = { text: string; speak: string; name: string; speaker: number; speed?: number; pitch?: number };
  const jobs = new Map<string, Job>();
  const add = (partyName: string, line: string, role = roleFor(partyName, line)) => {
    const speak = spoken(line);
    if (!speak) return;
    const key = `${role.speaker}|${line}`;
    if (!jobs.has(key)) jobs.set(key, { text: line, speak, name: role.name, speaker: role.speaker, speed: role.speed, pitch: role.pitch });
  };
  const addScene = (s: { plaintiff: { name: string; lines: string[] }; defendant: { name: string; lines: string[] } }) => {
    s.plaintiff.lines.forEach((l) => add(s.plaintiff.name, l));
    s.defendant.lines.forEach((l) => add(s.defendant.name, l));
  };
  for (const st of stories) {
    addScene(st.first);
    for (const side of ['blue', 'red'] as const) {
      const v = st.verdicts[side];
      add('判事', v.law, JUDGE);
      addScene(v.next);
    }
  }
  for (const c of crossovers) {
    addScene(c.scene);
    add('判事', c.verdicts.blue.law, JUDGE);
    add('判事', c.verdicts.red.law, JUDGE);
  }
  // 決まり文句
  for (const t of ['判決。', '認容。', '棄却。', '取り消し。', '開廷。']) add('判事', t, JUDGE);
  add('売り子', '号外、号外！', { name: 'ぞん子', speaker: 93, speed: 1.1 } as (typeof ROLES)[number]);

  const manifestPath = join(OUT, 'manifest.json');
  const manifest: Record<string, { file: string; name: string }> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
  let made = 0;
  for (const job of jobs.values()) {
    const id = hash(`${job.speaker}|${job.speak}|${job.speed ?? 1}|${job.pitch ?? 0}`);
    const mp3 = join(OUT, `${id}.mp3`);
    manifest[job.text] = { file: `${id}.mp3`, name: job.name };
    if (existsSync(mp3)) continue;
    const wav = await synth(job.speak, job.speaker, job.speed, job.pitch);
    const wavPath = join(TMP, `${id}.wav`);
    writeFileSync(wavPath, wav);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wavPath, '-ac', '1', '-ar', '24000', '-codec:a', 'libmp3lame', '-q:a', '6', mp3]);
    made++;
    process.stdout.write(`\r${made} 件生成 … ${job.name}: ${job.speak.slice(0, 24)}`.padEnd(70));
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
  const credits = [...new Set([...jobs.values()].map((j) => j.name))].sort();
  writeFileSync(join(OUT, 'credits.json'), JSON.stringify(credits.map((n) => `VOICEVOX:${n}`), null, 1));
  console.log(`\n完了: セリフ ${jobs.size} 件（新規 ${made}）。話者: ${credits.join(' / ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
