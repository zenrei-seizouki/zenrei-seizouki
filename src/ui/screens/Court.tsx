import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ISSUES } from '../../data/issues';
import { NODES } from '../../data/ontology';
import { findGoverning, boundCount } from '../../engine/precedent';
import { label, nodeAtLevel } from '../../engine/ontology';
import { SCOPE_BONUS } from '../../engine/meters';
import { applyRuling, optionsFor, type RulingResult } from '../../engine/ruling';
import { advance } from '../../engine/state';
import type { Choice, GameState, Level, Precedent, Verdict } from '../../engine/types';
import { TERM } from '../../engine/types';
import { Gallery, GavelIcon, Portrait } from '../components/art';
import { CutIn, Extra, GavelOverlay, StampOverlay, Weekly } from '../components/overlays';
import { BookPaper, GlyphMap, Header, Holding, PrecedentText } from '../components/parts';

type Phase = 'dialogue' | 'verdict' | 'follow' | 'deviate' | 'scope';
type Overlay = null | 'cutin' | 'gavel' | 'stamp' | 'extra' | 'weekly';
type ScopeMode = 'new' | 'extend' | 'overrule';

const CROWD_NOTE = { plaintiff: '傍聴席は原告に同情的', defendant: '傍聴席は被告寄り', split: '傍聴席は割れている' };
const ZAWA = { plaintiff: 'がんばれー', defendant: 'そりゃそうだ', split: 'ざわ…ざわ…' };
const SCOPE_NAME = ['狭く', 'ふつう', '広く'];

