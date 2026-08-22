import { lazy, Suspense, Component, type ReactNode } from 'react';
import { useTabState } from '../hooks/useTabState';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { NotificationPromptBanner } from './NotificationPreferences';
import { FilterPanel } from './FilterPanel';
import { RecentlyViewedStrip } from './RecentlyViewedStrip';
import { BrowsePage } from '../pages/BrowsePage';
import { FilterProvider } from '../hooks/FilterContext';
import { CompareTray } from './CompareTray';
import { useLanguage } from '../i18n';

const MapPage = lazy(() => import('../pages/MapPage'));

// ─── Internal layout sub-components ────────────────────────────────────────────

/**
 * Desktop sidebar — sticky, no visible scrollbar, translucent glass styling.
 * Shared between listings and map views.
 */
function FilterSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 overflow-y-auto border-r border-surface-200 bg-white/90 p-6 backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:block dark:border-white/[0.08] dark:bg-surface-950/80">
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
  const { t, locale, setLocale } = useLanguage();
  return (
    <footer className="border-t border-surface-200 bg-surface-950 dark:border-surface-800">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <OtoLogo className="h-6 w-auto" />
            <p className="mt-2 text-xs text-surface-500">{t.tagline}</p>
            <p className="mt-1 text-[10px] text-surface-600">Netherlands only</p>
          </div>
          {/* Navigation */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">{locale === 'nl' ? 'Navigatie' : 'Navigate'}</p>
            <nav className="mt-3 flex flex-col gap-2">
              <a href="/" className="text-xs text-surface-500 hover:text-brand-accent">{locale === 'nl' ? 'Zoeken' : 'Search'}</a>
              <a href="/?view=map" className="text-xs text-surface-500 hover:text-brand-accent">{locale === 'nl' ? 'Kaart' : 'Map'}</a>
              <a href="/compare" className="text-xs text-surface-500 hover:text-brand-accent">{locale === 'nl' ? 'Vergelijken' : 'Compare'}</a>
              <a href="/premium" className="text-xs text-surface-500 hover:text-brand-accent">Premium</a>
            </nav>
          </div>
          {/* Legal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">{locale === 'nl' ? 'Juridisch' : 'Legal'}</p>
            <nav className="mt-3 flex flex-col gap-2">
              <a href="/privacy" className="text-xs text-surface-500 hover:text-brand-accent">Privacy Policy</a>
              <a href="/terms" className="text-xs text-surface-500 hover:text-brand-accent">{locale === 'nl' ? 'Voorwaarden' : 'Terms'}</a>
              <a href="/cookies" className="text-xs text-surface-500 hover:text-brand-accent">Cookies</a>
            </nav>
          </div>
          {/* Language */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">{locale === 'nl' ? 'Taal' : 'Language'}</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setLocale('nl')} className={`rounded-md px-2.5 py-1 text-xs font-medium ${locale === 'nl' ? 'bg-brand-accent/15 text-brand-accent' : 'text-surface-500 hover:text-white'}`}>NL</button>
              <button type="button" onClick={() => setLocale('en')} className={`rounded-md px-2.5 py-1 text-xs font-medium ${locale === 'en' ? 'bg-brand-accent/15 text-brand-accent' : 'text-surface-500 hover:text-white'}`}>EN</button>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-surface-800 pt-6 text-center">
          <p className="text-[10px] text-surface-600">&copy; {new Date().getFullYear()} OTO &mdash; Online Top Occasions. All rights reserved.</p>
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
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <NotificationPromptBanner />

      {/* Main layout: shared filter sidebar + content area */}
      <div className="flex flex-1">
        <FilterSidebar />
        <MobileFilterOverlay />

        {/* Content area — switches between listings and map */}
        <main id="main-content" className="flex-1 overflow-auto pb-16 md:pb-0">
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
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <CompareTray />
    </FilterProvider>
  );
}
