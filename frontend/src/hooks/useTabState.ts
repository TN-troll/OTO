import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export type ActiveTab = 'listings' | 'map';

export function useTabState(): {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: ActiveTab =
    searchParams.get('view') === 'map' ? 'map' : 'listings';

  const setActiveTab = useCallback(
    (tab: ActiveTab) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === 'map') {
            next.set('view', 'map');
          } else {
            next.delete('view');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return { activeTab, setActiveTab };
}
