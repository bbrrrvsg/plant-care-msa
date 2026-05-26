import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

// SecureStore 키는 영숫자/./-/_만 허용해서 콜론은 못 씀
const KEY_PREFIX = 'bookFavorites_';

let favorites: Set<number> = new Set();
let activeUserId: number | null = null;
const listeners: Array<() => void> = [];

function notify() { listeners.forEach((fn) => fn()); }

function storageKey(userId: number) { return `${KEY_PREFIX}${userId}`; }

async function persist() {
  if (activeUserId == null) return;
  try {
    const arr = Array.from(favorites);
    await SecureStore.setItemAsync(storageKey(activeUserId), JSON.stringify(arr));
  } catch (err) {
    console.warn('찜 목록 저장 실패:', err);
  }
}

export async function hydrateFavorites(userId: number | null) {
  activeUserId = userId;
  if (userId == null) {
    favorites = new Set();
    notify();
    return;
  }
  try {
    const raw = await SecureStore.getItemAsync(storageKey(userId));
    const arr: unknown = raw ? JSON.parse(raw) : [];
    favorites = new Set(Array.isArray(arr) ? arr.filter((x): x is number => typeof x === 'number') : []);
  } catch (err) {
    console.warn('찜 목록 로드 실패:', err);
    favorites = new Set();
  }
  notify();
}

export function isFavorite(speciesCode: number): boolean {
  return favorites.has(speciesCode);
}

export async function toggleFavorite(speciesCode: number): Promise<boolean> {
  const next = new Set(favorites);
  const nowFavorited = !next.has(speciesCode);
  if (nowFavorited) next.add(speciesCode); else next.delete(speciesCode);
  favorites = next;
  notify();
  await persist();
  return nowFavorited;
}

export function getFavoriteCodes(): number[] {
  return Array.from(favorites);
}

// 컴포넌트에서 찜 변경에 반응하도록 구독하는 훅. 반환값은 현재 Set 스냅샷.
export function useFavorites(): Set<number> {
  const [snapshot, setSnapshot] = useState<Set<number>>(favorites);
  useEffect(() => {
    const fn = () => setSnapshot(new Set(favorites));
    listeners.push(fn);
    return () => { const idx = listeners.indexOf(fn); if (idx !== -1) listeners.splice(idx, 1); };
  }, []);
  return snapshot;
}
