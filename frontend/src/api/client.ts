import type { FilterCriteria, FilterResult, FilterOptionsResponse, Listing, ListingSummary, MarketplaceHealth, MapLocationsResponse } from '@car-ads/shared';

// In production, frontend is served from the same origin as the API
// In dev, Vite proxy handles /api → localhost:4000
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, error.message || response.statusText, error.errors);
  }

  return response.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface PaginatedListings {
  listings: ListingSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CursorPaginatedListings {
  items: ListingSummary[];
  nextCursor: string | null;
  totalCount: number;
}

export interface SearchResult {
  listings: ListingSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  suggestions?: string[];
}

export const api = {
  /**
   * Fetch paginated listings with sorting
   */
  async getListings(params: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedListings> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const query = searchParams.toString();
    return fetchJson<PaginatedListings>(`${API_BASE}/listings${query ? `?${query}` : ''}`);
  },

  /**
   * Fetch a single listing by ID with full details
   */
  async getListing(id: string): Promise<Listing> {
    return fetchJson<Listing>(`${API_BASE}/listings/${id}`);
  },

  /**
   * Apply filters and get matching listings
   */
  async filterListings(criteria: FilterCriteria): Promise<FilterResult> {
    return fetchJson<FilterResult>(`${API_BASE}/listings/filter`, {
      method: 'POST',
      body: JSON.stringify(criteria),
    });
  },

  /**
   * Cursor-based pagination for infinite scroll.
   * Uses the /filter/cursor endpoint.
   */
  async filterListingsCursor(params: {
    cursor?: string;
    limit?: number;
    filters?: Partial<FilterCriteria>;
    sort?: { sortBy: string; sortOrder: 'asc' | 'desc' };
  }): Promise<CursorPaginatedListings> {
    return fetchJson<CursorPaginatedListings>(`${API_BASE}/listings/filter/cursor`, {
      method: 'POST',
      body: JSON.stringify({
        cursor: params.cursor,
        limit: params.limit ?? 20,
        filters: params.filters ?? {},
        sort: params.sort,
      }),
    });
  },

  /**
   * Search listings by text query
   */
  async searchListings(params: {
    q: string;
    page?: number;
    pageSize?: number;
  }): Promise<SearchResult> {
    const searchParams = new URLSearchParams();
    searchParams.set('q', params.q);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));

    return fetchJson<SearchResult>(`${API_BASE}/smart-search?${searchParams.toString()}`);
  },

  /**
   * Get marketplace health status
   */
  async getMarketplaceHealth(): Promise<MarketplaceHealth[]> {
    const data = await fetchJson<{ marketplaces: MarketplaceHealth[] }>(`${API_BASE}/marketplace-health`);
    return data.marketplaces;
  },

  /**
   * Get available filter options (dynamic ranges, discrete values, make/model dependency)
   */
  async getFilterOptions(): Promise<FilterOptionsResponse> {
    return fetchJson<FilterOptionsResponse>(`${API_BASE}/filter-options`);
  },

  /**
   * Get models for selected make(s)
   */
  async getModelsForMake(makes: string[]): Promise<string[]> {
    const params = new URLSearchParams();
    makes.forEach((m) => params.append('make', m));
    const data = await fetchJson<{ models: string[] }>(`${API_BASE}/filter-options/models?${params.toString()}`);
    return data.models;
  },

  /**
   * Get audio clip URL for a sound profile
   */
  getAudioClipUrl(soundProfileId: string): string {
    return `${API_BASE}/sound-profiles/${soundProfileId}/audio`;
  },

  /**
   * Get similar listings for a given listing
   */
  async getSimilarListings(id: string): Promise<ListingSummary[]> {
    return fetchJson<ListingSummary[]>(`${API_BASE}/listings/${id}/similar`);
  },

  /**
   * Get price history for a listing
   */
  async getPriceHistory(id: string): Promise<{ history: { price: number; date: string }[] }> {
    return fetchJson<{ history: { price: number; date: string }[] }>(`${API_BASE}/listings/${id}/price-history`);
  },

  /**
   * Get map locations with aggregated listing data
   */
  async getMapLocations(): Promise<MapLocationsResponse> {
    return fetchJson<MapLocationsResponse>(`${API_BASE}/map/locations`);
  },
};
