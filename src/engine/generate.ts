import { DEFENDANT_BY_OBJECT, GEN_TEMPLATES, NAMES, SILLY_NAMES } from '../data/generated';
import { label } from './ontology';
import { pick, type Rng } from './rng';
import type { CaseDef, IssueId, LeafId } from './types';

const fill = (s: string, vars: Record<string, string | number>): string =>
  s.replace(/\{(\w+)\}/g, (m, k) => (k === 'cite' ? m : String(vars[k] ?? m)));

/** 自動生成事件。手書きと完全に同じ扱い（適用・区別・判例変更が効く） */
export function generateCase(issue: IssueId, subject: LeafId, object: LeafId, rng: Rng, allowCite: boolean): CaseDef {
  const tpl = GEN_TEMPLATES[issue];
  const vars = {
    S: label(subject),
    O: label(object),
    n: 2 + Math.floor(rng.next() * 28),
    silly: pick(rng, SILLY_NAMES),
  };
  const plas = tpl.pla.filter((p) => allowCite || !p.cite);
  const pl = pick(rng, plas);
  const df = pick(rng, tpl.def);
  const defendant = pick(rng, DEFENDANT_BY_OBJECT[object] ?? [{ name: '一般市民', art: 'citizen' }]);
  const r = rng.next();
  const lean: CaseDef['crowdLean'] = r < 0.4 ? 'plaintiff' : r < 0.7 ? 'defendant' : 'split';
  return {
    id: `gen:${issue}:${subject}:${object}`,
    issue,
    tier: 1,
    generated: true,
    title: fill(pick(rng, tpl.title), vars),
    subject,
    object,
    plaintiff: { name: pick(rng, NAMES[subject] ?? [label(subject)]), art: subject, lines: pl.lines.map((l) => fill(l, vars)) },
    defendant: { name: defendant.name, sub: defendant.sub, art: defendant.art, lines: df.lines.map((l) => fill(l, vars)) },
    crowdLean: lean,
  };
}
