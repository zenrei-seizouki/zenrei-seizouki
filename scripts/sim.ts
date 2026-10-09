// バランス用シミュレーター: `npm run sim [回数=1000]`
// 方針ごとに N プレイして、判例適用率・連鎖事件率・罷免率・エンディング分布・クラッシュ数を出す（DESIGN §8.3）
import { primaryEnding, unlockedEndings } from '../src/engine/endings';
import { applyRuling, optionsFor } from '../src/engine/ruling';
import { makeRng, type Rng } from '../src/engine/rng';
import { advance, newGame } from '../src/engine/state';
import type { Choice, GameState, Level, Verdict } from '../src/engine/types';

type Policy = (s: GameState, r: Rng) => Choice;

const pickV = (r: Rng): Verdict => (r.next() < 0.5 ? 'grant' : 'deny');
const crowdV = (s: GameState, r: Rng): Verdict => {
  const l = s.currentCase!.crowdLean;
  return l === 'plaintiff' ? 'grant' : l === 'defendant' ? 'deny' : pickV(r);
};

/** 判決の向きを v と決めたとき、状況に応じた選択を作る */
function decide(s: GameState, r: Rng, v: Verdict, scope: (r: Rng) => Level, mode: { distinguish: number; extend: number }): Choice {
  const o = optionsFor(s);
  const k = o.verdictKind[v];
  if (k === 'new') return { kind: 'new', verdict: v, level: scope(r) };
  if (k === 'follow') {
    if (o.extendLevels.length && r.next() < mode.extend) return { kind: 'extend', verdict: v, level: o.extendLevels[o.extendLevels.length - 1] };
    return { kind: 'follow', verdict: v };
  }
  if (r.next() < mode.distinguish) return { kind: 'distinguish', verdict: v, exception: o.distinguishNodes[Math.floor(r.next() * 2)] };
  return { kind: 'overrule', verdict: v, level: scope(r) };
}

const POLICIES: Record<string, Policy> = {
  '常に広く': (s, r) => decide(s, r, pickV(r), () => 2, { distinguish: 0.5, extend: 0 }),
  '常に狭く': (s, r) => decide(s, r, pickV(r), () => 0, { distinguish: 0.5, extend: 0 }),
  'ランダム': (s, r) => decide(s, r, pickV(r), (r2) => Math.floor(r2.next() * 3) as Level, { distinguish: 0.5, extend: 0.3 }),
  '常に世論に従う': (s, r) => decide(s, r, crowdV(s, r), () => 1, { distinguish: 0.5, extend: 0.2 }),
  '判例どおり(慎重)': (s, r) => {
    const g = optionsFor(s).governing;
    return decide(s, r, g ? g.verdict : crowdV(s, r), () => 1, { distinguish: 1, extend: 0.3 });
  },
};

interface Stats {
  plays: number;
  crashes: number;
  cases: number;
  governed: number;
  chain: number;
  generated: number;
  dismissed: number;
  daysSum: number;
  authSum: number;
  threePlus: number;
  endings: Map<string, number>;
  unlockedDistinct: Set<string>;
  crisis: number;
  noGovernedPlays: number;
}

function runPolicy(name: string, N: number): Stats {
  const st: Stats = { plays: N, crashes: 0, cases: 0, governed: 0, chain: 0, generated: 0, dismissed: 0, daysSum: 0, authSum: 0, threePlus: 0, endings: new Map(), unlockedDistinct: new Set(), crisis: 0, noGovernedPlays: 0 };
  const policy = POLICIES[name];
  for (let i = 1; i <= N; i++) {
    const r = makeRng(i * 2654435761);
    try {
      let s = newGame({ seed: i * 31 + 7, opening: i % 2 === 0 });
      let governedThisPlay = 0;
      for (let d = 0; d < 10; d++) {
        const c = s.currentCase!;
        if (c.crisis) st.crisis++;
        const res = applyRuling(s, policy(s, r));
        s = res.state;
        const lg = s.log[s.log.length - 1];
        st.cases++;
        if (lg.governedBy !== undefined) {
          st.governed++;
          governedThisPlay++;
        }
        if (lg.chain) st.chain++;
        if (c.generated) st.generated++;
        s = advance(s);
        if (s.finished) break;
      }
      if (s.authority <= 0) st.dismissed++;
      st.daysSum += s.log.length;
      st.authSum += s.authority;
      if (governedThisPlay >= 3) st.threePlus++;
      if (governedThisPlay === 0) st.noGovernedPlays++;
      const e = primaryEnding(s);
      st.endings.set(e.name, (st.endings.get(e.name) ?? 0) + 1);
      for (const u of unlockedEndings(s)) st.unlockedDistinct.add(u.name);
    } catch (err) {
      st.crashes++;
      if (st.crashes <= 3) console.error(`  [crash] policy=${name} play=${i}:`, (err as Error).message);
    }
  }
  return st;
}

const N = Number(process.argv[2] ?? 1000);
const pct = (a: number, b: number) => `${((a / b) * 100).toFixed(1)}%`;
console.log(`\n前例製造機 シミュレーション（各方針 ${N} プレイ）\n`);
let totalCrashes = 0;
const all = new Map<string, number>();
for (const name of Object.keys(POLICIES)) {
  const s = runPolicy(name, N);
  totalCrashes += s.crashes;
  console.log(`■ ${name}`);
  console.log(`  判例が適用された事件   ${pct(s.governed, s.cases)}   （目標 40〜60%）`);
  console.log(`  うち1プレイで3回以上   ${pct(s.threePlus, s.plays)}   （MVP: 最低3回）`);
  console.log(`  連鎖事件の出現率       ${pct(s.chain, s.cases)}`);
  console.log(`  自動生成事件の割合     ${pct(s.generated, s.cases)}   （目標 20〜30%）`);
  console.log(`  危機事件の出現         ${(s.crisis / s.plays).toFixed(2)} 件/プレイ`);
  console.log(`  罷免率                 ${pct(s.dismissed, s.plays)}   （ランダムで 10〜25%）`);
  console.log(`  平均 裁いた件数 / 最終威信  ${(s.daysSum / s.plays).toFixed(1)} 件 / ${(s.authSum / s.plays).toFixed(1)}`);
  console.log(`  クラッシュ             ${s.crashes}`);
  const top = [...s.endings.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`  エンディング分布(大見出し) ${top.length}種類: ` + top.slice(0, 8).map(([n, c]) => `${n} ${pct(c, s.plays)}`).join(' / '));
  console.log(`  解除した名前付き(のべ)  ${s.unlockedDistinct.size}種\n`);
  for (const u of s.unlockedDistinct) all.set(u, (all.get(u) ?? 0) + 1);
}
console.log(`全方針で到達できた名前付きエンディング: ${all.size}種`);
console.log(`クラッシュ合計: ${totalCrashes}`);
process.exit(totalCrashes ? 1 : 0);
