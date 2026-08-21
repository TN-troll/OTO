import { Routes, Route, Navigate } from 'react-router-dom';
import { Component, type ReactNode } from 'react';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { ComparePage } from './pages/ComparePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PremiumPage } from './pages/PremiumPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SellerPage } from './pages/SellerPage';
import { BrowseLayout } from './components/BrowseLayout';
import { MarketplaceHealthBanner } from './components/MarketplaceHealthBanner';
import { Header } from './components/Header';
import { CompareTray } from './components/CompareTray';
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

/** OTO exhaust-pipe logo — used in Footer */
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
    <ErrorBoundary>
    <div className="glass-mesh-bg flex min-h-screen flex-col transition-colors duration-300">
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
      </Routes>
      <CompareTray />
    </div>
    </ErrorBoundary>
  );
}
