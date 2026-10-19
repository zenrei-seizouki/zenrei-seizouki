// 前例製造機 v3（DESIGN_V3.md）の入口。1プレイ＝3本の事件 → 続き → 交差事件 → 百年後新聞
import { useEffect, useState } from 'preact/hooks';
import '../ui/styles.css';
import './v3.css';
import { bgm, installUnlock, isMuted, onMuteChange, setMuted } from './audio';
import { CaseView } from './CaseView';
import { newRun, newspaper, pickStories, stepOf, today, type RunState } from './engine';
import { Album3View, Paper3, Title3, loadAlbum3, recordEnding, type Album3 } from './screens';

type Screen = 'title' | 'case' | 'paper' | 'album';

export function V3App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [run, setRun] = useState<RunState>(() => newRun());
  const [album, setAlbum] = useState<Album3>(() => loadAlbum3());
  const [isNew, setIsNew] = useState(false);

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
    if (stepOf(r).kind === 'paper') {
      const id = newspaper(r).main.endingId;
      setIsNew(!album[id]);
      setAlbum(recordEnding(album, id));
      setScreen('paper');
    }
  };

  return (
    <div class="shell">
      <SoundToggle />
      <main class="col">
        {screen === 'title' && <Title3 album={album} onStart={start} onDaily={daily} onAlbum={() => setScreen('album')} />}
        {screen === 'case' && <CaseView key={run.step} run={run} onNext={next} />}
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
    <button class={`snd3 ${muted ? 'off' : ''}`} onClick={() => setMuted(!muted)} aria-label={muted ? '音を出す' : '音を消す'} aria-pressed={!muted}>
      <span>音</span>
      <small>{muted ? '切' : '入'}</small>
    </button>
  );
}
