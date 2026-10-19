// 音のファイルと台本の対応（声が無いセリフは無音になるので、ここで気づけるようにする）
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CROSSOVERS, STORIES } from './data';

const DIR = 'public/audio';
const manifest: Record<string, { file: string; name: string }> = JSON.parse(readFileSync(`${DIR}/voice/manifest.json`, 'utf8'));
const credits: string[] = JSON.parse(readFileSync(`${DIR}/voice/credits.json`, 'utf8'));

const allLines = () => {
  const out: string[] = [];
  for (const s of STORIES) {
    for (const sc of [s.first, s.verdicts.blue.next, s.verdicts.red.next]) out.push(...sc.plaintiff.lines, ...sc.defendant.lines);
    out.push(s.verdicts.blue.law, s.verdicts.red.law);
  }
  for (const x of CROSSOVERS) out.push(...x.scene.plaintiff.lines, ...x.scene.defendant.lines, x.verdicts.blue.law, x.verdicts.red.law);
  return out;
};

describe('声（VOICEVOX）', () => {
  it('台本の全セリフ・判決文に声がある（無ければ npm run voice）', () => {
    const missing = allLines().filter((l) => !manifest[l]);
    expect(missing).toEqual([]);
  });
  it('決まり文句（判決。認容。棄却。取り消し。号外）にも声がある', () => {
    for (const t of ['判決。', '認容。', '棄却。', '取り消し。', '号外、号外！']) expect(manifest[t], t).toBeTruthy();
  });
  it('manifest のファイルが全部ある', () => {
    for (const [t, v] of Object.entries(manifest)) expect(existsSync(`${DIR}/voice/${v.file}`), t).toBe(true);
  });
  it('クレジットに、使った話者が全員載っている（VOICEVOX の利用規約）', () => {
    for (const v of Object.values(manifest)) expect(credits).toContain(`VOICEVOX:${v.name}`);
  });
});

describe('効果音・BGM', () => {
  it('画面で鳴らす名前のファイルがある（無くても無音で動くが、今はそろっている）', () => {
    for (const n of ['gavel', 'stamp', 'paper', 'extra', 'murmur', 'strike', 'tap']) expect(existsSync(`${DIR}/sfx/${n}.mp3`), n).toBe(true);
    for (const n of ['court', 'extra', 'future']) expect(existsSync(`${DIR}/bgm/${n}.mp3`), n).toBe(true);
  });
});
