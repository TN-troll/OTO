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
    <div className="inline-flex items-center gap-0.5 rounded-full border border-white/[0.12] bg-white/[0.06] p-0.5 backdrop-blur-md">
      <button
        type="button"
        onClick={() => onTabChange('listings')}
        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
          activeTab === 'listings'
            ? 'bg-white/[0.15] text-white shadow-sm'
            : 'text-surface-400 hover:text-surface-200'
        }`}
        aria-pressed={activeTab === 'listings'}
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
        {t.tabListings}
      </button>
      <button
        type="button"
        onClick={() => onTabChange('map')}
        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
          activeTab === 'map'
            ? 'bg-white/[0.15] text-white shadow-sm'
            : 'text-surface-400 hover:text-surface-200'
        }`}
        aria-pressed={activeTab === 'map'}
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
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
          className="rounded-button bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-glass transition-all duration-200 ease-smooth hover:bg-brand-light hover:shadow-glass-hover active:scale-95 dark:bg-white/[0.12] dark:hover:bg-white/[0.18]"
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
        <div className="flex-1 overflow-auto">
          {/* Listings view */}
          <div
            id="tabpanel-listings"
            role="tabpanel"
            aria-labelledby="tab-listings"
            className={activeTab === 'listings' ? 'block animate-blur-in' : 'hidden'}
          >
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
              <BrowsePage />
              <RecentlyViewedStrip />
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
        </div>
      </div>

      <Footer />
    </FilterProvider>
  );
}
