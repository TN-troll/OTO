import { useState, useEffect, useCallback, useRef } from 'react';
import { SearchBar } from './SearchBar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { PremiumBadge } from './PremiumBadge';
import { useLanguage } from '../i18n';
import { isPushSupported } from '../hooks/usePushNotifications';

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
        <linearGradient id="oto-gold-header" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9A84C" />
          <stop offset="50%" stopColor="#F2D680" />
          <stop offset="100%" stopColor="#C9A84C" />
        </linearGradient>
      </defs>
      {/* Left exhaust pipe (O) */}
      <ellipse cx="50" cy="40" rx="35" ry="28" stroke="url(#oto-gold-header)" strokeWidth="6" />
      <ellipse cx="50" cy="40" rx="22" ry="17" stroke="url(#oto-gold-header)" strokeWidth="2.5" opacity="0.4" />
      {/* Center bridge (T) */}
      <rect x="85" y="28" width="30" height="6" rx="3" fill="url(#oto-gold-header)" />
      <rect x="97" y="28" width="6" height="30" rx="3" fill="url(#oto-gold-header)" />
      {/* Right exhaust pipe (O) */}
      <ellipse cx="150" cy="40" rx="35" ry="28" stroke="url(#oto-gold-header)" strokeWidth="6" />
      <ellipse cx="150" cy="40" rx="22" ry="17" stroke="url(#oto-gold-header)" strokeWidth="2.5" opacity="0.4" />
    </svg>
  );
}

/** Hamburger / X icon for mobile menu toggle */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  );
}

export function Header({ activeTab, onTabChange }: { activeTab?: 'listings' | 'map'; onTabChange?: (tab: 'listings' | 'map') => void } = {}) {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        mobileMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        toggleRef.current &&
        !toggleRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const toggleMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Main header bar — frosted glass */}
      <div className="bg-white/70 shadow-glass backdrop-blur-xl dark:bg-black/70 dark:shadow-glass-dark">
        <div className="mx-auto flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8 max-w-[1200px]">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5">
            <OtoLogo className="h-8 w-auto" />
            <span className="hidden text-[11px] font-medium tracking-wide text-surface-500 dark:text-surface-400 lg:inline">
              {t.tagline}
            </span>
          </a>

          {/* View toggle — Search/Map tabs (only on browse page) */}
          {activeTab && onTabChange && (
            <div role="tablist" className="ml-4 hidden items-center gap-0.5 rounded-full border border-white/[0.12] bg-white/[0.06] p-0.5 backdrop-blur-md sm:inline-flex">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'listings'}
                onClick={() => onTabChange('listings')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
                  activeTab === 'listings'
                    ? 'bg-white/[0.15] text-white shadow-sm'
                    : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                {t.tabListings}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'map'}
                onClick={() => onTabChange('map')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
                  activeTab === 'map'
                    ? 'bg-white/[0.15] text-white shadow-sm'
                    : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                {t.tabMap}
              </button>
            </div>
          )}

          {/* Search — hidden on mobile, shown inline on md+ */}
          <div className="hidden flex-1 max-w-md px-8 md:block">
            <SearchBar />
          </div>

          {/* Actions — right side */}
          <div className="flex items-center gap-2">
            {/* Notifications link — hidden on mobile, visible on sm+ */}
            {isPushSupported() && (
              <a
                href="/notifications"
                className="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-xl text-surface-700 transition-colors hover:bg-surface-100/80 dark:text-surface-300 dark:hover:bg-white/[0.08]"
                aria-label="Notification settings"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </a>
            )}

            {/* Premium link — hidden on mobile */}
            <a
              href="/premium"
              className="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-xl text-amber-600 transition-colors hover:bg-amber-50/80 dark:text-amber-400 dark:hover:bg-amber-900/20"
              aria-label="Premium membership"
            >
              <PremiumBadge size="sm" />
            </a>

            {/* Theme toggle — 44x44 touch target */}
            <ThemeToggle />

            {/* Language switcher — 44px height touch target */}
            <LanguageSwitcher />

            {/* Mobile menu toggle — 44x44px touch target, visible below md */}
            <button
              ref={toggleRef}
              type="button"
              onClick={toggleMenu}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-surface-700 transition-colors hover:bg-surface-100/80 md:hidden dark:text-surface-300 dark:hover:bg-white/[0.08]"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              <MenuIcon open={mobileMenuOpen} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search — glass panel below header, visible only on <768px */}
      <div className="border-b border-white/10 bg-white/50 px-4 py-2.5 backdrop-blur-lg md:hidden dark:bg-black/50 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          {activeTab && onTabChange && (
            <div role="tablist" className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-white/[0.12] bg-white/[0.06] p-0.5">
              <button type="button" role="tab" aria-selected={activeTab === 'listings'} onClick={() => onTabChange('listings')}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${activeTab === 'listings' ? 'bg-white/[0.15] text-white' : 'text-surface-400'}`}>
                {t.tabListings}
              </button>
              <button type="button" role="tab" aria-selected={activeTab === 'map'} onClick={() => onTabChange('map')}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${activeTab === 'map' ? 'bg-white/[0.15] text-white' : 'text-surface-400'}`}>
                {t.tabMap}
              </button>
            </div>
          )}
          <div className="flex-1">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Mobile navigation menu — glass panel overlay */}
      {/* TODO: Add focus trap to mobile navigation menu (trap Tab/Shift+Tab within
         the menu panel when open, return focus to toggle button on close) */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none md:hidden ${
          mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Menu panel */}
      <div
        ref={menuRef}
        id="mobile-nav-menu"
        role="navigation"
        aria-label="Mobile navigation"
        className={`absolute left-0 right-0 z-50 border-b border-white/10 bg-white/80 px-4 py-4 shadow-glass-elevated backdrop-blur-xl transition-all duration-300 ease-smooth motion-reduce:transition-none md:hidden dark:bg-black/80 dark:border-white/[0.06] dark:shadow-glass-dark ${
          mobileMenuOpen
            ? 'translate-y-0 opacity-100'
            : '-translate-y-4 pointer-events-none opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-1">
          {isPushSupported() && (
            <a
              href="/notifications"
              className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-100/80 dark:text-surface-300 dark:hover:bg-white/[0.08]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notifications
            </a>
          )}
          <a
            href="/premium"
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50/80 dark:text-amber-400 dark:hover:bg-amber-900/20"
          >
            <PremiumBadge size="sm" />
            Premium
          </a>
          <a
            href="/leaderboard"
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-100/80 dark:text-surface-300 dark:hover:bg-white/[0.08]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Leaderboard
          </a>
          <a
            href="/compare"
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-100/80 dark:text-surface-300 dark:hover:bg-white/[0.08]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Compare
          </a>
          <a
            href="/map"
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-100/80 dark:text-surface-300 dark:hover:bg-white/[0.08]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Map
          </a>
        </nav>
      </div>
    </header>
  );
}
