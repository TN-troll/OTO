import { useInfiniteQuery } from '@tanstack/react-query';
import type { FilterCriteria, ListingSummary } from '@car-ads/shared';
import { api, CursorPaginatedListings } from '../api/client';

const DEFAULT_PAGE_SIZE = 20;

export interface UseInfiniteListingsOptions {
  filters?: Partial<FilterCriteria>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
  enabled?: boolean;
}

export interface UseInfiniteListingsResult {
  /** All listings accumulated across all fetched pages */
  listings: ListingSummary[];
  /** Total count from the server */
  totalCount: number;
  /** Whether the initial page is loading */
  isLoading: boolean;
  /** Whether a subsequent page is being fetched */
  isFetchingNextPage: boolean;
  /** Whether there are more pages available */
  hasNextPage: boolean;
  /** Fetch the next page of results */
  fetchNextPage: () => void;
  /** Whether a page fetch error occurred */
  isError: boolean;
  /** The error object if a fetch failed */
  error: Error | null;
  /** Refetch all pages from scratch */
  refetch: () => void;
}

/**
 * Hook for infinite scroll pagination using TanStack Query's useInfiniteQuery.
 * Uses cursor-based pagination to avoid duplicate/missing results.
 */
export function useInfiniteListings(options: UseInfiniteListingsOptions = {}): UseInfiniteListingsResult {
  const {
    filters = {},
    sortBy = 'price',
    sortOrder = 'desc',
    pageSize = DEFAULT_PAGE_SIZE,
    enabled = true,
  } = options;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteQuery<CursorPaginatedListings, Error>({
    queryKey: ['infinite-listings', { filters, sortBy, sortOrder, pageSize }],
    queryFn: ({ pageParam }) => {
      return api.filterListingsCursor({
        cursor: pageParam as string | undefined,
        limit: pageSize,
        filters,
        sort: { sortBy, sortOrder },
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: 30_000,
  });

  // Flatten all pages into a single list, preserving order (Req 3.3)
  const listings: ListingSummary[] = data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return {
    listings,
    totalCount,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    isError,
    error: error ?? null,
    refetch,
  };
}
