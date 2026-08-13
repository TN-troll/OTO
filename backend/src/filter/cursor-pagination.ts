/**
 * Pure cursor-based pagination utility.
 *
 * Simulates cursor-based pagination on an in-memory array.
 * The cursor is a base64-encoded offset, matching the approach used
 * by the Filter Engine's queryCursor method.
 */

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  totalCount: number;
}

/**
 * Encode an offset into an opaque cursor string (base64).
 */
export function encodeCursor(offset: number): string {
  return Buffer.from(String(offset)).toString('base64');
}

/**
 * Decode an opaque cursor string back into an offset number.
 * Throws if the cursor is invalid.
 */
export function decodeCursor(cursor: string): number {
  const decoded = Buffer.from(cursor, 'base64').toString('utf8');
  const offset = parseInt(decoded, 10);
  if (isNaN(offset) || offset < 0) {
    throw new Error('Invalid cursor value');
  }
  return offset;
}

/**
 * Paginate through an array using cursor-based pagination.
 *
 * @param items - The full array to paginate over
 * @param pageSize - Number of items per page (must be >= 1)
 * @param cursor - Optional cursor from a previous call's nextCursor
 * @returns Page of items with nextCursor (null if no more pages) and totalCount
 */
export function paginateWithCursor<T>(
  items: T[],
  pageSize: number,
  cursor?: string | null,
): CursorPaginationResult<T> {
  if (pageSize < 1) {
    throw new Error('pageSize must be at least 1');
  }

  const offset = cursor ? decodeCursor(cursor) : 0;
  const totalCount = items.length;

  // Slice the items for this page
  const pageItems = items.slice(offset, offset + pageSize);

  // Determine if there are more pages
  const hasMore = offset + pageSize < totalCount;
  const nextCursor = hasMore ? encodeCursor(offset + pageSize) : null;

  return {
    items: pageItems,
    nextCursor,
    totalCount,
  };
}
