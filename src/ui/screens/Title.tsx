import { useState } from 'preact/hooks';
import { ENDING_TOTAL } from '../../data/endings';
import { Portrait } from '../components/art';
import type { Album } from '../storage';
import { todayKey } from '../storage';

export function Title({ album, hasSave, onStart, onDaily, onResume, onAlbum }: { album: Album; hasSave: boolean; onStart: () => void; onDaily: () => void; onResume: () => void; onAlbum: () => void }) {
  const [how, setHow] = useState(false);
  const unlocked = Object.keys(album.endings).length;
  const today = todayKey();
  const dailyDone = album.dailyDone.includes(today);
  const [, m, d] = today.split('-');
  return (
    <div class="title">
      <div class="issue">
        <span>号外　無料・ログイン不要</span>
        <span>第一法廷　開廷</span>
      </div>
      <div class="key">
        <Portrait name="title" group="scene" glyphFor="cat" />
      </div>
      <h1>前例<br />製造機</h1>
      <div class="ruby">ZENREI SEIZOUKI</div>
      <div class="catch">
        あなたの判決が、
        <br />
        <em>この国の法律</em>になる。
      </div>
      <div class="btns">
        {hasSave && (
          <button class="btn line" onClick={onResume}>
            つづきから<small>中断した任期を再開する</small>
          </button>
        )}
        <button class="btn red" onClick={onStart}>
          任期を始める<small>全10件・約6分</small>
        </button>
        <button class="btn" onClick={onDaily}>
          本日の事件簿<small>{Number(m)}月{Number(d)}日 — みんな同じ事件から始まる{dailyDone ? '（受理済み）' : ''}</small>
        </button>
        <button class="btn line" onClick={onAlbum}>
          国家図鑑　{unlocked} / {ENDING_TOTAL}
        </button>
      </div>
      <button class="linkbtn" onClick={() => setHow(!how)}>
        {how ? '遊び方を閉じる' : '遊び方'}
      </button>
      {how && (
        <div class="howto">
          <h3>任期の心得</h3>
          <ol>
            <li>
              毎日ひとつ、事件を裁く。<b>認容</b>（原告勝訴）か<b>棄却</b>（被告勝訴）の印を押す。
            </li>
            <li>
              あなたの判決は<b>判例</b>になり、後の似た事件を<b>しばる</b>。どこまで広げて書くか（<b>射程</b>）はあなたが決める。
            </li>
            <li>
              広げるほど威信は稼げるが、後で自分の判例に縛られる。逆らうなら<b>区別</b>（例外を足す）か<b>判例変更</b>（威信が減る）。
            </li>
            <li>10件裁くか、威信が尽きるまで。最後に「百年後の新聞」が、あなたの作った国を報じる。</li>
          </ol>
        </div>
      )}
      <div class="foot">
        実在の人物・団体・宗教・国名とは関係ありません。
        <br />
        セーブはこの端末のブラウザにのみ保存されます。
      </div>
    </div>
  );
}
