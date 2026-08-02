interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-all duration-200 hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        ← Previous
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-2 text-sm text-surface-400"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[2.5rem] rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ${
                page === currentPage
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-surface-600 hover:bg-surface-100'
              }`}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-all duration-200 hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
