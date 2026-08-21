import { useState } from 'react';
import { useLanguage } from '../i18n';

interface SavedSearchPromptProps {
  filtersActive: boolean;
  filterSummary: string;
}

/**
 * Floating prompt that appears when filters are active, suggesting
 * the user save their search to get notifications for new matches.
 * Stores dismissed state in sessionStorage.
 */
export function SavedSearchPrompt({ filtersActive, filterSummary }: SavedSearchPromptProps) {
  const { locale } = useLanguage();
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('oto-search-prompt-dismissed') === '1'; }
    catch { return false; }
  });
  const [saved, setSaved] = useState(false);

  if (!filtersActive || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem('oto-search-prompt-dismissed', '1'); } catch {}
  };

  const handleSave = () => {
    // Store search in localStorage
    try {
      const searches = JSON.parse(localStorage.getItem('oto-saved-searches') || '[]');
      searches.push({
        id: Date.now(),
        summary: filterSummary,
        url: window.location.href,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('oto-saved-searches', JSON.stringify(searches.slice(-10)));
    } catch {}
    setSaved(true);
    setTimeout(handleDismiss, 2000);
  };

  if (saved) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-fade-in md:bottom-6">
        <div className="flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-3 shadow-lg backdrop-blur-xl">
          <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {locale === 'nl' ? 'Zoekopdracht opgeslagen!' : 'Search saved!'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-fade-in md:bottom-6">
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.12] bg-surface-900/90 px-5 py-3 shadow-xl backdrop-blur-xl">
        <svg className="h-5 w-5 flex-shrink-0 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">
            {locale === 'nl' ? 'Nieuwe matches ontvangen?' : 'Get notified of new matches?'}
          </span>
          <span className="text-[11px] text-surface-400">{filterSummary}</span>
        </div>
        <button
          onClick={handleSave}
          className="ml-2 rounded-full bg-brand-accent px-4 py-1.5 text-xs font-bold text-white transition-transform active:scale-95"
        >
          {locale === 'nl' ? 'Opslaan' : 'Save'}
        </button>
        <button
          onClick={handleDismiss}
          className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
