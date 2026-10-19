// 台本（docs/fable_cases.md / docs/fable_crossovers.md）を読み込んで、本と交差事件のデータにする。
// セリフ・判決文・予告・100年後は台本の文字列をそのまま使う（一字も変えない）。
// 台本に無い物（立ち絵・ただし書き・取り消しの一言）は extras.ts で足す。

export interface RawParty {
  name: string;
  lines: string[];
}
export interface RawScene {
  title: string;
  plaintiff: RawParty;
  defendant: RawParty;
}
export interface RawVerdict {
  law: string;
  teaser: string;
  next: RawScene;
  future: { hl: string; ending: string };
}
export interface RawStory {
  no: number;
  title: string;
  issue: string;
  first: RawScene;
  verdicts: { blue: RawVerdict; red: RawVerdict };
}
export interface RawCrossover {
  id: string;
  title: string;
  requires: { no: number; side: 'blue' | 'red' }[];
  scene: RawScene;
  verdicts: { blue: { law: string; future: { hl: string; ending: string } }; red: { law: string; future: { hl: string; ending: string } } };
}

const sideOf = (s: string): 'blue' | 'red' => (s.includes('🟦') ? 'blue' : 'red');

/** 「## 1. 骨なし手羽先事件（表示どおり）」で区切る */
function sections(md: string, head: RegExp): { head: RegExpExecArray; body: string[] }[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: { head: RegExpExecArray; body: string[] }[] = [];
  let cur: { head: RegExpExecArray; body: string[] } | null = null;
  for (const l of lines) {
    const m = head.exec(l);
    if (m) {
      cur = { head: m, body: [] };
      out.push(cur);
    } else if (/^## /.test(l)) {
      cur = null;
    } else if (cur) cur.body.push(l);
  }
  return out;
}

/** 最初の事件・交差事件の形: **原告: 名前** の下に「- セリフ」 */
function parseBoldParties(body: string[], title: string): RawScene {
  const parties: Record<'原告' | '被告', RawParty> = { 原告: { name: '', lines: [] }, 被告: { name: '', lines: [] } };
  let who: '原告' | '被告' | null = null;
  for (const l of body) {
    const m = /^\*\*(原告|被告): (.+)\*\*\s*$/.exec(l);
    if (m) {
      who = m[1] as '原告' | '被告';
      parties[who].name = m[2].trim();
      continue;
    }
    if (/^\*\*/.test(l) || /^### /.test(l)) {
      who = null;
      continue;
    }
    const d = /^- (.+)$/.exec(l);
    if (who && d) parties[who].lines.push(d[1].trim());
  }
  return { title, plaintiff: parties.原告, defendant: parties.被告 };
}

/** 続きの事件の形: 「- 原告: 名前」の下に「  - セリフ」 */
function parseIndentedParties(body: string[], title: string): RawScene {
  const parties: Record<'原告' | '被告', RawParty> = { 原告: { name: '', lines: [] }, 被告: { name: '', lines: [] } };
  let who: '原告' | '被告' | null = null;
  for (const l of body) {
    const m = /^- (原告|被告): (.+)$/.exec(l);
    if (m) {
      who = m[1] as '原告' | '被告';
      parties[who].name = m[2].trim();
      continue;
    }
    const d = /^\s+- (.+)$/.exec(l);
    if (who && d) parties[who].lines.push(d[1].trim());
  }
  return { title, plaintiff: parties.原告, defendant: parties.被告 };
}

/** 「### 判決文」の中: - 🟦 **判決文** / 　- → 予告 */
function parseLaws(body: string[]): Record<'blue' | 'red', { law: string; teaser: string }> {
  const out: Record<string, { law: string; teaser: string }> = {};
  let side: 'blue' | 'red' | null = null;
  for (const l of body) {
    const m = /^- (🟦|🟥) \*\*(.+?)\*\*/.exec(l);
    if (m) {
      side = sideOf(m[1]);
      out[side] = { law: m[2].trim(), teaser: '' };
      continue;
    }
    const t = /^\s+- → (.+)$/.exec(l);
    if (side && t) out[side].teaser = t[1].trim();
  }
  return out as Record<'blue' | 'red', { law: string; teaser: string }>;
}

