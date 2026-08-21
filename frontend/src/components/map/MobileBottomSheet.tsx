import type { ReactNode } from 'react';

export interface MobileBottomSheetProps {
  /** Content to render inside the bottom sheet */
  children: ReactNode;
  /** Whether the bottom sheet is visible */
  isOpen: boolean;
  /** Callback when the user closes the bottom sheet */
  onClose: () => void;
}

/**
 * Mobile bottom sheet overlay for displaying marker popup content on small viewports (< 768px).
 *
 * Slides up from the bottom of the viewport with a backdrop overlay.
 * Includes a drag handle and close button for dismissal.
 * Visibility is controlled by the parent via the `isOpen` prop.
 *
 * TODO: Add swipe-down gesture support to dismiss the bottom sheet
 * (track touch start/move/end on the drag handle area, dismiss when
 * the user swipes down beyond a threshold).
 */
export function MobileBottomSheet({ children, isOpen, onClose }: MobileBottomSheetProps) {
  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet panel */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[70vh] transform overflow-y-auto rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden dark:bg-surface-800 dark:border-t dark:border-white/[0.08] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Location details"
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 flex items-center justify-center bg-white pt-3 pb-1 dark:bg-surface-800">
          <div className="h-1.5 w-10 rounded-full bg-surface-300 dark:bg-surface-600" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="px-4 pb-6 pt-2">
          {children}
        </div>
      </div>
    </>
  );
}
