import type { FilterCriteria, FilterResult, Listing, ListingSummary, MarketplaceHealth } from '@car-ads/shared';

const API_BASE = '/api';

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

export interface SearchResult {
  listings: ListingSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  suggestions?: string[];
}

export interface FilterOptions {
  makes: string[];
  models: string[];
  fuelTypes: string[];
  transmissionTypes: string[];
  engineConfigurations: string[];
  cylinderCounts: number[];
  forcedInductionTypes: string[];
  exhaustNotes: string[];
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

    return fetchJson<SearchResult>(`${API_BASE}/search?${searchParams.toString()}`);
  },

  /**
   * Get marketplace health status
   */
  async getMarketplaceHealth(): Promise<MarketplaceHealth[]> {
    const data = await fetchJson<{ marketplaces: MarketplaceHealth[] }>(`${API_BASE}/marketplace-health`);
    return data.marketplaces;
  },

  /**
   * Get available filter options
   */
  async getFilterOptions(): Promise<FilterOptions> {
    return fetchJson<FilterOptions>(`${API_BASE}/filter-options`);
  },

  /**
   * Get audio clip URL for a sound profile
   */
  getAudioClipUrl(soundProfileId: string): string {
    return `${API_BASE}/sound-profiles/${soundProfileId}/audio`;
  },
};
