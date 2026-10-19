// v3 の網羅チェック（vitest で動かす）: 全組み合わせで新聞まで到達するか・交差事件の出方・図鑑の到達可能性・声の有無
//   npx vitest run --config scripts/check-v3.config.ts
import { readFileSync } from 'node:fs';
import { it } from 'vitest';
import { CROSSOVERS, STORIES, STORY_BY_ID, STORY_PAIRS, type Side } from '../src/v3/data';
import { allEndings, choose, lawOf, matchCrossover, newRun, newspaper, stepOf, totalSteps, type Follow, type RunState } from '../src/v3/engine';
import { runLog } from '../src/v3/log';
import { parseCrossovers } from '../src/v3/parse';

const perms = <T>(a: T[]): T[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const sides: Side[] = ['blue', 'red'];
const fs: Follow[] = ['follow', 'except', 'overrule'];

it('全組み合わせで新聞まで到達し、交差事件が条件どおりに出る', () => {
  const problems: string[] = [];
  const reachable = new Map<string, string>();
  let runs = 0;
  const sets: { order: string[]; pair: [string, string] }[] = [];
  for (const pair of STORY_PAIRS)
    for (const third of STORIES.map((s) => s.id).filter((id) => !pair.includes(id))) for (const order of perms([pair[0], pair[1], third])) sets.push({ order, pair });
  for (const { order, pair } of sets)
    for (const a of sides)
      for (const b of sides)
        for (const c of sides)
          for (const fa of fs)
            for (const fb of fs)
              for (const fc of fs)
                for (const xc of sides) {
                  const tag = `${order.join(',')} ${a}/${b}/${c} ${fa}/${fb}/${fc} x=${xc}`;
                  let r: RunState = newRun(order, { pair });
                  const kinds: string[] = [];
                  const totals: number[] = [];
                  let guard = 0;
                  while (stepOf(r).kind !== 'paper') {
                    if (++guard > 10) {
                      problems.push(`${tag}: 終わらない`);
                      break;
                    }
                    const st = stepOf(r);
                    kinds.push(st.kind);
                    totals.push(totalSteps(r));
                    try {
                      runLog(r, { line: 0, done: false });
                      runLog(r, { line: 99, done: true, answer: st.kind === 'next' ? 'follow' : 'blue' });
                    } catch (e) {
                      problems.push(`${tag}: runLog ${e}`);
                    }
                    const ans = st.kind === 'first' ? [a, b, c][r.step] : st.kind === 'next' ? [fa, fb, fc][r.step - 3] : xc;
                    r = choose(r, ans);
                  }
                  runs++;
                  if (kinds.slice(0, 6).join() !== 'first,first,first,next,next,next') problems.push(`${tag}: 順序 ${kinds.join()}`);
                  if (kinds.length !== totalSteps(r)) problems.push(`${tag}: 件数 ${kinds.length} != ${totalSteps(r)}`);
                  for (let i = 1; i < totals.length; i++) if (totals[i] > totals[i - 1]) problems.push(`${tag}: 分母が増えた ${totals.join()}`);
                  if (totals[0] !== 7) problems.push(`${tag}: 最初の分母 ${totals[0]}`);
                  const picks: Record<string, Side> = { [order[0]]: a, [order[1]]: b, [order[2]]: c };
                  const follow: Record<string, Follow> = { [order[0]]: fa, [order[1]]: fb, [order[2]]: fc };
                  const alive = (id: string) => follow[id] !== 'overrule';
                  const pairX = CROSSOVERS.find((x) => x.requires.every((q) => pair.includes(q.story) && picks[q.story] === q.side));
                  const expectPair = alive(pair[0]) && alive(pair[1]) && pairX ? pairX.id : undefined;
                  const anyX = CROSSOVERS.find((x) => x.requires.every((q) => order.includes(q.story) && picks[q.story] === q.side && alive(q.story)));
                  const expect = expectPair ?? anyX?.id;
                  const got = r.crossover?.id;
                  if (got !== expect) problems.push(`${tag}: 交差事件 ${got} (期待 ${expect})`);
                  if (got && (totals[totals.length - 1] !== 7 || kinds[6] !== 'cross')) problems.push(`${tag}: 交差事件なのに分母 ${totals.join()}`);
                  let p;
                  try {
                    p = newspaper(r);
                  } catch (e) {
                    problems.push(`${tag}: newspaper ${e}`);
                    continue;
                  }
                  if (p.laws.length !== 3 || p.side.length > 2 || !p.main.hl || !p.main.ending) problems.push(`${tag}: 新聞 ${JSON.stringify(p)}`);
                  if (!reachable.has(p.main.endingId)) reachable.set(p.main.endingId, tag);
                  for (const id of order) {
                    const l = lawOf(r, id);
                    if (follow[id] === 'except' && !l.exception) problems.push(`${tag}: ただし書きが無い ${id}`);
                    if (follow[id] === 'overrule' && (!l.struck || !l.regret)) problems.push(`${tag}: 取り消しの表示が無い ${id}`);
                  }
                }
  const all = allEndings();
  const unreachable = all.filter((e) => !reachable.has(e.id));
  console.log(`組み合わせ: ${sets.length} 組 × 8 × 27 × 2 = ${runs} プレイ。問題 ${problems.length} 件`);
  console.log(problems.slice(0, 30).join('\n'));
  console.log(`図鑑 ${all.length} 種のうち、主見出しとして到達できる物 ${reachable.size}。到達できない: ${unreachable.map((e) => e.id).join(', ') || 'なし'}`);
  for (const id of ['patchwork', 'overruled', 'wing-blue', 'sign-red', 'chatbot-blue']) console.log(`  ${id} ← ${reachable.get(id)}`);
  // 同名の結末
  const byName = new Map<string, string[]>();
  for (const e of all) byName.set(e.name, [...(byName.get(e.name) ?? []), e.id]);
  for (const [n, ids] of byName) if (ids.length > 1) console.log(`同名の結末: ${n} = ${ids.join(', ')}`);
});

it('台本の予告（→）・条件の判決文・ただし書きが続きの事件と合っているか（機械的に確かめられる分）', () => {
  // 交差事件の条件に書いてある判決文（括弧内）が、本の判決文と一致するか
  const md = readFileSync('docs/fable_crossovers.md', 'utf8');
  for (const x of parseCrossovers(md)) {
    const cond = md.split('\n').find((l) => l.startsWith('**条件**') && md.indexOf(l) > md.indexOf(`## ${x.id.toUpperCase()}.`))!;
    for (const m of cond.matchAll(/#(\d+)[^#🟦🟥]*?(🟦|🟥)（(.+?)）/g)) {
      const s = STORIES.find((st) => st.no === Number(m[1]))!;
      const law = s.verdicts[m[2] === '🟦' ? 'blue' : 'red'].law;
      if (law !== m[3]) console.log(`${x.id}: 条件の判決文が違う #${m[1]} ${m[2]} 「${m[3]}」 ≠ 「${law}」`);
    }
  }
  // 予告・ただし書き・続きの事件の相手を並べて目視用に出す
  for (const s of STORIES)
    for (const side of sides) {
      const v = s.verdicts[side];
      console.log(`#${s.no} ${side} 予告「${v.teaser}」 → 続き「${v.next.title}」 原告=${v.next.plaintiff.name} 被告=${v.next.defendant.name} ／ ${v.exception} ／ regret: ${v.regret.by}「${v.regret.text}」 ／ 最初の原告=${s.first.plaintiff.name}`);
    }
});

it('声が無いセリフ', () => {
  const manifest = JSON.parse(readFileSync('public/audio/voice/manifest.json', 'utf8')) as Record<string, unknown>;
  const texts = new Map<string, string>();
  const addScene = (where: string, sc: { plaintiff: { lines: string[] }; defendant: { lines: string[] } }) => {
    for (const l of [...sc.plaintiff.lines, ...sc.defendant.lines]) if (!texts.has(l)) texts.set(l, where);
  };
  for (const s of STORIES) {
    addScene(`#${s.no} 最初`, s.first);
    for (const side of sides) {
      addScene(`#${s.no} ${side} 続き`, s.verdicts[side].next);
      texts.set(s.verdicts[side].law, `#${s.no} ${side} 判決文`);
    }
  }
  for (const x of CROSSOVERS) {
    addScene(`${x.id}`, x.scene);
    for (const side of sides) texts.set(x.verdicts[side].law, `${x.id} ${side} 判決文`);
  }
  for (const t of ['判決。', '認容。', '棄却。', '取り消し。', '号外、号外！']) texts.set(t, '決まり文句');
  const missing = [...texts].filter(([t]) => !manifest[t]);
  console.log(`セリフ・判決文 ${texts.size} 件のうち、声が無い物 ${missing.length} 件`);
  for (const [t, w] of missing) console.log(`  ${w}: ${t}`);
  const unused = Object.keys(manifest).filter((k) => !texts.has(k));
  console.log(`manifest にあるが使われない物 ${unused.length} 件: ${unused.slice(0, 10).join(' / ')}`);
});
