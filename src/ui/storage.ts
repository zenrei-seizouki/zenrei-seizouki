import { deserialize, serialize } from '../engine/state';
import type { GameState } from '../engine/types';

const SAVE = 'zenrei:save';
const ALBUM = 'zenrei:album';

export interface AlbumEntry {
  count: number;
  first: string; // ISO date
}
export interface CountryRecord {
  name: string;
  ending: string;
  date: string;
  mode: 'normal' | 'daily';
}
export interface Album {
  endings: Record<string, AlbumEntry>;
  countries: CountryRecord[];
  played: number;
  tutorialDone: boolean;
  dailyDone: string[]; // YYYY-MM-DD
}

const emptyAlbum = (): Album => ({ endings: {}, countries: [], played: 0, tutorialDone: false, dailyDone: [] });

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const saveGame = (s: GameState | null): void =>
  safe(() => {
    if (!s || s.finished) localStorage.removeItem(SAVE);
    else localStorage.setItem(SAVE, serialize(s));
  }, undefined);

export const loadGame = (): GameState | null =>
  safe(() => {
    const raw = localStorage.getItem(SAVE);
    return raw ? deserialize(raw) : null;
  }, null);

export const loadAlbum = (): Album =>
  safe(() => {
    const raw = localStorage.getItem(ALBUM);
    return raw ? { ...emptyAlbum(), ...(JSON.parse(raw) as Album) } : emptyAlbum();
  }, emptyAlbum());

export const saveAlbum = (a: Album): void => safe(() => localStorage.setItem(ALBUM, JSON.stringify(a)), undefined);

export const todayKey = (d = new Date()): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
