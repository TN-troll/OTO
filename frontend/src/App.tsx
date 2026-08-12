import { Routes, Route } from 'react-router-dom';
import { BrowsePage } from './pages/BrowsePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { MarketplaceHealthBanner } from './components/MarketplaceHealthBanner';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ThemeToggle } from './components/ThemeToggle';
import { FilterProvider, useFilterContext } from './hooks/FilterContext';
import { useLanguage } from './i18n';
import { useEffect } from 'react';

/** OTO exhaust-pipe logo — uses currentColor so it adapts to dark/light mode */
function OtoLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="OTO logo"
      role="img"
    >
      <defs>
        <linearGradient id="oto-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9A84C" />
          <stop offset="50%" stopColor="#F2D680" />
          <stop offset="100%" stopColor="#C9A84C" />
        </linearGradient>
      </defs>
      {/* Left exhaust pipe (O) */}
      <ellipse cx="50" cy="40" rx="35" ry="28" stroke="url(#oto-gold)" strokeWidth="6" />
      <ellipse cx="50" cy="40" rx="22" ry="17" stroke="url(#oto-gold)" strokeWidth="2.5" opacity="0.4" />
      {/* Center bridge (T) */}
      <rect x="85" y="28" width="30" height="6" rx="3" fill="url(#oto-gold)" />
      <rect x="97" y="28" width="6" height="30" rx="3" fill="url(#oto-gold)" />
      {/* Right exhaust pipe (O) */}
      <ellipse cx="150" cy="40" rx="35" ry="28" stroke="url(#oto-gold)" strokeWidth="6" />
      <ellipse cx="150" cy="40" rx="22" ry="17" stroke="url(#oto-gold)" strokeWidth="2.5" opacity="0.4" />
    </svg>
  );
}

function Header() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50">
      {/* Main navigation bar */}
      <div className="bg-gradient-brand shadow-premium">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <OtoLogo className="h-8 w-auto" />
            <span className="hidden text-xs font-light tracking-wide text-surface-400 md:inline">
              {t.tagline}
            </span>
          </a>

          {/* Search - center */}
          <div className="hidden max-w-lg flex-1 px-8 md:block">
            <SearchBar />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-b border-surface-200 bg-white px-4 py-3 md:hidden dark:bg-surface-800 dark:border-surface-700">
        <SearchBar />
      </div>
    </header>
  );
}

function FilterSidebar() {
  return (
    <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-surface-200 bg-white p-6 lg:block dark:bg-surface-800 dark:border-surface-700">
      <FilterPanel />
    </aside>
  );
}

/** Mobile slide-over drawer containing the FilterPanel */
function MobileFilterDrawer() {
  const { t } = useLanguage();
  const { mobileFilterOpen, setMobileFilterOpen } = useFilterContext();

  // Lock body scroll when open
  useEffect(() => {
    if (mobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFilterOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileFilterOpen) {
        setMobileFilterOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileFilterOpen, setMobileFilterOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileFilterOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileFilterOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-[70] w-80 max-w-[85vw] transform overflow-y-auto bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden dark:bg-surface-800 ${
          mobileFilterOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={t.filters}
      >
        {/* Close button */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-surface-900 dark:text-white">{t.filters}</h2>
          <button
            type="button"
            onClick={() => setMobileFilterOpen(false)}
            className="rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-white"
            aria-label="Close filters"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <FilterPanel />
      </div>
    </>
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
          <p className="text-xs text-surface-500">
            © {new Date().getFullYear()} OTO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50 dark:bg-surface-900 transition-colors duration-300">
      <MarketplaceHealthBanner />
      <Header />
      <div className="flex flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <FilterProvider>
                <FilterSidebar />
                <MobileFilterDrawer />
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    <BrowsePage />
                  </div>
                </main>
              </FilterProvider>
            }
          />
          <Route
            path="/listing/:id"
            element={
              <main className="flex-1 overflow-auto">
                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                  <ListingDetailPage />
                </div>
              </main>
            }
          />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
