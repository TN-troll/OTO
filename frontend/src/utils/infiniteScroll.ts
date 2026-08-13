/**
 * Appends a new page of items to an existing list of results.
 * Used by the infinite scroll component to accumulate paginated data.
 *
 * @param existing - The current list of items already loaded
 * @param newPage - The new page of items to append
 * @returns A combined list with existing items preserved and new items appended
 */
export function appendPage<T>(existing: T[], newPage: T[]): T[] {
  return [...existing, ...newPage];
}
