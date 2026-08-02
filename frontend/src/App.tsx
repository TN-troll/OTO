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
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      {/* Top bar */}
      <div className="bg-brand text-white">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight">OTO</span>
            <span className="hidden text-xs font-light opacity-75 sm:inline">
              {t.tagline}
            </span>
          </a>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Search bar row */}
      <div className="border-b border-gray-100 bg-white py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <SearchBar />
          </div>
        </div>
      </div>
    </header>
  );
}

function FilterSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-white px-5 py-6 lg:block">
      <FilterPanel />
    </aside>
  );
}

export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
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
                  <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
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
                <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
                  <ListingDetailPage />
                </div>
              </main>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
