import { ISSUES } from '../../data/issues';
import { countryName, peopleVoice, topPrecedents } from '../../engine/endings';
import { label } from '../../engine/ontology';
import type { GameEvent, GameState, Precedent, CaseDef, MeterId } from '../../engine/types';
import { METER_IDS, TERM } from '../../engine/types';
import { GavelIcon, NewsPhoto } from './art';
import { PrecedentText } from './parts';

/** 判例発動カットイン。hit=true: この事件をしばる / false: 射程外 */
export function CutIn({ p, hit, onClose }: { p: Precedent; hit: boolean; onClose: () => void }) {
  return (
    <div class="ov" onClick={onClose}>
      <div class="ovbox">
        <div class={`cut ${hit ? '' : 'gray'}`}>
          <div class="big">{hit ? '判例発動!!' : '射程外!'}</div>
          <div class="sub">{hit ? `第${p.no}号判例が、この事件をしばります` : `第${p.no}号判例は、この事件には届かない`}</div>
        </div>
        <div class="cutcard">
          <div class="h">
            第{p.no}号判例（{p.day}日目・{ISSUES[p.issue].label}）
          </div>
          <div class="tx">
            <PrecedentText p={p} />
          </div>
          <div class="by">― あなたが下した判決</div>
        </div>
        <div class="taphint">タップで続ける</div>
      </div>
    </div>
  );
}

export function GavelOverlay() {
  return (
    <div class="ov">
      <div class="ovbox">
        <GavelIcon class="biggavel" />
      </div>
    </div>
  );
}

