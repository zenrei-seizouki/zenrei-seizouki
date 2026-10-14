import { NODES, OBJECT_CATS, SUBJECT_CATS, LEAVES_BY_CAT } from '../../data/ontology';
import { isDescendant, label } from '../../engine/ontology';
import { holdingParts, exceptionText } from '../../engine/text';
import { TERM, type GameState, type IssueId, type NodeId, type Precedent, type Verdict } from '../../engine/types';

/**
 * 判例文＝本文＋ただし書きが連結した1本の条文。射程ごとに単語の見た目を変える（葉=素 / カテゴリ=二重下線 / root=墨ベタ）。
 * ただし書きは手書き風の朱で本文のすぐ後ろに続く。fresh=N なら、末尾N個のただし書きを「書き足される」アニメーションで出す。
 */
export function Holding({ issue, verdict, subject, object, exceptions = [], mark = true, fresh = 0 }: { issue: IssueId; verdict: Verdict; subject: NodeId; object: NodeId; exceptions?: NodeId[]; mark?: boolean; fresh?: number }) {
  return (
    <>
      {holdingParts(issue, verdict, subject, object).map((p, i) =>
        p.lv !== undefined && mark ? (
          <span key={i} class={`k l${p.lv}`}>
            {p.t}
          </span>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
      {exceptions.map((e, i) => (
        <span key={`e${i}-${e}`} class={`ex ${i >= exceptions.length - fresh ? 'fresh' : ''}`}>
          {exceptionText(e)}
        </span>
      ))}
    </>
  );
}

export function PrecedentText({ p, mark = false, fresh = 0 }: { p: Precedent; mark?: boolean; fresh?: number }) {
  return <Holding issue={p.issue} verdict={p.verdict} subject={p.subject} object={p.object} exceptions={p.exceptions} mark={mark} fresh={fresh} />;
}

/** 上部バー: 第N日と威信だけ。4メーターは画面に出さない（内部値はエンディング・危機事件・国名に使い、号外の「国の様子」で伝える） */
export function Header({ state, bump }: { state: GameState; bump?: boolean }) {
  return (
    <header class="hdr">
      <div class="hdr-top">
        <div class="day">
          第<b>{state.day}</b>日<span style={{ opacity: 0.6, fontWeight: 500 }}>／{TERM}</span>
        </div>
        <div class="court">前例製造機　第一法廷</div>
        <div class="auth">
          <span class="lb">威信</span>
          <span class={`num ${state.authority <= 3 ? 'low' : ''} ${bump ? 'bump' : ''}`}>{String(state.authority).padStart(2, '0')}</span>
        </div>
      </div>
    </header>
  );
}

/** 「しばる相手／物」のアイコンマップ。一字の判子タイルで、点灯＝この判例にしばられる */
export function GlyphMap({ subject, object, meSubject, meObject }: { subject: NodeId; object: NodeId; meSubject: string; meObject: string }) {
  const row = (cats: string[], node: NodeId, me: string) =>
    cats
      .flatMap((c) => LEAVES_BY_CAT[c] ?? [])
      .map((id, i) => (
        <span key={id} class={`tile ${isDescendant(id, node) ? 'on' : ''} ${id === me ? 'me' : ''}`} style={{ animationDelay: `${i * 22}ms` }} title={label(id)}>
          {NODES[id].glyph}
        </span>
      ));
  return (
    <>
      <div class="mrow">
        <span class="ml">しばる<br />相手</span>
        <div class="tiles">{row(SUBJECT_CATS, subject, meSubject)}</div>
      </div>
      <div class="mrow">
        <span class="ml">しばる<br />物</span>
        <div class="tiles">{row(OBJECT_CATS, object, meObject)}</div>
      </div>
    </>
  );
}

export function BookPaper({ state, governingNo, onClose }: { state: GameState; governingNo?: number; onClose?: () => void }) {
  const ps = state.precedents;
  return (
    <div class="book-paper">
      <div class="cover">
        <div>
          <div class="t">判例集</div>
          <div class="s">あなたが作った、この国の法律</div>
        </div>
        {onClose && (
          <button class="x" onClick={onClose} aria-label="閉じる">
            閉じる
          </button>
        )}
      </div>
      <div class="pages">
        {ps.length === 0 ? (
          <div class="empty">
            まだ一つもない。
            <br />
            あなたの最初の判決が、
            <br />
            この国の最初の法律になる。
          </div>
        ) : (
          ps.map((p) => (
            <div key={p.no} class={`law ${p.overruledBy !== undefined ? 'dead' : ''} ${p.no === governingNo ? 'hit' : ''}`}>
              <div class="no">
                <b>第{p.no}号</b>
                <span>
                  {p.day}日目・引用{p.citations}回{p.exceptions.length > 0 ? `・ただし書き${p.exceptions.length}` : ''}
                </span>
              </div>
              <div class="tx">
                <PrecedentText p={p} />
              </div>
              {p.overruledBy !== undefined && <div class="haishi">廃止</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