/** 「- 🟦 見出し: **〜** ／ エンディング: **〜**」 */
function parseFutures(body: string[]): Record<'blue' | 'red', { hl: string; ending: string }> {
  const out: Record<string, { hl: string; ending: string }> = {};
  for (const l of body) {
    const m = /^- (🟦|🟥) 見出し: \*\*(.+?)\*\* ／ エンディング: \*\*(.+?)\*\*/.exec(l);
    if (m) out[sideOf(m[1])] = { hl: m[2].trim(), ending: m[3].trim() };
  }
  return out as Record<'blue' | 'red', { hl: string; ending: string }>;
}

/** 本文を「### 見出し」ごとに分ける */
function subsections(body: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  let key = '';
  for (const l of body) {
    const m = /^### (.+)$/.exec(l);
    if (m) {
      key = m[1].trim();
      out[key] = [];
    } else if (key) out[key].push(l);
  }
  return out;
}

export function parseStories(md: string): RawStory[] {
  return sections(md, /^## (\d+)\. (.+?)（(.+?)）\s*$/).map(({ head, body }) => {
    const no = Number(head[1]);
    const title = head[2].trim();
    const sub = subsections(body);
    const first = parseBoldParties(sub['最初の事件'] ?? [], title);
    const laws = parseLaws(sub['判決文'] ?? []);
    const futures = parseFutures(sub['100年後'] ?? []);
    // 続きの事件: 「**🟦のあと: たい焼き事件**」で2つに分ける
    const nexts: Record<string, RawScene> = {};
    let cur: { side: 'blue' | 'red'; title: string; lines: string[] } | null = null;
    const flush = () => {
      if (cur) nexts[cur.side] = parseIndentedParties(cur.lines, cur.title);
    };
    for (const l of sub['続きの事件'] ?? []) {
      const m = /^\*\*(🟦|🟥)のあと: (.+)\*\*\s*$/.exec(l);
      if (m) {
        flush();
        cur = { side: sideOf(m[1]), title: m[2].trim(), lines: [] };
      } else if (cur) cur.lines.push(l);
    }
    flush();
    const v = (side: 'blue' | 'red'): RawVerdict => ({ ...laws[side], next: nexts[side], future: futures[side] });
    return { no, title, issue: head[3].trim(), first, verdicts: { blue: v('blue'), red: v('red') } };
  });
}

export function parseCrossovers(md: string): RawCrossover[] {
  return sections(md, /^## (X\d+)\. (.+?)\s*$/).map(({ head, body }) => {
    const id = head[1].toLowerCase();
    const title = head[2].trim();
    const cond = body.find((l) => l.startsWith('**条件**')) ?? '';
    const requires = [...cond.matchAll(/#(\d+)[^#🟦🟥]*?(🟦|🟥)/g)].map((m) => ({ no: Number(m[1]), side: sideOf(m[2]) }));
    // 判決文・100年後は「**判決文**」「**100年後**」の後の箇条書き
    const idxLaw = body.findIndex((l) => l.trim() === '**判決文**');
    const idxFut = body.findIndex((l) => l.trim() === '**100年後**');
    const sceneLines = body.slice(0, idxLaw >= 0 ? idxLaw : body.length).filter((l) => !l.startsWith('**条件**'));
    const laws = parseLaws(idxLaw >= 0 ? body.slice(idxLaw + 1, idxFut >= 0 ? idxFut : undefined) : []);
    const futures = parseFutures(idxFut >= 0 ? body.slice(idxFut + 1) : []);
    return {
      id,
      title,
      requires,
      scene: parseBoldParties(sceneLines, title),
      verdicts: {
        blue: { law: laws.blue?.law ?? '', future: futures.blue },
        red: { law: laws.red?.law ?? '', future: futures.red },
      },
    };
  });
}
