import { memo } from 'react';
import { useCompare } from '../hooks/useCompare';
import { useFavorites } from '../hooks/useFavorites';
import { useLanguage } from '../i18n';

interface MobileBottomNavProps {
  activeTab?: 'listings' | 'map';
  onTabChange?: (tab: 'listings' | 'map') => void;
}

function MobileBottomNavInner({ activeTab, onTabChange }: MobileBottomNavProps) {
  const { count: compareCount } = useCompare();
  const { favorites } = useFavorites();
  const { locale } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-surface-950/95 backdrop-blur-xl md:hidden">
      <div className="flex h-14 items-center justify-around">
        {/* Search */}
        <button
          type="button"
          onClick={() => onTabChange?.('listings')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 ${activeTab === 'listings' ? 'text-brand-accent' : 'text-surface-400'}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <span className="text-[10px] font-medium">{locale === 'nl' ? 'Zoeken' : 'Search'}</span>
        </button>

        {/* Map */}
        <button
          type="button"
          onClick={() => onTabChange?.('map')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 ${activeTab === 'map' ? 'text-brand-accent' : 'text-surface-400'}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span className="text-[10px] font-medium">{locale === 'nl' ? 'Kaart' : 'Map'}</span>
        </button>

        {/* Favorites */}
        <a href="/favorites" className="relative flex flex-col items-center gap-0.5 px-3 py-1 text-surface-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {favorites.length > 0 && (
            <span className="absolute -right-0.5 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {favorites.length}
            </span>
          )}
          <span className="text-[10px] font-medium">Favorites</span>
        </a>

        {/* Compare */}
        <a href="/compare" className="relative flex flex-col items-center gap-0.5 px-3 py-1 text-surface-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          {compareCount > 0 && (
            <span className="absolute -right-0.5 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-accent px-1 text-[9px] font-bold text-white">
              {compareCount}
            </span>
          )}
          <span className="text-[10px] font-medium">{locale === 'nl' ? 'Vergelijk' : 'Compare'}</span>
        </a>
      </div>
    </nav>
  );
}

export const MobileBottomNav = memo(MobileBottomNavInner);
