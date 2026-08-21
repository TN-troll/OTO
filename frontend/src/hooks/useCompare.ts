import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'oto-compare-ids';
const MAX_COMPARE = 4;

// External store for cross-component sync without context
let compareIds: string[] = [];
const listeners = new Set<() => void>();

function getSnapshot() { return compareIds; }
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function notify() { listeners.forEach(l => l()); }

// Initialize from localStorage
try {
  compareIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
} catch { compareIds = []; }

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds)); } catch {}
}

export function useCompare() {
  const ids = useSyncExternalStore(subscribe, getSnapshot);

  const addToCompare = useCallback((id: string) => {
    if (compareIds.includes(id) || compareIds.length >= MAX_COMPARE) return;
    compareIds = [...compareIds, id];
    persist();
    notify();
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    compareIds = compareIds.filter(cid => cid !== id);
    persist();
    notify();
  }, []);

  const isInCompare = useCallback((id: string) => ids.includes(id), [ids]);

  const clearCompare = useCallback(() => {
    compareIds = [];
    persist();
    notify();
  }, []);

  return {
    compareIds: ids,
    addToCompare,
    removeFromCompare,
    isInCompare,
    clearCompare,
    isFull: ids.length >= MAX_COMPARE,
    count: ids.length,
  };
}
