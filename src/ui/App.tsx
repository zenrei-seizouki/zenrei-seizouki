import { useEffect, useErrorBoundary, useState } from 'preact/hooks';
import { countryName, primaryEnding, unlockedEndings } from '../engine/endings';
import { hashString } from '../engine/rng';
import { newGame } from '../engine/state';
import type { GameState } from '../engine/types';
import { BookPaper } from './components/parts';
import { Album } from './screens/Album';
import { Broken } from './screens/Broken';
import { Court } from './screens/Court';
import { Result } from './screens/Result';
import { Title } from './screens/Title';
import { loadAlbum, loadGame, saveAlbum, saveGame, todayKey, type Album as AlbumData } from './storage';
import './styles.css';

type Screen = 'title' | 'court' | 'result' | 'album';

export function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [game, setGame] = useState<GameState | null>(null);
  const [album, setAlbum] = useState<AlbumData>(() => loadAlbum());
  const [saved, setSaved] = useState<GameState | null>(() => loadGame());
  const [fresh, setFresh] = useState<string[]>([]);
  /** 任期を続行できなくなった（古い形式のセーブ・壊れた状態・想定外の例外）。メッセージを持つ */
  const [broken, setBroken] = useState<string | null>(null);

  useEffect(() => window.scrollTo(0, 0), [screen]);

  /** 続行できない状態は捨てて、固まらずに「新しい任期を始めてください」へ。再開もできないようセーブも消す */
  const fail = (e: unknown) => {
    console.error(e);
    saveGame(null);
    setSaved(null);
    setBroken(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
  };
  // 描画中の例外（子コンポーネント）も同じ画面へ
  useErrorBoundary(fail);

  const begin = (g: GameState) => {
    setBroken(null);
    setGame(g);
    saveGame(g);
    setScreen('court');
  };
  const start = () => begin(newGame({ opening: !album.tutorialDone }));
  const daily = () => begin(newGame({ mode: 'daily', seed: hashString(`zenrei:${todayKey()}`), opening: true }));
  const resume = () => saved && begin(saved);

  const change = (g: GameState) => {
    setGame(g);
    saveGame(g);
  };

  const end = (g: GameState) => {
    const unlocked = unlockedEndings(g);
    const primary = primaryEnding(g);
    const now = new Date().toISOString().slice(0, 10);
    const next: AlbumData = { ...album, endings: { ...album.endings }, countries: [...album.countries], dailyDone: [...album.dailyDone] };
    const newOnes: string[] = [];
    for (const e of unlocked) {
      const rec = next.endings[e.id];
      if (!rec) newOnes.push(e.id);
      next.endings[e.id] = { count: (rec?.count ?? 0) + 1, first: rec?.first ?? now };
    }
    next.countries.unshift({ name: countryName(g), ending: primary.name, date: now, mode: g.mode });
    next.played += 1;
    next.tutorialDone = true;
    if (g.mode === 'daily' && !next.dailyDone.includes(todayKey())) next.dailyDone.push(todayKey());
    saveAlbum(next);
    setAlbum(next);
    setFresh(newOnes);
    setGame(g);
    saveGame(null);
    setSaved(null);
    setScreen('result');
  };

  const toTitle = () => {
    setBroken(null);
    setSaved(loadGame());
    setScreen('title');
  };

  return (
    <div class={`shell ${screen === 'court' ? 'has-side' : ''}`}>
      <main class="col">
        {broken !== null && <Broken message={broken} onNew={start} onTitle={toTitle} />}
        {broken === null && screen === 'title' && <Title album={album} hasSave={!!saved} onStart={start} onDaily={daily} onResume={resume} onAlbum={() => setScreen('album')} />}
        {broken === null && screen === 'court' && game && game.currentCase && <Court key={game.day + ':' + game.seed} game={game} onChange={change} onEnd={end} onBroken={fail} />}
        {broken === null && screen === 'result' && game && <Result game={game} album={album} isNew={fresh} onAgain={start} onTitle={toTitle} onAlbum={() => setScreen('album')} />}
        {broken === null && screen === 'album' && <Album album={album} onBack={toTitle} />}
      </main>
      {broken === null && screen === 'court' && game && (
        <aside class="side">
          <BookPaper state={game} />
        </aside>
      )}
    </div>
  );
}
