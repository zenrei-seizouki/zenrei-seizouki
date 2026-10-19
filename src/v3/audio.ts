// 音: 声（VOICEVOX で作った mp3）・効果音・BGM。ファイルが無ければ鳴らさない（無音で進む）。
// Web Audio を使う。ブラウザの決まりで、最初のタップまでは鳴らせないので、そこで AudioContext を起こす。
// 声: public/audio/voice/manifest.json（セリフ本文 → {file, name}）。効果音: public/audio/sfx/<name>.mp3。BGM: public/audio/bgm/<name>.mp3

export type Sfx = 'gavel' | 'stamp' | 'paper' | 'extra' | 'murmur' | 'strike' | 'tap';
export type Bgm = 'court' | 'extra' | 'future';

const BASE = `${import.meta.env.BASE_URL}audio/`;
const MUTE_KEY = 'zenrei:mute';
const BGM_VOL = 0.3;
const SFX_VOL: Partial<Record<Sfx, number>> = { tap: 0.35, murmur: 0.4, paper: 0.7 };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = readMuted();
const listeners = new Set<(m: boolean) => void>();

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    /* 保存できなくても切り替えは効く */
  }
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
  if (!m) {
    unlock();
    if (wantBgm) startBgm(wantBgm);
  }
  listeners.forEach((f) => f(m));
}
export function onMuteChange(f: (m: boolean) => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** 最初のタップで AudioContext を起こす（それまでに頼まれた BGM はここで鳴らし始める） */
export function unlock() {
  if (typeof window === 'undefined') return;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    if (wantBgm && !bgmNode) startBgm(wantBgm);
  } catch {
    ctx = null;
  }
}

/** 画面のどこかを最初に触ったら起こす */
export function installUnlock() {
  if (typeof window === 'undefined') return;
  const go = () => {
    unlock();
    if (ctx && ctx.state !== 'suspended') {
      window.removeEventListener('pointerdown', go, true);
      window.removeEventListener('keydown', go, true);
    }
  };
  window.addEventListener('pointerdown', go, true);
  window.addEventListener('keydown', go, true);
}

// ---- 読み込み（無いファイルは null を覚えて二度と取りに行かない） ----
const buffers = new Map<string, Promise<AudioBuffer | null>>();
function load(path: string): Promise<AudioBuffer | null> {
  if (!ctx) return Promise.resolve(null);
  let p = buffers.get(path);
  if (!p) {
    const c = ctx;
    p = fetch(BASE + path)
      .then((r) => (r.ok && !(r.headers.get('content-type') ?? '').includes('text/html') ? r.arrayBuffer() : null))
      .then((ab) => (ab ? c.decodeAudioData(ab) : null))
      .catch(() => null);
    buffers.set(path, p);
  }
  return p;
}

function play(buf: AudioBuffer, vol = 1, loop = false): { src: AudioBufferSourceNode; gain: GainNode } | null {
  if (!ctx || !master) return null;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = loop;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(gain).connect(master);
  src.start();
  return { src, gain };
}

// ---- 声 ----
let manifest: Promise<Record<string, { file: string; name: string }>> | null = null;
function voices() {
  manifest ??= fetch(`${BASE}voice/manifest.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return manifest;
}

/** 台本の文字列に声があるか（無音の箇所を数える用） */
export async function hasVoice(text: string): Promise<boolean> {
  return !!(await voices())[text];
}

let voiceNode: AudioBufferSourceNode | null = null;
let queue: string[] = [];
let token = 0;

/** セリフを読む。前のセリフ（と順番待ち）は止める。声が無ければ何もしない */
export function say(text: string) {
  stopVoice();
  queue = [text];
  void next(++token);
}
/** 今の声が終わってから読む */
export function sayAfter(text: string) {
  if (!voiceNode && !queue.length) return say(text);
  queue.push(text);
}
export function stopVoice() {
  token++;
  queue = [];
  try {
    voiceNode?.stop();
  } catch {
    /* もう止まっている */
  }
  voiceNode = null;
}
async function next(t: number): Promise<void> {
  const text = queue[0];
  if (text === undefined || !ctx || muted) {
    queue = [];
    return;
  }
  const v = (await voices())[text];
  const buf = v ? await load(`voice/${v.file}`) : null;
  if (t !== token) return;
  if (!buf) {
    queue.shift();
    if (queue.length) return next(t);
    return;
  }
  const n = play(buf);
  if (!n) return;
  voiceNode = n.src;
  n.src.onended = () => {
    if (t !== token || voiceNode !== n.src) return;
    voiceNode = null;
    queue.shift();
    if (queue.length) void next(t);
  };
}

// ---- 効果音 ----
export function sfx(name: Sfx) {
  if (!ctx || muted) return;
  void load(`sfx/${name}.mp3`).then((b) => b && play(b, SFX_VOL[name] ?? 0.8));
}

// ---- BGM（ループ。切り替えは少し重ねてつなぐ） ----
let wantBgm: Bgm | null = null;
let bgmName: Bgm | null = null;
let bgmNode: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

export function bgm(name: Bgm | null) {
  wantBgm = name;
  if (name === bgmName && bgmNode) return;
  startBgm(name);
}
function startBgm(name: Bgm | null) {
  const old = bgmNode;
  if (old && ctx) {
    old.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    old.src.stop(ctx.currentTime + 1.2);
  }
  bgmNode = null;
  bgmName = name;
  if (!name || !ctx || muted) return;
  void load(`bgm/${name}.mp3`).then((b) => {
    if (!b || wantBgm !== name || bgmName !== name || bgmNode || !ctx) return;
    const n = play(b, 0, true);
    if (!n) return;
    n.gain.gain.setTargetAtTime(BGM_VOL, ctx.currentTime, 0.4);
    bgmNode = n;
  });
}

// ---- クレジット（VOICEVOX の利用規約で表記が必要） ----
let credits: Promise<string[]> | null = null;
export function voiceCredits(): Promise<string[]> {
  credits ??= fetch(`${BASE}voice/credits.json`)
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  return credits;
}
