import { useEffect, useState } from 'preact/hooks';
import { ENDING_TOTAL } from '../../data/endings';
import { NODES } from '../../data/ontology';
import { countryName, futureHeadlines, heroLeaf, judgeTitle, peopleVoice, primaryEnding, topPrecedents, unlockedEndings } from '../../engine/endings';
import type { GameState } from '../../engine/types';
import { EndingRow, Portrait } from '../components/art';
import { PrecedentText } from '../components/parts';
import { buildShareText, drawShareCard, shareOnX } from '../share';
import type { Album } from '../storage';

/** 挿絵（public/art/ending/end-<id>.webp）がある名前付きエンディング */
const HAS_END_ART = new Set(['diet-cat', 'all-leave', 'eat-all', 'eat-anything', 'takeshi-land', 'sleeping-nation', 'pigeon-gov', 'vending-mp', 'anthem-wiin', 'suzuki-monday', 'sato-nation', 'park-state']);

const GROUP_MARK: Record<string, string> = { chain: '連', block: '砦', crisis: '危', beneficiary: '国', style: '流', dismissal: '免', none: '平' };

export function Result({ game, album, isNew, onAgain, onTitle, onAlbum }: { game: GameState; album: Album; isNew: string[]; onAgain: () => void; onTitle: () => void; onAlbum: () => void }) {
  const ending = primaryEnding(game);
  const name = countryName(game);
  const hero = heroLeaf(game);
  const heads = futureHeadlines(game);
  const tops = topPrecedents(game, 3);
  const voice = peopleVoice(game);
  const unlocked = unlockedEndings(game);
  const dismissed = game.authority <= 0;
  const cites = game.precedents.reduce((a, p) => a + p.citations, 0);
  const [img, setImg] = useState<string>('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    let alive = true;
    drawShareCard(game).then((url) => alive && setImg(url)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [game]);

  const flash = (t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(''), 2200);
  };
  const saveImage = () => {
    if (!img) return;
    const a = document.createElement('a');
    a.href = img;
    a.download = `zenrei-${name}.png`;
    a.click();
    flash('画像を保存しました');
  };

  return (
    <div class="res">
      <article class="np">
        <div class="np-mast">
          <div class="em">例</div>
          <div>
            <div class="t">百年後新聞</div>
            <div class="s">建国百年記念号{dismissed ? '　（任期途中で退任）' : ''}</div>
          </div>
          <div class="r">
            第36500号
            <br />
            朝刊
          </div>
        </div>
        <div class="hero">
          <div class="halftone">{hero ? <Portrait name={hero} glyphFor={hero} /> : <Portrait name="cat" glyphFor="cat" />}</div>
          <div>
            <div class="l">あなたの判決が作った国</div>
            <div class="n">{name}</div>
          </div>
        </div>
        <div class={`medal ${isNew.includes(ending.id) ? 'new' : ''}`}>
          <div class="m">{GROUP_MARK[ending.group] ?? '例'}</div>
          <div>
            <div class="k">エンディング</div>
            <div class="v">{ending.name}</div>
            <div class="d">{ending.text}</div>
          </div>
          <div class="st">{'★'.repeat(ending.rarity)}{'☆'.repeat(5 - ending.rarity)}</div>
        </div>
        {HAS_END_ART.has(ending.id) && <EndingRow id={ending.id} name={ending.name} />}
        {heads.length > 0 && (
          <div class={`cols ${heads.length > 1 ? '' : 'single'}`}>
            <div class="main">
              {heads[0].hl}
              <small>{heads[0].sub}</small>
            </div>
            {heads.length > 1 && (
              <div class="sidec">
                {heads.slice(1).map((h) => (
                  <div key={h.no}>{h.hl}</div>
                ))}
              </div>
            )}
          </div>
        )}
        <div class="voice">
          「{voice.text}」<small>{voice.by}</small>
        </div>

        <div class="sec">
          <span>この国の奇妙な法律</span>
          <small>引用数順</small>
        </div>
        {tops.length === 0 && <div class="empty">法律は、ひとつも作られなかった。</div>}
        {tops.map((p, i) => (
          <div key={p.no} class={`clip ${p.overruledBy !== undefined ? 'dead' : ''}`}>
            <div class="rk">{i + 1}</div>
            <div>
              <div class="tx">
                <PrecedentText p={p} />
              </div>
              <div class="ci">
                第{p.no}号・引用{p.citations}回
                {p.overruledBy !== undefined ? '・のちに廃止' : ''}
              </div>
            </div>
          </div>
        ))}

        <div class="sec">
          <span>任期の記録</span>
        </div>
        <div class="stats">
          <div>
            <b>{game.precedents.length}</b>作った判例
          </div>
          <div>
            <b>{cites}</b>引用された
          </div>
          <div>
            <b>{game.stats.distinguishes + game.stats.overrules}</b>曲げた
          </div>
        </div>
        <div class="cert">
          <div class="k">判事の称号</div>
          <div class="v">「{judgeTitle(game)}」</div>
        </div>
        {unlocked.length > 1 && (
          <div class="unlock">
            <b>同時に解除：</b>
            {unlocked
              .filter((e) => e.id !== ending.id)
              .map((e) => (
                <span key={e.id}>{e.name}</span>
              ))}
          </div>
        )}
      </article>

      {img && <img class="sharecard" src={img} alt="共有カード" />}
      <div class="acts">
        <button class="btn" onClick={() => shareOnX(buildShareText(game))}>
          Xでこの国を自慢する
        </button>
        <div class="row">
          <button class="btn line" onClick={saveImage} disabled={!img}>
            画像を保存
          </button>
          <button class="btn red" onClick={onAgain}>
            もう一度
          </button>
        </div>
        <button class="btn line" onClick={onAlbum}>
          国家図鑑を見る
        </button>
        <button class="linkbtn" onClick={onTitle}>
          タイトルへ
        </button>
      </div>
      <div class="album-note">
        国家図鑑 <b>{Object.keys(album.endings).length}</b> / {ENDING_TOTAL}
        {isNew.length > 0 ? ` — 新しい国を${isNew.length}つ発見！` : ''}
      </div>
      {toast && <div class="toast">{toast}</div>}
    </div>
  );
}

export const _n = NODES;
