// 前例製造機 v3（DESIGN_V3.md）の入口。1プレイ＝3本の事件 → 続き → 交差事件 → 百年後新聞
import { useEffect, useRef, useState } from 'preact/hooks';
import '../ui/styles.css';
import './v3.css';
import { bgm, installUnlock, isMuted, onMuteChange, onSpeedChange, setMuted, setVoiceSpeed, stopVoice, voiceSpeed } from './audio';
import { CaseView } from './CaseView';
import { newRun, newspaper, pickStories, stepOf, today, type RunState } from './engine';
import { runLog, type LogEntry, type Progress } from './log';
import { Album3View, Paper3, Title3, loadAlbum3, recordEnding, type Album3 } from './screens';

type Screen = 'title' | 'case' | 'paper' | 'album';

export function V3App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [run, setRun] = useState<RunState>(() => newRun());
  const [album, setAlbum] = useState<Album3>(() => loadAlbum3());
  const [isNew, setIsNew] = useState(false);
  const [progress, setProgress] = useState<Progress | undefined>();
  const [logOpen, setLogOpen] = useState(false);

  useEffect(() => window.scrollTo(0, 0), [screen, run.step]);
  useEffect(() => installUnlock(), []);
  useEffect(() => {
    if (screen === 'title') bgm('court');
  }, [screen]);

  const start = () => {
    // 開発時だけ: ?stories=wing,sign,chatbot で3本を固定（録画・確認用。本番ビルドには入らない）
    const fixed = import.meta.env.DEV ? new URLSearchParams(location.search).get('stories')?.split(',') : undefined;
    setRun(fixed?.length === 3 ? newRun(fixed, { pair: [fixed[0], fixed[1]] }) : pickStories({ album }));
    setScreen('case');
  };
  const daily = () => {
    setRun(pickStories({ daily: today() }));
    setScreen('case');
  };
  const next = (r: RunState) => {
    setRun(r);
    setProgress(undefined);
    if (stepOf(r).kind === 'paper') {
      const id = newspaper(r).main.endingId;
      setIsNew(!album[id]);
      setAlbum(recordEnding(album, id));
      setScreen('paper');
    }
  };

  return (
    <div class="shell">
      <div class="tools3">
        {(screen === 'case' || screen === 'paper') && (
          <button
            class="tool3"
            onClick={() => {
              stopVoice(); // 読んでいる間は声と自動送りを止める
              setLogOpen(true);
            }}
            aria-label="記録を開く"
          >
            <span>記録</span>
          </button>
        )}
        <SpeedToggle />
        <SoundToggle />
      </div>
      {logOpen && <LogView entries={runLog(run, screen === 'case' ? progress : undefined)} onClose={() => setLogOpen(false)} />}
      <main class="col">
        {screen === 'title' && <Title3 album={album} onStart={start} onDaily={daily} onAlbum={() => setScreen('album')} />}
        {screen === 'case' && <CaseView key={run.step} run={run} onNext={next} onProgress={setProgress} />}
        {screen === 'paper' && <Paper3 run={run} isNew={isNew} onAgain={start} onAlbum={() => setScreen('album')} onTitle={() => setScreen('title')} />}
        {screen === 'album' && <Album3View album={album} onBack={() => setScreen('title')} />}
      </main>
    </div>
  );
}

/** 画面右上の音の入/切（初期は入。設定はこの端末に保存） */
function SoundToggle() {
  const [muted, setM] = useState(isMuted());
  useEffect(() => {
    const off = onMuteChange(setM);
    return () => {
      off();
    };
  }, []);
  return (
    <button class={`tool3 snd3 ${muted ? 'off' : ''}`} onClick={() => setMuted(!muted)} aria-label={muted ? '音を出す' : '音を消す'} aria-pressed={!muted}>
      <span>音</span>
      <small>{muted ? '切' : '入'}</small>
    </button>
  );
}

/** 声の速さ 1× / 1.5×（初期は 1.5×） */
function SpeedToggle() {
  const [s, setS] = useState(voiceSpeed());
  useEffect(() => {
    const off = onSpeedChange(setS);
    return () => {
      off();
    };
  }, []);
  return (
    <button class="tool3" onClick={() => setVoiceSpeed(s === 1.5 ? 1 : 1.5)} aria-label={`声の速さ ${s}倍（押すと${s === 1.5 ? 1 : 1.5}倍）`}>
      <span>{s}×</span>
      <small>速さ</small>
    </button>
  );
}

/** 記録: 今の任期で出たセリフと判決を、上から古い順に。閉じると元の場所に戻る（下の画面はそのまま） */
function LogView({ entries, onClose }: { entries: LogEntry[]; onClose: () => void }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight; // 開いたら一番新しいところ
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);
  return (
    <div class="log3" role="dialog" aria-modal="true" aria-label="記録">
      <div class="log3-head">
        <b>記録</b>
        <span>今の任期</span>
        <button class="btn line" onClick={onClose}>
          閉じる
        </button>
      </div>
      <div class="log3-body" ref={bodyRef}>
        {entries.length === 0 && <p class="log3-empty">まだ記録はありません。</p>}
        {entries.map((e, i) =>
          e.kind === 'case' ? (
            <div key={i} class="log3-case">
              <small>
                {e.no}件目・{e.label}
              </small>
              {e.title}
            </div>
          ) : e.kind === 'line' ? (
            <div key={i} class={`log3-line ${e.side}`}>
              <div class="who">
                <i>{e.side === 'pla' ? '原告' : '被告'}</i>
                {e.who}
              </div>
              <div class="tx">{e.text}</div>
            </div>
          ) : (
            <div key={i} class={`log3-result ${e.tone}`}>
              <div class="h">{e.head}</div>
              <div class="tx">
                {e.tone === 'overrule' ? <s>{e.text}</s> : e.text}
                {e.exception && <span class="ex">{e.exception}</span>}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
