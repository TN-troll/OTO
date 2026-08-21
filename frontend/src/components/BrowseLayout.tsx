import { lazy, Suspense, Component, type ReactNode } from 'react';
import { useTabState } from '../hooks/useTabState';
import { Header } from './Header';
import { NotificationPromptBanner } from './NotificationPreferences';
import { FilterPanel } from './FilterPanel';
import { RecentlyViewedStrip } from './RecentlyViewedStrip';
import { BrowsePage } from '../pages/BrowsePage';
import { FilterProvider } from '../hooks/FilterContext';
import { useLanguage } from '../i18n';

const MapPage = lazy(() => import('../pages/MapPage'));

// ─── Internal layout sub-components ────────────────────────────────────────────

/**
 * Desktop sidebar — sticky, no visible scrollbar, translucent glass styling.
 * Shared between listings and map views.
 */
function FilterSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 overflow-y-auto border-r border-white/[0.08] bg-surface-950/60 p-6 backdrop-blur-glass [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:block">
      <FilterPanel />
    </aside>
  );
}

/** Mobile filter: FilterPanel handles its own MobileFilterDrawer rendering when viewport < 768px */
function MobileFilterOverlay() {
  return (
    <div className="md:hidden">
      <FilterPanel />
    </div>
  );
}

/**
 * View toggle — compact pill buttons for switching between Listings and Map.
 * Rendered in the top bar area.
 */
function ViewTogglePill({ activeTab, onTabChange }: { activeTab: 'listings' | 'map'; onTabChange: (tab: 'listings' | 'map') => void }) {
  const { t } = useLanguage();

  return (
    <div role="tablist" className="inline-flex items-center gap-0.5 rounded-full border border-white/[0.12] bg-white/[0.06] p-0.5 backdrop-blur-md">
      <button
        type="button"
        role="tab"
        id="tab-listings"
        aria-selected={activeTab === 'listings'}
        aria-controls="tabpanel-listings"
        tabIndex={activeTab === 'listings' ? 0 : -1}
        onClick={() => onTabChange('listings')}
        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-[background-color,color] duration-150 ${
          activeTab === 'listings'
            ? 'bg-white/[0.15] text-white shadow-sm'
            : 'text-surface-400 hover:text-surface-200'
        }`}
      >
        {/* Grid/cards icon — represents listing overview */}
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
        {t.tabListings}
      </button>
      <button
        type="button"
        role="tab"
        id="tab-map"
        aria-selected={activeTab === 'map'}
        aria-controls="tabpanel-map"
        tabIndex={activeTab === 'map' ? 0 : -1}
        onClick={() => onTabChange('map')}
        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-[background-color,color] duration-150 ${
          activeTab === 'map'
            ? 'bg-white/[0.15] text-white shadow-sm'
            : 'text-surface-400 hover:text-surface-200'
        }`}
      >
        {/* Map pin icon — represents geographic view */}
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        {t.tabMap}
      </button>
    </div>
  );
}

/** Apple Glass shimmer loading skeleton for the lazy-loaded MapPage */
export function MapLoadingSkeleton() {
  const { t } = useLanguage();

  return (
    <div className="relative flex min-h-[400px] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-white/20 bg-white/60 p-8 backdrop-blur-glass dark:border-white/[0.08] dark:bg-white/[0.04]">
      <div className="absolute inset-0 flex flex-col gap-3 p-6 opacity-30">
        <div className="h-1/3 w-full rounded-xl bg-surface-200 dark:bg-surface-700" />
        <div className="flex flex-1 gap-3">
          <div className="w-2/3 rounded-xl bg-surface-200 dark:bg-surface-700" />
          <div className="w-1/3 rounded-xl bg-surface-200 dark:bg-surface-700" />
        </div>
        <div className="h-1/4 w-full rounded-xl bg-surface-200 dark:bg-surface-700" />
      </div>
      <div className="absolute inset-0 animate-shimmer motion-reduce:animate-none bg-gradient-to-r from-transparent via-white/40 to-transparent bg-[length:200%_100%] dark:via-white/[0.06]" />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-200 border-t-brand dark:border-surface-700 dark:border-t-brand" />
        <p className="text-sm font-medium text-surface-600 dark:text-surface-300">{t.loadingMap}</p>
      </div>
    </div>
  );
}

