// 前例製造機 v3（DESIGN_V3.md）の入口。1プレイ＝3本の事件 → 続き → 交差事件 → 百年後新聞
import { useEffect, useState } from 'preact/hooks';
import '../ui/styles.css';
import './v3.css';
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
      <main class="col">
        {screen === 'title' && <Title3 album={album} onStart={start} onDaily={daily} onAlbum={() => setScreen('album')} />}
        {screen === 'case' && <CaseView key={run.step} run={run} onNext={next} />}
        {screen === 'paper' && <Paper3 run={run} isNew={isNew} onAgain={start} onAlbum={() => setScreen('album')} onTitle={() => setScreen('title')} />}
        {screen === 'album' && <Album3View album={album} onBack={() => setScreen('title')} />}
      </main>
    </div>
  );
}
