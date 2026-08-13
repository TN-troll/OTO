import { useState, useCallback } from 'react';

const STORAGE_KEY = 'oto-recently-viewed';
const MAX_RECENT = 10;

export function useRecentlyViewed() {
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  });

  const addViewed = useCallback((id: string) => {
    setRecentIds(prev => {
      const next = [id, ...prev.filter(rid => rid !== id)].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recentIds, addViewed };
}