/** Glass-styled error fallback for MapPage load failures */
export function MapErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/20 bg-white/10 px-8 py-10 shadow-glass backdrop-blur-lg dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-glass-dark">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100/80 dark:bg-red-900/30">
          <svg className="h-6 w-6 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-center text-sm font-medium text-surface-700 dark:text-surface-200">{t.mapLoadError}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-button bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-glass transition-[transform,background-color,box-shadow] duration-200 ease-smooth hover:bg-brand-light hover:shadow-glass-hover active:scale-95 dark:bg-white/[0.12] dark:hover:bg-white/[0.18]"
        >
          {t.retry}
        </button>
      </div>
    </div>
  );
}

/** Error boundary for MapPage lazy load failures */
interface MapErrorBoundaryProps { children: ReactNode; }
interface MapErrorBoundaryState { hasError: boolean; }

export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): MapErrorBoundaryState { return { hasError: true }; }
  handleRetry = () => { this.setState({ hasError: false }); };
  render() {
    if (this.state.hasError) return <MapErrorFallback onRetry={this.handleRetry} />;
    return this.props.children;
  }
}

/** OTO logo */
function OtoLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="OTO logo" role="img">
      <defs>
        <linearGradient id="oto-gold-browse" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9A84C" /><stop offset="50%" stopColor="#F2D680" /><stop offset="100%" stopColor="#C9A84C" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="40" rx="35" ry="28" stroke="url(#oto-gold-browse)" strokeWidth="6" />
      <ellipse cx="50" cy="40" rx="22" ry="17" stroke="url(#oto-gold-browse)" strokeWidth="2.5" opacity="0.4" />
      <rect x="85" y="28" width="30" height="6" rx="3" fill="url(#oto-gold-browse)" />
      <rect x="97" y="28" width="6" height="30" rx="3" fill="url(#oto-gold-browse)" />
      <ellipse cx="150" cy="40" rx="35" ry="28" stroke="url(#oto-gold-browse)" strokeWidth="6" />
      <ellipse cx="150" cy="40" rx="22" ry="17" stroke="url(#oto-gold-browse)" strokeWidth="2.5" opacity="0.4" />
    </svg>
  );
}

function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-surface-200 bg-brand dark:border-surface-700">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <OtoLogo className="h-6 w-auto" />
            <span className="text-xs text-surface-400">{t.tagline}</span>
          </div>
          <p className="text-xs text-surface-500">© {new Date().getFullYear()} OTO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main BrowseLayout ─────────────────────────────────────────────────────────

export function BrowseLayout() {
  const { activeTab, setActiveTab } = useTabState();

  return (
    <FilterProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg">
        Skip to main content
      </a>
      <Header />
      <NotificationPromptBanner />

      {/* Top bar with view toggle — easily accessible */}
      <div className="sticky top-0 z-40 flex items-center justify-center border-b border-white/[0.06] bg-brand/95 px-4 py-2 backdrop-blur-lg">
        <ViewTogglePill activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main layout: shared filter sidebar + content area */}
      <div className="flex flex-1">
        <FilterSidebar />
        <MobileFilterOverlay />

        {/* Content area — switches between listings and map */}
        <main id="main-content" className="flex-1 overflow-auto">
          {/* Listings view */}
          <div
            id="tabpanel-listings"
            role="tabpanel"
            aria-labelledby="tab-listings"
            className={activeTab === 'listings' ? 'block animate-blur-in' : 'hidden'}
          >
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
              <RecentlyViewedStrip />
              <BrowsePage />
            </div>
          </div>

          {/* Map view */}
          {activeTab === 'map' && (
            <div
              id="tabpanel-map"
              role="tabpanel"
              aria-labelledby="tab-map"
              className="animate-blur-in"
            >
              <MapErrorBoundary>
                <Suspense fallback={<MapLoadingSkeleton />}>
                  <MapPage />
                </Suspense>
              </MapErrorBoundary>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </FilterProvider>
  );
}
