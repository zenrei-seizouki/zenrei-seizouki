// 記録（ログ）: 今の任期で出たセリフと、各事件で選んだ判決を、上から古い順に並べる。
// 進行（RunState）から組み立て直すので、会話を飛ばした事件のセリフも全部残る。
import type { Side } from './data';
import { choose, lawOf, newRun, stepOf, type Follow, type RunState } from './engine';

export type LogEntry =
  | { kind: 'case'; no: number; label: string; title: string }
  | { kind: 'line'; side: 'pla' | 'def'; who: string; text: string }
  | { kind: 'result'; tone: Side | Follow; head: string; text: string; exception?: string };

/** 今の事件の進み具合（何行目まで出たか・会話が終わったか・選んだ答え） */
export interface Progress {
  line: number;
  done: boolean;
  answer?: Side | Follow;
}

export function runLog(run: RunState, cur?: Progress): LogEntry[] {
  const out: LogEntry[] = [];
  let r = newRun(run.stories, { pair: run.pair });
  for (;;) {
    const st = stepOf(r);
    if (st.kind === 'paper' || r.step > run.step) break;
    const label = st.kind === 'first' ? '最初の事件' : st.kind === 'next' ? '続きの事件' : '交差事件';
    out.push({ kind: 'case', no: r.step + 1, label, title: st.scene.title });
    const lines = [
      ...st.scene.plaintiff.lines.map((text) => ({ kind: 'line' as const, side: 'pla' as const, who: st.scene.plaintiff.name, text })),
      ...st.scene.defendant.lines.map((text) => ({ kind: 'line' as const, side: 'def' as const, who: st.scene.defendant.name, text })),
    ];
    const past = r.step < run.step;
    const shown = past || !cur || cur.done ? lines.length : Math.min(lines.length, cur.line + 1);
    out.push(...lines.slice(0, shown));
    const answer: Side | Follow | undefined = past
      ? st.kind === 'first'
        ? run.picks[st.story.id]
        : st.kind === 'next'
          ? run.follow[st.story.id]
          : run.crossover?.pick
      : cur?.answer;
    if (!answer) break;
    const next = choose(r, answer);
    if (st.kind === 'first' || st.kind === 'cross') {
      const law = st.kind === 'first' ? st.story.verdicts[answer as Side].law : st.cross.verdicts[answer as Side].law;
      out.push({ kind: 'result', tone: answer, head: '判決', text: `${law}。` });
    } else {
      const l = lawOf(next, st.story.id);
      const head = answer === 'follow' ? '判例に従う' : answer === 'except' ? 'ただし書きを付ける' : '判例を取り消す';
      out.push({ kind: 'result', tone: answer, head, text: l.base, exception: l.exception });
    }
    if (!past) break;
    r = next;
  }
  return out;
}
