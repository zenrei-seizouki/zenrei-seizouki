export interface Rng {
  next(): number;
  state(): number;
}

/** mulberry32。状態(32bit整数)をセーブできる */
export function makeRng(state: number): Rng {
  let a = state >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    state: () => a,
  };
}

export const pick = <T,>(r: Rng, arr: readonly T[]): T => arr[Math.floor(r.next() * arr.length)];

export function weightedPick<T>(r: Rng, items: readonly T[], weight: (t: T) => number): T {
  const ws = items.map(weight);
  const total = ws.reduce((a, b) => a + b, 0);
  let x = r.next() * total;
  for (let i = 0; i < items.length; i++) {
    x -= ws[i];
    if (x <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
