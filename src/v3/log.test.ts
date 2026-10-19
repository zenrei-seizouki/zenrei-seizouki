import { describe, expect, it } from 'vitest';
import { STORY_BY_ID } from './data';
import { choose, newRun, stepOf } from './engine';
import { runLog } from './log';

const stories = ['wing', 'ice', 'fighter'];

describe('記録（ログ）', () => {
  it('始めたばかりは、1件目の見出しと、出たところまでのセリフ', () => {
    const log = runLog(newRun(stories), { line: 1, done: false });
    expect(log[0]).toMatchObject({ kind: 'case', no: 1, label: '最初の事件', title: '骨なし手羽先事件' });
    const lines = log.filter((e) => e.kind === 'line');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ side: 'pla', who: STORY_BY_ID.wing.first.plaintiff.name, text: STORY_BY_ID.wing.first.plaintiff.lines[0] });
  });

  it('会話を飛ばしても、その事件のセリフは全部残る', () => {
    const sc = STORY_BY_ID.wing.first;
    const log = runLog(newRun(stories), { line: 0, done: true });
    expect(log.filter((e) => e.kind === 'line')).toHaveLength(sc.plaintiff.lines.length + sc.defendant.lines.length);
  });

  it('時系列（上が古い）で、選んだ判決・従う/ただし書き/取り消しが入る。最後まで遊ぶと全事件', () => {
    let r = newRun(stories);
    for (const a of ['blue', 'red', 'blue', 'follow', 'except', 'overrule'] as const) r = choose(r, a);
    expect(stepOf(r).kind).toBe('paper');
    const log = runLog(r);
    expect(log.filter((e) => e.kind === 'case').map((e) => (e.kind === 'case' ? e.no : 0))).toEqual([1, 2, 3, 4, 5, 6]);
    const results = log.filter((e) => e.kind === 'result');
    expect(results.map((e) => (e.kind === 'result' ? e.head : ''))).toEqual(['判決', '判決', '判決', '判例に従う', 'ただし書きを付ける', '判例を取り消す']);
    expect(results[0]).toMatchObject({ tone: 'blue', text: '名前に書いた物は、中に入れなければならない。' });
    expect(results[4]).toMatchObject({ tone: 'except', exception: STORY_BY_ID.ice.verdicts.red.exception });
    // 各事件の見出しの後に、その事件のセリフと結果が続く
    const i4 = log.findIndex((e) => e.kind === 'case' && e.no === 4);
    expect(log[i4 + 1]).toMatchObject({ kind: 'line', text: STORY_BY_ID.wing.verdicts.blue.next.plaintiff.lines[0] });
  });

  it('判決を選んだ直後（号外の間）も、その判決が記録に出る', () => {
    const log = runLog(newRun(stories), { line: 3, done: true, answer: 'red' });
    expect(log.at(-1)).toMatchObject({ kind: 'result', tone: 'red', text: `${STORY_BY_ID.wing.verdicts.red.law}。` });
  });
});
