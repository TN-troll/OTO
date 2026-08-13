import { useState, useCallback } from 'react';

const MAX_COMPARE = 3;

export function useCompare() {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const addToCompare = useCallback((id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id) || prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setCompareIds(prev => prev.filter(cid => cid !== id));
  }, []);

  const isInCompare = useCallback((id: string) => compareIds.includes(id), [compareIds]);
  const clearCompare = useCallback(() => setCompareIds([]), []);

  return { compareIds, addToCompare, removeFromCompare, isInCompare, clearCompare, isFull: compareIds.length >= MAX_COMPARE };
}