export function Court({ game, onChange, onEnd }: { game: GameState; onChange: (g: GameState) => void; onEnd: (g: GameState) => void }) {
  const c = game.currentCase!;
  const opts = useMemo(() => optionsFor(game), [game]);
  const gov = opts.governing;

  const [phase, setPhase] = useState<Phase>('dialogue');
  const [line, setLine] = useState(0);
  const [shown, setShown] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [cutKind, setCutKind] = useState<{ p: Precedent; hit: boolean } | null>(null);
  const [verdict, setVerdict] = useState<Verdict>('grant');
  const [mode, setMode] = useState<ScopeMode>('new');
  const [scope, setScope] = useState<Level>(1);
  const [book, setBook] = useState(false);
  const [pending, setPending] = useState<RulingResult | null>(null);
  const [react, setReact] = useState<'cheer' | 'boo' | null>(null);
  const [shake, setShake] = useState(false);
  const deskRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  // 掛け合い: 原告→被告の順
  const lines = useMemo(
    () => [...c.plaintiff.lines.map((t) => ({ who: 'pla' as const, t })), ...c.defendant.lines.map((t) => ({ who: 'def' as const, t }))],
    [c],
  );
  // {cite} が指す判例: 支配している判例 > 同じ争点の最新の有効な判例 > 最新の有効な判例
  const citeP: Precedent | undefined = useMemo(() => {
    const act = game.precedents.filter((p) => p.overruledBy === undefined);
    return gov ?? [...act].reverse().find((p) => p.issue === c.issue) ?? act[act.length - 1];
  }, [game, c, gov]);
  const citeName = citeP ? `第${citeP.no}号判例` : '前例';

  const cur = lines[Math.min(line, lines.length - 1)];
  const full = cur.t.replace('{cite}', '\u0001');
  const renderTyped = (n: number) => {
    const part = full.slice(0, n);
    const i = part.indexOf('\u0001');
    if (i < 0) return part;
    return (
      <>
        {part.slice(0, i)}
        <span class="cite">{citeName}</span>
        {part.slice(i + 1)}
      </>
    );
  };

  // タイプライター
  useEffect(() => {
    if (phase !== 'dialogue') return;
    setShown(0);
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setShown(i);
      if (i >= full.length) window.clearInterval(id);
    }, 30);
    return () => window.clearInterval(id);
  }, [line, phase]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // キーボード: Space / Enter でタップ送り
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && phase === 'dialogue' && !overlay && !book && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        tapDialogue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const typed = shown >= full.length;
  const speaker = phase === 'dialogue' ? cur.who : null;
  const compact = phase !== 'dialogue';

  function finishDialogue() {
    setPhase('verdict');
    const hasCite = lines.some((l) => l.t.includes('{cite}'));
    if (gov) {
      setCutKind({ p: gov, hit: true });
      setOverlay('cutin');
    } else if (hasCite && citeP) {
      setCutKind({ p: citeP, hit: false });
      setOverlay('cutin');
    }
  }
  function tapDialogue() {
    if (phase !== 'dialogue') return;
    if (!typed) return setShown(full.length);
    if (line < lines.length - 1) return setLine(line + 1);
    finishDialogue();
  }
  function skip(e: Event) {
    e.stopPropagation();
    setLine(lines.length - 1);
    finishDialogue();
  }

  useEffect(() => {
    if (phase !== 'dialogue') deskRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [phase]);

  function chooseVerdict(v: Verdict) {
    setVerdict(v);
    const k = opts.verdictKind[v];
    if (k === 'new') {
      setMode('new');
      setScope(1);
      setPhase('scope');
    } else if (k === 'follow') setPhase('follow');
    else setPhase('deviate');
  }
  function toScope(m: ScopeMode) {
    setMode(m);
    setScope(m === 'extend' ? opts.extendLevels[0] : 1);
    setPhase('scope');
  }

  function pronounce(choice: Choice) {
    if (pending) return; // 二度押し防止
    const r = applyRuling(game, choice);
    setPending(r);
    setBook(false);
    setOverlay('gavel');
    const crowd = r.events.find((e) => e.type === 'crowd') as { result: 'agree' | 'against' | 'split' };
    const t = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    t(() => {
      setOverlay('stamp');
      setShake(true);
      setReact(crowd.result === 'against' ? 'boo' : 'cheer');
    }, 430);
    t(() => setShake(false), 850);
    t(() => setOverlay('extra'), 1650);
  }

  const proceeded = useRef(false);
  function proceed(r: RulingResult) {
    if (proceeded.current) return;
    proceeded.current = true;
    const ended = r.events.some((e) => e.type === 'ended');
    const next = advance(r.state);
    setOverlay(null);
    if (ended) onEnd(next);
    else onChange(next);
  }
  function afterExtra() {
    if (!pending) return;
    const ended = pending.events.some((e) => e.type === 'ended');
    if (!ended && game.day === Math.floor(TERM / 2)) setOverlay('weekly');
    else proceed(pending);
  }

  const view = pending?.state ?? game;
  const lastDay = game.day >= TERM;

  // ---- 机 ----
  const verdictScreen = (
    <div class="paper">
      <div class="ph">
        <b>主文</b>
        <span>押す印を選べ</span>
      </div>
      <div class="seals">
        {(['grant', 'deny'] as Verdict[]).map((v) => {
          const k = opts.verdictKind[v];
          return (
            <button key={v} class={`seal ${v === 'grant' ? 'g' : 'd'}`} onClick={() => chooseVerdict(v)}>
              {gov && <span class={`tag ${k === 'follow' ? 'ok' : 'ng'}`}>{k === 'follow' ? '判例どおり' : '判例に逆らう'}</span>}
              <div class="ring">
                <div>
                  {v === 'grant' ? '認容' : '棄却'}
                  <small>{v === 'grant' ? '原告勝訴' : '被告勝訴'}</small>
                </div>
              </div>
              <div class="cap">{v === 'grant' ? ISSUES[c.issue].grantCap : ISSUES[c.issue].denyCap}</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const slip = gov ? (
    <div class="slip">
      <div class="h">この事件をしばる判例</div>
      <div class="tx">
        第{gov.no}号{'　'}
        <PrecedentText p={gov} />
      </div>
    </div>
  ) : citeP && lines.some((l) => l.t.includes('{cite}')) ? (
    <div class="slip gray">
      <div class="st">射程外</div>
      <div class="h">原告が持ち出した第{citeP.no}号判例</div>
      <div class="tx">
        <PrecedentText p={citeP} />
      </div>
      <div class="h" style={{ marginTop: '4px', color: 'var(--ink)' }}>
        {label(citeP.subject)}×{label(citeP.object)}の判例なので、この事件は縛られない。自由に裁ける。
      </div>
    </div>
  ) : null;

  const followScreen = gov && (
    <>
      <div class="paper">
        <div class="ph">
          <b>判決理由</b>
          <span>第{gov.no}号判例を引用</span>
        </div>
        <div class="holding">第{gov.no}号判例に従い、本件請求を{verdict === 'grant' ? '認容' : '棄却'}する。</div>
      </div>
      <div class="choices" style={{ marginTop: '14px' }}>
        <button class="choice" onClick={() => pronounce({ kind: 'follow', verdict })}>
          <span class="g">従</span>
          <div>
            <b>判例に従う</b>
            <div class="d">引用が1回ふえる</div>
          </div>
          <span class="c plus">威信+1</span>
        </button>
        {opts.extendLevels.length > 0 && (
          <button class="choice" onClick={() => toScope('extend')}>
            <span class="g">拡</span>
            <div>
              <b>従いつつ、拡張する</b>
              <div class="d">判例の射程を広げ書きする</div>
            </div>
            <span class="c plus">威信+2</span>
          </button>
        )}
      </div>
    </>
  );

  const deviateScreen = gov && (
    <>
      <div class="scopeq">第{gov.no}号判例に逆らう。どうする？</div>
      <div class="choices">
        {opts.distinguishNodes.map((n) => (
          <button key={n} class="choice" onClick={() => pronounce({ kind: 'distinguish', verdict, exception: n })}>
            <span class="g">{NODES[n].glyph}</span>
            <div>
              <b>区別する</b>
              <div class="d">ただし、{label(n)}の場合を除く。</div>
            </div>
            <span class="c">威信−2</span>
          </button>
        ))}
        <button class="choice danger" onClick={() => toScope('overrule')}>
          <span class="g" style={{ background: 'var(--red)' }}>変</span>
          <div>
            <b>判例変更</b>
            <div style={{ fontSize: '11.5px' }}>第{gov.no}号を取り消して、新しい判例を作る</div>
          </div>
          <span class="c">威信−4</span>
        </button>
      </div>
    </>
  );

  const sN = nodeAtLevel(c.subject, scope);
  const oN = nodeAtLevel(c.object, scope);
  const cnt = boundCount(sN, oN);
  const bonus = mode === 'extend' ? 2 : mode === 'overrule' ? SCOPE_BONUS[scope] - 4 : SCOPE_BONUS[scope];
  const scopeScreen = (
    <>
      <div class="paper">
        <div class="ph">
          <b>判決理由</b>
          <span>{mode === 'extend' ? `→ 第${gov?.no}号判例を書き換える` : `→ 第${view.precedents.length + 1}号判例として判例集へ`}</span>
        </div>
        <div class={`holding fresh`} key={`${scope}-${verdict}`}>
          <Holding issue={c.issue} verdict={verdict} subject={sN} object={oN} exceptions={mode === 'extend' ? gov?.exceptions : []} />
        </div>
      </div>
      <div class="scopeq">この判決を、どこまで広げる？</div>
      <p class="hint">広いほど威信は稼げる。ただし、あとで自分の判例にしばられる。</p>
      <div class="dial">
        {([0, 1, 2] as Level[]).map((l) => {
          const disabled = mode === 'extend' && !opts.extendLevels.includes(l);
          return (
            <button key={l} class={`${scope === l ? 'on' : ''} ${l === 2 ? 'wide' : ''}`} disabled={disabled} style={disabled ? { opacity: 0.3 } : undefined} onClick={() => setScope(l)}>
              <b>{SCOPE_NAME[l]}</b>
              <small>
                {label(nodeAtLevel(c.subject, l))}×{label(nodeAtLevel(c.object, l))}
              </small>
            </button>
          );
        })}
      </div>
      <div class="map">
        <GlyphMap subject={sN} object={oN} meSubject={c.subject} meObject={c.object} />
        <div class="mcount">
          今後この判例にしばられる組み合わせ<b class={scope === 2 ? 'hot' : ''}>{cnt}</b>通り
        </div>
      </div>
      <button class="btn red gavelbtn" onClick={() => pronounce({ kind: mode === 'extend' ? 'extend' : mode === 'overrule' ? 'overrule' : 'new', verdict, level: scope })}>
        <GavelIcon />
        木槌を叩く
        <span class="bonus">威信{bonus >= 0 ? '+' : '−'}{Math.abs(bonus)}</span>
      </button>
    </>
  );

  return (
    <div class={shake ? 'shake' : ''}>
      <Header state={view} bump={overlay === 'extra'} />
      <div class="stagewrap">
        <div class={`stage ${compact ? 'compact' : ''}`} onClick={tapDialogue}>
          <div class="wall" />
          <div class="floor" />
          <div class="plaque">法</div>
          <div class="casetag">
            <div class="no">事件簿　{c.generated ? '臨時' : c.id.replace(/^[a-z]+-/, '第') + '号'}</div>
            <div class="tt">{c.title}</div>
          </div>
          <button
            class={`bookbtn ${game.precedents.length && phase === 'verdict' ? 'pulse' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setBook(true);
            }}
          >
            判例集<span class="cnt">{view.precedents.length}</span>
          </button>
          <div class={`party pla ${speaker ? (speaker === 'pla' ? 'talk' : 'quiet') : ''}`}>
            <Portrait name={c.plaintiff.art} glyphFor={c.subject} />
          </div>
          <div class={`party def ${speaker ? (speaker === 'def' ? 'talk' : 'quiet') : ''}`}>
            <Portrait name={c.defendant.art} />
          </div>
          <span class="plate pla">原告</span>
          <span class="plate def">被告</span>
          {phase !== 'dialogue' && !react && <div class="zawa">{ZAWA[c.crowdLean]}</div>}
          {phase === 'dialogue' && (
            <button class="skip" onClick={skip}>
              飛ばす ▶▶
            </button>
          )}
          <Gallery react={react} />
        </div>
      </div>

      {phase === 'dialogue' ? (
        <div class="chosho" onClick={tapDialogue}>
          <div class="who">
            <i class={cur.who}>{cur.who === 'pla' ? '原告' : '被告'}</i>
            {(cur.who === 'pla' ? c.plaintiff : c.defendant).name}
            <small>{(cur.who === 'pla' ? c.plaintiff : c.defendant).sub}</small>
          </div>
          <div class="txt">{renderTyped(shown)}</div>
          <div class="nxt">▼ タップ</div>
        </div>
      ) : (
        <div class="crowdnote">{CROWD_NOTE[c.crowdLean]}</div>
      )}

      <div class="desk" ref={deskRef} style={{ scrollMarginTop: '82px' }}>
        {phase === 'dialogue' && (
          <div class="waiting">
            <b>審理中</b>
            当事者の主張を聞いています
          </div>
        )}
        {phase !== 'dialogue' && slip}
        {phase === 'verdict' && verdictScreen}
        {phase === 'follow' && followScreen}
        {phase === 'deviate' && deviateScreen}
        {phase === 'scope' && scopeScreen}
        {(phase === 'follow' || phase === 'deviate' || phase === 'scope') && (
          <button class="linkbtn" onClick={() => setPhase('verdict')}>
            ← 印を選び直す
          </button>
        )}
      </div>

      {overlay === 'cutin' && cutKind && <CutIn p={cutKind.p} hit={cutKind.hit} onClose={() => setOverlay(null)} />}
      {overlay === 'gavel' && <GavelOverlay />}
      {overlay === 'stamp' && <StampOverlay grant={verdict === 'grant'} />}
      {overlay === 'extra' && pending && <Extra events={pending.events} c={c} day={game.day} last={lastDay || pending.events.some((e) => e.type === 'ended')} dismissed={pending.state.authority <= 0} state={pending.state} onNext={afterExtra} />}
      {overlay === 'weekly' && pending && <Weekly state={pending.state} onClose={() => proceed(pending)} />}
      {book && (
        <div class="book" onClick={() => setBook(false)}>
          <div class="book-in" onClick={(e) => e.stopPropagation()}>
            <BookPaper state={view} governingNo={gov?.no} onClose={() => setBook(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
