import { useEffect, useRef, useCallback } from 'react';
import { useFilterContext } from '../../hooks/FilterContext';
import { useLanguage } from '../../i18n/LanguageContext';

interface MobileFilterDrawerProps {
  children: React.ReactNode;
}

/** Velocity threshold in px/ms for swipe-down-to-close gesture */
const SWIPE_VELOCITY_THRESHOLD = 0.5;
/** Minimum swipe distance (px) to close even at low velocity */
const SWIPE_DISTANCE_THRESHOLD = 100;

/**
 * Full-screen slide-up drawer for mobile viewports (<768px).
 *
 * - Spring animation (ease-smooth) for open/close
 * - Sticky header with close button and "Show X results" CTA
 * - Scroll-locks body while open
 * - Swipe-down to close gesture with velocity/distance threshold
 * - Glass morphism backdrop
 */
export function MobileFilterDrawer({ children }: MobileFilterDrawerProps) {
  const { mobileFilterOpen, setMobileFilterOpen, filterResult } = useFilterContext();
  const { t } = useLanguage();

  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const currentTranslateY = useRef<number>(0);

  // ─── Scroll lock body while drawer is open ──────────────────────────────────
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

  // ─── Swipe-down gesture handlers ───────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    currentTranslateY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartY.current;
    // Only track downward swipes (positive deltaY)
    if (deltaY > 0) {
      currentTranslateY.current = deltaY;
      // Apply live transform for visual feedback
      if (drawerRef.current) {
        drawerRef.current.style.transform = `translateY(${deltaY}px)`;
        drawerRef.current.style.transition = 'none';
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const deltaY = currentTranslateY.current;
    const elapsed = Date.now() - touchStartTime.current;
    // Only compute velocity when meaningful time has passed (> 10ms)
    const velocity = elapsed > 10 ? deltaY / elapsed : 0;

    // Reset transform
    if (drawerRef.current) {
      drawerRef.current.style.transform = '';
      drawerRef.current.style.transition = '';
    }

    // Close if velocity or distance exceeds threshold
    if (velocity >= SWIPE_VELOCITY_THRESHOLD || deltaY >= SWIPE_DISTANCE_THRESHOLD) {
      setMobileFilterOpen(false);
    }

    currentTranslateY.current = 0;
  }, [setMobileFilterOpen]);

  const handleClose = useCallback(() => {
    setMobileFilterOpen(false);
  }, [setMobileFilterOpen]);

  const totalCount = filterResult?.totalCount ?? 0;

  return (
    <>
      {/* Backdrop with glass morphism blur */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-smooth ${
          mobileFilterOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={`fixed inset-x-0 bottom-0 z-50 flex h-full flex-col bg-glass-light backdrop-blur-glass transition-transform duration-300 ease-smooth dark:bg-glass-dark ${
          mobileFilterOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-glass-border bg-glass-light/90 px-4 py-3 backdrop-blur-glass dark:border-white/[0.06] dark:bg-glass-dark/90">
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="flex min-h-touch min-w-touch items-center justify-center rounded-button text-surface-600 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100"
            aria-label="Close filters"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Title */}
          <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">
            Filters
          </span>

          {/* Show results button */}
          <button
            type="button"
            onClick={handleClose}
            className="flex min-h-touch items-center rounded-lg bg-brand-accent px-3 py-2 text-xs font-semibold text-white shadow-glass-glow transition-all duration-200 hover:brightness-110 active:scale-95"
          >
            {t.showResults} ({totalCount})
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>
      </div>
    </>
  );
}
