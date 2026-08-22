import { Routes, Route, Navigate } from 'react-router-dom';
import { Component, type ReactNode } from 'react';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { ComparePage } from './pages/ComparePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PremiumPage } from './pages/PremiumPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SellerPage } from './pages/SellerPage';
import { DealerDashboard } from './pages/DealerDashboard';
import { DealersPage } from './pages/DealersPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { BrandsPage } from './pages/BrandsPage';
import { BrandDetailPage } from './pages/BrandDetailPage';
import { ModelPage } from './pages/ModelPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { BrowseLayout } from './components/BrowseLayout';
import { MarketplaceHealthBanner } from './components/MarketplaceHealthBanner';
import { Header } from './components/Header';
import { CompareTray } from './components/CompareTray';
import { CookieConsent } from './components/CookieConsent';
import { ScrollToTop } from './components/ScrollToTop';
import { LoadingBar } from './components/LoadingBar';
import { OtoLogo } from './components/OtoLogo';
import { useLanguage } from './i18n';

/** Error boundary to prevent full-page crashes */
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] items-center justify-center p-8">
          <div className="rounded-xl bg-white p-6 shadow-lg text-center dark:bg-surface-800">
            <p className="text-base font-semibold text-red-600 dark:text-red-400">Something went wrong</p>
            <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-surface-200 bg-brand dark:border-surface-700">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <OtoLogo className="h-6 w-auto" id="footer" />
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
    <ErrorBoundary>
    <div className="glass-mesh-bg flex min-h-screen flex-col transition-colors duration-300">
      <LoadingBar />
      <MarketplaceHealthBanner />
      <Routes>
        <Route path="/" element={<BrowseLayout />} />
        <Route path="/map" element={<Navigate to="/" replace />} />
        <Route
          path="/listing/:id"
          element={
            <>
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                    <ListingDetailPage />
                  </div>
                </main>
              </div>
              <Footer />
            </>
          }
        />
        <Route
          path="/seller"
          element={
            <>
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    <SellerPage />
                  </div>
                </main>
              </div>
              <Footer />
            </>
          }
        />
        <Route
          path="/favorites"
          element={
            <>
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    <FavoritesPage />
                  </div>
                </main>
              </div>
              <Footer />
            </>
          }
        />
        <Route
          path="/brands"
          element={
            <>
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    <BrandsPage />
                  </div>
                </main>
              </div>
              <Footer />
            </>
          }
        />
        <Route
          path="/brands/:make"
          element={
            <>
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    <BrandDetailPage />
                  </div>
                </main>
              </div>
              <Footer />
            </>
          }
        />
        <Route
          path="/models/:make/:model"
          element={
            <>
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    <ModelPage />
                  </div>
                </main>
              </div>
              <Footer />
            </>
          }
        />
        <Route
          path="/collections"
          element={
            <>
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    <CollectionsPage />
                  </div>
                </main>
              </div>
              <Footer />
            </>
          }
        />
        <Route
          path="/compare"
          element={
            <>
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 overflow-auto">
                  <ComparePage />
                </main>
              </div>
              <Footer />
            </>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <>
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 overflow-auto">
                  <LeaderboardPage />
                </main>
              </div>
              <Footer />
            </>
          }
        />
        <Route
          path="/premium"
          element={
            <>
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                    <PremiumPage />
                  </div>
                </main>
              </div>
              <Footer />
            </>
          }
        />
        <Route
          path="/notifications"
          element={
            <>
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                    <NotificationsPage />
                  </div>
                </main>
              </div>
              <Footer />
            </>
          }
        />
        <Route
          path="/dealers"
          element={
            <>
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    <DealersPage />
                  </div>
                </main>
              </div>
              <Footer />
            </>
          }
        />
        <Route
          path="/dashboard"
          element={
            <>
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 overflow-auto">
                  <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                    <DealerDashboard />
                  </div>
                </main>
              </div>
              <Footer />
            </>
          }
        />
      </Routes>
      <CompareTray />
      <ScrollToTop />
      <CookieConsent />
    </div>
    </ErrorBoundary>
  );
}
