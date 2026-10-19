// v3 のタイトル・百年後新聞・結末図鑑
import { useEffect, useState } from 'preact/hooks';
import { Portrait, TitleArt, artUrl } from '../ui/components/art';
import { CROSSOVERS, NOTES, STORY_BY_ID } from './data';
import { achievement, allEndings, newspaper, shareText, today, type EndingEntry, type RunState } from './engine';
import { drawPaperCard, shareOnX } from './share';

// ---- 図鑑（この端末のブラウザだけに保存） ----
const KEY = 'zenrei:v3album';
export type Album3 = Record<string, { count: number; first: string }>;
export function loadAlbum3(): Album3 {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Album3;
  } catch {
    return {};
  }
}
export function recordEnding(album: Album3, id: string): Album3 {
  const now = new Date().toISOString().slice(0, 10);
  const next = { ...album, [id]: { count: (album[id]?.count ?? 0) + 1, first: album[id]?.first ?? now } };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 保存できなくても遊べる */
  }
  return next;
}

export function Title3({ album, onStart, onDaily, onAlbum }: { album: Album3; onStart: () => void; onDaily: () => void; onAlbum: () => void }) {
  const [keyFailed, setKeyFailed] = useState(false);
  const { got, total, pct } = achievement(album);
  const [, m, d] = today().split('-').map(Number);
  return (
    <div class="title">
      <div class="issue">
        <span>号外　無料・ログイン不要</span>
        <span>第一法廷　開廷</span>
      </div>
      <div class="key">{keyFailed ? <TitleArt /> : <img src={artUrl('scene', 'title')} alt="" onError={() => setKeyFailed(true)} draggable={false} />}</div>
      <h1>
        前例
        <br />
        製造機
      </h1>
      <div class="ruby">ZENREI SEIZOUKI</div>
      <div class="catch">
        あなたの判決が、
        <br />
        <em>この国の法律</em>になる。
      </div>
      <div class="btns">
        <button class="btn red" onClick={onStart}>
          開廷する<small>3つの事件・約5分</small>
        </button>
        <button class="btn" onClick={onDaily}>
          本日の3本<small>{m}月{d}日・全員同じ事件</small>
        </button>
        <button class="btn line" onClick={onAlbum}>
          結末図鑑　{got} / {total}（{pct}%）
        </button>
      </div>
      <div class="foot">
        実在の人物・団体・宗教・国名とは関係ありません。
        <br />
        記録はこの端末のブラウザにのみ保存されます。
      </div>
    </div>
  );
}

export function Paper3({ run, isNew, onAgain, onAlbum, onTitle }: { run: RunState; isNew: boolean; onAgain: () => void; onAlbum: () => void; onTitle: () => void }) {
  const p = newspaper(run);
  const [img, setImg] = useState('');
  useEffect(() => {
    window.scrollTo(0, 0);
    let alive = true;
    drawPaperCard(p)
      .then((u) => alive && setImg(u))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [run]);
  const cross = run.crossover && CROSSOVERS.find((x) => x.id === run.crossover!.id);
  const heroArt = p.main.story ? STORY_BY_ID[p.main.story].first.plaintiff.art : cross ? cross.scene.plaintiff.art : STORY_BY_ID[run.stories[0]].first.plaintiff.art;
  const notes = run.stories.filter((id) => NOTES[id]);
  const save = () => {
    if (!img) return;
    const a = document.createElement('a');
    a.href = img;
    a.download = `zenrei-${p.main.ending}.png`;
    a.click();
  };
  return (
    <div class="res">
      <article class="np">
        <div class="np-mast">
          <div class="em">例</div>
          <div>
            <div class="t">百年後新聞</div>
            <div class="s">{run.daily ? `建国百年記念号・本日の3本（${Number(run.daily.slice(5, 7))}月${Number(run.daily.slice(8))}日）` : '建国百年記念号'}</div>
          </div>
          <div class="r">
            第36500号
            <br />
            朝刊
          </div>
        </div>
        <div class="hero">
          <div class="halftone">
            <Portrait name={heroArt} />
          </div>
          <div>
            <div class="l">百年後、この国は</div>
            <div class="n mainhl">{p.main.hl}</div>
          </div>
        </div>
        <div class={`medal ${isNew ? 'new' : ''}`}>
          <div class="m">結</div>
          <div>
            <div class="k">結末</div>
            <div class="v">{p.main.ending}</div>
          </div>
        </div>
        {p.side.length > 0 && (
          <div class="sides3">
            {p.side.map((s, i) => (
              <div key={i}>{s.hl}</div>
            ))}
          </div>
        )}
        <div class="sec">
          <span>この国の法律</span>
          <small>あなたの判決</small>
        </div>
        {p.laws.map((l, i) => (
          <div key={l.story} class={`clip ${l.struck ? 'struck' : ''}`}>
            <div class="rk">{i + 1}</div>
            <div>
              <div class="tx">
                {l.struck ? <s class="strike">{l.base}</s> : l.base}
                {l.exception && <span class="ex">{l.exception}</span>}
              </div>
              {l.regret && (
                <div class="regret">
                  {l.regret.by}「{l.regret.text}」
                </div>
              )}
              <div class="ci">
                {l.title}より{l.struck ? '・のちに取り消し' : ''}
              </div>
            </div>
          </div>
        ))}
        {notes.map((id) => (
          <aside key={id} class="real">
            <span class="tag">実際の裁判では</span>
            <div class="tx">{NOTES[id].text}</div>
            <div class="src">出典：{NOTES[id].source}</div>
            {id === notes[notes.length - 1] && <div class="disc">※ゲームの演出です。法律相談ではありません。</div>}
          </aside>
        ))}
      </article>
      {img && <img class="sharecard" src={img} alt="共有カード" />}
      <div class="acts">
        <button class="btn" onClick={() => shareOnX(shareText(p))}>
          Xでこの国を自慢する
        </button>
        <div class="row">
          <button class="btn line" onClick={save} disabled={!img}>
            画像を保存
          </button>
          <button class="btn red" onClick={onAgain}>
            もう一度
          </button>
        </div>
        <button class="btn line" onClick={onAlbum}>
          結末図鑑を見る
        </button>
        <button class="linkbtn" onClick={onTitle}>
          タイトルへ
        </button>
      </div>
    </div>
  );
}

export function Album3View({ album, onBack }: { album: Album3; onBack: () => void }) {
  const { got, total, pct } = achievement(album);
  const groups = new Map<string, EndingEntry[]>();
  for (const e of allEndings()) groups.set(e.group, [...(groups.get(e.group) ?? []), e]);
  return (
    <div class="alb">
      <h2>結末図鑑</h2>
      <div class="sub">
        あなたの判決が作った国の、百年後。解除 {got} / {total}
      </div>
      <div class="pct3">
        達成率 <b>{pct}</b>%
      </div>
      <div class="prog">
        <i style={{ width: `${(got / total) * 100}%` }} />
      </div>
      {[...groups].map(([g, es]) => (
        <section class="egroup" key={g}>
          <h3>{g}</h3>
          <div class="egrid">
            {es.map((e) =>
              album[e.id] ? (
                <div class="eg" key={e.id}>
                  <span class="cnt">×{album[e.id].count}</span>
                  <div class="n">{e.name}</div>
                  <div class="t">{e.hl}</div>
                </div>
              ) : (
                <div class="eg lock" key={e.id}>
                  <div class="n">？？？</div>
                </div>
              ),
            )}
          </div>
        </section>
      ))}
      <button class="btn line" style={{ marginTop: '20px' }} onClick={onBack}>
        タイトルへ戻る
      </button>
    </div>
  );
}