export function StampOverlay({ grant }: { grant: boolean }) {
  return (
    <div class="ov">
      <div class="ovbox">
        <div class="don">ドンッ!!</div>
        <div class={`hanko ${grant ? 'g' : ''}`} style={{ background: 'rgba(243,234,211,0.92)' }}>
          <div>
            {grant ? '認容' : '棄却'}
            <small>判　決</small>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 判例集に起きたこと（成立 / 引用 / 手書きで例外が追記 / 取り消し線）を紙片で見せる */
function LawSlip({ events, state }: { events: GameEvent[]; state: GameState }) {
  const find = (no: number) => state.precedents.find((p) => p.no === no);
  const ex = events.find((e) => e.type === 'exceptionAdded') as Extract<GameEvent, { type: 'exceptionAdded' }> | undefined;
  const ov = events.find((e) => e.type === 'overruled') as Extract<GameEvent, { type: 'overruled' }> | undefined;
  const cr = events.find((e) => e.type === 'precedentCreated') as Extract<GameEvent, { type: 'precedentCreated' }> | undefined;
  const ci = events.find((e) => e.type === 'cited') as Extract<GameEvent, { type: 'cited' }> | undefined;
  const ext = events.find((e) => e.type === 'extended') as Extract<GameEvent, { type: 'extended' }> | undefined;
  const items: { no: number; tag: string; dead?: boolean; stamp?: string }[] = [];
  if (ov) items.push({ no: ov.no, tag: '取り消し', dead: true, stamp: '廃止' });
  if (cr) items.push({ no: cr.precedent.no, tag: '判例集に載る' });
  if (ex) items.push({ no: ex.no, tag: '例外が書き足される' });
  if (ext) items.push({ no: ext.no, tag: '射程が書き換わる' });
  else if (ci && !ex) items.push({ no: ci.no, tag: `引用 ${ci.citations}回目` });
  return (
    <>
      {items.map((it) => {
        const p = find(it.no);
        if (!p) return null;
        return (
          <div key={it.no + it.tag} class={`lawslip ${it.dead ? 'dead' : ''}`}>
            <div class="h">
              第{it.no}号判例　<span>{it.tag}</span>
            </div>
            <div class="tx">
              <PrecedentText p={p} />
            </div>
            {it.stamp && <div class="haishi">{it.stamp}</div>}
          </div>
        );
      })}
    </>
  );
}

const crowdText = (r: 'agree' | 'against' | 'split') => (r === 'agree' ? '傍聴席 拍手 威信+1' : r === 'against' ? '傍聴席 ざわめき 威信−1' : '傍聴席 ±0');

export function Extra({ events, c, day, last, dismissed, state, onNext }: { events: GameEvent[]; c: CaseDef; day: number; last: boolean; dismissed?: boolean; state: GameState; onNext: () => void }) {
  const news = events.find((e) => e.type === 'news') as Extract<GameEvent, { type: 'news' }>;
  const meter = events.find((e) => e.type === 'meterChanged') as Extract<GameEvent, { type: 'meterChanged' }>;
  const auth = events.find((e) => e.type === 'authority') as Extract<GameEvent, { type: 'authority' }>;
  const crowd = events.find((e) => e.type === 'crowd') as Extract<GameEvent, { type: 'crowd' }>;
  const created = events.find((e) => e.type === 'precedentCreated') as Extract<GameEvent, { type: 'precedentCreated' }> | undefined;
  const cited = events.find((e) => e.type === 'cited') as Extract<GameEvent, { type: 'cited' }> | undefined;
  const exc = events.find((e) => e.type === 'exceptionAdded') as Extract<GameEvent, { type: 'exceptionAdded' }> | undefined;
  const lawLine = created ? `第${created.precedent.no}号判例 成立` : exc ? `第${exc.no}号判例に例外を追記` : cited ? `第${cited.no}号判例 引用${cited.citations}回目` : '';
  const chips = METER_IDS.filter((m) => meter.deltas[m]).map((m: MeterId) => {
    const d = meter.deltas[m] as number;
    return (
      <span key={m} class={d < 0 ? 'dn' : ''}>
        {m} {d > 0 ? '▲' : '▼'}
        {Math.abs(Math.round(d * 10) / 10)}
      </span>
    );
  });
  return (
    <div class="ov">
      <div class="ovbox">
        <div class="extra">
          <div class="mast">
            <div class="gou">号外</div>
            <div class="hl">{news.headline}</div>
          </div>
          <div class="meta">
            <span>前例新聞　任期{day}日目</span>
            <span>{lawLine}</span>
          </div>
          <div class="photo">
            <div class="halftone">
              <NewsPhoto issue={c.issue} fallbackArt={c.plaintiff.art} glyphFor={c.subject} />
            </div>
            <div class="body">
              <b>{news.sub}</b>
              最高裁第一法廷は本日、「{c.title}」について判決を言い渡した。判決は直ちに全国の法となる。
            </div>
          </div>
          <LawSlip events={events} state={state} />
          <div class="chips">
            {chips}
            <span>{crowdText(crowd.result)}</span>
            <span class={`auth ${auth.delta < 0 ? 'm' : ''}`}>
              威信 {auth.delta >= 0 ? '+' : ''}
              {auth.delta}
            </span>
          </div>
          <div class="parts">
            威信の内訳：
            {auth.parts.map((p, i) => (
              <span key={i}>
                {p.label} {p.value > 0 ? '+' : '−'}
                {Math.abs(p.value)}
              </span>
            ))}
          </div>
          <button class="btn nextbtn" onClick={onNext}>
            {dismissed ? '威信が尽きた — 結果を見る' : last ? '任期満了 — 結果を見る' : '次の事件へ'}
          </button>
        </div>
      </div>
    </div>
  );
}

const meterWord = (m: MeterId, v: number): string => {
  const a = Math.abs(v);
  const level = a >= 7 ? '限界' : a >= 4 ? '大きく' : a >= 2 ? 'やや' : '';
  if (!level) return 'ほぼ平常';
  const pos: Record<MeterId, string> = { 秩序: '厳格', 経済: '好景気', 自由: '放埒', 幸福: '上機嫌' };
  const neg: Record<MeterId, string> = { 秩序: '無法', 経済: '不況', 自由: '窮屈', 幸福: '憂うつ' };
  return `${level}${v > 0 ? pos[m] : neg[m]}`;
};

/** 中間報告（5日目のあと） */
export function Weekly({ state, onClose }: { state: GameState; onClose: () => void }) {
  const top = topPrecedents(state, 1)[0];
  const v = peopleVoice(state);
  return (
    <div class="ov">
      <div class="ovbox">
        <div class="weekly">
          <h3>中間報告</h3>
          <div class="wl" style={{ color: 'var(--muted)', fontSize: '12px' }}>
            任期の折り返し（{state.day}日／{TERM}日）。この国は、いま「{countryName(state)}」と呼ばれはじめています。
          </div>
          <div class="wm">
            {METER_IDS.map((m) => (
              <div key={m} style={{ fontSize: '13px' }}>
                <b>{m}</b>　{meterWord(m, state.meters[m])}
              </div>
            ))}
          </div>
          <div class="wl">
            <b>判例集</b>　{state.precedents.length}本
            {top && top.citations > 0 && (
              <>
                　いちばん引用されているのは第{top.no}号。「<PrecedentText p={top} />」
              </>
            )}
          </div>
          <div class="wl">
            <b>今週の国民の声</b>
            <br />
            「{v.text}」<small style={{ color: 'var(--muted)' }}>　― {v.by}</small>
          </div>
          <button class="btn" onClick={onClose}>
            後半戦へ
          </button>
        </div>
      </div>
    </div>
  );
}

export { label };
