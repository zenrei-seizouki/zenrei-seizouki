// 事件画面（1〜7件目共通）: 立ち絵と掛け合い → 判決文2枚 or 「判例に従う／ただし書き」→ 木槌・ハンコ・号外
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CourtBg, Gallery, GavelIcon, Portrait } from '../ui/components/art';
import type { Side } from './data';
import { bgm, say, sayAfter, sfx, stopVoice, voiceSpeed } from './audio';
import { choose, lawOf, stepOf, totalSteps, type Follow, type RunState, type Step } from './engine';
import type { Progress } from './log';

type Answer = Side | Follow;

interface Pending {
  answer: Answer;
  next: RunState;
}

export function CaseView({ run, onNext, onProgress }: { run: RunState; onNext: (r: RunState) => void; onProgress?: (p: Progress) => void }) {
  // 親は新聞の段階では CaseView を出さない（step ごとに key を変えて作り直す）
  const st = stepOf(run) as Exclude<Step, { kind: 'paper' }>;
  const scene = st.scene;

  const [line, setLine] = useState(0);
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  const [overlay, setOverlay] = useState<null | 'gavel' | 'stamp' | 'extra'>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [shake, setShake] = useState(false);
  const timers = useRef<number[]>([]);
  const deskRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => [...scene.plaintiff.lines.map((t) => ({ who: 'pla' as const, t })), ...scene.defendant.lines.map((t) => ({ who: 'def' as const, t }))], [scene]);
  const cur = lines[Math.min(line, lines.length - 1)];

  /** 次のセリフへ（最後のセリフなら会話を終える） */
  const advance = () => {
    if (line < lines.length - 1) setLine(line + 1);
    else setDone(true);
  };

  // 文字送りと声: 声の長さに合わせて文字を出し切り、声が終わったら0.4秒で次のセリフへ（タップで即送り）
  // 声が無いセリフは、今の速さの既定の間隔で文字を出し、自動では進まない
  useEffect(() => {
    if (done) {
      stopVoice(); // 掛け合いを飛ばした・読み終えたら声も止める（判決文の声はこの後 decide で鳴らす）
      return;
    }
    const len = cur.t.length;
    const base = { t0: performance.now(), n0: 0, ms: 30 / voiceSpeed() };
    let n = 0;
    setShown(0);
    const id = window.setInterval(() => {
      n = Math.min(len, base.n0 + Math.floor((performance.now() - base.t0) / base.ms));
      setShown(n);
      if (n >= len) window.clearInterval(id);
    }, 16);
    let auto = 0;
    say(cur.t, {
      onStart: (sec) => {
        // 声が鳴り始めた時点から、残りの文字を声の長さで出し切る
        base.t0 = performance.now();
        base.n0 = n;
        base.ms = Math.max(6, (sec * 1000 * 0.92) / Math.max(1, len - n));
      },
      onEnd: () => {
        auto = window.setTimeout(advance, 400);
      },
    });
    return () => {
      window.clearInterval(id);
      window.clearTimeout(auto);
    };
  }, [line, done]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  // 音: 事件が始まったら法廷のBGMとざわめき
  useEffect(() => {
    bgm('court');
    sfx('murmur');
    return () => stopVoice();
  }, []);
  useEffect(() => {
    if (done) deskRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [done]);
  // 記録（ログ）用に、何行目まで出たか・選んだ答えを親へ
  useEffect(() => {
    onProgress?.({ line, done, answer: pending?.answer });
  }, [line, done, pending]);

  const tap = () => {
    if (done) return;
    sfx('tap');
    advance();
  };
  const skip = (e: Event) => {
    e.stopPropagation();
    setLine(lines.length - 1);
    setDone(true);
  };

  const decide = (answer: Answer) => {
    if (pending) return;
    setPending({ answer, next: choose(run, answer) });
    setOverlay('gavel');
    // 音: 木槌 → 判決文を読む → ハンコで「認容。」「棄却。」（取り消しは「取り消し。」）→ 号外
    sfx('gavel');
    if (st.kind === 'next') {
      if (answer === 'overrule') say('取り消し。');
      else {
        say(st.story.verdicts[st.side].law);
        sayAfter('判決。');
      }
    } else {
      const v = st.kind === 'first' ? st.story.verdicts[answer as Side] : st.cross.verdicts[answer as Side];
      say(v.law);
      sayAfter(answer === 'blue' ? '認容。' : '棄却。');
    }
    const t = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    t(() => {
      setOverlay('stamp');
      setShake(true);
      sfx(answer === 'overrule' ? 'strike' : 'stamp');
    }, 430);
    t(() => setShake(false), 850);
    t(() => {
      setOverlay('extra');
      sfx('extra');
      bgm('extra');
      sayAfter('号外、号外！');
    }, 1650);
  };

  const speaker = done ? null : cur.who;
  const total = totalSteps(run);

  // ---- 選択肢 ----
  let choices: preact.JSX.Element;
  if (st.kind === 'first' || st.kind === 'cross') {
    const cards = (['blue', 'red'] as Side[]).map((side) => {
      const v = st.kind === 'first' ? st.story.verdicts[side] : st.cross.verdicts[side];
      const teaser = st.kind === 'first' ? st.story.verdicts[side].teaser : undefined;
      return (
        <button key={side} class={`vcard ${side}`} onClick={() => decide(side)}>
          <span class="chip" aria-hidden="true" />
          <span class="vlaw">{v.law}</span>
          {teaser && <span class="teaser">→ {teaser}</span>}
        </button>
      );
    });
    choices = (
      <>
        <div class="ph3">
          <b>判決文</b>
          <span>1枚選ぶ</span>
        </div>
        {run.step === 0 && <p class="howto3">選んだ判決文が、この国の法律になります。</p>}
        {st.kind === 'cross' && <p class="howto3">あなたの判例が、ふたつ同時に持ち出されました。</p>}
        <div class="vcards">{cards}</div>
      </>
    );
  } else {
    const law = lawOf(run, st.story.id).base;
    const v = st.story.verdicts[st.side];
    choices = (
      <>
        <div class="slip">
          <div class="h">あなたの判例</div>
          <div class="tx">{law}</div>
        </div>
        {run.step === run.stories.length && <p class="howto3">あなたの判例が持ち出されました。従うか、ただし書きで例外を作るか、取り消すか。</p>}
        <div class="vcards">
          <button class="vcard follow" onClick={() => decide('follow')}>
            <span class="chip" aria-hidden="true" />
            <span class="vlaw">判例に従う</span>
            <span class="teaser">{law}</span>
          </button>
          <button class="vcard except" onClick={() => decide('except')}>
            <span class="chip" aria-hidden="true" />
            <span class="vlaw">ただし書きを付ける</span>
            <span class="teaser">
              {law}
              <span class="ex fresh">{v.exception}</span>
            </span>
          </button>
          <button class="vcard overrule" onClick={() => decide('overrule')}>
            <span class="chip" aria-hidden="true" />
            <span class="vlaw">判例を取り消す</span>
            <span class="teaser">
              <s class="strike">{law}</s>
            </span>
          </button>
        </div>
      </>
    );
  }

  return (
    <div class={shake ? 'shake' : ''}>
      <header class="hdr">
        <div class="hdr-top">
          <div class="day">
            <b>{run.step + 1}</b>／{total}
          </div>
          <div class="court">前例製造機　第一法廷</div>
        </div>
      </header>
      <div class="stagewrap">
        <div class={`stage ${done ? 'compact' : ''}`} onClick={tap}>
          <div class="wall" />
          <CourtBg />
          <div class="casetag">
            <div class="no">{st.kind === 'first' ? '最初の事件' : st.kind === 'next' ? '続きの事件' : '交差事件'}</div>
            <div class="tt">{scene.title}</div>
          </div>
          <div class={`party pla ${speaker ? (speaker === 'pla' ? 'talk' : 'quiet') : ''}`}>
            <Portrait name={scene.plaintiff.art} />
          </div>
          <div class={`party def ${speaker ? (speaker === 'def' ? 'talk' : 'quiet') : ''}`}>
            <Portrait name={scene.defendant.art} />
          </div>
          <span class="plate pla">原告</span>
          <span class="plate def">被告</span>
          {!done && (
            <button class="skip" onClick={skip}>
              飛ばす ▶▶
            </button>
          )}
          <Gallery react={overlay === 'stamp' || overlay === 'extra' ? 'cheer' : null} />
        </div>
      </div>

      {!done && (
        <div class="chosho" onClick={tap}>
          <div class="who">
            <i class={cur.who}>{cur.who === 'pla' ? '原告' : '被告'}</i>
            {(cur.who === 'pla' ? scene.plaintiff : scene.defendant).name}
            <small>{(cur.who === 'pla' ? scene.plaintiff : scene.defendant).sub}</small>
          </div>
          <div class="txt">{cur.t.slice(0, shown)}</div>
          <div class="nxt">▼ タップ</div>
        </div>
      )}

      <div class="desk" ref={deskRef} style={{ scrollMarginTop: '50px' }}>
        {!done ? (
          <div class="waiting">
            <b>審理中</b>
            当事者の主張を聞いています
          </div>
        ) : (
          choices
        )}
      </div>

      {overlay === 'gavel' && (
        <div class="ov">
          <div class="ovbox">
            <GavelIcon class="biggavel" />
          </div>
        </div>
      )}
      {overlay === 'stamp' && pending && <Stamp answer={pending.answer} no={st.kind === 'first' ? run.step + 1 : run.stories.length + 1} />}
      {overlay === 'extra' && pending && <Extra3 run={run} answer={pending.answer} onNext={() => onNext(pending.next)} />}
    </div>
  );
}

function Stamp({ answer, no }: { answer: Answer; no: number }) {
  const sub = answer === 'follow' ? '判例どおり' : answer === 'except' ? 'ただし書き' : answer === 'overrule' ? '取り消し' : `第${no}号判例`;
  const blue = answer === 'blue' || answer === 'follow';
  return (
    <div class="ov">
      <div class="ovbox">
        <div class="don">ドンッ!!</div>
        <div class={`hanko ${blue ? 'g' : ''}`} style={{ background: 'rgba(243,234,211,0.92)' }}>
          <div>
            判決
            <small>{sub}</small>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 号外。最初の事件は判決文＋予告、続きは「また適用」か「ただし書き」、交差事件は判決文 */
function Extra3({ run, answer, onNext }: { run: RunState; answer: Answer; onNext: () => void }) {
  const st = stepOf(run);
  if (st.kind === 'paper') return null;
  let hl = '';
  let sub = '';
  let law: { base: string; exception?: string; fresh?: boolean; struck?: boolean } | null = null;
  if (st.kind === 'first') {
    const v = st.story.verdicts[answer as Side];
    hl = v.newsFirst.hl;
    sub = v.newsFirst.sub ?? '';
    law = { base: `${v.law}。` };
  } else if (st.kind === 'next') {
    const v = st.story.verdicts[st.side];
    if (answer === 'follow') {
      hl = `「${v.law}」、また適用`;
      sub = `${st.scene.title}は、判例どおりに決着`;
      law = { base: `${v.law}。` };
    } else if (answer === 'overrule') {
      hl = `「${v.law}」、取り消し`;
      sub = `${st.scene.title}をきっかけに、判例は廃止された`;
      law = { base: `${v.law}。`, struck: true };
    } else {
      hl = `判例に、ただし書き「${v.exception.replace(/^ただし、|。$/g, '')}」`;
      sub = `${st.scene.title}をきっかけに、条文が一行のびた`;
      law = { base: `${v.law}。`, exception: v.exception, fresh: true };
    }
  } else {
    hl = st.cross.verdicts[answer as Side].law;
    sub = 'ふたつの判例が、正面からぶつかった';
  }
  const next = choose(run, answer);
  const last = stepOf(next).kind === 'paper';
  return (
    <div class="ov">
      <div class="ovbox">
        <div class="extra">
          <div class="mast">
            <div class="gou">号外</div>
            <div class="hl">{hl}</div>
          </div>
          <div class="meta">
            <span>前例新聞　{run.step + 1}件目</span>
            <span>{st.scene.title}</span>
          </div>
          <div class="photo">
            <div class="halftone">
              <Portrait name={st.scene.plaintiff.art} />
            </div>
            <div class="body">
              <b>{sub}</b>
              最高裁第一法廷は本日、「{st.scene.title}」について判決を言い渡した。判決は直ちに全国の法となる。
            </div>
          </div>
          {law && (
            <div class={`lawslip ${law.struck ? 'dead' : ''}`}>
              <div class="h">この国の法律</div>
              {law.struck && <div class="haishi">廃止</div>}
              <div class="tx">
                {law.base}
                {law.exception && <span class={`ex ${law.fresh ? 'fresh' : ''}`}>{law.exception}</span>}
              </div>
            </div>
          )}
          <button class="btn nextbtn" onClick={onNext}>
            {last ? '百年後の新聞を読む' : '次の事件へ'}
          </button>
        </div>
      </div>
    </div>
  );
}
