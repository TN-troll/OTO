import { useRef, useCallback } from 'react';
import { useLanguage } from '../i18n';
import type { ActiveTab } from '../hooks/useTabState';

interface TabBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const tabs: { key: ActiveTab; labelKey: 'tabListings' | 'tabMap' }[] = [
  { key: 'listings', labelKey: 'tabListings' },
  { key: 'map', labelKey: 'tabMap' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const { t } = useLanguage();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = tabs.findIndex((tab) => tab.key === activeTab);
      let targetIndex: number | null = null;

      switch (e.key) {
        case 'ArrowRight':
          targetIndex = (currentIndex + 1) % tabs.length;
          break;
        case 'ArrowLeft':
          targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          targetIndex = 0;
          break;
        case 'End':
          targetIndex = tabs.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onTabChange(tabs[currentIndex].key);
          return;
        default:
          return;
      }

      e.preventDefault();
      tabRefs.current[targetIndex]?.focus();
      onTabChange(tabs[targetIndex].key);
    },
    [activeTab, onTabChange],
  );

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className="relative mx-auto flex w-full max-w-md items-center gap-1 rounded-2xl border border-white/20 bg-white/10 p-1 shadow-glass backdrop-blur-lg sm:w-auto sm:max-w-none sm:inline-flex dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-glass-dark"
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            ref={(el) => { tabRefs.current[index] = el; }}
            id={`tab-${tab.key}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.key}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.key)}
            className={`
              relative z-10 flex-1 rounded-xl px-6 py-2.5 text-sm font-medium
              transition-all duration-300 ease-spring
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1
              sm:flex-none sm:px-8
              ${
                isActive
                  ? 'bg-white/20 text-surface-900 shadow-glass backdrop-blur-lg dark:bg-white/[0.12] dark:text-white'
                  : 'text-surface-500 hover:bg-white/10 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-white/[0.06] dark:hover:text-surface-200'
              }
            `}
          >
            {t[tab.labelKey]}
          </button>
        );
      })}
    </div>
  );
}
