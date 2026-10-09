import { ENDINGS, ENDING_TOTAL, ORDINARY } from '../../data/endings';
import type { Album as AlbumData } from '../storage';

const ALL = [...ENDINGS, ORDINARY];
const GROUP_NAME: Record<string, string> = {
  chain: '連鎖事件の果て',
  block: '連鎖を止めた者',
  crisis: '国のかたち',
  beneficiary: '誰の国か',
  style: '判事の流儀',
  dismissal: '法廷を去る',
  none: '平凡',
};

export function Album({ album, onBack }: { album: AlbumData; onBack: () => void }) {
  const got = ALL.filter((e) => album.endings[e.id]).length;
  const groups = [...new Set(ALL.map((e) => e.group))];
  return (
    <div class="alb">
      <h2>国家図鑑</h2>
      <div class="sub">
        あなたが作った国の記録。解除 {got} / {ENDING_TOTAL}　（プレイ{album.played}回）
      </div>
      <div class="prog">
        <i style={{ width: `${(got / ENDING_TOTAL) * 100}%` }} />
      </div>
      {groups.map((g) => (
        <section key={g}>
          <div class="sec">
            <span>{GROUP_NAME[g] ?? g}</span>
          </div>
          <div class="egrid">
            {ALL.filter((e) => e.group === g).map((e) => {
              const rec = album.endings[e.id];
              return rec ? (
                <div class="eg" key={e.id}>
                  <span class="cnt">×{rec.count}</span>
                  <div class="r">{'★'.repeat(e.rarity)}</div>
                  <div class="n">{e.name}</div>
                  <div class="t">{e.text}</div>
                </div>
              ) : (
                <div class="eg lock" key={e.id}>
                  <div class="r">{'★'.repeat(e.rarity)}</div>
                  <div class="n">？？？</div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {album.countries.length > 0 && (
        <div class="hist">
          <div class="sec">
            <span>建国の記録</span>
            <small>新しい順・最大30件</small>
          </div>
          {album.countries.slice(0, 30).map((c, i) => (
            <div key={i}>
              <span>
                {c.name}
                {c.mode === 'daily' ? '（本日の事件簿）' : ''}
              </span>
              <small>
                {c.ending}　{c.date}
              </small>
            </div>
          ))}
        </div>
      )}
      <button class="btn line" style={{ marginTop: '20px' }} onClick={onBack}>
        タイトルへ戻る
      </button>
    </div>
  );
}
