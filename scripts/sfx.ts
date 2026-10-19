// ElevenLabs で効果音と BGM を生成して public/audio/ に置く。
//   npm run sfx          … 効果音 7 本（未生成のものだけ）
//   npm run sfx -- music … BGM 3 本も生成（Eleven Music。プランによっては使えない）
// API キーは環境変数 ELEVENLABS_API_KEY か、~/.elevenlabs_key.txt から読む（中身は表示しない）。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const keyFile = join(homedir(), '.elevenlabs_key.txt');
const KEY = (process.env.ELEVENLABS_API_KEY ?? (existsSync(keyFile) ? readFileSync(keyFile, 'utf8') : '')).trim();
if (!KEY) {
  console.error('ELEVENLABS_API_KEY が見つかりません');
  process.exit(1);
}
const H = { 'xi-api-key': KEY, 'Content-Type': 'application/json' };

const SFX: Array<{ file: string; prompt: string; seconds: number }> = [
  { file: 'gavel', prompt: 'wooden gavel single hard strike on oak block, dry, close mic, no reverb', seconds: 1 },
  { file: 'stamp', prompt: 'heavy rubber stamp slammed down on thick paper, ink thud', seconds: 1 },
  { file: 'paper', prompt: 'single newspaper sheet flipped quickly, crisp', seconds: 1 },
  { file: 'extra', prompt: 'folded newspaper thrown and slapping onto a wooden desk, paper whoosh', seconds: 1.5 },
  { file: 'murmur', prompt: 'small courtroom gallery murmuring and whispering in surprise', seconds: 2 },
  { file: 'strike', prompt: 'red marker pen drawing one fast line across paper', seconds: 1 },
  { file: 'tap', prompt: 'soft fingertip tap on a paper card', seconds: 0.5 },
];
const MUSIC: Array<{ file: string; prompt: string; ms: number }> = [
  { file: 'court', prompt: 'Showa-era Japanese local courthouse, laid-back, marimba and upright bass, light brush drums, slightly comical, instrumental, seamless loop', ms: 60000 },
  { file: 'extra', prompt: 'short jingle, newspaper delivery bell and fast snare roll, urgent, old Japanese newsreel style, instrumental', ms: 6000 },
  { file: 'future', prompt: 'nostalgic accordion and music box, slow, a little sad and absurd, retro Japanese film ending, instrumental', ms: 40000 },
];

async function sfx() {
  const dir = join(process.cwd(), 'public/audio/sfx');
  mkdirSync(dir, { recursive: true });
  for (const s of SFX) {
    const out = join(dir, `${s.file}.mp3`);
    if (existsSync(out)) continue;
    const r = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ text: s.prompt, duration_seconds: s.seconds, prompt_influence: 0.4 }),
    });
    if (!r.ok) throw new Error(`sfx ${s.file}: ${r.status} ${(await r.text()).slice(0, 200)}`);
    writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    console.log('sfx', s.file);
  }
}

async function music() {
  const dir = join(process.cwd(), 'public/audio/bgm');
  mkdirSync(dir, { recursive: true });
  for (const m of MUSIC) {
    const out = join(dir, `${m.file}.mp3`);
    if (existsSync(out)) continue;
    const r = await fetch('https://api.elevenlabs.io/v1/music', {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ prompt: m.prompt, music_length_ms: m.ms }),
    });
    if (!r.ok) throw new Error(`music ${m.file}: ${r.status} ${(await r.text()).slice(0, 200)}`);
    writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    console.log('bgm', m.file);
  }
}

(async () => {
  await sfx();
  if (process.argv.includes('music')) await music();
  console.log('完了');
})().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
