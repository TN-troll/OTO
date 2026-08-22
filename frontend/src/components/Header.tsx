import { useState, useEffect, useCallback, useRef } from 'react';
import { SearchBar } from './SearchBar';
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
          <stop offset="0%" stopColor="#C97B4A" />
          <stop offset="50%" stopColor="#E8A67A" />
          <stop offset="100%" stopColor="#C97B4A" />
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
  const { t, locale, setLocale } = useLanguage();
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
        <div className="mx-auto flex h-14 items-center gap-2 px-4 sm:h-16 sm:px-6 lg:px-8 max-w-[1400px]">
          {/* Logo — pushed left */}
          <a href="/" className="flex shrink-0 items-center">
            <OtoLogo className="h-7 w-auto" />
          </a>

          {/* Desktop nav links */}
          <nav className="ml-4 hidden items-center gap-1.5 md:flex">
            <a href="/brands" className="flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-surface-600 transition-all hover:border-surface-200 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:border-white/[0.1] dark:hover:bg-white/[0.06] dark:hover:text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              {locale === 'nl' ? 'Merken' : 'Brands'}
            </a>
            <a href="/leaderboard" className="flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-surface-600 transition-all hover:border-surface-200 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:border-white/[0.1] dark:hover:bg-white/[0.06] dark:hover:text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              Leaderboard
            </a>
          </nav>

          {/* View toggle — Search/Map (only on browse page) */}
          {activeTab && onTabChange && (
            <div role="tablist" className="ml-2 hidden items-center gap-0.5 rounded-full border border-white/[0.12] bg-white/[0.06] p-0.5 backdrop-blur-md sm:inline-flex">
              <button type="button" role="tab" aria-selected={activeTab === 'listings'} onClick={() => onTabChange('listings')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${activeTab === 'listings' ? 'bg-white/[0.15] text-white shadow-sm' : 'text-surface-400 hover:text-surface-200'}`}>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                {t.tabListings}
              </button>
              <button type="button" role="tab" aria-selected={activeTab === 'map'} onClick={() => onTabChange('map')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${activeTab === 'map' ? 'bg-white/[0.15] text-white shadow-sm' : 'text-surface-400 hover:text-surface-200'}`}>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
                {t.tabMap}
              </button>
            </div>
          )}

          {/* Search bar — centered, takes remaining space */}
          <div className="hidden flex-1 max-w-lg px-4 md:block">
            <SearchBar />
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            {/* Language toggle */}
            <div className="hidden sm:flex items-center gap-0.5 rounded-full border border-surface-200 bg-surface-100 p-0.5 dark:border-white/[0.1] dark:bg-white/[0.04]">
              <button type="button" onClick={() => setLocale('nl')} className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${locale === 'nl' ? 'bg-white shadow-sm text-surface-900 dark:bg-white/[0.15] dark:text-white dark:shadow-none' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>NL</button>
              <button type="button" onClick={() => setLocale('en')} className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${locale === 'en' ? 'bg-white shadow-sm text-surface-900 dark:bg-white/[0.15] dark:text-white dark:shadow-none' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}>EN</button>
            </div>
            <a href="/favorites" className="flex h-10 w-10 items-center justify-center rounded-xl text-surface-400 transition-colors hover:bg-white/[0.06] hover:text-red-400" aria-label="Favorites">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </a>
            <button ref={toggleRef} type="button" onClick={toggleMenu}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-surface-400 transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen}>
              <MenuIcon open={mobileMenuOpen} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search — glass panel below header, visible only on <768px */}
      <div className="border-b border-white/10 bg-white/50 px-4 py-2.5 backdrop-blur-lg md:hidden dark:bg-black/50 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Mobile navigation menu — glass panel overlay */}
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
          <a
            href="/favorites"
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-100/80 dark:text-surface-300 dark:hover:bg-white/[0.08]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            Favorites
          </a>
          <a
            href="/compare"
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-100/80 dark:text-surface-300 dark:hover:bg-white/[0.08]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            {locale === 'nl' ? 'Vergelijken' : 'Compare'}
          </a>
          {isPushSupported() && (
            <a
              href="/notifications"
              className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-100/80 dark:text-surface-300 dark:hover:bg-white/[0.08]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {locale === 'nl' ? 'Meldingen' : 'Notifications'}
            </a>
          )}
          <a
            href="/premium"
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50/80 dark:text-amber-400 dark:hover:bg-amber-900/20"
          >
            <PremiumBadge size="sm" />
            Premium
          </a>
          {/* Language toggle */}
          <div className="mt-2 flex items-center gap-2 border-t border-surface-200 px-3 pt-3 dark:border-surface-700">
            <span className="text-xs text-surface-500">{locale === 'nl' ? 'Taal' : 'Language'}:</span>
            <button
              type="button"
              onClick={() => setLocale('nl')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${locale === 'nl' ? 'bg-brand-accent/15 text-brand-accent' : 'text-surface-500 hover:text-white'}`}
            >
              NL
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${locale === 'en' ? 'bg-brand-accent/15 text-brand-accent' : 'text-surface-500 hover:text-white'}`}
            >
              EN
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
