import { Routes, Route } from 'react-router-dom';
import { BrowsePage } from './pages/BrowsePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { MarketplaceHealthBanner } from './components/MarketplaceHealthBanner';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useLanguage } from './i18n';

function Header() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50">
      {/* Main navigation bar */}
      <div className="bg-gradient-brand shadow-premium">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <span className="text-2xl font-extrabold tracking-tight text-white">
              OTO
            </span>
            <span className="hidden text-xs font-light tracking-wide text-surface-400 md:inline">
              {t.tagline}
            </span>
          </a>

          {/* Search - center */}
          <div className="hidden max-w-lg flex-1 px-8 md:block">
            <SearchBar />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-b border-surface-200 bg-white px-4 py-3 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}

function FilterSidebar() {
  return (
    <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-surface-200 bg-white p-6 lg:block">
      <FilterPanel />
    </aside>
  );
}

function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-surface-200 bg-brand">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold tracking-tight text-white">OTO</span>
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
    <div className="flex min-h-screen flex-col bg-surface-50">
      <MarketplaceHealthBanner />
      <Header />
      <div className="flex flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <FilterSidebar />
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    <BrowsePage />
                  </div>
                </main>
              </>
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
